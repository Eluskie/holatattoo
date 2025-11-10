'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [studio, setStudio] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: '',
    whatsappNumber: '',
    webhookUrl: ''
  })

  useEffect(() => {
    fetchStudio()
  }, [])

  const fetchStudio = async () => {
    try {
      const res = await fetch('/api/studio')
      const data = await res.json()
      if (data.success) {
        setStudio(data.data)
        setFormData({
          name: data.data.name || '',
          whatsappNumber: data.data.whatsappNumber || '',
          webhookUrl: data.data.webhookUrl || ''
        })
      }
    } catch (error) {
      toast.error('Failed to load studio settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch('/api/studio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Settings saved successfully!')
        setStudio(data.data)
      } else {
        toast.error(data.error || 'Failed to save settings')
      }
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Studio Settings</h1>
        <p className="text-gray-600 mt-2">Manage your studio information and integrations</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
        </div>

        <div className="px-6 py-4 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Studio Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-700">
              WhatsApp Business Number
            </label>
            <input
              type="text"
              id="whatsappNumber"
              value={formData.whatsappNumber}
              onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
              placeholder="whatsapp:+1234567890"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Format: whatsapp:+[country_code][number]
            </p>
          </div>

          <div>
            <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700">
              Webhook URL
            </label>
            <input
              type="url"
              id="webhookUrl"
              value={formData.webhookUrl}
              onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
              placeholder="https://your-domain.com/webhook"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Qualified leads will be sent to this URL via POST request
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary-600 text-white hover:bg-primary-700 px-6 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* Webhook Payload Example */}
      <div className="mt-8 bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Webhook Payload Example</h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-600 mb-4">
            When a lead is qualified, we'll send a POST request to your webhook URL with this format:
          </p>
          <pre className="bg-gray-50 p-4 rounded-md text-xs overflow-x-auto">
{`{
  "lead_id": "uuid",
  "studio_id": "your-studio-id",
  "timestamp": "2024-01-15T10:30:00Z",
  "source": "whatsapp",
  "data": {
    "phone": "+1234567890",
    "name": "John Doe",
    "tattoo_type": "realistic",
    "size": "medium",
    "budget": "$500",
    "preferred_date": "next week"
  }
}`}
          </pre>
        </div>
      </div>
    </div>
  )
}
