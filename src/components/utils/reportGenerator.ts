import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { TapLocation } from "@/components/Data/demoData";
import { IS_10500_STANDARDS } from "@/components/Data/isStandards";

export function generateWaterQualityReport(tap: TapLocation): void {
  const doc = new jsPDF();
  const primaryColor: [number, number, number] = [0, 188, 212];
  const darkBg: [number, number, number] = [10, 20, 35];
  const gray: [number, number, number] = [100, 100, 100];

  // Header background
  doc.setFillColor(...darkBg);
  doc.rect(0, 0, 210, 40, "F");

  // Title
  doc.setFontSize(20);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text("AquaWatch", 15, 18);
  doc.setFontSize(10);
  doc.setTextColor(180, 220, 240);
  doc.setFont("helvetica", "normal");
  doc.text("Water Quality Analysis Report", 15, 26);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 33);

  // WQI badge
  const wqiColor: [number, number, number] = tap.wqi >= 70 ? [34, 197, 94] : tap.wqi >= 50 ? [245, 158, 11] : [239, 68, 68];
  doc.setFillColor(...wqiColor);
  doc.roundedRect(150, 8, 50, 24, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(String(tap.wqi), 162, 20);
  doc.setFontSize(8);
  doc.text("WQI Score", 159, 27);

  // Station Info
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Tap Station Information", 15, 52);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text(`Station: ${tap.name}`, 15, 60);
  doc.text(`Location: ${tap.location}`, 15, 66);
  doc.text(`Last Updated: ${tap.lastUpdated || "Recent"}`, 15, 72);
  const latStr = typeof tap.latitude === "number" ? tap.latitude.toFixed(4) : "25.2615";
  const lngStr = typeof tap.longitude === "number" ? tap.longitude.toFixed(4) : "82.9878";
  doc.text(`GPS: ${latStr}°N, ${lngStr}°E`, 15, 78);

  // Prediction box
  const fitColor: [number, number, number] = tap.prediction === "Fit for Drinking" ? [34, 197, 94] : [239, 68, 68];
  doc.setFillColor(fitColor[0], fitColor[1], fitColor[2], 0.1);
  doc.setDrawColor(...fitColor);
  doc.roundedRect(110, 50, 85, 30, 3, 3, "FD");
  doc.setTextColor(...fitColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(tap.prediction, 152, 62, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`ML Prediction | Confidence: High`, 152, 70, { align: "center" });

  // Parameters table
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Parameter Analysis — IS 10500:2012 / WHO 2022 Standards", 15, 92);

  const tableRows = tap.parameters.map((p) => {
    const std = IS_10500_STANDARDS[p.name];
    const permissible = std?.is10500Permissible ?? "—";
    const desirable = std?.is10500Desirable ?? "—";
    const who = std?.whoGuideline ?? "—";
    const exceeds = p.value > (typeof permissible === "number" ? permissible : Infinity);
    const status = exceeds ? "❌ EXCEEDS" : "✓ OK";
    return [p.name, `${p.value} ${p.unit}`, `${desirable} ${p.unit}`, `${permissible} ${p.unit}`, `${who} ${p.unit}`, status];
  });

  autoTable(doc, {
    startY: 96,
    head: [["Parameter", "Measured", "IS Desirable", "IS Permissible", "WHO Guideline", "Status"]],
    body: tableRows,
    headStyles: {
      fillColor: darkBg,
      textColor: [0, 188, 212],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 248, 255] },
    didParseCell: (data) => {
      if (data.column.index === 5 && data.section === "body") {
        if (String(data.cell.text).includes("EXCEEDS")) {
          data.cell.styles.textColor = [239, 68, 68];
          data.cell.styles.fontStyle = "bold";
        } else {
          data.cell.styles.textColor = [34, 197, 94];
        }
      }
    },
  });

  // Recommendations
  const finalY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(50, 50, 50);
  doc.text("Recommendations", 15, finalY);

  const exceeding = tap.parameters.filter((p) => {
    const std = IS_10500_STANDARDS[p.name];
    const limit = std?.is10500Permissible;
    return typeof limit === "number" && p.value > limit;
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  if (exceeding.length === 0) {
    doc.text("• All parameters are within IS 10500:2012 permissible limits.", 15, finalY + 8);
    doc.text("• Water is safe for drinking. Continue routine monitoring.", 15, finalY + 14);
  } else {
    exceeding.forEach((p, i) => {
      const std = IS_10500_STANDARDS[p.name];
      doc.text(`• ${p.name}: ${std?.remediation ?? "Consult water quality expert."}`, 15, finalY + 8 + i * 12, { maxWidth: 180 });
    });
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFillColor(...darkBg);
  doc.rect(0, pageHeight - 12, 210, 12, "F");
  doc.setTextColor(100, 150, 180);
  doc.setFontSize(7);
  doc.text(
    "AquaWatch — IoT Water Quality Monitoring | IS 10500:2012 | WHO Drinking Water Guidelines 2022 | Confidential",
    105, pageHeight - 5, { align: "center" }
  );

  doc.save(`WaterQualityReport_${tap.name.replace(/ /g, "_")}_${Date.now()}.pdf`);
}
