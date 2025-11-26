"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useRef, useImperativeHandle, forwardRef } from "react";

interface TurnstileInvisibleProps {
    onSuccess: (token: string) => void;
    onError?: () => void;
}

export interface TurnstileInvisibleHandle {
    execute: () => void;
    reset: () => void;
}

/**
 * 隐形 Turnstile 验证组件（非交互模式）
 * 
 * 使用方式：
 * 1. 创建 ref: const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
 * 2. 在需要验证时调用: turnstileRef.current?.execute();
 * 3. 验证成功会自动调用 onSuccess 回调
 */
const TurnstileInvisible = forwardRef<
    TurnstileInvisibleHandle,
    TurnstileInvisibleProps
>(({ onSuccess, onError }, ref) => {
    const turnstileRef = useRef<any>(null);
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    useImperativeHandle(ref, () => ({
        execute: () => {
            turnstileRef.current?.execute();
        },
        reset: () => {
            turnstileRef.current?.reset();
        },
    }));

    if (!siteKey) {
        console.error("❌ TURNSTILE ERROR: Site Key not configured!");
        console.error("Please check NEXT_PUBLIC_TURNSTILE_SITE_KEY in your .env file");
        return null;
    }

    console.log("✅ Turnstile component mounted with Site Key:", siteKey?.substring(0, 10) + "...");

    return (
        <div style={{ position: "absolute", left: "-9999px", visibility: "hidden" }}>
            <Turnstile
                ref={turnstileRef}
                siteKey={siteKey}
                onSuccess={(token) => {
                    console.log("✅ Turnstile verification SUCCESS!");
                    console.log("Token received (length):", token?.length);
                    onSuccess(token);
                    turnstileRef.current?.reset();
                }}
                onError={(error) => {
                    console.error("❌ Turnstile verification FAILED!");
                    console.error("Error details:", error);
                    console.error("Possible causes:");
                    console.error("1. Invalid Site Key");
                    console.error("2. Domain not whitelisted in Cloudflare Dashboard");
                    console.error("3. Widget mode is still 'Interactive' instead of 'Non-Interactive'");
                    console.error("4. Network connectivity issues");
                    onError?.();
                }}
                onExpire={() => {
                    console.warn("⚠️ Turnstile token EXPIRED - resetting...");
                    turnstileRef.current?.reset();
                }}
                options={{
                    size: "invisible",
                    theme: "light",
                    execution: "execute", // 手动触发
                }}
            />
        </div>
    );
});

TurnstileInvisible.displayName = "TurnstileInvisible";

export default TurnstileInvisible;
