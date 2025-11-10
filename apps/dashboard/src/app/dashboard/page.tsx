import { prisma } from '@hola-tattoo/database'
import { currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Find or create studio for this user
  let studio = await prisma.studio.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
    include: {
      botConfig: true,
      conversations: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  })

  // If no studio exists, redirect to onboarding
  if (!studio) {
    redirect('/onboarding')
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Conversations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {studio.conversations.map((conv) => (
                <tr key={conv.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {conv.userPhone}
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
                    Step {conv.currentStep}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(conv.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <details>
                      <summary className="cursor-pointer text-primary-600">View</summary>
                      <pre className="mt-2 text-xs bg-gray-50 p-2 rounded">
                        {JSON.stringify(conv.collectedData, null, 2)}
                      </pre>
                    </details>
                  </td>
                </tr>
              ))}
              {studio.conversations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No conversations yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
