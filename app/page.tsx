import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getVisibleEntities } from "@/lib/entities";

export default async function EntitySelectorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const entities = await getVisibleEntities();

  return (
    <main className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-10">
          <p className="text-sm font-medium text-muted-foreground">PeakCorp Intelligence Platform</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Select an entity</h1>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {entities.map((entity) => {
            const isActive = entity.status === "active";
            const card = (
              <Card
                className={
                  isActive
                    ? "transition-colors hover:border-neutral-400 dark:hover:border-neutral-600"
                    : "opacity-70"
                }
              >
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <CardTitle className="text-lg">{entity.name}</CardTitle>
                  <Badge variant={isActive ? "default" : "secondary"}>
                    {isActive ? "Live" : "Coming soon"}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{entity.business_type}</p>
                </CardContent>
              </Card>
            );

            return isActive ? (
              <Link key={entity.id} href={`/${entity.slug}`} className="block">
                {card}
              </Link>
            ) : (
              <div key={entity.id}>{card}</div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
