prd.md
AeroStress] PRD
Project: AeroStress
Owner: Jonel, Pape, Jagger
Date: 2/28/2026
Problem
"Wind turbine operators in complex terrain overspend an estimated $X on reactive maintenance annually because their monitoring system — SCADA — calculates wear using a flat-terrain baseline that misrepresents real stress loads by up to 2×. The result is unplanned failures costing $150K–$500K per incident."
Supporting Context:
NREL Wind Resource Meteorological Database (WRMDB)
IEC 61400-1 Turbulence Classes
NREL OpenFAST / MLife
eia.gov/electricity/data/eia923
NREL ATB
USWTDB 
Opportunity
75,417 wind turbines operate across the US. Approximately 32.5% — nearly 24,500 turbines — sit in moderate, complex, or coastal terrain where SCADA underestimates wear. At $40K–$150K in annual O&M per turbine, the addressable market for terrain-corrected predictive maintenance is approximately $1B–$3.6B annually.
Market Opportunity:
Massive Addressable Market: The global Wind Turbine Operations & Maintenance (O&M) market is valued at $25.9 billion in 2024 and is projected to surge to $39–$59 billion by 2030 (CAGR of 7.1%–8.5%).
The "Aging Fleet" Crisis: Over 44%–56% of global wind turbines are now over 10 years old, creating a massive demand for life-extension services. In the U.S. alone, blade repairs exceeded $1 billion last year.
The High Cost of Silence: A single catastrophic blade failure can cost $500,000+ per unit, while unplanned repairs account for nearly 57% of total O&M spend.
The Geographic Shift: As prime "flat-land" sites are filled, development is pushing into "complex terrain" (mountains and coasts) where standard models have a documented "error floor," leading to failure rates up to 55% higher in the first few years of operation for larger, newer models.

Users & Needs
Who: 
As a wind farm asset manager, I need to know which of my turbines are aging faster than their calendar age suggests, because I'm reserving the wrong amount of cash for repairs
As a maintenance crew supervisor, I need prioritized inspection lists based on actual stress risk, because I can't send a crane crew to every turbine every quarter
OUT OF SCOPE: As a project finance investor, I need a data-backed stress score per turbine, because I can't accurately model reserve funds without terrain-adjusted wear data

Proposed Solution
AeroStress is a predictive maintenance platform that calculates the "True Age" of wind turbines by analyzing the specific terrain and turbulence of their location. While standard software treats every turbine the same, we identify "Hidden Stress" in mountainous and coastal sites to predict mechanical failure before it happens. Essentially, we provide a high-fidelity "health tracker" for aging wind assets that traditional sensors miss. AeroStress ingests GPS coordinates from USWTDB, cross-references terrain classification from USGS elevation data, and applies IEC 61400-1 turbulence class multipliers to generate a stress-adjusted age score for each turbine."
Top 3 MVP Value props:
[The Vitamin] Accurate Asset Mapping: A centralized dashboard that integrates terrain data with existing wind models to provide a realistic baseline for turbine wear across different geographic locations.
[The Painkiller] Early Warning "Blind Spot" Detection: Identifies high-risk turbines in turbulent zones where standard models fail, preventing catastrophic blade snaps and bearing failures through targeted sensor placement.
OUT OF SCOPE: [The Steroid] The "True Age" Financial Forecast: A proprietary score that shows investors exactly how much more cash to reserve for repairs based on terrain, turning invisible physical stress into a concrete line item on a balance sheet.

Goals & Non-Goals
Goals:
Validate the "Terrain Gap": Successfully demonstrate that mountainous turbines are degrading faster than flat-land counterparts using historical repair data.
Reduce O&M Costs: Help operators lower Operations & Maintenance (O&M) spend by moving from calendar-based checks to risk-based inspections.
Secure Pilot Programs: Partner with three U.S. wind farm owners with assets aged 10+ years to test the "True Age" algorithm.

Non-Goals:
Manufacturing Hardware: We are not building our own physical sensors; we are a software layer that tells you where to put existing sensors.
Predicting Power Output: Our focus is on mechanical integrity and "health," not optimizing the daily energy market trade or grid distribution.
New Construction Consulting: This version is strictly for existing turbines (10+ years old) rather than site selection for brand-new wind farms.


Success Metrics



Goal
Signal
Metric
Target
Prove the "Terrain Gap"
Operators identify "high-stress" turbines they previously thought were "low-risk."
Stress Delta % (Difference between AeroStress "True Age" vs. OEM "Calendar Age").
>25% discrepancy flagged in 1st audit.
Prevent Catastrophic Failure
A turbine flagged by AeroStress as "High Risk" is inspected and found to have early-stage damage.
True Positive Rate (Number of confirmed "Blind Spot" wear cases).
90% accuracy on flagged high-risk components.
Drive Operational Efficiency
Owners shift their maintenance budget from "Generic Checks" to "AeroStress-Prioritized" repairs.
O&M Reallocation Ratio (% of budget moved from scheduled to predictive).
>30% of annual maintenance spend prioritized by AeroStress.
Engagement: Users find value
Asset Managers check the "Health Tracker" to plan their quarterly repair schedules.
Decision-Support Frequency (Logins per month per site manager).
>10 Monthly Active Users (MAU) per site.
Investor Confidence ( out of scope)
Project Finance partners use the AeroStress score to adjust their "Cash Reserve" requirements.
Reserve Fund Accuracy (Actual repair costs vs. AeroStress-predicted costs).
<15% variance between predicted and actual spend.
Model Accuracy Growth 
Ground truth findings confirm predictions
True Positive Rate improvement over time
 Accuracy improves from 80% → 90%+ after 12 months of field data







































Requirements

User Journey 1: Asset Manager Auditing an Aging Fleet Context: Asset managers need to justify maintenance budget reallocations. We are optimizing for the "Truth Gap"—showing them exactly where their current software is lying to them about turbine health.
[The Terrain Audit]
[P0] User can import fleet GPS coordinates and turbine models via CSV or API.
System must map these against global topographic and coastal data.
[P0] User can view a "Stress Heatmap" of their wind farm.
Visual representation of which turbines are in "High Turbulence" zones (ridges, cliffs, gaps).
[P1] User can see a "True Age" vs. "Chronological Age" comparison.
A side-by-side metric showing a turbine may be 10 years old but has the structural wear of a 16-year-old unit.
True Age is calculated as Calendar Age × Terrain Stress Multiplier, where the multiplier is derived from IEC 61400-1 turbulence class assigned to the turbine's GPS location using USGS elevation data. The control baseline is a Class C flat-terrain turbine of equivalent model and age operating under SCADA's standard assumptions.
[P1]  User can see a plain-language explanation of what the stress score means in context — not just a multiplier number - Example: "This turbine has the structural wear of a 16-year-old unit and is operating in IEC Class A terrain" - Note: Financial dollar estimates are out of scope for MVP. As the model accumulates ground truth data and prediction accuracy improves, cost projections will be introduced in a future version.
[P2] User can toggle "Historical Weather Overlays."
See how specific storm events in the last decade accelerated wear on specific ridge-line units.
[Risk Prioritization]
[P0] User can identify "Sensor Blind Spots."
System flags specific turbines that have high terrain stress but zero high-fidelity monitoring.
[P0] User can generate a "Critical Action Report."
A downloadable PDF for executives showing the top 5% of turbines at risk of catastrophic failure.
[P1] User can input current O&M costs to see "Projected Savings."
Shows the ROI of fixing a "High Stress" bearing now versus a full collapse in 18 months.

User Journey 2: Site Technician / Field Lead Planning Inspections Context: Technicians have limited time and high "climb costs." We are optimizing for "Inspection Accuracy"—ensuring they climb the right towers, not just the next one on the calendar.
[Inspection Scheduling]
[P0] User can view a prioritized "Climb List."
Ranked by AeroStress score rather than installation date.
[P0] User can access "Failure Mode Predictions" for specific units.
Tells the tech: "Check the main bearing for pitting," or "Look for leading-edge erosion on Blade B."
[Ground Truth & Model Learning]
[P1] User can log inspection findings directly in the app after a climb
Fields include: component inspected, condition found, severity rating, and free-text notes
Example: "Main bearing — pitting detected — severity 3/5 — 2mm fissure on drive side"
[P1] User can attach photos or video to a filed inspection report
Visual evidence tied to the specific turbine and component
[P1] App displays whether the technician's finding matched the AeroStress prediction — confirmed, partial, or not found
This closes the loop and shows the tech whether the system was right
[P2] System automatically flags when a confirmed finding significantly deviates from the prediction
Triggers a model review for that terrain class and turbine model combination
[P2] Maintenance repair workers can submit unstructured notes from repairs not initiated by AeroStress
Example: a tech notices unexpected corrosion during a routine visit — that data gets absorbed into the model even if AeroStress didn't flag it
[P2] System uses accumulated ground truth data to recalibrate stress multipliers over time
If Class A turbines of Model X are consistently showing more wear than predicted, the multiplier for that combination gets adjusted upward
[P2] User can view 3D "Stress Models" of the turbine structure.
Highlighting exactly where on the blade or tower the terrain-induced stress is concentrated.
[Proof of Work & Inspection Report]
[P0] User can generate a completed inspection report upon finishing a climb
Report auto-populates with turbine ID, location, terrain class, AeroStress prediction, date, and technician name
Technician adds findings, severity ratings, photos, and free-text notes


[P0] User can complete and save an inspection report offline
Report syncs and submits automatically when connectivity is restored

[P0] User can submit the report directly from the app upon completion
Submission timestamps the report and ties it to the specific turbine record
[P0] User can download or share the report as a PDF
Format is professional and presentable to asset managers, site owners, and compliance teams
[P1] Report clearly shows the AeroStress prediction alongside the technician's actual finding
Three possible outcomes displayed: Confirmed / Partial Match / Not Found
Example layout: "AeroStress predicted: leading edge erosion on Blade B — Technician found: erosion confirmed, severity 3/5, photo attached"
[P1] Asset manager receives a notification when a technician submits a completed report
Creates a real-time connection between field work and office decision-making
[P1] User can view a full inspection history for any turbine
Chronological log of every climb, finding, and outcome tied to that unit
[P2] Report includes a repair recommendation and estimated cost based on finding severity
Example: "Severity 3/5 erosion — recommended action: leading edge repair — estimated cost: $8,000–$12,000"
[P2] System tracks whether recommended repairs were completed and logs the outcome
Closes the full loop: prediction → inspection → repair → result

[Onboarding & Setup]
- [P0] User can create an account with email and password
- [P0] User can onboard their wind farm by entering GPS coordinates or uploading a CSV
   - Note: Initial terrain classification and USWTDB data seeding will be handled 
     by the AeroStress team during the onboarding process. This is not a self-serve 
     feature at launch.
- [P0] User can see confirmation that their turbines have been classified by terrain 
  type (flat / moderate / complex / coastal)
- [P0] User is assigned the asset manager role with appropriate dashboard access
- [P1] User can invite team members to view the same fleet dashboard
- [P2] User can import existing maintenance history to calibrate the True Age baseline

OUT OF SCOPE/ possible future feature:
User Journey 3: Financial Stakeholder / Investor Evaluating an Asset Context: Investors want to know if a mountainous wind farm is a "money pit." We are optimizing for "Financial Transparency."
[Due Diligence & Reserves]
[P0] User can see a "20-Year OpEx Forecast" based on terrain.
Adjusts standard depreciation models to account for mountainous wear-and-tear.
[P1] User can compare "Flat-Land Benchmark" vs. "Actual Site Stress."
Proves why this specific site needs a 20% higher contingency fund than a site in Kansas.
[P2] User can receive "Risk Alerts" for portfolio-wide weather events.
Automated notification if a high-stress site was hit by wind speeds exceeding its "True Age" threshold.

Legend Summary
[P0]: Terrain mapping, Stress Heatmap, Blind Spot identification, and Critical Action reporting.
[P1]: "True Age" metrics, ROI calculators, and Field Validation logging.
[P2]: 3D structural stress visualization, historical weather overlays, and portfolio-level financial alerts.


Legend
[P0] = MVP for a GA release
[P1] = Important for delightful experience
[P2] = Nice-to-have
