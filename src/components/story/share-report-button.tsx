"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Icon from "@/components/icon";
import type { TurnstileInvisibleHandle } from "@/components/TurnstileInvisible";

const TurnstileInvisible = dynamic(
  () => import("@/components/TurnstileInvisible"),
  { ssr: false, loading: () => null }
);

export interface ShareReportLabels {
  report: string;
  reported: string;
  title: string;
  placeholder: string;
  submit: string;
  cancel: string;
}

export default function ShareReportButton({
  shareId,
  labels,
}: {
  shareId: string;
  labels: ShareReportLabels;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);

  // Gate the report on Turnstile (reports are anonymous-write, same as create).
  const handleSubmit = () => {
    setSubmitting(true);
    turnstileRef.current?.execute();
  };

  const doSubmit = async (token: string) => {
    try {
      const res = await fetch(`/api/story-share/${shareId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, turnstileToken: token }),
      });
      const data = await res.json();
      if (data.code === 0) {
        toast.success(labels.reported);
        setOpen(false);
        setReason("");
      } else {
        toast.error(data.message || "failed");
      }
    } catch {
      toast.error("failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-xs text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Icon name="RiFlagLine" className="size-3.5 mr-1" />
        {labels.report}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{labels.title}</DialogTitle>
          </DialogHeader>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={labels.placeholder}
            className="min-h-[110px] w-full rounded-md border bg-transparent p-3 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {labels.cancel}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {labels.submit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TurnstileInvisible
        ref={turnstileRef}
        onSuccess={doSubmit}
        onError={() => {
          toast.error("verification failed");
          setSubmitting(false);
        }}
      />
    </>
  );
}
