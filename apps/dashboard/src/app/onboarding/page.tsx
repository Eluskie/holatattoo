'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import toast from 'react-hot-toast'
import { BotQuestion } from '@hola-tattoo/shared-types'

const DEFAULT_QUESTIONS: BotQuestion[] = [
  {
    id: 1,
    text: "Com et dius?",
    field: 'name',
    type: 'text'
  },
  {
    id: 2,
    text: "Genial {name}! Quin tipus de tatuatge t'interessa?",
    field: 'tattoo_type',
    type: 'text'
  },
  {
    id: 3,
    text: "Quina mida aproximada vols?",
    field: 'size',
    type: 'text'
  },
  {
    id: 4,
    text: "Tens un pressupost en ment?",
    field: 'budget',
    type: 'text'
  },
  {
    id: 5,
    text: "Perfecte {name}! Quan t'aniria bé venir per l'estudi?",
    field: 'preferred_date',
    type: 'text'
  }
];

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useUser()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [studioData, setStudioData] = useState({
    name: '',
    whatsappNumber: '',
    webhookUrl: ''
  })

  const [botData, setBotData] = useState({
    welcomeMessage: "Hola! Sóc l'assistent virtual del nostre estudi de tatuatges. M'agradaria fer-te unes preguntes.",
    brandingColor: '#FF6B6B',
    questions: DEFAULT_QUESTIONS
  })

  const handleStudioSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/studio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studioData)
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Studio created!')
        setCurrentStep(2)
      } else {
        toast.error(data.error || 'Failed to create studio')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleBotConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/bot-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(botData)
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Bot configured!')
        setCurrentStep(3)
      } else {
        toast.error(data.error || 'Failed to configure bot')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const finishOnboarding = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step {currentStep} of 3</span>
            <span className="text-sm font-medium text-gray-700">{Math.round((currentStep / 3) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Studio Info */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Hola Tattoo!</h1>
            <p className="text-gray-600 mb-8">Let's set up your studio in just a few steps</p>

            <form onSubmit={handleStudioSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Studio Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={studioData.name}
                  onChange={(e) => setStudioData({ ...studioData, name: e.target.value })}
                  className="block w-full rounded-md border border-gray-300 px-4 py-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="My Awesome Tattoo Studio"
                  required
                />
              </div>

              <div>
                <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Business Number
                </label>
                <input
                  type="text"
                  id="whatsappNumber"
                  value={studioData.whatsappNumber}
                  onChange={(e) => setStudioData({ ...studioData, whatsappNumber: e.target.value })}
                  className="block w-full rounded-md border border-gray-300 px-4 py-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="whatsapp:+1234567890"
                />
                <p className="mt-2 text-sm text-gray-500">
                  You can skip this for now and add it later in settings
                </p>
              </div>

              <div>
                <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook URL (Optional)
                </label>
                <input
                  type="url"
                  id="webhookUrl"
                  value={studioData.webhookUrl}
                  onChange={(e) => setStudioData({ ...studioData, webhookUrl: e.target.value })}
                  className="block w-full rounded-md border border-gray-300 px-4 py-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="https://your-domain.com/webhook"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Where should we send qualified leads? You can configure this later
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white hover:bg-primary-700 px-6 py-3 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Continue'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Bot Configuration */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Configure Your Bot</h1>
            <p className="text-gray-600 mb-8">Customize your bot's welcome message and questions</p>

            <form onSubmit={handleBotConfigSubmit} className="space-y-6">
              <div>
                <label htmlFor="welcomeMessage" className="block text-sm font-medium text-gray-700 mb-2">
                  Welcome Message *
                </label>
                <textarea
                  id="welcomeMessage"
                  value={botData.welcomeMessage}
                  onChange={(e) => setBotData({ ...botData, welcomeMessage: e.target.value })}
                  rows={3}
                  className="block w-full rounded-md border border-gray-300 px-4 py-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="brandingColor" className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Color
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    id="brandingColor"
                    value={botData.brandingColor}
                    onChange={(e) => setBotData({ ...botData, brandingColor: e.target.value })}
                    className="h-12 w-24 rounded border border-gray-300"
                  />
                  <span className="text-sm text-gray-600">{botData.brandingColor}</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  We've pre-configured {DEFAULT_QUESTIONS.length} default questions for you. You can customize them later in the Bot Config page.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-md font-medium"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary-600 text-white hover:bg-primary-700 px-6 py-3 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Continue'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Complete */}
        {currentStep === 3 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">You're All Set!</h1>
            <p className="text-gray-600 mb-8">
              Your WhatsApp bot is ready to start qualifying leads
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold text-gray-900 mb-4">Next Steps:</h3>
              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-3 font-semibold">1</span>
                  <span>Set up your Twilio WhatsApp Business API account</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-3 font-semibold">2</span>
                  <span>Get your widget code from the Widget page</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-3 font-semibold">3</span>
                  <span>Add the widget to your website</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-3 font-semibold">4</span>
                  <span>Start receiving qualified leads!</span>
                </li>
              </ol>
            </div>

            <button
              onClick={finishOnboarding}
              className="bg-primary-600 text-white hover:bg-primary-700 px-8 py-3 rounded-md font-medium"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
