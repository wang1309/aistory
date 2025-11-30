"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Icon from "@/components/icon";
import { Link } from "@/i18n/navigation";

interface CompletionGuideProps {
    onCreateAnother: () => void;
    onSave: () => void;
    isSaveDisabled?: boolean;
    translations: {
        title: string;
        subtitle: string;
        create_another: string;
        share_action: string;
    };
}

export default function CompletionGuide({ onCreateAnother, onSave, translations, isSaveDisabled }: CompletionGuideProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-12 p-8 rounded-[2rem] bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 border border-white/10 relative overflow-hidden"
        >
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-left">
                    <h3 className="text-2xl font-bold text-foreground mb-2 flex items-center justify-center md:justify-start gap-2">
                        <span>🎉</span> {translations.title}
                    </h3>
                    <p className="text-muted-foreground/80 text-lg font-light">
                        {translations.subtitle}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    <Button
                        onClick={onCreateAnother}
                        size="lg"
                        className="w-full sm:w-auto rounded-full h-14 px-8 text-base font-semibold bg-white dark:bg-white/10 hover:bg-gray-50 dark:hover:bg-white/20 text-foreground border border-black/5 dark:border-white/10 shadow-sm transition-all hover:-translate-y-0.5"
                    >
                        <Icon name="plus" className="size-5 mr-2 text-indigo-500" />
                        {translations.create_another}
                    </Button>

                    <Button
                        onClick={onSave}
                        size="lg"
                        disabled={isSaveDisabled}
                        className="w-full sm:w-auto rounded-full h-14 px-8 text-base font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 hover:shadow-indigo-500/40 disabled:opacity-60 disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:shadow-none"
                    >
                        {translations.share_action}
                        <Icon name="save" className="size-5 ml-2" />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
