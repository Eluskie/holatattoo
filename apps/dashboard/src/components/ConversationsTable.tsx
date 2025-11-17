'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, Eye, Copy, Check } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface Conversation {
  id: string
  userPhone: string
  status: string
  currentStep: number
  collectedData: any
  createdAt: Date
  estimatedPriceMin?: number | null
  estimatedPriceMax?: number | null
}

interface Props {
  conversations: Conversation[]
}

export function ConversationsTable({ conversations }: Props) {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null)

  const getDataValue = (data: any, field: string) => {
    if (!data || typeof data !== 'object') return '-'
    return data[field] || '-'
  }

  const formatPrice = (conv: Conversation) => {
    // Debug logging to check price data
    if (conv.estimatedPriceMin || conv.estimatedPriceMax) {
      console.log('💰 Price data for conversation:', {
        id: conv.id,
        min: conv.estimatedPriceMin,
        max: conv.estimatedPriceMax,
        phone: conv.userPhone
      })
    }
    
    if (conv.estimatedPriceMin && conv.estimatedPriceMax) {
      return `${conv.estimatedPriceMin}€ - ${conv.estimatedPriceMax}€`
    }
    return null
  }

  const formatPhoneShort = (phone: string) => {
    // Remove all non-digits
    const cleaned = phone.replace(/[^0-9]/g, '')
    // Return last 4 digits with ...
    return `...${cleaned.slice(-4)}`
  }

  const formatPhoneFull = (phone: string) => {
    // Format: +34 999 99 99 99
    const cleaned = phone.replace(/[^0-9+]/g, '')
    if (cleaned.startsWith('+34')) {
      const number = cleaned.slice(3)
      return `+34 ${number.slice(0, 3)} ${number.slice(3, 5)} ${number.slice(5, 7)} ${number.slice(7, 9)}`
    }
    return phone
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedPhone(text)
      setTimeout(() => setCopiedPhone(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'qualified':
        return 'bg-green-50 border-green-200'
      case 'active':
        return 'bg-blue-50 border-blue-200'
      case 'closed':
        return 'bg-gray-50 border-gray-200'
      case 'pending_update_confirmation':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      qualified: 'bg-green-100 text-green-800',
      active: 'bg-blue-100 text-blue-800',
      closed: 'bg-gray-100 text-gray-600',
      pending_update_confirmation: 'bg-yellow-100 text-yellow-800'
    }
    return colors[status as keyof typeof colors] || colors.closed
  }

  const formatDate = (date: Date) => {
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) {
      return `Today ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
    } else if (d.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
      </div>

      {/* Mobile Card Layout */}
      <div className="block sm:hidden">
        {conversations.map((conv) => {
          const name = getDataValue(conv.collectedData, 'name')
          const description = getDataValue(conv.collectedData, 'description') ||
                            getDataValue(conv.collectedData, 'style') ||
                            getDataValue(conv.collectedData, 'placement_size')
          const priceDisplay = formatPrice(conv)

          return (
            <div key={conv.id} className={`p-4 border-b border-gray-200 last:border-b-0 border-l-4 ${getStatusColor(conv.status)}`}>
              {/* Header: Name + Status Badge */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {name !== '-' ? name : 'Unknown'}
                  </p>
                  <button
                    onClick={() => copyToClipboard(conv.userPhone)}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 mt-0.5"
                  >
                    {formatPhoneShort(conv.userPhone)}
                    {copiedPhone === conv.userPhone ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
                <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${getStatusBadge(conv.status)}`}>
                  {conv.status === 'pending_update_confirmation' ? 'pending' : conv.status}
                </span>
              </div>

              {/* Description */}
              {description !== '-' && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{description}</p>
              )}

              {/* Price Badge (if available) */}
              {priceDisplay && (
                <div className="mb-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-800">
                    💰 {priceDisplay}
                  </span>
                </div>
              )}

              {/* Footer: Date + Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">{formatDate(conv.createdAt)}</span>
                <div className="flex gap-2">
                  <a
                    href={`https://wa.me/${conv.userPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" className="h-8 gap-1.5">
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span className="text-xs">Message</span>
                    </Button>
                  </a>

                  <Sheet>
                    <SheetTrigger asChild>
                      <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => setSelectedConversation(conv)}>
                        <Eye className="h-3.5 w-3.5" />
                        <span className="text-xs">View</span>
                      </Button>
                    </SheetTrigger>
                  <SheetContent className="w-full sm:w-[540px] overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Conversation with {getDataValue(conv.collectedData, 'name')}</SheetTitle>
                      <SheetDescription>
                        {conv.userPhone}
                      </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 space-y-6">
                      {/* Conversation History */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Conversation History</h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {((conv as any).messages || []).map((msg: any, idx: number) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                msg.role === 'user'
                                  ? 'bg-blue-100 text-gray-900'
                                  : 'bg-gray-100 text-gray-900'
                              }`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(msg.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          ))}
                          {((conv as any).messages || []).length === 0 && (
                            <p className="text-sm text-gray-500 italic">No messages yet</p>
                          )}
                        </div>
                      </div>

                      {/* Collected Data */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Collected Information</h3>
                        <div className="space-y-3">
                          {Object.entries(conv.collectedData || {}).map(([key, value]: [string, any]) => (
                            <div key={key} className="border-l-2 border-blue-500 pl-3">
                              <p className="text-xs font-medium text-gray-500 uppercase">{key.replace(/_/g, ' ')}</p>
                              <p className="text-sm text-gray-900 mt-1">{String(value)}</p>
                            </div>
                          ))}
                          {Object.keys(conv.collectedData || {}).length === 0 && (
                            <p className="text-sm text-gray-500 italic">No data collected yet</p>
                          )}
                        </div>
                      </div>

                      {/* Conversation Status */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Status</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Current Status:</span>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              conv.status === 'qualified' ? 'bg-green-100 text-green-800' :
                              conv.status === 'active' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {conv.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-gray-600">Started:</span>
                            <span className="text-sm text-gray-900">{new Date(conv.createdAt).toLocaleString()}</span>
                          </div>
                          {(conv.estimatedPriceMin && conv.estimatedPriceMax) && (
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                              <span className="text-sm text-gray-600">Estimated Price:</span>
                              <span className="text-sm font-semibold text-green-700">{formatPrice(conv)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-4 border-t">
                        <a
                          href={`https://wa.me/${conv.userPhone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full"
                        >
                          <Button className="w-full gap-2">
                            <MessageCircle className="h-4 w-4" />
                            Continue Conversation on WhatsApp
                          </Button>
                        </a>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
          )
        })}
        {conversations.length === 0 && (
          <div className="p-12 text-center">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900">No conversations yet</p>
            <p className="text-xs text-gray-500 mt-1">New conversations will appear here</p>
          </div>
        )}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tattoo Details
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {conversations.map((conv) => {
              const name = getDataValue(conv.collectedData, 'name')
              const description = getDataValue(conv.collectedData, 'description') ||
                                getDataValue(conv.collectedData, 'style') ||
                                getDataValue(conv.collectedData, 'placement_size')
              const priceDisplay = formatPrice(conv)

              return (
                <tr key={conv.id} className={`hover:bg-gray-50 transition-colors border-l-4 ${getStatusColor(conv.status)}`}>
                  {/* Contact Column - Name + Phone + Status */}
                  <td className="px-4 py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {name !== '-' ? name : 'Unknown'}
                          </p>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(conv.status)}`}>
                            {conv.status === 'pending_update_confirmation' ? 'pending' : conv.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <button
                            onClick={() => copyToClipboard(conv.userPhone)}
                            className="hover:text-gray-700 flex items-center gap-1"
                            title="Copy phone number"
                          >
                            {formatPhoneShort(conv.userPhone)}
                            {copiedPhone === conv.userPhone ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Tattoo Details Column */}
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-700 max-w-xs truncate">
                      {description !== '-' ? description : 'No details yet'}
                    </p>
                  </td>

                  {/* Price Column */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    {priceDisplay ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-800">
                        {priceDisplay}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>

                  {/* Date Column */}
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(conv.createdAt)}
                  </td>

                  {/* Actions Column */}
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="flex gap-1.5 justify-end">
                      <a
                        href={`https://wa.me/${conv.userPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Message on WhatsApp"
                      >
                        <Button size="sm" variant="default" className="gap-1.5">
                          <MessageCircle className="h-4 w-4" />
                          <span>Message</span>
                        </Button>
                      </a>

                      <Sheet>
                        <SheetTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 w-8 p-0" 
                            onClick={() => setSelectedConversation(conv)}
                            title="View conversation details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                          <SheetHeader>
                            <SheetTitle>Conversation with {getDataValue(conv.collectedData, 'name')}</SheetTitle>
                            <SheetDescription>
                              {conv.userPhone}
                            </SheetDescription>
                          </SheetHeader>

                          <div className="mt-6 space-y-6">
                            {/* Conversation History */}
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900 mb-3">Conversation History</h3>
                              <div className="space-y-3 max-h-96 overflow-y-auto">
                                {((conv as any).messages || []).map((msg: any, idx: number) => (
                                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                      msg.role === 'user'
                                        ? 'bg-blue-100 text-gray-900'
                                        : 'bg-gray-100 text-gray-900'
                                    }`}>
                                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                                {((conv as any).messages || []).length === 0 && (
                                  <p className="text-sm text-gray-500 italic">No messages yet</p>
                                )}
                              </div>
                            </div>

                            {/* Collected Data */}
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900 mb-3">Collected Information</h3>
                              <div className="space-y-3">
                                {Object.entries(conv.collectedData || {}).map(([key, value]: [string, any]) => (
                                  <div key={key} className="border-l-2 border-blue-500 pl-3">
                                    <p className="text-xs font-medium text-gray-500 uppercase">{key.replace(/_/g, ' ')}</p>
                                    <p className="text-sm text-gray-900 mt-1">{String(value)}</p>
                                  </div>
                                ))}
                                {Object.keys(conv.collectedData || {}).length === 0 && (
                                  <p className="text-sm text-gray-500 italic">No data collected yet</p>
                                )}
                              </div>
                            </div>

                            {/* Conversation Status */}
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900 mb-3">Status</h3>
                              <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Current Status:</span>
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    conv.status === 'qualified' ? 'bg-green-100 text-green-800' :
                                    conv.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {conv.status}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-sm text-gray-600">Started:</span>
                                  <span className="text-sm text-gray-900">{new Date(conv.createdAt).toLocaleString()}</span>
                                </div>
                                {(conv.estimatedPriceMin && conv.estimatedPriceMax) && (
                                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                                    <span className="text-sm text-gray-600">Estimated Price:</span>
                                    <span className="text-sm font-semibold text-green-700">{formatPrice(conv)}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action Button */}
                            <div className="pt-4 border-t">
                              <a
                                href={`https://wa.me/${conv.userPhone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full"
                              >
                                <Button className="w-full gap-2">
                                  <MessageCircle className="h-4 w-4" />
                                  Continue Conversation on WhatsApp
                                </Button>
                              </a>
                            </div>
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>
                  </td>
                </tr>
              )
            })}
            {conversations.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <MessageCircle className="h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-sm font-medium text-gray-900">No conversations yet</p>
                    <p className="text-xs text-gray-500 mt-1">New conversations will appear here</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
