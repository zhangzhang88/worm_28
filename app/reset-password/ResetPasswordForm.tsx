"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

interface ResetPasswordFormProps {
  searchParams: {
    access_token?: string;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  };
}

const ContainerStyles: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#05051d",
  padding: "2rem"
};

const FormCardStyles: React.CSSProperties = {
  width: "100%",
  maxWidth: "420px",
  background: "#0f0f2b",
  padding: "2rem",
  borderRadius: "16px",
  boxShadow: "0 10px 35px rgba(0,0,0,0.4)",
  color: "#fff"
};

function parseHashTokens(hash: string) {
  if (!hash) {
    return {};
  }
  const trimmed = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(trimmed);
  return {
    accessToken: params.get("access_token") ?? undefined,
    refreshToken: params.get("refresh_token") ?? undefined,
    error: params.get("error") ?? undefined,
    errorDescription: params.get("error_description") ?? undefined
  };
}

export default function ResetPasswordForm({ searchParams }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [accessToken, setAccessToken] = useState<string | undefined>(undefined);
  const [refreshToken, setRefreshToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hashTokens = parseHashTokens(window.location.hash);
    const resolved = {
      accessToken: hashTokens.accessToken ?? searchParams.access_token,
      refreshToken: hashTokens.refreshToken ?? searchParams.refresh_token,
      error: hashTokens.error ?? searchParams.error,
      errorDescription: hashTokens.errorDescription ?? searchParams.error_description
    };

    const { accessToken, refreshToken, error, errorDescription } = resolved;

    if (error || errorDescription) {
      setStatus({
        type: "error",
        message: errorDescription ?? "重置链接被拒绝，请重新申请。"
      });
      return;
    }

    if (!accessToken) {
      setStatus({ type: "error", message: "未检测到有效的重置链接，请返回登录页重新请求。" });
      return;
    }

    if (!refreshToken) {
      setStatus({
        type: "error",
        message: "重置链接缺少必要信息，请重新申请重置邮件。"
      });
      return;
    }

    setAccessToken(accessToken);
    setRefreshToken(refreshToken);

    const initializeSession = async () => {
      const payload = {
        access_token: accessToken,
        refresh_token: refreshToken
      };

      const { error } = await supabase.auth.setSession(payload);

      if (error) {
        setStatus({ type: "error", message: error.message });
        return;
      }

      window.history.replaceState(null, "", window.location.pathname);
      setSessionReady(true);
    };

    void initializeSession();
  }, [searchParams]);

  const buttonDisabled = loading || !accessToken || !sessionReady;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accessToken) {
      return;
    }
    if (!password || password.length < 8) {
      setStatus({ type: "error", message: "密码应不少于 8 个字符。" });
      return;
    }
    if (password !== confirm) {
      setStatus({ type: "error", message: "两次密码输入不一致。" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setStatus({ type: "error", message: error.message });
      return;
    }

    setStatus({ type: "success", message: "密码已更新，正在跳转..." });
    router.push("/");
  };

  return (
    <div style={ContainerStyles}>
      <form style={FormCardStyles} onSubmit={handleSubmit}>
        <h1 style={{ margin: "0 0 1rem", textAlign: "center" }}>重置密码</h1>
        <p style={{ marginBottom: "1rem", color: "#c2c7ff" }}>
          请输入新密码，提交后系统会自动更新账户并登录。
        </p>
        <label style={{ display: "block", marginBottom: "0.35rem" }}>新密码</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "#05051d",
            color: "#fff",
            marginBottom: "1rem"
          }}
        />
        <label style={{ display: "block", marginBottom: "0.35rem" }}>确认密码</label>
        <input
          type="password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "#05051d",
            color: "#fff",
            marginBottom: "1rem"
          }}
        />
        {status && (
          <p
            style={{
              fontSize: "0.85rem",
              color: status.type === "error" ? "#ff6b6b" : "#7cffb0",
              marginBottom: "0.75rem"
            }}
          >
            {status.message}
          </p>
        )}
        <button
          type="submit"
          disabled={buttonDisabled}
          style={{
            width: "100%",
            marginTop: "0.5rem",
            padding: "0.85rem",
            borderRadius: "10px",
            border: "none",
            background: buttonDisabled ? "#555" : "#00c18b",
            color: "#05051d",
            fontWeight: 600,
            cursor: buttonDisabled ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "处理中..." : "提交新密码"}
        </button>
      </form>
    </div>
  );
}
