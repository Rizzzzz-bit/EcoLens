import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import * as api from '../api'
import type { ClassifyResponse, GpsLocation } from '../types'

// ── Category metadata ────────────────────────────────────────────────────────
const CATEGORY_META: Record<string, { icon: string; label: string; color: string; bg: string; border: string }> = {
  organic:          { icon: '🌿', label: 'Organic Waste',       color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
  recyclable:       { icon: '♻️', label: 'Recyclable Waste',    color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200'  },
  hazardous:        { icon: '⚠️', label: 'Hazardous Material',  color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200'   },
  general_waste:    { icon: '🗑️', label: 'General Waste',       color: 'text-gray-700',   bg: 'bg-gray-50',   border: 'border-gray-200'  },
  resource_wastage: { icon: '💧', label: 'Resource Wastage',    color: 'text-cyan-700',   bg: 'bg-cyan-50',   border: 'border-cyan-200'  },
}

// ── GPS helpers ──────────────────────────────────────────────────────────────
const MAX_ACCURACY_METRES = 100

function gpsErrorMessage(code: number): string {
  switch (code) {
    case GeolocationPositionError.PERMISSION_DENIED:
      return 'Location permission denied. Allow access in browser settings and try again.'
    case GeolocationPositionError.POSITION_UNAVAILABLE:
      return 'Location unavailable. Make sure GPS is enabled and try again.'
    case GeolocationPositionError.TIMEOUT:
      return 'Location request timed out. Move to a better signal area and retry.'
    default:
      return 'Unknown location error. Please try again.'
  }
}

function getLocation(): Promise<GpsLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => reject(new Error(gpsErrorMessage(err.code))),
      { timeout: 10000, maximumAge: 0, enableHighAccuracy: true },
    )
  })
}

function accuracyLabel(m: number): { label: string; color: string; bg: string } {
  if (m <= 20)  return { label: 'Excellent', color: 'text-green-700',  bg: 'bg-green-100'  }
  if (m <= MAX_ACCURACY_METRES) return { label: 'Good',      color: 'text-lime-700',   bg: 'bg-lime-100'   }
  return { label: 'Poor', color: 'text-orange-700', bg: 'bg-orange-100' }
}

// ── Step indicator ──────────────────────────────────────────────────────────
const STEPS = ['Upload Photo', 'AI Analysis', 'Submit']

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((label, i) => {
        const done    = i < current
        const active  = i === current
        const isLast  = i === STEPS.length - 1
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                ${done   ? 'bg-green-600 border-green-600 text-white'
                : active ? 'bg-white border-green-600 text-green-700'
                :          'bg-white border-gray-200 text-gray-400'}`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap
                ${active ? 'text-green-700' : done ? 'text-green-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {!isLast && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 rounded transition-all
                ${done ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────
export default function ReportPage() {
  const navigate  = useNavigate()
  const fileRef   = useRef<HTMLInputElement>(null)
  const [preview,     setPreview]     = useState<string | null>(null)
  const [file,        setFile]        = useState<File | null>(null)
  const [aiResult,    setAiResult]    = useState<ClassifyResponse | null>(null)
  const [gps,         setGps]         = useState<GpsLocation | null>(null)
  const [gpsError,    setGpsError]    = useState('')
  const [gpsLoading,  setGpsLoading]  = useState(false)
  const [description, setDescription] = useState('')
  const [step,        setStep]        = useState<0 | 1 | 2>(0)
  const [ticketId,    setTicketId]    = useState<number | null>(null)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [dragging,    setDragging]    = useState(false)

  // ── File helpers ───────────────────────────────────────────────────────────
  const applyFile = (f: File) => {
    setFile(f)
    setPreview(null)
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(f)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.type.startsWith('image/')) applyFile(dropped)
  }, [])

  // ── GPS ────────────────────────────────────────────────────────────────────
  const handleGetLocation = async () => {
    setGpsLoading(true)
    setGpsError('')
    setGps(null)
    try {
      setGps(await getLocation())
    } catch (err) {
      setGpsError(err instanceof Error ? err.message : 'Failed to get location.')
    } finally {
      setGpsLoading(false)
    }
  }

  // ── Classify ───────────────────────────────────────────────────────────────
  const handleClassify = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const r = await api.classifyImage(file)
      setAiResult(r.data)
      setStep(1)
    } catch {
      setError('Failed to analyse image. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const CAMPUS_DEFAULT = { lat: 26.5045, lng: 80.2695 }

  const handleSubmit = async () => {
    if (!file || !aiResult || !aiResult.relevant) return
    setLoading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('image', file)
      form.append('lat',  String(gps?.lat ?? CAMPUS_DEFAULT.lat))
      form.append('lng',  String(gps?.lng ?? CAMPUS_DEFAULT.lng))
      if (description.trim()) form.append('description', description.trim())
      const r = await api.createTicket(form, aiResult.classification_token)
      setTicketId(r.data.id)
      setStep(2)
    } catch {
      setError('Failed to submit ticket. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  const reset = () => {
    setStep(0)
    setFile(null)
    setPreview(null)
    setAiResult(null)
    setDescription('')
    setGps(null)
    setGpsError('')
    setError('')
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">Report an Issue</h1>
          <p className="text-sm text-gray-500 mt-0.5">Snap a photo, let AI classify it, then submit your ticket.</p>
        </div>

        {/* Step bar */}
        <StepBar current={step} />

        {/* ── Step 0: Upload ───────────────────────────────────────────────── */}
        {step === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">

            {/* Image upload zone */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Photo <span className="text-red-400">*</span>
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => e.target.files?.[0] && applyFile(e.target.files[0])}
              />

              {!preview ? (
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl h-52 flex flex-col items-center justify-center cursor-pointer transition-all
                    ${dragging
                      ? 'border-green-400 bg-green-50 scale-[1.01]'
                      : 'border-gray-200 hover:border-green-400 hover:bg-green-50/50'}`}
                >
                  <div className="text-5xl mb-3 select-none">📷</div>
                  <p className="text-sm font-medium text-gray-600">Tap to take a photo or upload</p>
                  <p className="text-xs text-gray-400 mt-1">or drag & drop an image here</p>
                </div>
              ) : (
                <div className="relative group rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                  <img src={preview} alt="preview" className="w-full h-56 object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <button
                      onClick={e => { e.stopPropagation(); setPreview(null); setFile(null) }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white rounded-full px-3 py-1.5 text-xs font-semibold text-gray-700 shadow flex items-center gap-1.5"
                    >
                      ✕ Remove
                    </button>
                  </div>
                  {/* Retake shortcut */}
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-2 right-2 bg-white/90 hover:bg-white rounded-full px-2.5 py-1 text-xs font-medium text-gray-600 shadow"
                  >
                    🔄 Retake
                  </button>
                </div>
              )}
            </div>

            {/* GPS section */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Location <span className="text-gray-400 font-normal normal-case">(recommended)</span>
              </label>

              {!gps && !gpsError && !gpsLoading && (
                <button
                  onClick={handleGetLocation}
                  className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-50 hover:border-gray-300 text-sm transition-colors"
                >
                  <span>📍</span> Detect My Location
                </button>
              )}

              {gpsLoading && (
                <div className="flex items-center gap-2.5 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <span>Acquiring GPS location…</span>
                </div>
              )}

              {gpsError && !gpsLoading && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    <span className="shrink-0 mt-0.5">⚠️</span>
                    <span>{gpsError}</span>
                  </div>
                  <button
                    onClick={handleGetLocation}
                    className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-50 text-sm transition-colors"
                  >
                    🔄 Retry Location
                  </button>
                </div>
              )}

              {gps && !gpsLoading && (() => {
                const acc = accuracyLabel(gps.accuracy)
                return (
                  <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-green-700">
                        <span>📍</span> Location acquired
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${acc.bg} ${acc.color}`}>
                        {acc.label} · ±{Math.round(gps.accuracy)} m
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div className="bg-white rounded-lg px-3 py-2">
                        <div className="text-gray-400 text-[10px] font-medium uppercase mb-0.5">Latitude</div>
                        <div className="font-mono font-semibold text-gray-800">{gps.lat.toFixed(6)}</div>
                      </div>
                      <div className="bg-white rounded-lg px-3 py-2">
                        <div className="text-gray-400 text-[10px] font-medium uppercase mb-0.5">Longitude</div>
                        <div className="font-mono font-semibold text-gray-800">{gps.lng.toFixed(6)}</div>
                      </div>
                    </div>
                    <button
                      onClick={handleGetLocation}
                      className="text-xs text-green-600 hover:text-green-800 underline underline-offset-2 transition-colors"
                    >
                      Refresh location
                    </button>
                  </div>
                )
              })()}
            </div>

            {/* Optional description */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Description <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add any extra context about the issue…"
                rows={3}
                maxLength={300}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all"
              />
              <div className="text-right text-[10px] text-gray-400 mt-0.5">{description.length}/300</div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              onClick={handleClassify}
              disabled={!file || loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Analysing…
                </>
              ) : (
                <><span>🤖</span> Analyse with AI</>
              )}
            </button>
          </div>
        )}

        {/* ── Step 1: AI Result ────────────────────────────────────────────── */}
        {step === 1 && aiResult && (
          <div className="space-y-4">

            {/* Image thumbnail + GPS pill */}
            {preview && (
              <div className="relative rounded-xl overflow-hidden shadow-sm border border-gray-100">
                <img src={preview} alt="preview" className="w-full h-48 object-cover" />
                {gps && (() => {
                  const acc = accuracyLabel(gps.accuracy)
                  return (
                    <div className={`absolute bottom-2 left-2 flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow ${acc.bg} ${acc.color}`}>
                      📍 {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)} · ±{Math.round(gps.accuracy)} m
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Result card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-800 text-base">🤖 AI Analysis</h2>
                {aiResult.relevant
                  ? <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">Relevant</span>
                  : <span className="text-xs font-semibold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">Not Relevant</span>
                }
              </div>

              {/* ── Not relevant ── */}
              {!aiResult.relevant && (
                <div className="space-y-3">
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 space-y-1">
                    <p className="text-sm font-semibold text-red-700">
                      This image doesn't appear to show a campus environmental issue.
                    </p>
                    <p className="text-xs text-red-600">{aiResult.reason}</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-800">
                    💡 <span className="font-medium">Eco Tip:</span> {aiResult.eco_tip}
                  </div>
                </div>
              )}

              {/* ── Relevant ── */}
              {aiResult.relevant && aiResult.category && (() => {
                const meta = CATEGORY_META[aiResult.category] ?? { icon: '❓', label: aiResult.category, color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' }
                return (
                  <div className="space-y-3">
                    {/* Category badge */}
                    <div className={`flex items-center gap-3 ${meta.bg} ${meta.border} border rounded-xl px-4 py-3`}>
                      <span className="text-3xl">{meta.icon}</span>
                      <div>
                        <div className={`font-bold text-base ${meta.color}`}>{meta.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{aiResult.reason}</div>
                      </div>
                    </div>

                    {/* Action recommendation */}
                    <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 text-sm text-orange-800">
                      <span className="font-semibold">Recommended Action:</span> {aiResult.action_recommendation}
                    </div>

                    {/* Eco tip */}
                    <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-green-800">
                      💡 <span className="font-medium">Eco Tip:</span> {aiResult.eco_tip}
                    </div>

                    {/* Optional description preview */}
                    {description.trim() && (
                      <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-700">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Your Note</span>
                        {description.trim()}
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Action buttons */}
            {aiResult.relevant ? (
              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  ← Retake Photo
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm text-sm"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Submitting…
                    </>
                  ) : '✅ Submit Ticket'}
                </button>
              </div>
            ) : (
              <button
                onClick={reset}
                className="w-full border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                ← Try a Different Photo
              </button>
            )}
          </div>
        )}

        {/* ── Step 2: Submitted ────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-5">

            {/* Animated checkmark */}
            <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-gray-900">Ticket Submitted!</h2>
              <p className="text-gray-500 text-sm">
                Report <span className="font-bold text-gray-700">#{ticketId}</span> has been created and routed to the responsible department.
              </p>
            </div>

            {/* Points banner */}
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 font-semibold text-sm px-4 py-2 rounded-full">
              🌿 +10 Eco Points awarded!
            </div>

            {/* Summary row */}
            {aiResult?.category && (() => {
              const meta = CATEGORY_META[aiResult.category] ?? { icon: '❓', label: aiResult.category, color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' }
              return (
                <div className={`flex items-center gap-3 ${meta.bg} ${meta.border} border rounded-xl px-4 py-3 text-left`}>
                  <span className="text-2xl">{meta.icon}</span>
                  <div>
                    <div className={`font-semibold text-sm ${meta.color}`}>{meta.label}</div>
                    {gps && <div className="text-xs text-gray-500 mt-0.5">📍 {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}</div>}
                  </div>
                </div>
              )
            })()}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => navigate('/my-tickets')}
                className="flex-1 border border-green-500 text-green-600 font-semibold py-2.5 rounded-xl hover:bg-green-50 transition-colors text-sm"
              >
                📋 Track Ticket
              </button>
              <button
                onClick={reset}
                className="flex-1 bg-green-600 text-white font-semibold py-2.5 rounded-xl hover:bg-green-700 transition-colors text-sm shadow-sm"
              >
                📷 Report Another
              </button>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
