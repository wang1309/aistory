"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Admin controls to ban / hide / restore a story share.
 * Calls PATCH /api/admin/story-share/[id] then refreshes the page data.
 */
export default function ShareStatusActions({
  shareId,
  status,
}: {
  shareId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const update = async (next: "visible" | "hidden" | "banned") => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/story-share/${shareId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (data.code === 0) {
        toast.success(`Updated to ${next}`);
        router.refresh();
      } else {
        toast.error(data.message || "failed");
      }
    } catch {
      toast.error("failed");
    } finally {
      setBusy(false);
    }
  };

  if (status === "visible") {
    return (
      <div className="flex gap-1">
        <button
          disabled={busy}
          onClick={() => update("hidden")}
          className="px-2 py-1 text-xs rounded border hover:bg-muted disabled:opacity-50"
        >
          Hide
        </button>
        <button
          disabled={busy}
          onClick={() => update("banned")}
          className="px-2 py-1 text-xs rounded border text-red-600 border-red-300 hover:bg-red-50 disabled:opacity-50"
        >
          Ban
        </button>
      </div>
    );
  }

  return (
    <button
      disabled={busy}
      onClick={() => update("visible")}
      className="px-2 py-1 text-xs rounded border hover:bg-muted disabled:opacity-50"
    >
      Restore
    </button>
  );
}
