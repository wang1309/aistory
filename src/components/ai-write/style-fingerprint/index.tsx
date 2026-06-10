"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type FingerprintItem = {
  uuid: string;
  name: string;
  sample_text: string;
  style_summary: string | null;
  is_active: boolean;
};

type CachedFingerprintData = {
  fingerprints: FingerprintItem[];
  activeUuid: string | null;
};

function getCopy(locale: string) {
  if (locale.startsWith("zh")) {
    return {
      title: "Style Fingerprint",
      subtitle: "让 AI 学习你的写作风格",
      myStyles: "我的风格",
      newStyle: "+ 新建风格",
      sampleLabel: "写作样本",
      sampleHint: "粘贴一段你自己写的文字（至少 200 字），AI 会学习你的句式、词汇和节奏。",
      nameLabel: "风格名称",
      namePlaceholder: "如：文学风、轻松叙事…",
      active: "使用中",
      activate: "启用",
      deactivate: "取消激活",
      edit: "编辑",
      save: "保存",
      saving: "保存中…",
      saved: "已保存",
      delete: "删除",
      cancel: "取消",
      loadFailed: "加载失败",
      saveFailed: "保存失败",
      sampleTooShort: "请输入至少 200 字的样本",
      nameRequired: "请输入风格名称",
    };
  }
  return {
    title: "Style Fingerprint",
    subtitle: "Let AI learn your writing style",
    myStyles: "My Styles",
    newStyle: "+ New Style",
    sampleLabel: "Writing Sample",
    sampleHint: "Paste a passage of your own writing (at least 200 words). The AI will learn your sentence patterns, vocabulary, and rhythm.",
    nameLabel: "Style Name",
    namePlaceholder: "e.g. Literary, Casual…",
    active: "Active",
    activate: "Activate",
    deactivate: "Deactivate",
    edit: "Edit",
    save: "Save",
    saving: "Saving…",
    saved: "Saved",
    delete: "Delete",
    cancel: "Cancel",
    loadFailed: "Failed to load fingerprints",
    saveFailed: "Failed to save fingerprint",
    sampleTooShort: "Please enter at least 200 characters",
    nameRequired: "Please enter a style name",
  };
}

const CACHE_KEY = "ai-write:style-fingerprints";

function loadCache(): CachedFingerprintData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedFingerprintData;
  } catch {
    return null;
  }
}

function saveCache(data: CachedFingerprintData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

function EditForm({
  initName,
  initSample,
  copy,
  isSaving,
  onSave,
  onCancel,
}: {
  initName: string;
  initSample: string;
  copy: ReturnType<typeof getCopy>;
  isSaving: boolean;
  onSave: (name: string, sample: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initName);
  const [sample, setSample] = useState(initSample);

  return (
    <div className="space-y-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={copy.namePlaceholder}
        className="h-7 border-none bg-transparent px-0 text-sm font-medium shadow-none focus-visible:ring-0"
      />
      <p className="text-[11px] text-muted-foreground/70">
        {copy.sampleHint}
      </p>
      <textarea
        value={sample}
        onChange={(e) => setSample(e.target.value)}
        rows={6}
        className="w-full resize-none rounded-lg border border-border/40 px-3 py-2 text-xs outline-none placeholder:text-muted-foreground/50 focus:border-orange-400/60"
      />
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="h-7 rounded-lg bg-orange-600 px-3 text-xs text-white hover:bg-orange-700"
          disabled={isSaving}
          onClick={() => onSave(name, sample)}
        >
          {isSaving ? copy.saving : copy.save}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {copy.cancel}
        </button>
      </div>
    </div>
  );
}

export default function StyleFingerprintPanel() {
  const locale = useLocale();
  const copy = getCopy(locale);

  const [fingerprints, setFingerprints] = useState<FingerprintItem[]>([]);
  const [activeUuid, setActiveUuid] = useState<string | null>(null);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingUuid, setTogglingUuid] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    setLoaded(true);

    // 1. Show cached data immediately
    const cached = loadCache();
    if (cached && cached.fingerprints.length > 0) {
      setFingerprints(cached.fingerprints);
      setActiveUuid(cached.activeUuid);
      setIsLoading(false);
    }

    // 2. Fetch fresh data from API
    fetch("/api/style-fingerprint")
      .then((r) => r.json())
      .then((json) => {
        if (json.code !== 0) return;
        const data: CachedFingerprintData = {
          fingerprints: json.data.fingerprints || [],
          activeUuid: json.data.activeUuid || null,
        };
        setFingerprints(data.fingerprints);
        setActiveUuid(data.activeUuid);
        saveCache(data);
      })
      .catch(() => {
        if (!cached || cached.fingerprints.length === 0) {
          toast.error(copy.loadFailed);
        }
      })
      .finally(() => setIsLoading(false));
  }, [loaded, copy.loadFailed]);

  const handleActivate = useCallback(
    async (uuid: string) => {
      setTogglingUuid(uuid);
      try {
        const resp = await fetch("/api/style-fingerprint", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uuid, action: "activate" }),
        });
        const json = await resp.json();
        if (json.code !== 0) throw new Error(json.message);
        setActiveUuid(uuid);
        setFingerprints((prev) => {
          const updated = prev.map((fp) => ({ ...fp, is_active: fp.uuid === uuid }));
          saveCache({ fingerprints: updated, activeUuid: uuid });
          return updated;
        });
      } catch {
        toast.error(copy.saveFailed);
      } finally {
        setTogglingUuid(null);
      }
    },
    [copy]
  );

  const handleDeactivate = useCallback(async (uuid: string) => {
    setTogglingUuid(uuid);
    try {
      const resp = await fetch("/api/style-fingerprint", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deactivate" }),
      });
      const json = await resp.json();
      if (json.code !== 0) throw new Error(json.message);
      setActiveUuid(null);
      setFingerprints((prev) => {
        const updated = prev.map((fp) => ({ ...fp, is_active: false }));
        saveCache({ fingerprints: updated, activeUuid: null });
        return updated;
      });
    } catch {
      toast.error(copy.saveFailed);
    } finally {
      setTogglingUuid(null);
    }
  }, [copy]);

  const handleCreateSave = useCallback(
    async (name: string, sample: string) => {
      if (!name.trim()) {
        toast.error(copy.nameRequired);
        return;
      }
      if (sample.trim().length < 200) {
        toast.error(copy.sampleTooShort);
        return;
      }

      setIsSaving(true);
      try {
        const resp = await fetch("/api/style-fingerprint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), sample_text: sample.trim() }),
        });
        const json = await resp.json();
        if (json.code !== 0) throw new Error(json.message);
        setFingerprints((prev) => {
          const updated = [...prev, json.data];
          saveCache({ fingerprints: updated, activeUuid });
          return updated;
        });
        setIsCreating(false);
        toast.success(copy.saved);
      } catch {
        toast.error(copy.saveFailed);
      } finally {
        setIsSaving(false);
      }
    },
    [copy, activeUuid]
  );

  const handleEditSave = useCallback(
    async (name: string, sample: string) => {
      if (!editingUuid) return;
      if (!name.trim()) {
        toast.error(copy.nameRequired);
        return;
      }
      if (sample.trim().length < 200) {
        toast.error(copy.sampleTooShort);
        return;
      }

      setIsSaving(true);
      try {
        const resp = await fetch("/api/style-fingerprint", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uuid: editingUuid,
            name: name.trim(),
            sample_text: sample.trim(),
          }),
        });
        const json = await resp.json();
        if (json.code !== 0) throw new Error(json.message);
        setFingerprints((prev) => {
          const updated = prev.map((fp) =>
            fp.uuid === editingUuid
              ? { ...fp, name: name.trim(), sample_text: sample.trim() }
              : fp
          );
          saveCache({ fingerprints: updated, activeUuid });
          return updated;
        });
        setEditingUuid(null);
        toast.success(copy.saved);
      } catch {
        toast.error(copy.saveFailed);
      } finally {
        setIsSaving(false);
      }
    },
    [editingUuid, copy, activeUuid]
  );

  const handleDelete = useCallback(
    async (uuid: string) => {
      try {
        const resp = await fetch(`/api/style-fingerprint?uuid=${uuid}`, {
          method: "DELETE",
        });
        const json = await resp.json();
        if (json.code !== 0) throw new Error(json.message);
        setFingerprints((prev) => {
          const updated = prev.filter((fp) => fp.uuid !== uuid);
          const newActive = activeUuid === uuid ? null : activeUuid;
          saveCache({ fingerprints: updated, activeUuid: newActive });
          return updated;
        });
        if (editingUuid === uuid) setEditingUuid(null);
        if (activeUuid === uuid) setActiveUuid(null);
      } catch {
        toast.error(copy.saveFailed);
      }
    },
    [editingUuid, activeUuid, copy]
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 space-y-4 overflow-auto px-3 py-3 sm:px-4 sm:py-4">
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {copy.myStyles}
          </h3>

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-8">
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-orange-500" />
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-orange-500 [animation-delay:0.2s]" />
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-orange-500 [animation-delay:0.4s]" />
            </div>
          )}

          {!isLoading && (
            <>
              {/* Create new form */}
              {isCreating && (
                <div className="mb-3 rounded-xl border border-orange-300/50 bg-orange-50/30 p-3 dark:border-orange-600/30 dark:bg-orange-900/10">
                  <EditForm
                    initName=""
                    initSample=""
                    copy={copy}
                    isSaving={isSaving}
                    onSave={handleCreateSave}
                    onCancel={() => setIsCreating(false)}
                  />
                </div>
              )}

              {fingerprints.map((fp) => (
                <div
                  key={fp.uuid}
                  className="mb-2 rounded-xl border border-border/50 bg-background p-3"
                >
                  {editingUuid === fp.uuid ? (
                    <EditForm
                      initName={fp.name}
                      initSample={fp.sample_text}
                      copy={copy}
                      isSaving={isSaving}
                      onSave={handleEditSave}
                      onCancel={() => setEditingUuid(null)}
                    />
                  ) : (
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{fp.name}</span>
                          {fp.is_active && (
                            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-200">
                              {copy.active}
                            </span>
                          )}
                        </div>
                      </div>
                      {fp.sample_text && fp.sample_text.length > 1 && (
                        <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                          {fp.sample_text.slice(0, 120)}…
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        {fp.is_active ? (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(fp.uuid)}
                            disabled={togglingUuid === fp.uuid}
                            className="rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-60"
                          >
                            {togglingUuid === fp.uuid ? (
                              <span className="inline-flex items-center gap-1">
                                <span className="inline-block size-1.5 animate-pulse rounded-full bg-muted-foreground" />
                                <span className="inline-block size-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:0.15s]" />
                                <span className="inline-block size-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:0.3s]" />
                              </span>
                            ) : copy.deactivate}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleActivate(fp.uuid)}
                            disabled={togglingUuid === fp.uuid}
                            className="rounded-md px-2 py-1 text-[11px] font-medium text-orange-600 transition hover:bg-orange-50 disabled:opacity-60 dark:text-orange-300 dark:hover:bg-orange-900/20"
                          >
                            {togglingUuid === fp.uuid ? (
                              <span className="inline-flex items-center gap-1">
                                <span className="inline-block size-1.5 animate-pulse rounded-full bg-orange-600 dark:bg-orange-300" />
                                <span className="inline-block size-1.5 animate-pulse rounded-full bg-orange-600 [animation-delay:0.15s] dark:bg-orange-300" />
                                <span className="inline-block size-1.5 animate-pulse rounded-full bg-orange-600 [animation-delay:0.3s] dark:bg-orange-300" />
                              </span>
                            ) : copy.activate}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setEditingUuid(fp.uuid)}
                          className="rounded-md px-2 py-1 text-[11px] text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        >
                          {copy.edit}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(fp.uuid)}
                          className="rounded-md px-2 py-1 text-[11px] text-muted-foreground/60 transition hover:bg-muted hover:text-destructive"
                        >
                          {copy.delete}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {!isCreating && (
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="w-full rounded-lg border border-dashed border-border/60 py-2 text-xs text-muted-foreground transition hover:border-orange-400/60 hover:bg-orange-50/50 hover:text-orange-600 dark:hover:bg-orange-900/10"
                >
                  {copy.newStyle}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
