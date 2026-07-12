"use client";

import { motion } from "framer-motion";
import Icon from "@/components/icon";
import { Link } from "@/i18n/navigation";
import { PartyPopper } from "lucide-react";

interface CompletionGuideProps {
    onCreateAnother?: () => void;
    onSave?: () => void;
    continueHref?: string;
    continueLabel?: string;
    continueHint?: string;
    onContinue?: () => void;
    isSaveDisabled?: boolean;
    translations?: {
        title: string;
        subtitle: string;
        create_another: string;
        share_action: string;
    };
}

// 次要操作按钮统一样式:克制描边,不与主 CTA 抢视觉
const secondaryButtonClass =
    "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-foreground/10 bg-foreground/[0.02] px-6 text-sm font-medium text-foreground/75 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-foreground/[0.05] hover:text-foreground dark:border-white/15 dark:bg-white/[0.04] sm:w-auto";

// 主 CTA 样式:橙渐变胶囊,本次漏斗的视觉焦点
const continueButtonClass =
    "group inline-flex w-full h-[3.25rem] items-center justify-center gap-2 rounded-full px-7 text-sm sm:text-base font-semibold text-white shadow-lg shadow-orange-500/25 bg-gradient-to-r from-orange-600 to-amber-600 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:from-orange-500 hover:to-amber-500 hover:-translate-y-0.5 hover:shadow-orange-500/40 active:translate-y-0 sm:w-auto sm:min-w-[16rem]";

export default function CompletionGuide({
    onCreateAnother,
    onSave,
    continueHref,
    continueLabel,
    continueHint,
    onContinue,
    translations,
    isSaveDisabled,
}: CompletionGuideProps) {
    const showContinue = Boolean(continueHref || onContinue);

    const continueInner = (
        <>
            <Icon name="RiChat3Line" className="size-5" />
            <span>{continueLabel || "Continue in AI Write"}</span>
            <Icon
                name="RiArrowRightLine"
                className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
            />
        </>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-12 relative overflow-hidden rounded-[2rem] border border-orange-500/10 bg-gradient-to-br from-orange-500/[0.04] via-amber-500/[0.02] to-orange-500/[0.03]"
        >
            {/* 单个柔光:克制暖意,夜间更轻 */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-44 w-[30rem] -translate-x-1/2 rounded-full bg-orange-500/[0.08] blur-3xl dark:bg-orange-500/[0.05]" />

            <div className="relative z-10 flex flex-col items-center gap-7 px-6 py-10 text-center sm:px-10 sm:py-12">
                {/* 标题区:仅在传入文案时渲染 */}
                {translations?.title ? (
                    <div className="flex flex-col items-center gap-2.5">
                        <div className="inline-flex items-center gap-2 text-foreground">
                            <PartyPopper className="size-5 text-orange-500" />
                            <h3 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
                                {translations.title}
                            </h3>
                        </div>
                        <p className="max-w-md text-sm font-light text-muted-foreground/75 sm:text-base">
                            {translations.subtitle}
                        </p>
                    </div>
                ) : null}

                {/* 主操作:继续续写 + 承诺行 */}
                {showContinue ? (
                    <div className="flex w-full max-w-sm flex-col items-center gap-2.5">
                        {continueHref ? (
                            <Link href={continueHref as any} className={continueButtonClass}>
                                {continueInner}
                            </Link>
                        ) : (
                            <button type="button" onClick={onContinue} className={continueButtonClass}>
                                {continueInner}
                            </button>
                        )}

                        {continueHint ? (
                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                                <Icon name="RiCheckLine" className="size-3.5 text-orange-500/80" />
                                {continueHint}
                            </p>
                        ) : null}
                    </div>
                ) : null}

                {/* 次要操作:仅在有对应 handler 时渲染 */}
                {onCreateAnother || onSave ? (
                    <div className="flex w-full flex-col items-center gap-2.5 sm:w-auto sm:flex-row">
                        {onCreateAnother ? (
                            <button type="button" onClick={onCreateAnother} className={secondaryButtonClass}>
                                <Icon name="plus" className="size-4 text-orange-500/80" />
                                {translations?.create_another}
                            </button>
                        ) : null}

                        {onSave ? (
                            <button
                                type="button"
                                onClick={onSave}
                                disabled={isSaveDisabled}
                                className={`${secondaryButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                                <Icon name="save" className="size-4 text-orange-500/80" />
                                {translations?.share_action}
                            </button>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </motion.div>
    );
}
