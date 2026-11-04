import { getWQIClass } from "@/components/Data/isStandards";
import { IS_10500_STANDARDS, PARAMETER_NAMES, getParameterStandard } from "@/components/Data/isStandards";
import { calculateWQI } from "./wqiCalculator";

export interface PredictionInput {
  pH: number;
  Hardness: number;
  Solids: number;
  Chloramines: number;
  Sulfate: number;
  Conductivity: number;
  Organic_carbon: number;
  Trihalomethanes: number;
  Turbidity: number;
}

export interface TreatmentAction {
  parameter: string;
  instruction: string;
  issue: string;
}

export interface PredictionResult {
  wqi: number;              
  label: string;
  potability: "Fit for Drinking" | "Not Fit for Drinking";
  parameterScores: Record<string, number>;
  riskFactors: string[];
  recommendation: string;
  treatmentPlan: TreatmentAction[];
  alternativeUses: string[];
}

function getAlternativeUses(wqi: number): string[] {
  const uses: string[] = [];
  if (wqi >= 70) {
      uses.push("Domestic Drinking Supply", "Food Processing & Beverages", "Pharmaceutical Manufacturing", "High-Grade Aquaculture");
  } else if (wqi >= 50) {
      uses.push("Agricultural Irrigation", "Textile & Leather Manufacturing", "Livestock Watering");
  } else if (wqi >= 25) {
      uses.push("Industrial Cooling Towers", "Construction & Concrete Mixing", "Mining Dust Control");
  } else {
      uses.push("Strictly Industrial Waste Treatment", "Severe Contamination Isolation (Do Not Touch)");
  }
  return uses;
}

// Renamed internally but keeping the export name to avoid breaking imports
export function predictWaterQuality(input: PredictionInput): PredictionResult {

  const riskFactors: string[] = [];
  const treatmentPlan: TreatmentAction[] = [];
  
  const wqiParams = PARAMETER_NAMES.map(paramKey => {
    let uiKey = paramKey.replace(" ", "_") as keyof PredictionInput;
    if (paramKey === "pH" || paramKey === "ph") uiKey = "pH";
    
    const val = (input as any)[uiKey];
    const std = getParameterStandard(paramKey);
    
    if (std && val !== undefined) {
      if (paramKey === "pH" || paramKey === "ph") {
        if (val < 6.5) {
          riskFactors.push("pH");
          treatmentPlan.push({ parameter: "pH", issue: "Too Acidic", instruction: std.remediation });
        } else if (val > 8.5) {
          riskFactors.push("pH");
          treatmentPlan.push({ parameter: "pH", issue: "Too Alkaline", instruction: std.remediation });
        }
      } else {
        const limit = std.is10500Permissible ?? std.maxAllowed;
        if (val > limit) {
          riskFactors.push(std.name);
          treatmentPlan.push({ parameter: std.name, issue: "Exceeds Permissible Limit", instruction: std.remediation });
        }
      }
    }

    return {
      name: paramKey,
      value: val,
      unit: std?.unit || "",
      minSafe: std?.minAllowed || 0,
      maxSafe: std?.is10500Permissible ?? std?.maxAllowed ?? 100,
      idealValue: std?.idealValue || 0,
      category: "Chemical" as const
    };
  });

  const finalWqi = calculateWQI(wqiParams);
  const classData = getWQIClass(finalWqi);
  const alternativeUses = getAlternativeUses(finalWqi);

  let recommendation = `Mathematical Index evaluates water quality as ${classData.label}. `;
  if (riskFactors.length > 0) {
    recommendation += `Critical parameters outside IS 10500 limits: ${riskFactors.join(", ")}. Immediate neutralization required using established methods.`;
  } else if (finalWqi < 70) {
    recommendation += "Water quality parameters are marginally safe but have high mineralization or slight impurities.";
  } else {
    recommendation += "All parameters strictly satisfy safe IS 10500 drinking benchmarks. Water is chemically stable.";
  }

  const potabilityStr = finalWqi >= 70 ? "Fit for Drinking" : "Not Fit for Drinking";

  return {
    wqi: finalWqi,
    label: classData.label,
    potability: potabilityStr,
    parameterScores: {},
    riskFactors,
    recommendation,
    treatmentPlan,
    alternativeUses
  };
}

