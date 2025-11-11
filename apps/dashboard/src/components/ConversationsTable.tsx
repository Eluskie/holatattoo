'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, Eye } from 'lucide-react'
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
}

interface Props {
  conversations: Conversation[]
}

export function ConversationsTable({ conversations }: Props) {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)

  const getDataValue = (data: any, field: string) => {
    if (!data || typeof data !== 'object') return '-'
    return data[field] || '-'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Recent Conversations</h2>
      </div>

      {/* Mobile Card Layout */}
      <div className="block sm:hidden">
        {conversations.map((conv) => {
          const name = getDataValue(conv.collectedData, 'name')
          const description = getDataValue(conv.collectedData, 'description') ||
                            getDataValue(conv.collectedData, 'style') ||
                            getDataValue(conv.collectedData, 'placement_size')

          return (
            <div key={conv.id} className="p-4 border-b border-gray-200 last:border-b-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{name || 'No name'}</p>
                  <p className="text-sm text-gray-500 mt-1">{conv.userPhone}</p>
                </div>
                <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full whitespace-nowrap ${
                  conv.status === 'qualified' ? 'bg-green-100 text-green-800' :
                  conv.status === 'active' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {conv.status}
                </span>
              </div>

              {description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{description}</p>
              )}

              <div className="text-xs text-gray-500 mb-3">
                {new Date(conv.createdAt).toLocaleDateString()}
              </div>

              <div className="flex gap-2">
                <a
                  href={`https://wa.me/${conv.userPhone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button size="sm" className="w-full gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Text
                  </Button>
                </a>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button size="sm" variant="outline" className="flex-1 gap-2" onClick={() => setSelectedConversation(conv)}>
                      <Eye className="h-4 w-4" />
                      View
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
          )
        })}
        {conversations.length === 0 && (
          <div className="p-6 text-center text-sm text-gray-500">
            No conversations yet
          </div>
        )}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {conversations.map((conv) => {
              const name = getDataValue(conv.collectedData, 'name')
              const description = getDataValue(conv.collectedData, 'description') ||
                                getDataValue(conv.collectedData, 'style') ||
                                getDataValue(conv.collectedData, 'placement_size')

              return (
                <tr key={conv.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {conv.userPhone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      conv.status === 'qualified' ? 'bg-green-100 text-green-800' :
                      conv.status === 'active' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {conv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(conv.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <a
                        href={`https://wa.me/${conv.userPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" className="gap-2">
                          <MessageCircle className="h-4 w-4" />
                          Text Directly
                        </Button>
                      </a>

                      <Sheet>
                        <SheetTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-2" onClick={() => setSelectedConversation(conv)}>
                            <Eye className="h-4 w-4" />
                            See Conversation
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
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No conversations yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
