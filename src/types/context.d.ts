import { ReactNode } from "react";
import { User } from "@/types/user";

export interface ContextValue {
  showSignModal: boolean;
  setShowSignModal: (show: boolean) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  showFeedback: boolean;
  setShowFeedback: (show: boolean) => void;
  showVerificationModal: boolean;
  setShowVerificationModal: (show: boolean) => void;
  verificationCallback: ((token: string) => void) | null;
  setVerificationCallback: (callback: ((token: string) => void) | null) => void;
}
