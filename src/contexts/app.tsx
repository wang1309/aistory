"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { cacheGet, cacheRemove } from "@/lib/cache";

import { CacheKey } from "@/services/constant";
import { ContextValue, SignModalContext } from "@/types/context";
import {
  buildAuthTrackingPayload,
  clearPendingAuthAttempt,
  AuthIntent,
  AuthIntentInput,
  normalizeAuthIntent,
  readPendingAuthAttempt,
} from "@/lib/auth-funnel";
import { User } from "@/types/user";
import moment from "moment";
import useOneTapLogin from "@/hooks/useOneTapLogin";
import { useSession } from "next-auth/react";
import { isAuthEnabled, isGoogleOneTapEnabled } from "@/lib/auth";
import { useOpenPanel } from "@openpanel/nextjs";

const AppContext = createContext({} as ContextValue);

export const useAppContext = () => useContext(AppContext);

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  if (!isAuthEnabled()) {
    return <AppContextProviderWithoutAuth>{children}</AppContextProviderWithoutAuth>;
  }

  return <AppContextProviderWithAuth>{children}</AppContextProviderWithAuth>;
};

function AppContextProviderWithAuth({ children }: { children: ReactNode }) {
  useOneTapLogin();

  const { data: session } = useSession();
  return <AppContextProviderInner session={session}>{children}</AppContextProviderInner>;
}

function AppContextProviderWithoutAuth({ children }: { children: ReactNode }) {
  return <AppContextProviderInner session={null}>{children}</AppContextProviderInner>;
}

function AppContextProviderInner({
  children,
  session,
}: {
  children: ReactNode;
  session: any;
}) {
  const [showSignModal, setShowSignModal] = useState<boolean>(false);
  const [authIntent, setAuthIntent] = useState<AuthIntent | null>(null);
  const [signModalContext, setSignModalContext] = useState<SignModalContext>({
    mode: "default",
  });
  const [user, setUser] = useState<User | null>(null);

  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [showVerificationModal, setShowVerificationModal] = useState<boolean>(false);
  const [verificationCallback, setVerificationCallback] = useState<((token: string) => void) | null>(null);
  const { track } = useOpenPanel();

  const requireAuth = useCallback((intent: AuthIntentInput) => {
    setAuthIntent(normalizeAuthIntent(intent));
    setShowSignModal(true);
  }, []);

  const clearAuthIntent = useCallback(() => {
    setAuthIntent(null);
  }, []);

  // 当验证模态框关闭时，重置回调
  useEffect(() => {
    if (!showVerificationModal && verificationCallback) {
      setVerificationCallback(null);
    }
  }, [showVerificationModal, verificationCallback]);

  // 登录弹窗关闭时，清掉 continue-ai-write 上下文，避免下次打开残留旧文案
  useEffect(() => {
    if (!showSignModal && signModalContext) {
      if (signModalContext.mode !== "default") {
        setSignModalContext({ mode: "default" });
      }
    }
  }, [showSignModal, signModalContext]);

  const updateInvite = useCallback(async (user: User) => {
    try {
      if (user.invited_by) {
        // user already been invited
        console.log("user already been invited", user.invited_by);
        return;
      }

      const inviteCode = cacheGet(CacheKey.InviteCode);
      if (!inviteCode) {
        // no invite code
        return;
      }

      const userCreatedAt = moment(user.created_at).unix();
      const currentTime = moment().unix();
      const timeDiff = Number(currentTime - userCreatedAt);

      if (timeDiff <= 0 || timeDiff > 7200) {
        // user created more than 2 hours
        console.log("user created more than 2 hours");
        return;
      }

      // update invite relation
      console.log("update invite", inviteCode, user.uuid);
      const req = {
        invite_code: inviteCode,
        user_uuid: user.uuid,
      };
      const resp = await fetch("/api/update-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req),
      });
      if (!resp.ok) {
        throw new Error("update invite failed with status: " + resp.status);
      }
      const { code, message, data } = await resp.json();
      if (code !== 0) {
        throw new Error(message);
      }

      setUser(data);
      cacheRemove(CacheKey.InviteCode);
    } catch (e) {
      console.log("update invite failed: ", e);
    }
  }, []);

  const fetchUserInfo = useCallback(async () => {
    try {
      const resp = await fetch("/api/get-user-info", {
        method: "POST",
      });

      if (!resp.ok) {
        throw new Error("fetch user info failed with status: " + resp.status);
      }

      const { code, message, data } = await resp.json();
      if (code !== 0) {
        throw new Error(message);
      }

      setUser(data);

      updateInvite(data);
    } catch (e) {
      console.log("fetch user info failed");
    }
  }, [updateInvite]);

  const contextValue = useMemo(
    () => ({
      showSignModal,
      setShowSignModal,
      authIntent,
      requireAuth,
      clearAuthIntent,
      signModalContext,
      setSignModalContext,
      user,
      setUser,
      refreshUser: fetchUserInfo,
      showFeedback,
      setShowFeedback,
      showVerificationModal,
      setShowVerificationModal,
      verificationCallback,
      setVerificationCallback,
    }),
    [
      fetchUserInfo,
      authIntent,
      clearAuthIntent,
      requireAuth,
      showSignModal,
      signModalContext,
      user,
      showFeedback,
      showVerificationModal,
      verificationCallback,
    ]
  );

  useEffect(() => {
    if (session && session.user) {
      const attempt = readPendingAuthAttempt();
      if (attempt) {
        track(
          "auth_success",
          buildAuthTrackingPayload({
            source: attempt.source,
            action: attempt.action,
            provider: attempt.provider,
          })
        );
        clearPendingAuthAttempt();
      }
    }
  }, [session, track]);

  useEffect(() => {
    if (session && session.user) {
      void fetchUserInfo();
    }
  }, [fetchUserInfo, session]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}
