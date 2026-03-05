import { AppShell } from "@/components/layout/AppShell";
import { ChatInbox } from "./_components/ChatInbox";
import { getTranslations } from "next-intl/server";

export default async function ChatInboxPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "chat" });
  return (
    <AppShell variant="app">
      <main className="px-4">
        <div className="mx-auto w-full max-w-md pt-6 pb-10 sm:max-w-2xl sm:pt-10">
          <h1 className="text-xl font-semibold text-center sm:text-left">
            {t("inboxTitle")}
          </h1>
          <ChatInbox />
        </div>
      </main>
    </AppShell>
  );
}
