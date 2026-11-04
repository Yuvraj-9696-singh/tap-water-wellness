// Mapping of the 9 dataset features
export interface ParameterStandard {
  name: string;
  unit: string;
  is10500Permissible: number | null;
  is10500Desirable: number | null;
  whoGuideline: number | null;
  weight: number;
  minAllowed: number;
  maxAllowed: number;
  idealValue: number;
  description: string;
  healthEffect: string;
  remediation: string;
  isLowerBetter: boolean;
}

export const IS_10500_STANDARDS: Record<string, ParameterStandard> = {
  pH: {
    name: "pH",
    unit: "",
    is10500Permissible: 8.5,
    is10500Desirable: 7.0,
    whoGuideline: 8.5,
    weight: 0.15,
    minAllowed: 0,
    maxAllowed: 14,
    idealValue: 7.0,
    description: "pH represents acidity/alkalinity of water.",
    healthEffect: "Excessive ranges cause pipe corrosion and gastrointestinal irritation.",
    remediation: "Use calcite/soda ash for acidic water, acid dosing for alkaline.",
    isLowerBetter: false,
  },
  Hardness: {
    name: "Hardness",
    unit: "mg/L",
    is10500Permissible: 600,
    is10500Desirable: 200,
    whoGuideline: 200,
    weight: 0.1,
    minAllowed: 0,
    maxAllowed: 1000,
    idealValue: 100,
    description: "Measure of calcium and magnesium salts in water.",
    healthEffect: "Very hard water scaling problems, laxative effects, poor taste.",
    remediation: "Water softeners, reverse osmosis, ion exchange resins.",
    isLowerBetter: true,
  },
  Solids: {
    name: "Solids",
    unit: "mg/L",
    is10500Permissible: 2000,
    is10500Desirable: 500,
    whoGuideline: 600,
    weight: 0.1,
    minAllowed: 0,
    maxAllowed: 5000,
    idealValue: 100,
    description: "Total Dissolved Solids (TDS).",
    healthEffect: "High levels lead to palatability issues and gastro stress.",
    remediation: "Reverse Osmosis (RO) filtration.",
    isLowerBetter: true,
  },
  Chloramines: {
    name: "Chloramines",
    unit: "mg/L",
    is10500Permissible: 4,
    is10500Desirable: 4,
    whoGuideline: 3,
    weight: 0.15,
    minAllowed: 0,
    maxAllowed: 10,
    idealValue: 0,
    description: "Disinfectants used to treat drinking water.",
    healthEffect: "High levels cause eye/nose irritation and stomach discomfort.",
    remediation: "Carbon filtration, UV light destruction.",
    isLowerBetter: true,
  },
  Sulfate: {
    name: "Sulfate",
    unit: "mg/L",
    is10500Permissible: 400,
    is10500Desirable: 200,
    whoGuideline: 250,
    weight: 0.1,
    minAllowed: 0,
    maxAllowed: 1000,
    idealValue: 0,
    description: "Naturally occurring minerals.",
    healthEffect: "Produces a laxative effect and bitter taste.",
    remediation: "RO systems, distillation.",
    isLowerBetter: true,
  },
  Conductivity: {
    name: "Conductivity",
    unit: "μS/cm",
    is10500Permissible: 1000,
    is10500Desirable: 400,
    whoGuideline: 400,
    weight: 0.05,
    minAllowed: 0,
    maxAllowed: 1500,
    idealValue: 250,
    description: "Ability to conduct electricity indicating ion density.",
    healthEffect: "Indicates heavy heavy metal/contamination content.",
    remediation: "Deionization and RO isolation.",
    isLowerBetter: true,
  },
  Organic_carbon: {
    name: "Organic Carbon",
    unit: "mg/L",
    is10500Permissible: 4,
    is10500Desirable: 2,
    whoGuideline: 4,
    weight: 0.1,
    minAllowed: 0,
    maxAllowed: 30,
    idealValue: 0,
    description: "TOC is a measure of the total amount of carbon in organic compounds.",
    healthEffect: "Potential pathogen growth factor and disinfection byproduct formation.",
    remediation: "Activated carbon, biofiltration.",
    isLowerBetter: true,
  },
  Trihalomethanes: {
    name: "Trihalomethanes",
    unit: "μg/L",
    is10500Permissible: 80,
    is10500Desirable: 80,
    whoGuideline: 80,
    weight: 0.1,
    minAllowed: 0,
    maxAllowed: 200,
    idealValue: 0,
    description: "Chemicals formed when chlorine reacts with organic matter.",
    healthEffect: "Long term exposure linked to liver/kidney issues and cancer risk.",
    remediation: "Carbon filtering, ozone treatment.",
    isLowerBetter: true,
  },
  Turbidity: {
    name: "Turbidity",
    unit: "NTU",
    is10500Permissible: 5,
    is10500Desirable: 1,
    whoGuideline: 5,
    weight: 0.15,
    minAllowed: 0,
    maxAllowed: 10,
    idealValue: 0,
    description: "Measure of relative clarity of a liquid.",
    healthEffect: "Harbors pathogens, bacteria, and viral anomalies.",
    remediation: "Coagulation, ultrafiltration.",
    isLowerBetter: true,
  },
};

export const PARAMETER_NAMES = Object.keys(IS_10500_STANDARDS);

export function getParameterStandard(name: string): ParameterStandard | undefined {
  return IS_10500_STANDARDS[name.replace(" ", "_")] || IS_10500_STANDARDS[name];
}

export function getWQIClass(wqi: number): {
  label: string;
  description: string;
  colorClass: string;
  bgClass: string;
  status: "safe" | "warning" | "danger";
  drinkable: boolean;
} {
  if (wqi >= 90) return {
    label: "Excellent",
    description: "Water quality is ideal - ML confidence exceedingly high",
    colorClass: "text-success",
    bgClass: "bg-success",
    status: "safe",
    drinkable: true,
  };
  if (wqi >= 70) return {
    label: "Good",
    description: "Water is safe for drinking - minor algorithm deviations",
    colorClass: "text-success",
    bgClass: "bg-success",
    status: "safe",
    drinkable: true,
  };
  if (wqi >= 50) return {
    label: "Fair",
    description: "Water quality needs improvement - ML detects exceedances",
    colorClass: "text-warning",
    bgClass: "bg-warning",
    status: "warning",
    drinkable: false,
  };
  if (wqi >= 25) return {
    label: "Poor",
    description: "Unsuitable for drinking - Model detects toxicity",
    colorClass: "text-destructive",
    bgClass: "bg-destructive",
    status: "danger",
    drinkable: false,
  };
  return {
    label: "Very Poor",
    description: "Severely contaminated - Immediate danger to life",
    colorClass: "text-destructive",
    bgClass: "bg-destructive",
    status: "danger",
    drinkable: false,
  };
}
