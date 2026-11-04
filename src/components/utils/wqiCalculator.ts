import { IS_10500_STANDARDS } from "@/components/Data/isStandards";
import { WaterParameter } from "@/components/Data/demoData";

/**
 * IS 10500 / WHO Weighted Sub-Index WQI Calculator
 *
 * Formula:
 *   qi  = ((Vi - Vio) / (Vs - Vio)) × 100   [sub-index per parameter]
 *   WQI = Σ(qi × Wi) / Σ(Wi)               [weighted arithmetic mean]
 *
 * Where:
 *   Vi  = observed value
 *   Vio = ideal value (WHO/IS permissible best value)
 *   Vs  = IS 10500 / WHO standard value
 *   Wi  = unit weight = k / Vs  (k = proportionality constant)
 */
export function calculateWQI(parameters: WaterParameter[]): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const param of parameters) {
    const qi = calculateSubIndex(param);
    const weight = getWeight(param.name);
    weightedSum += qi * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 0;
  return Math.round(Math.min(100, Math.max(0, weightedSum / totalWeight)));
}

/**
 * Calculate sub-index for a single parameter.
 * Returns value in range [0, 100] — 100 is ideal.
 */
function calculateSubIndex(param: WaterParameter): number {
  const std = IS_10500_STANDARDS[param.name];
  if (!std) return calculateFallbackSubIndex(param);

  const { value, idealValue } = param;
  const { minAllowed, maxAllowed } = std;
  const Vs = std.is10500Permissible ?? std.whoGuideline ?? std.maxAllowed;

  if (std.name === "pH") {
    // pH is a range parameter, not lower-is-better
    const ideal = 7.0;
    const fullRange = 1.5; // 6.5 to 8.5 -> ideal at 7.0
    const deviation = Math.abs(value - ideal);
    const qi = Math.max(0, 100 - (deviation / fullRange) * 100);
    return qi;
  }

  if (std.name === "DO") {
    // Higher is better for DO
    const ideal = 8;
    const min = 6;
    if (value >= ideal) return 100;
    if (value <= 0) return 0;
    return Math.max(0, (value / ideal) * 100);
  }

  // For lower-is-better parameters
  if (Vs === 0 || Vs === null) return 100;
  if (value <= idealValue) return 100;
  const qi = Math.max(0, 100 - ((value - idealValue) / (Vs - idealValue)) * 100);
  return qi;
}

function calculateFallbackSubIndex(param: WaterParameter): number {
  const { value, minSafe, maxSafe, idealValue } = param;
  const range = maxSafe - minSafe;
  if (range === 0) return 100;
  const deviation = Math.abs(value - idealValue);
  const maxDeviation = Math.max(Math.abs(maxSafe - idealValue), Math.abs(minSafe - idealValue));
  if (maxDeviation === 0) return 100;
  return Math.max(0, 100 - (deviation / maxDeviation) * 100);
}

function getWeight(paramName: string): number {
  return IS_10500_STANDARDS[paramName]?.weight ?? 0.1;
}

export function getWQICategory(wqi: number): { label: string; color: string; description: string } {
  if (wqi >= 90) return { label: "Excellent", color: "success", description: "Water quality is ideal for drinking — all parameters within desirable limits" };
  if (wqi >= 70) return { label: "Good", color: "success", description: "Water is safe for drinking with minor concerns" };
  if (wqi >= 50) return { label: "Fair", color: "warning", description: "Water quality needs improvement — some parameters exceed desirable limits" };
  if (wqi >= 25) return { label: "Poor", color: "destructive", description: "Water is not suitable for drinking — multiple parameters exceed permissible limits" };
  return { label: "Very Poor", color: "destructive", description: "Water is severely contaminated — unsafe without treatment" };
}

export function isParameterExceeding(param: WaterParameter): boolean {
  const std = IS_10500_STANDARDS[param.name];
  if (!std) return param.value < param.minSafe || param.value > param.maxSafe;

  if (std.name === "pH") return param.value < 6.5 || param.value > 8.5;
  if (std.name === "DO") return param.value < 6;

  const limit = std.is10500Permissible ?? std.whoGuideline ?? std.maxAllowed;
  return param.value > limit;
}

export function isParameterAboveDesirable(param: WaterParameter): boolean {
  const std = IS_10500_STANDARDS[param.name];
  if (!std) return false;

  if (std.name === "pH") return param.value < 6.8 || param.value > 7.5;
  if (std.name === "DO") return param.value < 7;

  const desirable = std.is10500Desirable ?? std.whoGuideline ?? std.maxAllowed;
  if (desirable === null) return false;
  return param.value > desirable;
}

export function getExceedingParameters(parameters: WaterParameter[]): WaterParameter[] {
  return parameters.filter(isParameterExceeding);
}

export function predictPotability(wqi: number): "Fit for Drinking" | "Not Fit for Drinking" {
  return wqi >= 70 ? "Fit for Drinking" : "Not Fit for Drinking";
}
