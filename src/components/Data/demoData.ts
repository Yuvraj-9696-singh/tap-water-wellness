import { IS_10500_STANDARDS } from "./isStandards";

export interface WaterParameter {
  name: string;
  value: number;
  unit: string;
  minSafe: number;
  maxSafe: number;
  idealValue: number;
  category: "Physical" | "Chemical";
}

const buildParam = (name: string, value: number, category: "Physical" | "Chemical"): WaterParameter => {
  const std = IS_10500_STANDARDS[name.replace(" ", "_")] || IS_10500_STANDARDS[name];
  return {
    name,
    value,
    unit: std.unit,
    minSafe: std.minAllowed,
    maxSafe: std.is10500Desirable ?? std.is10500Permissible ?? std.maxAllowed,
    idealValue: std.idealValue,
    category,
  };
};

export type TapZone = "all" | "academic" | "hostel" | "sports";

export interface TapLocation {
  id: string;
  name: string;
  location: string;
  status: "safe" | "warning" | "danger";
  wqi: number;
  prediction: "Fit for Drinking" | "Not Fit for Drinking";
  parameters: WaterParameter[];
  lastUpdated: string;
  latitude?: number;
  longitude?: number;
  mapX?: number;
  mapY?: number;
  // Sensor health fields
  sensorStatus: "healthy" | "faulty";  // IoT sensor operational status
  faultyParams?: string[];              // Which sensor readings are missing/noisy
  mlPredictedWqi?: number;             // AI fallback WQI when sensor is faulty
  mlConfidence?: number;               // Model confidence level (0–100)
}

export const demoTaps: TapLocation[] = [
  {
    id: "tap-1",
    name: "Vishwakarma Hostel",
    location: "hostel",
    status: "safe",
    wqi: 92,
    prediction: "Fit for Drinking",
    lastUpdated: "Just now",
    sensorStatus: "healthy",
    mapX: 20,
    mapY: 35,
    parameters: [
      buildParam("pH", 7.2, "Chemical"),
      buildParam("Hardness", 120, "Chemical"),
      buildParam("Solids", 150, "Physical"),
      buildParam("Chloramines", 1.2, "Chemical"),
      buildParam("Sulfate", 50, "Chemical"),
      buildParam("Conductivity", 200, "Physical"),
      buildParam("Organic_carbon", 1.1, "Chemical"),
      buildParam("Trihalomethanes", 20, "Chemical"),
      buildParam("Turbidity", 0.5, "Physical"),
    ],
  },
  {
    id: "tap-2",
    name: "Rajputana Ground",
    location: "sports",
    status: "warning",
    wqi: 65,
    prediction: "Not Fit for Drinking",
    lastUpdated: "47 mins ago",
    // ⚠️ FAULTY SENSOR: Hardness, Sulfate, and Turbidity sensors offline
    sensorStatus: "faulty",
    faultyParams: ["Hardness", "Sulfate", "Turbidity"],
    mlPredictedWqi: 61,
    mlConfidence: 78,
    mapX: 75,
    mapY: 20,
    parameters: [
      buildParam("pH", 6.8, "Chemical"),
      buildParam("Hardness", 350, "Chemical"),  // last known value — sensor offline
      buildParam("Solids", 600, "Physical"),
      buildParam("Chloramines", 2.1, "Chemical"),
      buildParam("Sulfate", 210, "Chemical"),   // last known value — sensor offline
      buildParam("Conductivity", 850, "Physical"),
      buildParam("Organic_carbon", 2.5, "Chemical"),
      buildParam("Trihalomethanes", 45, "Chemical"),
      buildParam("Turbidity", 2.1, "Physical"),  // last known value — sensor offline
    ],
  },
  {
    id: "tap-3",
    name: "Main Library",
    location: "academic",
    status: "safe",
    wqi: 88,
    prediction: "Fit for Drinking",
    lastUpdated: "12 mins ago",
    sensorStatus: "healthy",
    mapX: 50,
    mapY: 50,
    parameters: [
      buildParam("pH", 7.5, "Chemical"),
      buildParam("Hardness", 90, "Chemical"),
      buildParam("Solids", 120, "Physical"),
      buildParam("Chloramines", 0.8, "Chemical"),
      buildParam("Sulfate", 40, "Chemical"),
      buildParam("Conductivity", 150, "Physical"),
      buildParam("Organic_carbon", 0.5, "Chemical"),
      buildParam("Trihalomethanes", 15, "Chemical"),
      buildParam("Turbidity", 0.2, "Physical"),
    ],
  },
  {
    id: "tap-4",
    name: "LC (Lecture Complex)",
    location: "academic",
    status: "danger",
    wqi: 35,
    prediction: "Not Fit for Drinking",
    lastUpdated: "1 hour ago",
    sensorStatus: "healthy",
    mapX: 40,
    mapY: 75,
    parameters: [
      buildParam("pH", 5.5, "Chemical"),
      buildParam("Hardness", 550, "Chemical"),
      buildParam("Solids", 2100, "Physical"),
      buildParam("Chloramines", 4.5, "Chemical"),
      buildParam("Sulfate", 450, "Chemical"),
      buildParam("Conductivity", 1800, "Physical"),
      buildParam("Organic_carbon", 5.5, "Chemical"),
      buildParam("Trihalomethanes", 120, "Chemical"),
      buildParam("Turbidity", 8.5, "Physical"),
    ],
  },
  {
    id: "tap-5",
    name: "Visvesvaraya Hostel",
    location: "hostel",
    status: "safe",
    wqi: 82,
    prediction: "Fit for Drinking",
    lastUpdated: "2 mins ago",
    sensorStatus: "healthy",
    mapX: 85,
    mapY: 80,
    parameters: [
      buildParam("pH", 7.1, "Chemical"),
      buildParam("Hardness", 150, "Chemical"),
      buildParam("Solids", 300, "Physical"),
      buildParam("Chloramines", 1.5, "Chemical"),
      buildParam("Sulfate", 100, "Chemical"),
      buildParam("Conductivity", 400, "Physical"),
      buildParam("Organic_carbon", 1.8, "Chemical"),
      buildParam("Trihalomethanes", 30, "Chemical"),
      buildParam("Turbidity", 1.0, "Physical"),
    ],
  },
];

export const historicalData = [
  { time: "00:00", wqi: 85, ph: 7.1 },
  { time: "04:00", wqi: 84, ph: 7.2 },
  { time: "08:00", wqi: 78, ph: 6.9 },
  { time: "12:00", wqi: 75, ph: 6.8 },
  { time: "16:00", wqi: 82, ph: 7.1 },
  { time: "20:00", wqi: 88, ph: 7.3 },
];

export const PREDICTION_PRESETS = [
  {
    name: "Pristine RO Water",
    values: {
      pH: 7.0, Hardness: 50, Solids: 80, Chloramines: 0.1, Sulfate: 20, Conductivity: 100, Organic_carbon: 0.2, Trihalomethanes: 5, Turbidity: 0.1
    }
  },
  {
    name: "Tap Water (Average)",
    values: {
      pH: 7.2, Hardness: 250, Solids: 400, Chloramines: 2.0, Sulfate: 150, Conductivity: 600, Organic_carbon: 1.5, Trihalomethanes: 40, Turbidity: 1.5
    }
  },
  {
    name: "Contaminated (Untreated)",
    values: {
      pH: 5.8, Hardness: 500, Solids: 2500, Chloramines: 5.0, Sulfate: 500, Conductivity: 2000, Organic_carbon: 6.0, Trihalomethanes: 150, Turbidity: 15.0
    }
  }
];
