import { describe, it, expect } from "vitest";
import { demoTaps } from "@/components/Data/demoData";
import {
  getStationStatus,
  parseMinutesAgo,
  getWQIBand,
  STALE_THRESHOLD_MINUTES,
} from "@/config/waterQualityConfig";

describe("Phase 1: Water Quality Logic & Single Source of Truth", () => {
  it("computes campus average WQI correctly from station records (72)", () => {
    const totalWqi = demoTaps.reduce((sum, tap) => sum + tap.wqi, 0);
    const avgWqi = Math.round(totalWqi / demoTaps.length);
    expect(avgWqi).toBe(72);
  });

  it("ensures Rajputana Ground has consistent WQI of 65 across evaluations", () => {
    const rajputana = demoTaps.find((t) => t.id === "tap-2");
    expect(rajputana).toBeDefined();
    expect(rajputana?.wqi).toBe(65);

    const evaluation = getStationStatus(rajputana!);
    expect(evaluation.wqiBand).toBe("Fair");
    expect(evaluation.baseStatus).toBe("warning");
  });

  it("removes potability contradiction: only safe stations can be 'Fit for Drinking'", () => {
    demoTaps.forEach((tap) => {
      const evaluation = getStationStatus(tap);
      if (evaluation.baseStatus === "safe") {
        expect(evaluation.potability).toBe("Fit for Drinking");
      } else {
        expect(evaluation.potability).toBe("Not Fit for Drinking");
        expect(evaluation.potabilityLabel).not.toBe("Fit for Drinking");
      }
    });
  });

  it("identifies stale stations when lastUpdated exceeds 30 minutes", () => {
    expect(parseMinutesAgo("Just now")).toBe(0);
    expect(parseMinutesAgo("2 mins ago")).toBe(2);
    expect(parseMinutesAgo("12 mins ago")).toBe(12);
    expect(parseMinutesAgo("47 mins ago")).toBe(47);
    expect(parseMinutesAgo("1 hour ago")).toBe(60);

    const rajputana = demoTaps.find((t) => t.id === "tap-2");
    const lc = demoTaps.find((t) => t.id === "tap-4");
    const vh = demoTaps.find((t) => t.id === "tap-1");

    expect(getStationStatus(rajputana!).isStale).toBe(true);
    expect(getStationStatus(lc!).isStale).toBe(true);
    expect(getStationStatus(vh!).isStale).toBe(false);
  });

  it("categorizes WQI into correct standard bands", () => {
    expect(getWQIBand(95)).toBe("Excellent");
    expect(getWQIBand(75)).toBe("Good");
    expect(getWQIBand(60)).toBe("Fair");
    expect(getWQIBand(35)).toBe("Poor");
  });
});

