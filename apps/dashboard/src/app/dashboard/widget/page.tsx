'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Copy, Check } from 'lucide-react'

export default function WidgetPage() {
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [studio, setStudio] = useState<any>(null)

  useEffect(() => {
    fetchStudio()
  }, [])

  const fetchStudio = async () => {
    try {
      const res = await fetch('/api/studio')
      const data = await res.json()
      if (data.success) {
        setStudio(data.data)
      }
    } catch (error) {
      toast.error('Failed to load studio information')
    } finally {
      setLoading(false)
    }
  }

  const widgetCode = studio?.whatsappNumber ? `<!-- Hola Tattoo WhatsApp Widget -->
<script>
  (function() {
    const config = {
      whatsappNumber: '${studio.whatsappNumber}',
      message: 'Hola! M\\'interessa saber més sobre els vostres tatuatges',
      brandingColor: '${studio.botConfig?.brandingColor || '#FF6B6B'}',
      position: 'bottom-right'
    };

    const script = document.createElement('script');
    script.src = 'https://your-domain.com/widget.js';
    script.async = true;
    script.onload = function() {
      if (window.HolaTattooWidget) {
        window.HolaTattooWidget.init(config);
      }
    };
    document.head.appendChild(script);
  })();
</script>` : ''

  const copyToClipboard = () => {
    navigator.clipboard.writeText(widgetCode)
    setCopied(true)
    toast.success('Widget code copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!studio?.whatsappNumber) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            WhatsApp Number Required
          </h3>
          <p className="text-yellow-700">
            Please configure your WhatsApp number in the settings before generating the widget code.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Widget Code</h1>
        <p className="text-gray-600 mt-2">Add this code to your website to enable the WhatsApp button</p>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Installation Code</h2>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Code
              </>
            )}
          </button>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-600 mb-4">
            Copy this code and paste it just before the closing {'</body>'} tag on your website:
          </p>
          <pre className="bg-gray-50 p-4 rounded-md text-xs overflow-x-auto border border-gray-200">
            {widgetCode}
          </pre>
        </div>
      </div>

      <div className="mt-8 bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-600 mb-4">
            This is how the widget will appear on your website:
          </p>
          <div className="relative bg-gray-100 rounded-lg p-8 h-64">
            <div className="absolute bottom-4 right-4">
              <button
                className="rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
                style={{
                  backgroundColor: studio.botConfig?.brandingColor || '#FF6B6B',
                  width: '60px',
                  height: '60px'
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="32"
                  height="32"
                  fill="white"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 italic">
              The button will appear in the bottom-right corner of your website
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          How It Works
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>Visitors click the WhatsApp button on your website</li>
          <li>They're directed to WhatsApp with a pre-filled message</li>
          <li>Your bot engages them with qualification questions</li>
          <li>Qualified leads are sent to your webhook automatically</li>
        </ol>
      </div>
    </div>
  )
}
