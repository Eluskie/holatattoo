import { prisma } from '@hola-tattoo/database'
import { ConversationsTable } from '@/components/ConversationsTable'

export default async function DashboardPage() {
  // Get the first studio (no auth for now)
  let studio = await prisma.studio.findFirst({
    include: {
      botConfig: true,
      conversations: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  })

  // If no studio exists, show empty state
  if (!studio) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">No Studio Found</h1>
          <p className="text-gray-600 mt-2">Please create a studio first.</p>
        </div>
      </div>
    )
  }

  const stats = {
    total: await prisma.conversation.count({ where: { studioId: studio.id } }),
    qualified: await prisma.conversation.count({
      where: { studioId: studio.id, status: 'qualified' }
    }),
    active: await prisma.conversation.count({
      where: { studioId: studio.id, status: 'active' }
    }),
    dropped: await prisma.conversation.count({
      where: { studioId: studio.id, status: 'dropped' }
    }),
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {studio.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Conversations</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Qualified Leads</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.qualified}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.active}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Dropped</p>
          <p className="text-3xl font-bold text-gray-400 mt-2">{stats.dropped}</p>
        </div>
      </div>

      {/* Recent Conversations */}
      <ConversationsTable conversations={studio.conversations} />
    </div>
  )
}
