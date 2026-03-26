#!/usr/bin/env python3
"""
OpenCV Template Matching for PhoneClaw
Reads base64 screenshot from stdin, matches against template image.
Outputs JSON: {"found": bool, "x": float, "y": float, "confidence": float}
"""
import sys
import json
import argparse
import base64
import numpy as np

try:
    import cv2
except ImportError:
    print(json.dumps({"error": "opencv-python-headless not installed. Run: pip3 install opencv-python-headless"}))
    sys.exit(1)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--template', required=True, help='Path to template PNG')
    parser.add_argument('--threshold', type=float, default=0.7)
    args = parser.parse_args()

    # Read base64 from stdin
    b64_data = sys.stdin.read().strip()
    if not b64_data:
        print(json.dumps({"error": "No screenshot data on stdin"}))
        sys.exit(1)

    # Decode screenshot
    img_bytes = base64.b64decode(b64_data)
    img_array = np.frombuffer(img_bytes, dtype=np.uint8)
    screenshot = cv2.imdecode(img_array, cv2.IMREAD_GRAYSCALE)
    if screenshot is None:
        print(json.dumps({"error": "Failed to decode screenshot"}))
        sys.exit(1)

    # Read template
    template = cv2.imread(args.template, cv2.IMREAD_GRAYSCALE)
    if template is None:
        print(json.dumps({"error": f"Failed to read template: {args.template}"}))
        sys.exit(1)

    # Template matching
    result = cv2.matchTemplate(screenshot, template, cv2.TM_CCOEFF_NORMED)
    _, max_val, _, max_loc = cv2.minMaxLoc(result)

    h, w = template.shape[:2]
    sh, sw = screenshot.shape[:2]

    # Center of match, normalized to 0-1
    cx = (max_loc[0] + w / 2) / sw
    cy = (max_loc[1] + h / 2) / sh

    if max_val >= args.threshold:
        print(json.dumps({
            "found": True,
            "x": round(cx, 4),
            "y": round(cy, 4),
            "confidence": round(float(max_val), 4),
        }))
    else:
        print(json.dumps({
            "found": False,
            "confidence": round(float(max_val), 4),
            "bestX": round(cx, 4),
            "bestY": round(cy, 4),
        }))

if __name__ == '__main__':
    main()
