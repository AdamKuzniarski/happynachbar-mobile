import { AppShell } from "@/components/layout/AppShell";
import { ChatRoom } from "./_components/ChatRoom";
import Link from "next/link";
import { CircleArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getTranslations } from "next-intl/server";

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "chat" });
  return (
    <AppShell variant="app">
      <main className="px-4">
        <div className="mx-auto w-full max-w-md pt-6 pb-10 sm:max-w-2xl sm:pt-10">
          <div className="mb-4">
            <Button
              asChild
              variant="secondary"
              className="group h-7 px-2 py-0 text-[11px] leading-none"
            >
              <Link href={`/${locale}/chat`}>
                <CircleArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span className="max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity] duration-200 ease-out group-hover:ml-2 group-hover:max-w-48 group-hover:opacity-100 group-hover:overflow-visible">
                  {t("backToOverview")}
                </span>
              </Link>
            </Button>
          </div>
          <ChatRoom conversationId={id} />
        </div>
      </main>
    </AppShell>
  );
}
