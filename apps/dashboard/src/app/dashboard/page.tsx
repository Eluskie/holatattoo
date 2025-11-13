import { prisma } from '@hola-tattoo/database'
import { ConversationsWithPagination } from '@/components/ConversationsWithPagination'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  try {
    // Ensure user exists in our database
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!dbUser) {
      // Create user if they don't exist (shouldn't happen normally, but good fallback)
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || null,
        },
      })
    }

    // Get user's first studio
    const studio = await prisma.studio.findFirst({
      where: { userId: user.id },
      include: {
        botConfig: true,
      },
    })

  // If no studio exists, show onboarding
  if (!studio) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Hola Tattoo! 👋
          </h1>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            You haven't set up your WhatsApp bot yet. Let's create your first studio
            and configure your bot to start capturing leads.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Get Started
          </Link>
        </div>
      </div>
    )
  }

    // Get stats for user's studio
    const stats = {
      total: await prisma.conversation.count({ where: { studioId: studio.id } }),
      qualified: await prisma.conversation.count({
        where: { studioId: studio.id, status: 'qualified' },
      }),
      active: await prisma.conversation.count({
        where: { studioId: studio.id, status: 'active' },
      }),
      dropped: await prisma.conversation.count({
        where: { studioId: studio.id, status: 'dropped' },
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
        <ConversationsWithPagination />
      </div>
    )
  } catch (error: any) {
    console.error('Dashboard error:', error)
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-900 mb-2">Database Connection Error</h2>
          <p className="text-red-700 mb-4">
            Unable to connect to the database. Please check that:
          </p>
          <ul className="list-disc list-inside text-red-700 space-y-2 mb-4">
            <li>Database migrations have been run</li>
            <li>DATABASE_URL environment variable is set correctly</li>
            <li>Database is accessible from this server</li>
          </ul>
          <p className="text-sm text-red-600 font-mono bg-red-100 p-3 rounded">
            Error: {error.message}
          </p>
        </div>
      </div>
    )
  }
}
