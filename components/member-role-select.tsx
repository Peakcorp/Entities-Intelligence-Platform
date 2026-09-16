"use client";

import { useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { changeRole } from "@/app/(dashboard)/[entitySlug]/settings/users/actions";

const ROLES = [
  { value: "manager", label: "Manager" },
  { value: "employee", label: "Employee" },
  { value: "it_admin", label: "IT Admin" },
];

export function MemberRoleSelect({
  entityId,
  entitySlug,
  membershipId,
  role,
}: {
  entityId: string;
  entitySlug: string;
  membershipId: string;
  role: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={role}
      onValueChange={(value) =>
        startTransition(() =>
          changeRole(entityId, entitySlug, membershipId, value as "manager" | "employee" | "it_admin"),
        )
      }
    >
      <SelectTrigger size="sm" className={isPending ? "w-36 opacity-60" : "w-36"}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((r) => (
          <SelectItem key={r.value} value={r.value}>
            {r.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
