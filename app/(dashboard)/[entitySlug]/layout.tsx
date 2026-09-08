import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEntityBySlug } from "@/lib/entities";

export default async function EntityLayout({
  children,
  params,
}: LayoutProps<"/[entitySlug]">) {
  const { entitySlug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // RLS on `entities` already scopes this to entities the user is a member of (or all of
  // them, for owners) — a null result here means either the slug doesn't exist or the
  // user has no access, and both should look identical to the visitor.
  const entity = await getEntityBySlug(entitySlug);
  if (!entity) notFound();

  if (entity.status === "placeholder") {
    // Placeholder entities skip the full dashboard chrome (nav links to sections that
    // don't exist yet) but still render their own page/request routes as children.
    return <main className="flex flex-1 flex-col bg-neutral-50 dark:bg-neutral-950">{children}</main>;
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b bg-white dark:bg-neutral-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-muted-foreground hover:underline">
              PeakCorp
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium">{entity.name}</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href={`/${entity.slug}`} className="hover:underline">
              Overview
            </Link>
            <Link href={`/${entity.slug}/settings/email`} className="hover:underline">
              Settings
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 bg-neutral-50 dark:bg-neutral-950">{children}</main>
    </div>
  );
}
