import { notFound, redirect } from "next/navigation";

const apiBase =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.API_URL ??
  "http://localhost:4000";

export default async function ActivityCreatorPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const res = await fetch(`${apiBase}/activities/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });

  if (!res.ok) notFound();
  const activity = (await res.json()) as { createdById?: string };
  if (!activity?.createdById) notFound();

  redirect(`/${locale}/users/${encodeURIComponent(activity.createdById)}`);
}
