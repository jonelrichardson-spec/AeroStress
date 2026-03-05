"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Wind,
  Calendar,
  MapPin,
  Hash,
  Zap,
  ShieldAlert,
  ClipboardList,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFarmStore } from "@/stores/useFarmStore";
import { getTurbineById, getStressExplanation, getFailurePredictions, getTurbineInspections, getInspectionReportUrl, createInspection, uploadInspectionAttachment } from "@/lib/api";
import { TERRAIN_CONFIG, KW_TO_MW_DIVISOR } from "@/lib/constants";
import type { Turbine, TerrainClass, StressExplanation, FailurePredictionsResponse, Inspection } from "@/lib/types";

export default function TurbineDetailPage() {
  const params = useParams<{ id: string }>();
  const turbineId = params.id;

  const [turbine, setTurbine] = useState<Turbine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stressExplanation, setStressExplanation] = useState<StressExplanation | null>(null);
  const [stressLoading, setStressLoading] = useState(false);
  const [stressError, setStressError] = useState<string | null>(null);

  const [failurePredictions, setFailurePredictions] = useState<FailurePredictionsResponse | null>(null);
  const [predictionsLoading, setPredictionsLoading] = useState(false);
  const [predictionsError, setPredictionsError] = useState<string | null>(null);

  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [inspectionsLoading, setInspectionsLoading] = useState(false);
  const [inspectionsError, setInspectionsError] = useState<string | null>(null);

  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [inspectionFormData, setInspectionFormData] = useState({
    inspector_name: "",
    component_inspected: "",
    condition_found: "",
    severity_rating: 2,
    notes: "",
  });
  const [submittingInspection, setSubmittingInspection] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedInspectionId, setSubmittedInspectionId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const turbines = useFarmStore((s) => s.turbines);
  const fetchTurbines = useFarmStore((s) => s.fetchTurbines);

  useEffect(() => {
    const loadTurbine = async () => {
      if (!turbineId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const data = await getTurbineById(turbineId);

        if (data) {
          setTurbine(data);
        } else {
          const fallback = turbines.find((t) => t.id === turbineId);
          if (fallback) {
            setTurbine(fallback);
          } else {
            if (turbines.length === 0) {
              await fetchTurbines();
              const refetch = turbines.find((t) => t.id === turbineId);
              setTurbine(refetch ?? null);
            } else {
              setTurbine(null);
            }
          }
        }
      } catch (err) {
        const fallback = turbines.find((t) => t.id === turbineId);
        if (fallback) {
          setTurbine(fallback);
          setError(null);
        } else {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load turbine data"
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTurbine();
  }, [turbineId, turbines, fetchTurbines]);

  // Fetch stress explanation when turbine is loaded
  useEffect(() => {
    const loadStressExplanation = async () => {
      if (!turbine?.id) return;

      try {
        setStressLoading(true);
        setStressError(null);
        const data = await getStressExplanation(turbine.id);
        setStressExplanation(data);
      } catch (err) {
        setStressError(
          err instanceof Error
            ? err.message
            : "Failed to load stress explanation"
        );
      } finally {
        setStressLoading(false);
      }
    };

    loadStressExplanation();
  }, [turbine?.id]);

  // Fetch failure predictions when turbine is loaded
  useEffect(() => {
    const loadFailurePredictions = async () => {
      if (!turbine?.id) return;

      try {
        setPredictionsLoading(true);
        setPredictionsError(null);
        const data = await getFailurePredictions(turbine.id);
        setFailurePredictions(data);
      } catch (err) {
        setPredictionsError(
          err instanceof Error
            ? err.message
            : "Failed to load failure predictions"
        );
      } finally {
        setPredictionsLoading(false);
      }
    };

    loadFailurePredictions();
  }, [turbine?.id]);

  // Fetch inspections when turbine is loaded
  useEffect(() => {
    const loadInspections = async () => {
      if (!turbine?.id) return;

      try {
        setInspectionsLoading(true);
        setInspectionsError(null);
        const data = await getTurbineInspections(turbine.id);
        // Sort by most recent first
        const sorted = data.sort((a, b) => {
          const dateA = new Date(a.conducted_at || a.created_at).getTime();
          const dateB = new Date(b.conducted_at || b.created_at).getTime();
          return dateB - dateA;
        });
        setInspections(sorted);
      } catch (err) {
        setInspectionsError(
          err instanceof Error
            ? err.message
            : "Failed to load inspections"
        );
      } finally {
        setInspectionsLoading(false);
      }
    };

    loadInspections();
  }, [turbine?.id]);

  const terrainConfig = useMemo(() => {
    if (!turbine) return null;
    return TERRAIN_CONFIG[turbine.terrain_class as TerrainClass];
  }, [turbine]);

  const handleSubmitInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turbine?.id) return;

    try {
      setSubmittingInspection(true);
      setSubmitError(null);

      const newInspection = await createInspection(turbine.id, inspectionFormData);

      // Refresh inspections list
      const data = await getTurbineInspections(turbine.id);
      const sorted = data.sort((a, b) => {
        const dateA = new Date(a.conducted_at || a.created_at).getTime();
        const dateB = new Date(b.conducted_at || b.created_at).getTime();
        return dateB - dateA;
      });
      setInspections(sorted);

      // Keep form open for photo upload
      setSubmittedInspectionId(newInspection.id);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit inspection"
      );
    } finally {
      setSubmittingInspection(false);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedFile || !submittedInspectionId) return;

    try {
      setUploadingPhoto(true);
      setUploadError(null);

      await uploadInspectionAttachment(submittedInspectionId, selectedFile);

      setUploadSuccess(true);
      setTimeout(() => {
        // Close form after showing success message
        handleCloseForm();
      }, 1500);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Failed to upload photo"
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCloseForm = () => {
    setShowInspectionForm(false);
    setSubmitError(null);
    setSubmittedInspectionId(null);
    setSelectedFile(null);
    setUploadError(null);
    setUploadSuccess(false);
    setInspectionFormData({
      inspector_name: "",
      component_inspected: "",
      condition_found: "",
      severity_rating: 2,
      notes: "",
    });
  };

  // ── Loading State ──
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-3">
        <Loader2 className="h-8 w-8 text-brand-amber animate-spin" />
        <p className="font-mono text-sm text-brand-muted">
          Loading turbine data...
        </p>
      </div>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-3">
        <AlertTriangle className="h-8 w-8 text-terrain-complex" />
        <p className="font-body text-sm text-brand-muted text-center max-w-md">
          {error}
        </p>
        <Link
          href="/dashboard"
          className="text-sm font-mono text-brand-amber hover:underline mt-2"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // ── Not Found State ──
  if (!turbine || !terrainConfig) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-3">
        <Wind className="h-8 w-8 text-brand-muted/40" />
        <p className="font-body text-sm text-brand-muted">
          Turbine not found
        </p>
        <Link
          href="/dashboard"
          className="text-sm font-mono text-brand-amber hover:underline mt-2"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const capacityMw = turbine.capacity_kw / KW_TO_MW_DIVISOR;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Back Button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-mono text-brand-muted hover:text-brand-text transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>

      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-display font-extrabold text-2xl text-brand-text">
            {turbine.project_name}
          </h1>
          <Badge
            variant="secondary"
            className="font-mono font-semibold text-xs"
            style={{ color: terrainConfig.color }}
          >
            <span
              className="inline-block h-2 w-2 rounded-full mr-1.5"
              style={{ backgroundColor: terrainConfig.color }}
            />
            {terrainConfig.label}
          </Badge>
        </div>
        <p className="font-body text-sm text-brand-muted mt-1">
          {turbine.manufacturer} {turbine.model} — {turbine.state}
        </p>
      </div>

      {/* ── True Age Breakdown (Hero Card) ── */}
      <Card className="bg-brand-surface border-brand-border">
        <CardHeader className="pb-3">
          <CardTitle className="font-display font-extrabold text-base text-brand-text">
            True Age Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2 flex-wrap">
            {/* Calendar Age */}
            <div className="text-center">
              <p className="text-[10px] font-mono text-brand-muted uppercase tracking-wider">
                Calendar Age
              </p>
              <p className="font-mono font-semibold text-3xl text-brand-text">
                {turbine.calendar_age_years.toFixed(1)}
              </p>
              <p className="text-xs font-mono text-brand-muted">yrs</p>
            </div>

            <span className="font-body text-2xl text-brand-muted pb-5">×</span>

            {/* Stress Multiplier */}
            <div className="text-center">
              <p className="text-[10px] font-mono text-brand-muted uppercase tracking-wider">
                Stress Multiplier
              </p>
              <p
                className="font-mono font-semibold text-3xl"
                style={{ color: terrainConfig.color }}
              >
                {turbine.stress_multiplier.toFixed(2)}x
              </p>
              <p className="text-xs font-mono text-brand-muted">
                {terrainConfig.risk}
              </p>
            </div>

            <span className="font-body text-2xl text-brand-muted pb-5">=</span>

            {/* True Age */}
            <div className="text-center">
              <p className="text-[10px] font-mono text-brand-muted uppercase tracking-wider">
                True Age
              </p>
              <p className="font-mono font-semibold text-3xl text-brand-accent">
                {turbine.true_age_years.toFixed(1)}
              </p>
              <p className="text-xs font-mono text-brand-muted">yrs</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Stress Analysis ── */}
      <Card className="bg-brand-surface border-brand-border">
        <CardHeader className="pb-3">
          <CardTitle className="font-display font-extrabold text-base text-brand-text">
            Stress Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stressLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 text-brand-amber animate-spin" />
            </div>
          ) : stressError ? (
            <div className="flex items-center gap-2 text-terrain-complex">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p className="font-body text-sm text-brand-muted">
                {stressError}
              </p>
            </div>
          ) : stressExplanation ? (
            <p className="font-body text-sm text-brand-text leading-relaxed">
              {stressExplanation.explanation}
            </p>
          ) : (
            <p className="font-body text-sm text-brand-muted italic">
              No stress analysis available for this turbine.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Failure Predictions ── */}
      <Card className="bg-brand-surface border-brand-border">
        <CardHeader className="pb-3">
          <CardTitle className="font-display font-extrabold text-base text-brand-text">
            Failure Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {predictionsLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 text-brand-amber animate-spin" />
            </div>
          ) : predictionsError ? (
            <div className="flex items-center gap-2 text-terrain-complex">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p className="font-body text-sm text-brand-muted">
                {predictionsError}
              </p>
            </div>
          ) : failurePredictions && failurePredictions.predictions.length > 0 ? (
            <div className="space-y-3">
              {failurePredictions.predictions.map((prediction, index) => {
                const severityColor =
                  prediction.severity === 1
                    ? "#52b788"
                    : prediction.severity === 2
                    ? "#f4a261"
                    : "#e85d3a";

                return (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-brand-surface2"
                  >
                    <div
                      className="h-2 w-2 rounded-full shrink-0 mt-1.5"
                      style={{ backgroundColor: severityColor }}
                    />
                    <div className="flex-1">
                      <p className="font-mono font-semibold text-sm text-brand-text">
                        {prediction.component}
                      </p>
                      <p className="font-mono text-xs text-brand-muted mt-0.5">
                        Probability: {(prediction.probability * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div
                      className="font-mono text-xs font-semibold px-2 py-1 rounded"
                      style={{ color: severityColor }}
                    >
                      Severity {prediction.severity}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="font-body text-sm text-brand-muted italic">
              No predicted failures.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Turbine Specs ── */}
      <Card className="bg-brand-surface border-brand-border">
        <CardHeader className="pb-3">
          <CardTitle className="font-display font-extrabold text-base text-brand-text">
            Turbine Specifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <SpecItem
              icon={Zap}
              label="Capacity"
              value={`${capacityMw.toFixed(2)} MW`}
            />
            <SpecItem
              icon={Calendar}
              label="Year Operational"
              value={String(turbine.year_operational)}
            />
            <SpecItem
              icon={MapPin}
              label="Location"
              value={
                turbine.county
                  ? `${turbine.county}, ${turbine.state}`
                  : turbine.state
              }
            />
            <SpecItem
              icon={Hash}
              label="USWTDB Case ID"
              value={String(turbine.case_id)}
            />
            <SpecItem
              icon={ShieldAlert}
              label="Risk Level"
              value={terrainConfig.risk}
              valueColor={terrainConfig.color}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── New Inspection Button ── */}
      {!showInspectionForm && (
        <button
          onClick={() => setShowInspectionForm(true)}
          className="w-full px-4 py-3 rounded-lg bg-brand-amber text-brand-bg font-mono font-semibold text-sm hover:bg-brand-accent transition-colors"
        >
          + New Inspection
        </button>
      )}

      {/* ── New Inspection Form ── */}
      {showInspectionForm && (
        <Card className="bg-brand-surface border-brand-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-display font-extrabold text-base text-brand-text">
              {submittedInspectionId ? "Inspection Submitted" : "New Inspection"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!submittedInspectionId ? (
            <form onSubmit={handleSubmitInspection} className="space-y-4">
              {/* Inspector Name */}
              <div>
                <label className="block font-mono text-xs text-brand-muted uppercase tracking-wider mb-1">
                  Inspector Name
                </label>
                <input
                  type="text"
                  value={inspectionFormData.inspector_name}
                  onChange={(e) =>
                    setInspectionFormData({
                      ...inspectionFormData,
                      inspector_name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-brand-surface2 border border-brand-border rounded-lg font-body text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-amber"
                  placeholder="Enter inspector name"
                  required
                />
              </div>

              {/* Component Inspected */}
              <div>
                <label className="block font-mono text-xs text-brand-muted uppercase tracking-wider mb-1">
                  Component Inspected
                </label>
                <input
                  type="text"
                  value={inspectionFormData.component_inspected}
                  onChange={(e) =>
                    setInspectionFormData({
                      ...inspectionFormData,
                      component_inspected: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-brand-surface2 border border-brand-border rounded-lg font-body text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-amber"
                  placeholder="e.g., Gearbox, Blade, Generator"
                  required
                />
              </div>

              {/* Condition Found */}
              <div>
                <label className="block font-mono text-xs text-brand-muted uppercase tracking-wider mb-1">
                  Condition Found
                </label>
                <textarea
                  value={inspectionFormData.condition_found}
                  onChange={(e) =>
                    setInspectionFormData({
                      ...inspectionFormData,
                      condition_found: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-brand-surface2 border border-brand-border rounded-lg font-body text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-amber resize-none"
                  placeholder="Describe the condition"
                  rows={3}
                  required
                />
              </div>

              {/* Severity Rating */}
              <div>
                <label className="block font-mono text-xs text-brand-muted uppercase tracking-wider mb-2">
                  Severity Rating
                </label>
                <div className="flex gap-4">
                  {[1, 2, 3].map((rating) => {
                    const severityColor =
                      rating === 1
                        ? "#52b788"
                        : rating === 2
                        ? "#f4a261"
                        : "#e85d3a";

                    return (
                      <label
                        key={rating}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="severity_rating"
                          value={rating}
                          checked={inspectionFormData.severity_rating === rating}
                          onChange={() =>
                            setInspectionFormData({
                              ...inspectionFormData,
                              severity_rating: rating,
                            })
                          }
                          className="sr-only"
                        />
                        <div
                          className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                            inspectionFormData.severity_rating === rating
                              ? "border-opacity-100"
                              : "border-opacity-30"
                          }`}
                          style={{ borderColor: severityColor }}
                        >
                          {inspectionFormData.severity_rating === rating && (
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: severityColor }}
                            />
                          )}
                        </div>
                        <span
                          className="font-mono text-sm"
                          style={{ color: severityColor }}
                        >
                          {rating}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-mono text-xs text-brand-muted uppercase tracking-wider mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={inspectionFormData.notes}
                  onChange={(e) =>
                    setInspectionFormData({
                      ...inspectionFormData,
                      notes: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-brand-surface2 border border-brand-border rounded-lg font-body text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-amber resize-none"
                  placeholder="Additional notes"
                  rows={2}
                />
              </div>

              {/* Error Message */}
              {submitError && (
                <div className="flex items-center gap-2 text-terrain-complex">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <p className="font-body text-sm">{submitError}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submittingInspection}
                  className="flex-1 px-4 py-2 rounded-lg bg-brand-amber text-brand-bg font-mono font-semibold text-sm hover:bg-brand-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingInspection ? "Submitting..." : "Submit Inspection"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  disabled={submittingInspection}
                  className="px-4 py-2 rounded-lg bg-brand-surface2 text-brand-text font-mono font-semibold text-sm hover:bg-brand-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
            ) : (
              <div className="space-y-4">
                {/* Success Message */}
                <div className="p-3 rounded-lg bg-terrain-flat/10 border border-terrain-flat/30">
                  <p className="font-body text-sm text-terrain-flat">
                    ✓ Inspection submitted successfully!
                  </p>
                </div>

                {/* Photo Upload Section */}
                <div className="space-y-3">
                  <label className="block font-mono text-xs text-brand-muted uppercase tracking-wider">
                    Attach Photo (Optional)
                  </label>

                  <div className="flex items-center gap-3">
                    <label className="flex-1 px-3 py-2 bg-brand-surface2 border border-brand-border rounded-lg cursor-pointer hover:bg-brand-bg transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedFile(file);
                            setUploadError(null);
                            setUploadSuccess(false);
                          }
                        }}
                        className="hidden"
                      />
                      <span className="font-body text-sm text-brand-text">
                        {selectedFile ? selectedFile.name : "Choose a photo"}
                      </span>
                    </label>

                    <button
                      onClick={handlePhotoUpload}
                      disabled={!selectedFile || uploadingPhoto || uploadSuccess}
                      className="px-4 py-2 rounded-lg bg-brand-amber text-brand-bg font-mono font-semibold text-sm hover:bg-brand-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingPhoto ? "Uploading..." : uploadSuccess ? "Uploaded ✓" : "Upload Photo"}
                    </button>
                  </div>

                  {/* Upload Success */}
                  {uploadSuccess && (
                    <p className="font-body text-sm text-terrain-flat">
                      Photo uploaded successfully!
                    </p>
                  )}

                  {/* Upload Error */}
                  {uploadError && (
                    <div className="flex items-center gap-2 text-terrain-complex">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <p className="font-body text-sm">{uploadError}</p>
                    </div>
                  )}
                </div>

                {/* Skip Button */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    disabled={uploadingPhoto}
                    className="px-4 py-2 rounded-lg bg-brand-surface2 text-brand-text font-mono font-semibold text-sm hover:bg-brand-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadSuccess ? "Done" : "Skip Photo"}
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Inspection History ── */}
      <Card className="bg-brand-surface border-brand-border">
        <CardHeader className="pb-3">
          <CardTitle className="font-display font-extrabold text-base text-brand-text">
            Inspection History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inspectionsLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 text-brand-amber animate-spin" />
            </div>
          ) : inspectionsError ? (
            <div className="flex items-center gap-2 text-terrain-complex">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p className="font-body text-sm text-brand-muted">
                {inspectionsError}
              </p>
            </div>
          ) : inspections.length > 0 ? (
            <div className="space-y-4">
              {inspections.map((inspection) => {
                const severityColor =
                  inspection.severity_rating === 1
                    ? "#52b788"
                    : inspection.severity_rating === 2
                    ? "#f4a261"
                    : "#e85d3a";

                const date = new Date(
                  inspection.conducted_at || inspection.created_at
                );
                const formattedDate = date.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });

                return (
                  <div
                    key={inspection.id}
                    className="p-4 rounded-lg bg-brand-surface2 border-l-4"
                    style={{ borderLeftColor: severityColor }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-mono font-semibold text-sm text-brand-text">
                            {inspection.component_inspected || "Component"}
                          </p>
                          {inspection.severity_rating && (
                            <span
                              className="font-mono text-xs font-semibold px-2 py-0.5 rounded"
                              style={{ color: severityColor }}
                            >
                              Severity {inspection.severity_rating}
                            </span>
                          )}
                        </div>
                        <p className="font-body text-sm text-brand-muted mb-1">
                          {inspection.condition_found || "No condition notes"}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <p className="font-mono text-xs text-brand-muted">
                            {inspection.inspector_name || "Unknown Inspector"}
                          </p>
                          <span className="text-brand-muted">•</span>
                          <p className="font-mono text-xs text-brand-muted">
                            {formattedDate}
                          </p>
                        </div>
                      </div>
                      <a
                        href={getInspectionReportUrl(inspection.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 font-mono text-xs text-brand-amber hover:underline"
                      >
                        View Report
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <ClipboardList className="h-8 w-8 text-brand-muted/40" />
              <p className="font-body text-sm text-brand-muted text-center max-w-sm">
                No inspections recorded yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Spec Item ──

function SpecItem({
  icon: Icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-brand-muted shrink-0 mt-0.5" />
      <div>
        <p className="text-[10px] font-mono text-brand-muted uppercase tracking-wider">
          {label}
        </p>
        <p
          className="font-mono font-semibold text-sm text-brand-text"
          style={valueColor ? { color: valueColor } : undefined}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
