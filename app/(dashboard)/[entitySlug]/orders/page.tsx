import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEntityBySlug } from "@/lib/entities";
import { getOrders } from "@/lib/supplyx";

const ORDER_STATUSES = ["pending", "confirmed", "in_production", "shipped", "in_customs", "delivered"] as const;
const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_production: "In Production",
  shipped: "Shipped",
  in_customs: "In Customs",
  delivered: "Delivered",
};

export default async function OrdersPage({ params }: PageProps<"/[entitySlug]/orders">) {
  const { entitySlug } = await params;
  const entity = await getEntityBySlug(entitySlug);
  if (!entity) return null;

  const orders = await getOrders(entity.id);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Order Tracker</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pending → Confirmed → In Production → Shipped → In Customs → Delivered.
      </p>

      <div className="mt-6 space-y-6">
        {ORDER_STATUSES.map((status) => {
          const statusOrders = orders.filter((o) => o.status === status);
          if (statusOrders.length === 0) return null;

          return (
            <div key={status}>
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">{STATUS_LABELS[status]}</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {statusOrders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                      <CardTitle className="text-sm">{order.deals?.clients?.name ?? "Unknown client"}</CardTitle>
                      <Badge variant="outline">{order.manufacturers?.name}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm text-muted-foreground">
                      {(order.items ?? []).map((item, i) => (
                        <p key={i}>
                          {item.qty} {item.unit} — {item.item}
                        </p>
                      ))}
                      <p className="pt-1 text-xs">
                        {order.shipping_method} · {order.origin_country}
                        {order.tracking_number ? ` · ${order.tracking_number}` : ""}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
        {orders.length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
      </div>
    </div>
  );
}
