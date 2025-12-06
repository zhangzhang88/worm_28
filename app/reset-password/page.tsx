"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

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

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const accessToken = searchParams.get("access_token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      setStatus({ type: "error", message: "重置链接无效，请返回登录页重新触发。"});
    }
  }, [accessToken]);

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
    const { error } = await supabase.auth.updateUser({
      password
    });
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
          disabled={loading || !accessToken}
          style={{
            width: "100%",
            marginTop: "0.5rem",
            padding: "0.85rem",
            borderRadius: "10px",
            border: "none",
            background: accessToken ? "#00c18b" : "#555",
            color: "#05051d",
            fontWeight: 600,
            cursor: loading || !accessToken ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "处理中..." : "提交新密码"}
        </button>
      </form>
    </div>
  );
}
