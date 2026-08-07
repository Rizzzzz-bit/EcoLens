import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import * as api from '../api'
import type { ClassifyResponse } from '../types'

const CATEGORY_ICONS: Record<string, string> = {
  organic: '🌿',
  recyclable: '♻️',
  hazardous: '⚠️',
  general_waste: '🗑️',
  resource_wastage: '💧',
}

const CAMPUS_DEFAULT = { lat: 26.847, lng: 80.948 }

/** Wraps geolocation in a Promise so it can be properly awaited. */
function getLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(CAMPUS_DEFAULT)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()    => resolve(CAMPUS_DEFAULT),   // denied / unavailable → campus centre
      { timeout: 6000, maximumAge: 0 },
    )
  })
}

export default function ReportPage() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [aiResult, setAiResult] = useState<ClassifyResponse | null>(null)
  const [lat, setLat] = useState<number>(CAMPUS_DEFAULT.lat)
  const [lng, setLng] = useState<number>(CAMPUS_DEFAULT.lng)
  const [usingGps, setUsingGps] = useState<boolean | null>(null)
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

  const handleClassify = async () => {
    if (!file) return
    setLoading(true); setError('')
    try {
      // Await GPS before classifying so the correct coords are captured
      const location = await getLocation()
      const gpsFired = location.lat !== CAMPUS_DEFAULT.lat || location.lng !== CAMPUS_DEFAULT.lng
      setLat(location.lat)
      setLng(location.lng)
      setUsingGps(gpsFired)

      const r = await api.classifyImage(file)
      setAiResult(r.data)
      setStep('ai_result')
    } catch {
      setError('Failed to classify image. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!file || !aiResult) return
    setLoading(true); setError('')
    try {
      const form = new FormData()
      form.append('image', file)
      form.append('lat', String(lat))
      form.append('lng', String(lng))
      const r = await api.createTicket(form)
      setTicketId(r.data.id)
      setStep('submitted')
    } catch {
      setError('Failed to submit ticket. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">📷 Report an Issue</h1>
        <p className="text-sm text-gray-500 mb-6">Take or upload a photo of waste or resource misuse on campus.</p>

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

            {usingGps === true && (
              <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <span>📍</span> GPS location captured
              </div>
            )}
            {usingGps === false && (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <span>⚠️</span> GPS unavailable — using campus centre. You can adjust coordinates below.
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Latitude</label>
                <input type="number" step="0.0001" value={lat}
                  onChange={e => setLat(parseFloat(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Longitude</label>
                <input type="number" step="0.0001" value={lng}
                  onChange={e => setLng(parseFloat(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
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
            <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-3">
              <h2 className="font-bold text-gray-700">🤖 AI Analysis Result</h2>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{CATEGORY_ICONS[aiResult.category]}</span>
                <div>
                  <div className="font-bold text-lg capitalize">{aiResult.category.replace('_', ' ')}</div>
                  <div className="text-xs text-gray-500">Confidence: {Math.round(aiResult.confidence * 100)}%</div>
                </div>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-sm text-orange-800">
                <span className="font-semibold">Recommended Action:</span> {aiResult.action_recommendation}
              </div>
              <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-sm text-green-800">
                💡 {aiResult.eco_tip}
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setStep('capture'); setAiResult(null) }}
                className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50">
                Retake Photo
              </button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl">
                {loading ? 'Submitting…' : '✅ Submit Ticket'}
              </button>
            </div>
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
              <button onClick={() => { setStep('capture'); setFile(null); setPreview(null); setAiResult(null) }}
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
