import Link from "next/link";
import moment from "moment";
import { getSharesForAdmin } from "@/models/story-share";
import ShareStatusActions from "@/components/admin/share-status-actions";

const PAGE_SIZE = 50;

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "visible"
      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
      : status === "banned"
      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  return (
    <span className={`px-2 py-0.5 rounded text-xs ${color}`}>{status}</span>
  );
}

export default async function AdminStorySharesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const onlyReported = sp.filter === "reported";
  const page = sp.page ? parseInt(sp.page, 10) || 1 : 1;

  const { items, total } = await getSharesForAdmin({
    page,
    limit: PAGE_SIZE,
    onlyReported,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filterParam = onlyReported ? "reported" : "all";

  return (
    <div className="w-full px-4 md:px-8 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-medium">Story Shares</h1>
        <div className="flex gap-4 text-sm">
          <Link
            href="/admin/story-shares"
            className={
              !onlyReported
                ? "font-semibold text-primary"
                : "text-muted-foreground"
            }
          >
            All
          </Link>
          <Link
            href="/admin/story-shares?filter=reported"
            className={
              onlyReported
                ? "font-semibold text-primary"
                : "text-muted-foreground"
            }
          >
            Reported
          </Link>
        </div>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Title</th>
              <th className="px-3 py-2 font-medium">Share ID</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Views</th>
              <th className="px-3 py-2 font-medium">Reports</th>
              <th className="px-3 py-2 font-medium">Created</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-10 text-center text-muted-foreground"
                >
                  No shares
                </td>
              </tr>
            )}
            {items.map((row) => (
              <tr key={row.share_id} className="border-t">
                <td className="px-3 py-2 max-w-xs truncate">
                  {row.title || "(untitled)"}
                </td>
                <td className="px-3 py-2">
                  <a
                    href={`/share/${row.share_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-mono text-xs"
                  >
                    {row.share_id}
                  </a>
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-3 py-2">{row.view_count}</td>
                <td className="px-3 py-2">
                  {row.report_count > 0 ? (
                    <span className="text-red-600 font-medium">
                      {row.report_count}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                  {row.created_at
                    ? moment(row.created_at).format("YYYY-MM-DD HH:mm")
                    : "-"}
                </td>
                <td className="px-3 py-2">
                  <ShareStatusActions
                    shareId={row.share_id}
                    status={row.status}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm">
        <span className="text-muted-foreground">
          {total} total · page {page}/{totalPages}
        </span>
        <div className="flex gap-2">
          {page > 1 && (
            <Link
              className="px-3 py-1 border rounded hover:bg-muted"
              href={`/admin/story-shares?filter=${filterParam}&page=${page - 1}`}
            >
              Prev
            </Link>
          )}
          {page < totalPages && (
            <Link
              className="px-3 py-1 border rounded hover:bg-muted"
              href={`/admin/story-shares?filter=${filterParam}&page=${page + 1}`}
            >
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
