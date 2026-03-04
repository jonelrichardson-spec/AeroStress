"""
PDF report generation (P0): Critical Action Report and Inspection Report.
"""

import io
from typing import Any, Dict, List, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def _safe(s: Any) -> str:
    if s is None:
        return "—"
    return str(s)


def build_critical_action_pdf(turbines: List[Dict[str, Any]], fleet_name: str) -> io.BytesIO:
    """Generate Critical Action Report PDF: top % at-risk turbines for executives."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, rightMargin=0.75 * inch, leftMargin=0.75 * inch)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ReportTitle", parent=styles["Heading1"], fontSize=16, spaceAfter=12
    )
    story = [
        Paragraph("AeroStress Critical Action Report", title_style),
        Paragraph(f"Fleet: {_safe(fleet_name)}", styles["Normal"]),
        Paragraph(f"Top {len(turbines)} turbine(s) at highest risk (by True Age)", styles["Normal"]),
        Spacer(1, 0.25 * inch),
    ]
    if not turbines:
        story.append(Paragraph("No turbines in this fleet.", styles["Normal"]))
    else:
        data = [
            [
                "Turbine ID",
                "True Age",
                "Calendar Age",
                "Terrain",
                "Multiplier",
                "Model",
                "State",
            ]
        ]
        for t in turbines:
            data.append([
                _safe(t.get("id"))[:8] + "…" if t.get("id") and len(str(t.get("id"))) > 8 else _safe(t.get("id")),
                _safe(t.get("true_age_years")),
                _safe(t.get("calendar_age_years")),
                _safe(t.get("terrain_class")),
                _safe(t.get("stress_multiplier")),
                _safe(t.get("model"))[:20] + "…" if t.get("model") and len(str(t.get("model"))) > 20 else _safe(t.get("model")),
                _safe(t.get("state")),
            ])
        table = Table(data, colWidths=[1.2 * inch, 0.7 * inch, 0.9 * inch, 0.8 * inch, 0.7 * inch, 1.2 * inch, 0.6 * inch])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
            ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("FONTSIZE", (0, 1), (-1, -1), 8),
        ]))
        story.append(table)
    doc.build(story)
    buf.seek(0)
    return buf


# P2: Default repair recommendation and cost range by severity (1-5)
_SEVERITY_RECOMMENDATION = {
    1: ("Monitor; no immediate action", 0, 1000),
    2: ("Schedule follow-up inspection", 1000, 5000),
    3: ("Plan repair within 6 months", 5000, 12000),
    4: ("Prioritize repair within 3 months", 12000, 25000),
    5: ("Urgent repair; consider shutdown if critical", 20000, 50000),
}


def build_inspection_report_pdf(
    inspection: Dict[str, Any],
    turbine: Dict[str, Any],
    repair_recommendation: Optional[Dict[str, Any]] = None,
) -> io.BytesIO:
    """Generate Inspection Report PDF for a single completed inspection. P2: includes repair recommendation + cost."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, rightMargin=0.75 * inch, leftMargin=0.75 * inch)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ReportTitle", parent=styles["Heading1"], fontSize=14, spaceAfter=10
    )
    story = [
        Paragraph("AeroStress Inspection Report", title_style),
        Spacer(1, 0.2 * inch),
        Paragraph(f"<b>Turbine ID:</b> {_safe(turbine.get('id'))}", styles["Normal"]),
        Paragraph(f"<b>Location:</b> {_safe(turbine.get('latitude'))}, {_safe(turbine.get('longitude'))}", styles["Normal"]),
        Paragraph(f"<b>Terrain class:</b> {_safe(turbine.get('terrain_class'))}", styles["Normal"]),
        Paragraph(f"<b>AeroStress prediction (True Age):</b> {_safe(turbine.get('true_age_years'))} years", styles["Normal"]),
        Paragraph(f"<b>Date conducted:</b> {_safe(inspection.get('conducted_at'))}", styles["Normal"]),
        Paragraph(f"<b>Inspector:</b> {_safe(inspection.get('inspector_name'))}", styles["Normal"]),
        Spacer(1, 0.3 * inch),
        Paragraph("Findings", styles["Heading2"]),
        Paragraph(f"<b>Component:</b> {_safe(inspection.get('component_inspected'))}", styles["Normal"]),
        Paragraph(f"<b>Condition:</b> {_safe(inspection.get('condition_found'))}", styles["Normal"]),
        Paragraph(f"<b>Severity (1–5):</b> {_safe(inspection.get('severity_rating'))}", styles["Normal"]),
        Paragraph(f"<b>Notes:</b> {_safe(inspection.get('notes'))}", styles["Normal"]),
    ]
    # P2: Repair recommendation and estimated cost
    severity = inspection.get("severity_rating")
    if repair_recommendation:
        rec_action = repair_recommendation.get("recommended_action")
        low, high = repair_recommendation.get("estimated_cost_low"), repair_recommendation.get("estimated_cost_high")
    elif severity is not None and 1 <= severity <= 5:
        rec_action, low, high = _SEVERITY_RECOMMENDATION.get(int(severity), ("Review recommended", 0, 0))
    else:
        rec_action, low, high = "Review recommended", 0, 0
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph("Repair recommendation (P2)", styles["Heading2"]))
    story.append(Paragraph(f"<b>Recommended action:</b> {_safe(rec_action)}", styles["Normal"]))
    story.append(Paragraph(f"<b>Estimated cost:</b> ${low:,}–${high:,}", styles["Normal"]))
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph(f"Report generated for asset managers and compliance. Status: {_safe(inspection.get('status'))}.", styles["Normal"]))
    doc.build(story)
    buf.seek(0)
    return buf
