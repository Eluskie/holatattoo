'use client'

import { useState, useEffect } from 'react'
import { ConversationsTable } from './ConversationsTable'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface Conversation {
  id: string
  userPhone: string
  status: string
  currentStep: number
  collectedData: any
  createdAt: Date
  messages?: any[]
}

interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasMore: boolean
}

export function ConversationsWithPagination() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
    hasMore: false,
  })
  const [loading, setLoading] = useState(true)

  const fetchConversations = async (page: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/conversations?page=${page}&limit=10`)
      const data = await response.json()

      if (data.success) {
        setConversations(data.data.conversations)
        setPagination(data.data.pagination)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations(1)
  }, [])

  const handlePageChange = (page: number) => {
    fetchConversations(page)
  }

  const renderPageNumbers = () => {
    const pages = []
    const { page: currentPage, totalPages } = pagination

    // Always show first page
    pages.push(
      <PaginationItem key={1}>
        <PaginationLink
          isActive={currentPage === 1}
          onClick={() => handlePageChange(1)}
        >
          1
        </PaginationLink>
      </PaginationItem>
    )

    // Show ellipsis if there's a gap
    if (currentPage > 3) {
      pages.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      )
    }

    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={currentPage === i}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      )
    }

    // Show ellipsis if there's a gap
    if (currentPage < totalPages - 2) {
      pages.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      )
    }

    // Always show last page (if there's more than one page)
    if (totalPages > 1) {
      pages.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            isActive={currentPage === totalPages}
            onClick={() => handlePageChange(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      )
    }

    return pages
  }

  if (loading && conversations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ConversationsTable conversations={conversations} />

      {pagination.totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
              </span>{' '}
              of <span className="font-medium">{pagination.totalCount}</span> conversations
            </div>

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className={
                      pagination.page === 1
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>

                {renderPageNumbers()}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(pagination.page + 1)}
                    className={
                      pagination.page === pagination.totalPages
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </div>
  )
}

