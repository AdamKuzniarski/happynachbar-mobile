import { AppShell } from "@/components/layout/AppShell";
import { PostalCodeForm } from "@/components/postal-code-form";
import { getTranslations } from "next-intl/server";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing" });
  return (
    <AppShell variant="public">
      <main className="px-4">
        <div className="mx-auto w-full max-w-md pt-10 pb-12 sm:max-w-2xl sm:pt-16">
          <div className="mx-auto w-full max-w-md">
            <h1 className="text-center text-2xl font-bold leading-tight text-foreground sm:text-4xl">
              {t("title")}
            </h1>
            <p className="mt-6 text-center text-sm leading-relaxed text-hunter dark:text-foreground/80 sm:mt-7 sm:text-base">
              {t("subtitleLine1")}
              <br />
              {t("subtitleLine2")}
            </p>

            <div className="mt-8 sm:mt-10">
              <PostalCodeForm />
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
