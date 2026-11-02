import { describe, expect, it } from "vite-plus/test";
import { calibrate, estimate, eyeFeatures, type CalibrationSample } from "@/lib/gaze/estimation";
import { Dwell } from "@/lib/gaze/dwell";

describe("calibrated eye navigation", () => {
  it("learns a person's screen mapping and rejects a motionless calibration", () => {
    const samples: CalibrationSample[] = [];
    for (const x of [0.1, 0.5, 0.9])
      for (const y of [0.1, 0.5, 0.9]) {
        for (let n = 0; n < 12; n++)
          samples.push({ features: [x * 0.3 + 0.4, y * 0.2 + 0.4, 0.5, 0.5], point: { x, y } });
      }
    const mapping = calibrate(samples);
    expect(mapping).not.toBeNull();
    const prediction = estimate(mapping!, [0.625, 0.45, 0.5, 0.5]);
    expect(prediction.x).toBeCloseTo(0.75, 1);
    expect(prediction.y).toBeCloseTo(0.25, 1);
    expect(calibrate(samples.map((s) => ({ ...s, features: [0.5, 0.5, 0.5, 0.5] })))).toBeNull();
    expect(calibrate([])).toBeNull();
  });

  it("does not navigate when a face is missing or the eyes are closed", () => {
    expect(eyeFeatures([])).toBeNull();
    const landmarks = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
    expect(eyeFeatures(landmarks)).toBeNull();
  });

  it("selects once per fixation and cancels progress when tracking or target is lost", () => {
    const dwell = new Dwell<string>(1200);
    expect(dwell.update("save", 0).activate).toBe(false);
    expect(dwell.update("save", 600).progress).toBe(0.5);
    expect(dwell.update("save", 1200).activate).toBe(true);
    expect(dwell.update("save", 3000).activate).toBe(false);
    dwell.update(null, 3100);
    expect(dwell.update("save", 3200).progress).toBe(0);
    expect(dwell.update("other", 3900).progress).toBe(0);
    expect(dwell.update("other", 5000).activate).toBe(false);
  });
});
