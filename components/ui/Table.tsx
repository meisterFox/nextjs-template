import { Button } from '@/components/ui/Button'

interface Column<T> {
  key: keyof T
  label: string
  render?: (item: T, index: number) => React.ReactNode
}

interface TableProps<T> {
  data: T[]
  columns: Column<T>[]
  hasNextPage?: boolean
  isLoading?: boolean
  getRowKey: (item: T) => string | number
  loadMore?: () => void
}

export function Table<T>({
  data,
  columns,
  hasNextPage,
  isLoading,
  getRowKey,
  loadMore,
}: TableProps<T>) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-xl shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-gray-700/50">
              {columns.map((col) => (
                <th key={`thead_${col.key as string}`} className="text-left p-4 font-bold text-white/90 uppercase text-sm tracking-wider">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={`${getRowKey(item)}_${index}`}
                className="border-b border-gray-700/30 hover:bg-white/5 transition-colors duration-200"
              >
                {columns.map((col) => (
                  <td
                    key={`${getRowKey(item)}_${col.key as string}`}
                    className="p-4 text-gray-300"
                  >
                    {col.render
                      ? col.render(item, index)
                      : String(item[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {loadMore ? (
            <tfoot>
              <tr>
                <td className="p-6" colSpan={columns.length}>
                  <div className="flex items-center justify-center w-full">
                    <Button
                      variant="gradient"
                      onClick={loadMore}
                      disabled={!hasNextPage || isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Loading...
                        </span>
                      ) : hasNextPage ? (
                        'Load More'
                      ) : (
                        'All Data Loaded'
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </div>
  )
}
