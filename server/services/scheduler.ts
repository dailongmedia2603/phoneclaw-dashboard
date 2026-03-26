import { readCollection, writeCollection, generateId } from '../store';
import { executeScript } from './script-engine';
import { getAllDevices, getAllGroups } from './device-manager';
import type { Schedule, ScheduleHistory } from '../../src/types';

let schedulerTimer: ReturnType<typeof setInterval> | null = null;
let onExecutionUpdate: ((execution: ScheduleHistory) => void) | null = null;

// --- Schedule CRUD ---

export function getAllSchedules(): Schedule[] {
  return readCollection<Schedule>('schedules');
}

export function getSchedule(id: string): Schedule | undefined {
  return getAllSchedules().find(s => s.id === id);
}

export function createSchedule(data: Omit<Schedule, 'id' | 'createdAt'>): Schedule {
  const schedules = getAllSchedules();
  const schedule: Schedule = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  schedules.push(schedule);
  writeCollection('schedules', schedules);
  return schedule;
}

export function updateSchedule(id: string, data: Partial<Schedule>): Schedule | null {
  const schedules = getAllSchedules();
  const idx = schedules.findIndex(s => s.id === id);
  if (idx === -1) return null;
  schedules[idx] = { ...schedules[idx], ...data };
  writeCollection('schedules', schedules);
  return schedules[idx];
}

export function deleteSchedule(id: string): boolean {
  const schedules = getAllSchedules();
  const filtered = schedules.filter(s => s.id !== id);
  if (filtered.length === schedules.length) return false;
  writeCollection('schedules', filtered);
  return true;
}

// --- Cron Parser (simple) ---

interface CronParts {
  minute: number[];
  hour: number[];
  dayOfMonth: number[];
  month: number[];
  dayOfWeek: number[];
}

function parseCronField(field: string, min: number, max: number): number[] {
  if (field === '*') {
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  }
  const values: number[] = [];
  for (const part of field.split(',')) {
    if (part.includes('/')) {
      const [range, step] = part.split('/');
      const stepNum = parseInt(step);
      const start = range === '*' ? min : parseInt(range);
      for (let i = start; i <= max; i += stepNum) {
        values.push(i);
      }
    } else if (part.includes('-')) {
      const [from, to] = part.split('-').map(Number);
      for (let i = from; i <= to; i++) values.push(i);
    } else {
      values.push(parseInt(part));
    }
  }
  return values.filter(v => v >= min && v <= max);
}

function parseCron(expr: string): CronParts | null {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  return {
    minute: parseCronField(parts[0], 0, 59),
    hour: parseCronField(parts[1], 0, 23),
    dayOfMonth: parseCronField(parts[2], 1, 31),
    month: parseCronField(parts[3], 1, 12),
    dayOfWeek: parseCronField(parts[4], 0, 6),
  };
}

function matchesCron(cron: CronParts, date: Date): boolean {
  return (
    cron.minute.includes(date.getMinutes()) &&
    cron.hour.includes(date.getHours()) &&
    cron.dayOfMonth.includes(date.getDate()) &&
    cron.month.includes(date.getMonth() + 1) &&
    cron.dayOfWeek.includes(date.getDay())
  );
}

export function getNextRun(cronExpr: string): string | undefined {
  const cron = parseCron(cronExpr);
  if (!cron) return undefined;
  const now = new Date();
  // Check next 7 days, minute by minute
  for (let i = 1; i <= 10080; i++) {
    const check = new Date(now.getTime() + i * 60000);
    if (matchesCron(cron, check)) {
      return check.toISOString();
    }
  }
  return undefined;
}

// --- Scheduler Loop ---

async function checkSchedules() {
  const schedules = getAllSchedules();
  const now = new Date();

  for (const schedule of schedules) {
    if (!schedule.enabled) continue;

    const cron = parseCron(schedule.cron);
    if (!cron || !matchesCron(cron, now)) continue;

    // Get target device(s)
    let deviceIds: string[] = [];
    if (schedule.targetType === 'device') {
      deviceIds = [schedule.targetId];
    } else {
      const group = getAllGroups().find(g => g.id === schedule.targetId);
      if (group) deviceIds = group.deviceIds;
    }

    // Execute on each device
    for (const deviceId of deviceIds) {
      const device = getAllDevices().find(d => d.id === deviceId);
      if (!device || device.status === 'offline') continue;

      executeScript(
        schedule.scriptId,
        deviceId,
        schedule.name,
        onExecutionUpdate || undefined
      ).catch(err => {
        console.error(`Schedule ${schedule.name} failed on ${device.name}:`, err);
      });
    }

    // Update lastRun and nextRun
    updateSchedule(schedule.id, {
      lastRun: now.toISOString(),
      nextRun: getNextRun(schedule.cron),
    });
  }
}

export function startScheduler(onUpdate?: (execution: ScheduleHistory) => void) {
  if (onUpdate) onExecutionUpdate = onUpdate;
  if (schedulerTimer) clearInterval(schedulerTimer);
  // Check every minute
  schedulerTimer = setInterval(checkSchedules, 60000);
}

export function stopScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}
