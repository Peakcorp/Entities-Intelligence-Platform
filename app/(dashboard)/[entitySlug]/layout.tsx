import { notFound, redirect } from "next/navigation";
import { ChatPanel } from "@/components/chat-panel";
import { EntitySidebar } from "@/components/entity-sidebar";
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
    <div className="flex flex-1">
      <EntitySidebar slug={entity.slug} entityName={entity.name} />
      <main className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-950">{children}</main>
      <ChatPanel entitySlug={entity.slug} />
    </div>
  );
}
