"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

const panelStyles: CSSProperties = {
  width: "100%",
  maxWidth: "520px",
  marginBottom: "2rem",
  padding: "1.5rem",
  borderRadius: "16px",
  backgroundColor: "#10102b",
  border: "1px solid #2f3148",
  color: "#fff"
};

const headerStyles: CSSProperties = {
  marginBottom: "1rem",
  fontSize: "1.1rem",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
};

const buttonStyles: CSSProperties = {
  padding: "0.35rem 0.85rem",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#00c18b",
  color: "#05051d",
  cursor: "pointer",
  fontWeight: 600
};

export function AuthPanel() {
  const { user, loading, signIn, signUp, signOut } = useAuth();
  const router = useRouter();
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out failed", error);
    } finally {
      router.replace("/");
      router.refresh();
    }
  };
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) {
      setStatusMessage({ type: "error", message: "请填写邮箱和密码。" });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    const action = mode === "login" ? signIn : signUp;
    const result = await action(email, password);

    if (result.error) {
      setStatusMessage({ type: "error", message: result.error });
    } else if (mode === "register") {
      setStatusMessage({
        type: "success",
        message: "注册成功。请查收邮件激活账户，之后即可登录并同步学习进度。"
      });
    } else {
      setStatusMessage({
        type: "success",
        message: "登录成功，进度会自动同步到 Supabase。"
      });
    }

    setSubmitting(false);
  };

  if (loading) {
    return <div style={panelStyles}>正在检查登录状态...</div>;
  }

  if (user) {
    return (
      <div style={panelStyles}>
        <div style={headerStyles}>
          <span>已登录账号</span>
          <button type="button" style={buttonStyles} onClick={handleSignOut}>
            登出
          </button>
        </div>
        <p style={{ margin: 0, fontSize: "0.95rem" }}>
          {user.email ?? "Supabase 用户"} · ID: {user.id}
        </p>
      <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#c9c9ff" }}>
        已登录 · {user.email ?? "账户"} · {user.id}
      </p>
      </div>
    );
  }

  return (
    <div style={panelStyles}>
      <div style={headerStyles}>
        <strong>{mode === "login" ? "登录账号" : "注册新账号"}</strong>
        <button
          style={{
            ...buttonStyles,
            backgroundColor: mode === "login" ? "#3e3f63" : "#ffb347"
          }}
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "切换到注册" : "切换到登录"}
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ display: "block", marginBottom: "0.2rem" }}>邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "8px",
              border: "1px solid #353662",
              background: "#0b0b1c",
              color: "#fff"
            }}
          />
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ display: "block", marginBottom: "0.2rem" }}>密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "8px",
              border: "1px solid #353662",
              background: "#0b0b1c",
              color: "#fff"
            }}
          />
        </div>
        {statusMessage && (
          <p
            style={{
              fontSize: "0.9rem",
              color: statusMessage.type === "error" ? "#ff6b6b" : "#7cffb0",
              marginBottom: "0.75rem"
            }}
          >
            {statusMessage.message}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          style={{
            ...buttonStyles,
            width: "100%",
            opacity: submitting ? 0.7 : 1
          }}
        >
          {mode === "login" ? "立即登录" : "立即注册"}
        </button>
      </form>
    </div>
  );
}
