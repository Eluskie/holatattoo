'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { BotQuestion } from '@hola-tattoo/shared-types'
import { Plus, Trash2, GripVertical } from 'lucide-react'

export default function BotConfigPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<any>(null)

  const [formData, setFormData] = useState({
    welcomeMessage: '',
    brandingColor: '#FF6B6B',
    questions: [] as BotQuestion[]
  })

  useEffect(() => {
    fetchBotConfig()
  }, [])

  const fetchBotConfig = async () => {
    try {
      const res = await fetch('/api/bot-config')
      const data = await res.json()
      if (data.success && data.data) {
        setConfig(data.data)
        setFormData({
          welcomeMessage: data.data.welcomeMessage || '',
          brandingColor: data.data.brandingColor || '#FF6B6B',
          questions: data.data.questions || []
        })
      }
    } catch (error) {
      toast.error('Failed to load bot configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch('/api/bot-config', {
        method: config ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Bot configuration saved successfully!')
        setConfig(data.data)
      } else {
        toast.error(data.error || 'Failed to save configuration')
      }
    } catch (error) {
      toast.error('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const addQuestion = () => {
    const newQuestion: BotQuestion = {
      id: formData.questions.length + 1,
      text: '',
      field: `field_${formData.questions.length + 1}`,
      type: 'text'
    }
    setFormData({
      ...formData,
      questions: [...formData.questions, newQuestion]
    })
  }

  const removeQuestion = (index: number) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter((_, i) => i !== index)
    })
  }

  const updateQuestion = (index: number, updates: Partial<BotQuestion>) => {
    const newQuestions = [...formData.questions]
    newQuestions[index] = { ...newQuestions[index], ...updates }
    setFormData({ ...formData, questions: newQuestions })
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
        <h1 className="text-3xl font-bold text-gray-900">Bot Configuration</h1>
        <p className="text-gray-600 mt-2">Customize your WhatsApp bot's questions and behavior</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Welcome Message */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Welcome Message</h2>
          </div>
          <div className="px-6 py-4">
            <textarea
              value={formData.welcomeMessage}
              onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
              rows={3}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Hola! I'm the virtual assistant for..."
              required
            />
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Branding</h2>
          </div>
          <div className="px-6 py-4">
            <label htmlFor="brandingColor" className="block text-sm font-medium text-gray-700 mb-2">
              Primary Color
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                id="brandingColor"
                value={formData.brandingColor}
                onChange={(e) => setFormData({ ...formData, brandingColor: e.target.value })}
                className="h-10 w-20 rounded border border-gray-300"
              />
              <span className="text-sm text-gray-600">{formData.brandingColor}</span>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Questions</h2>
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </button>
          </div>
          <div className="px-6 py-4 space-y-4">
            {formData.questions.map((question, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 pt-2">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Field Name
                        </label>
                        <input
                          type="text"
                          value={question.field}
                          onChange={(e) => updateQuestion(index, { field: e.target.value })}
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                          placeholder="name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          value={question.type}
                          onChange={(e) => updateQuestion(index, { type: e.target.value as any })}
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="choice">Choice</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Question Text
                      </label>
                      <textarea
                        value={question.text}
                        onChange={(e) => updateQuestion(index, { text: e.target.value })}
                        rows={2}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        placeholder="What's your name?"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Use {'{field_name}'} to reference previous answers
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeQuestion(index)}
                    className="flex-shrink-0 text-red-600 hover:text-red-800 pt-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            {formData.questions.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No questions yet. Click "Add Question" to get started.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary-600 text-white hover:bg-primary-700 px-6 py-3 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  )
}
