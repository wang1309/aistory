"use client";

import { useState, useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { StoryStatus } from "@/models/story";

interface StoryStatusSelectProps {
  uuid: string;
  initialStatus: StoryStatus;
}

const STATUS_VALUES: StoryStatus[] = ["draft", "saved", "published"];

export default function StoryStatusSelect({ uuid, initialStatus }: StoryStatusSelectProps) {
  const [status, setStatus] = useState<StoryStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();

  const handleChange = (value: string) => {
    if (!STATUS_VALUES.includes(value as StoryStatus)) {
      return;
    }

    const nextStatus = value as StoryStatus;
    const prevStatus = status;
    setStatus(nextStatus);

    startTransition(async () => {
      try {
        const resp = await fetch(`/api/stories/${uuid}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: nextStatus }),
        });

        if (!resp.ok) {
          throw new Error("request failed with status: " + resp.status);
        }

        const { code, message } = await resp.json();
        if (code !== 0) {
          setStatus(prevStatus);
          toast.error(message || "Failed to update status");
          return;
        }

        // 可选：轻量提示
        // toast.success("Status updated");
      } catch (e) {
        console.log("update story status failed", e);
        setStatus(prevStatus);
        toast.error("Failed to update status");
      }
    });
  };

  return (
    <Select value={status} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_VALUES.map((value) => (
          <SelectItem key={value} value={value}>
            {value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
