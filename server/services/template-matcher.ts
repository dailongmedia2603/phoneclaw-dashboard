import { execFile, execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config';
import { getDevice } from './device-manager';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PYTHON_SCRIPT = path.join(__dirname, 'opencv-match.py');

export interface MatchResult {
  found: boolean;
  x: number;
  y: number;
  confidence: number;
}

/**
 * Capture screenshot via VNC (vncdotool) — works even when API screenshot returns black
 */
export function captureVncScreenshot(deviceId: string): string | null {
  const device = getDevice(deviceId);
  if (!device) return null;

  const tmpFile = `/tmp/phoneclaw-vnc-${deviceId}.png`;
  const vncPassword = device.vncPassword || '';
  const vncHost = `${device.tailscaleIp}:1`;

  try {
    const cmd = vncPassword
      ? `vncdo -s ${vncHost} -p "${vncPassword}" capture ${tmpFile}`
      : `vncdo -s ${vncHost} capture ${tmpFile}`;
    execSync(cmd, { timeout: 15000, stdio: 'pipe' });

    const data = readFileSync(tmpFile);
    return data.toString('base64');
  } catch {
    return null;
  }
}

export async function matchTemplate(
  screenshotBase64: string,
  templateName: string,
  threshold = 0.7
): Promise<MatchResult> {
  const templatePath = path.join(config.templatesDir, `${templateName}.png`);

  if (!existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  return new Promise((resolve, reject) => {
    const proc = execFile(
      'python3',
      [PYTHON_SCRIPT, '--template', templatePath, '--threshold', String(threshold)],
      { timeout: config.opencvMatchTimeout, maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          return reject(new Error(`OpenCV match failed: ${error.message}${stderr ? ' — ' + stderr : ''}`));
        }

        try {
          const result = JSON.parse(stdout.trim());
          if (result.error) {
            return reject(new Error(`OpenCV: ${result.error}`));
          }
          resolve({
            found: !!result.found,
            x: result.x ?? result.bestX ?? 0,
            y: result.y ?? result.bestY ?? 0,
            confidence: result.confidence ?? 0,
          });
        } catch {
          reject(new Error(`Failed to parse OpenCV output: ${stdout}`));
        }
      }
    );

    if (proc.stdin) {
      proc.stdin.write(screenshotBase64);
      proc.stdin.end();
    }
  });
}
