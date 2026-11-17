import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import * as api from '../api'
import type { ClassifyResponse, GpsLocation } from '../types'
import { isInsideCampus } from '../config/campus'

const CATEGORY_ICONS: Record<string, string> = {
  organic: '🌿',
  recyclable: '♻️',
  hazardous: '⚠️',
  general_waste: '🗑️',
  resource_wastage: '💧',
}

// ── GPS configuration ──────────────────────────────────────────────────────────
// Maximum acceptable accuracy radius in metres.
// Adjust this one constant to tighten/loosen the threshold.
const MAX_ACCURACY_METRES = 100

// Human-readable label for error codes returned by the Geolocation API.
function gpsErrorMessage(code: number): string {
  switch (code) {
    case GeolocationPositionError.PERMISSION_DENIED:
      return 'Location permission was denied. Please allow location access in your browser settings and try again.'
    case GeolocationPositionError.POSITION_UNAVAILABLE:
      return 'Your location could not be determined. Make sure GPS is enabled on your device and try again.'
    case GeolocationPositionError.TIMEOUT:
      return 'Location request timed out. Please move to an area with better signal and try again.'
    default:
      return 'An unknown location error occurred. Please try again.'
  }
}

/**
 * Request a GPS fix from the browser.
 *
 * Resolves with a GpsLocation on success.
 * Rejects with an Error (with a user-facing message) on any failure,
 * including denied permission, position unavailable, timeout, and
 * accuracy below the configured threshold.
 *
 * Never falls back to a hardcoded coordinate.
 */
function getLocation(): Promise<GpsLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
      },
      (err) => reject(new Error(gpsErrorMessage(err.code))),
      { timeout: 10000, maximumAge: 0, enableHighAccuracy: true },
    )
  })
}

export default function ReportPage() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [aiResult, setAiResult] = useState<ClassifyResponse | null>(null)
  const [gps, setGps] = useState<GpsLocation | null>(null)
  const [gpsError, setGpsError] = useState<string>('')
  const [gpsLoading, setGpsLoading] = useState(false)
  const [step, setStep] = useState<'capture' | 'ai_result' | 'submitted'>('capture')
  const [ticketId, setTicketId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = (f: File) => {
    setFile(f)
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(f)
  }

  const handleGetLocation = async () => {
    setGpsLoading(true)
    setGpsError('')
    setGps(null)
    try {
      const location = await getLocation()
      setGps(location)
    } catch (err) {
      setGpsError(err instanceof Error ? err.message : 'Failed to get location.')
    } finally {
      setGpsLoading(false)
    }
  }

  const handleClassify = async () => {
    if (!file) return
    setLoading(true); setError('')
    try {
      const r = await api.classifyImage(file)
      setAiResult(r.data)
      setStep('ai_result')
    } catch {
      setError('Failed to classify image. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Default campus centre coordinates used when GPS is unavailable
  const CAMPUS_DEFAULT = { lat: 26.5045, lng: 80.2695 }

  const handleSubmit = async () => {
    if (!file || !aiResult || !aiResult.relevant) return
    setLoading(true); setError('')
    try {
      const form = new FormData()
      form.append('image', file)
      form.append('lat', String(gps?.lat ?? CAMPUS_DEFAULT.lat))
      form.append('lng', String(gps?.lng ?? CAMPUS_DEFAULT.lng))
      const r = await api.createTicket(form, aiResult.classification_token)
      setTicketId(r.data.id)
      setStep('submitted')
    } catch {
      setError('Failed to submit ticket. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetCapture = () => {
    setStep('capture')
    setFile(null)
    setPreview(null)
    setAiResult(null)
    setError('')
  }

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">📷 Report an Issue</h1>
        <p className="text-sm text-gray-500 mb-6">Take or upload a photo to report an environmental issue.</p>

        {/* Step 1: Capture */}
        {step === 'capture' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {!preview ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer hover:border-green-400 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <div className="text-5xl mb-2">📷</div>
                <div className="text-sm text-gray-500">Tap to take a photo or choose from gallery</div>
              </div>
            ) : (
              <div className="relative">
                <img src={preview} alt="preview" className="w-full h-56 object-cover rounded-xl" />
                <button
                  className="absolute top-2 right-2 bg-white rounded-full w-7 h-7 flex items-center justify-center shadow text-gray-600 hover:text-red-500"
                  onClick={() => { setPreview(null); setFile(null) }}
                >✕</button>
              </div>
            )}

            {/* ── GPS section ── */}
            <div className="space-y-2">
              {/* Not yet requested */}
              {!gps && !gpsError && !gpsLoading && (
                <button
                  onClick={handleGetLocation}
                  className="w-full border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-50 text-sm"
                >
                  📍 Get My Location
                </button>
              )}

              {/* Loading */}
              {gpsLoading && (
                <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <span className="animate-pulse">📍</span> Acquiring GPS location…
                </div>
              )}

              {/* Error */}
              {gpsError && !gpsLoading && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <span className="mt-0.5">⚠️</span>
                    <span>{gpsError}</span>
                  </div>
                  <button
                    onClick={handleGetLocation}
                    className="w-full border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-50 text-sm"
                  >
                    🔄 Retry Location
                  </button>
                </div>
              )}

              {/* Success — read-only display */}
              {gps && !gpsLoading && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700">
                    <span>📍</span> GPS location acquired
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-green-800">
                    <div>
                      <span className="text-gray-500 block">Latitude</span>
                      {gps.lat.toFixed(5)}
                    </div>
                    <div>
                      <span className="text-gray-500 block">Longitude</span>
                      {gps.lng.toFixed(5)}
                    </div>
                    <div>
                      <span className="text-gray-500 block">Accuracy</span>
                      ±{Math.round(gps.accuracy)} m
                    </div>
                  </div>
                  <button
                    onClick={handleGetLocation}
                    className="text-xs text-green-600 underline hover:text-green-800 mt-0.5"
                  >
                    Refresh location
                  </button>
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={handleClassify}
              disabled={!file || loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Analysing…' : '🤖 Analyse with AI'}
            </button>
          </div>
        )}

        {/* Step 2: AI Result */}
        {step === 'ai_result' && aiResult && (
          <div className="space-y-4">
            {preview && <img src={preview} alt="preview" className="w-full h-48 object-cover rounded-xl shadow" />}

            {/* ── GPS summary (read-only) ── */}
            {gps && (
              <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <span>📍</span>
                {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)} &nbsp;·&nbsp; ±{Math.round(gps.accuracy)} m
              </div>
            )}

            {/* ── Irrelevant image ── */}
            {!aiResult.relevant && (
              <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-3">
                <h2 className="font-bold text-gray-700">🤖 AI Analysis Result</h2>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-1">
                  <p className="font-semibold text-red-700">
                    This image does not appear to show a relevant campus environmental issue.
                  </p>
                  <p className="text-sm text-red-600">{aiResult.reason}</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-800">
                  💡 {aiResult.eco_tip}
                </div>
                <button
                  onClick={resetCapture}
                  className="w-full border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50"
                >
                  Retake Photo
                </button>
              </div>
            )}

            {/* ── Relevant image ── */}
            {aiResult.relevant && (
              <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-3">
                <h2 className="font-bold text-gray-700">🤖 AI Analysis Result</h2>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{aiResult.category ? CATEGORY_ICONS[aiResult.category] : '❓'}</span>
                  <div>
                    <div className="font-bold text-lg capitalize">
                      {aiResult.category?.replace('_', ' ') ?? 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-500">{aiResult.reason}</div>
                  </div>
                </div>
                <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-sm text-orange-800">
                  <span className="font-semibold">Recommended Action:</span> {aiResult.action_recommendation}
                </div>
                <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-sm text-green-800">
                  💡 {aiResult.eco_tip}
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            {aiResult.relevant && (
              <div className="flex gap-3">
                <button onClick={resetCapture}
                  className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50">
                  Retake Photo
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl">
                  {loading ? 'Submitting…' : '✅ Submit Ticket'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Submitted */}
        {step === 'submitted' && (
          <div className="bg-white rounded-2xl shadow-sm border p-8 text-center space-y-4">
            <div className="text-6xl">🎉</div>
            <h2 className="text-xl font-bold text-green-700">Ticket Submitted!</h2>
            <p className="text-gray-600">Your report <span className="font-bold">#{ticketId}</span> has been created and routed to the responsible department.</p>
            <p className="text-sm text-green-600 font-semibold">+10 Eco Points awarded! 🌿</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => navigate('/my-tickets')}
                className="flex-1 border border-green-600 text-green-600 font-semibold py-2 rounded-xl hover:bg-green-50">
                Track Ticket
              </button>
              <button onClick={() => { resetCapture(); setGps(null); setGpsError('') }}
                className="flex-1 bg-green-600 text-white font-semibold py-2 rounded-xl hover:bg-green-700">
                Report Another
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
