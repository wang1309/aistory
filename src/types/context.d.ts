import { ReactNode } from "react";
import { AuthIntent, AuthIntentInput } from "@/lib/auth-funnel";
import { User } from "@/types/user";

/**
 * 登录弹窗上下文。默认走通用登录文案；
 * continue-ai-write 模式由生成器结果页“继续续写”按钮触发，
 * 携带 source 与登录后跳转地址 redirectTo。
 */
export type SignModalContext =
  | {
      mode: "default";
    }
  | {
      mode: "continue-ai-write";
      source?: string;
      redirectTo: string;
    };

export interface ContextValue {
  showSignModal: boolean;
  setShowSignModal: (show: boolean) => void;
  authIntent: AuthIntent | null;
  requireAuth: (intent: AuthIntentInput) => void;
  clearAuthIntent: () => void;
  signModalContext: SignModalContext;
  setSignModalContext: (context: SignModalContext) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  showFeedback: boolean;
  setShowFeedback: (show: boolean) => void;
  showVerificationModal: boolean;
  setShowVerificationModal: (show: boolean) => void;
  verificationCallback: ((token: string) => void) | null;
  setVerificationCallback: (callback: ((token: string) => void) | null) => void;
}
