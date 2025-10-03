export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F5F3EF]">
      <div className="ml-64">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="h-64 bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
