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
    "inline-flex h-11 w-full items-center justify-center gap-2 rounded-[2px] border border-border bg-transparent px-6 text-[13px] font-semibold text-foreground transition-all duration-300 hover:border-primary/40 hover:bg-accent-sage/50 sm:w-auto";

// 主 CTA 样式:品牌绿直角按钮,硬偏移阴影
const continueButtonClass =
    "group inline-flex h-[3.25rem] w-full items-center justify-center gap-2 rounded-[3px] bg-primary px-7 text-[13px] font-semibold text-primary-foreground shadow-[4px_4px_0_rgba(36,77,61,0.16)] transition-all duration-300 hover:-translate-y-px hover:bg-primary/90 hover:shadow-[6px_6px_0_rgba(36,77,61,0.16)] active:translate-y-0 sm:w-auto sm:min-w-[16rem]";

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
            className="relative mt-12 overflow-hidden rounded-[2px] border border-border bg-card shadow-[8px_9px_0_rgba(36,77,61,0.08)] dark:shadow-[8px_9px_0_rgba(0,0,0,0.45)]"
        >
            <div className="relative z-10 flex flex-col items-center gap-7 px-6 py-10 text-center sm:px-10 sm:py-12">
                {/* 标题区:仅在传入文案时渲染 */}
                {translations?.title ? (
                    <div className="flex flex-col items-center gap-2.5">
                        <div className="inline-flex items-center gap-2 text-foreground">
                            <PartyPopper className="size-5 text-accent-copper/70" />
                            <h3 className="font-display text-[24px] font-normal tracking-[-0.03em] sm:text-[28px]">
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
                                <Icon name="RiCheckLine" className="size-3.5 text-primary/80" />
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
                                <Icon name="plus" className="size-4 text-primary/80" />
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
                                <Icon name="save" className="size-4 text-primary/80" />
                                {translations?.share_action}
                            </button>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </motion.div>
    );
}
