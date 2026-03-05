"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

function VerifyInner() {
  const t = useTranslations("auth.verify");
  const sp = useSearchParams();
  const token = sp.get("token");
  const [status, setStatus] = useState<"loading" | "ok" | "error">(
    token ? "loading" : "error",
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ??
      process.env.API_URL ??
      "http://localhost:4000";
    fetch(`${apiUrl}/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((r) => (r.ok ? setStatus("ok") : setStatus("error")))
      .catch(() => setStatus("error"));
  }, [token]);

  if (status === "loading") return <p>{t("loading")}</p>;
  if (status === "ok") return <p>{t("success")}</p>;
  return <p>{t("error")}</p>;
}

export default function VerifyPage() {
  const t = useTranslations("auth.verify");
  return (
    <Suspense fallback={<p>{t("loading")}</p>}>
      <VerifyInner />
    </Suspense>
  );
}
