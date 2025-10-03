export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F5F3EF]">
      <div className="ml-64">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="animate-pulse">
            {/* Header skeleton */}
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>

            {/* Card skeleton */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Search and filters */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1 h-10 bg-gray-200 rounded"></div>
                <div className="w-48 h-10 bg-gray-200 rounded"></div>
              </div>

              {/* Table skeleton */}
              <div className="space-y-3">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-100 rounded"></div>
                <div className="h-16 bg-gray-100 rounded"></div>
                <div className="h-16 bg-gray-100 rounded"></div>
                <div className="h-16 bg-gray-100 rounded"></div>
                <div className="h-16 bg-gray-100 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
