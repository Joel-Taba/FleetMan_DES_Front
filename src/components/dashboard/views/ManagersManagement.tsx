"use client";

import { useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { mockManagers } from "@/lib/mock-data";

export function ManagersManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [managers, setManagers] = useState(mockManagers);

  const filtered = managers.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <PageHeader
        title="Gestionnaires de Flottes"
        description="Supervisez les managers de votre tenant."
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-11 rounded-lg border border-input bg-background px-3 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Tous</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3">Manager</th>
              <th className="hidden px-4 py-3 md:table-cell">Organisation</th>
              <th className="px-4 py-3">Flottes</th>
              <th className="px-4 py-3">Statut</th>
              <th className="hidden px-4 py-3 lg:table-cell">Inscription</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => (
              <tr key={m.id} className={i % 2 ? "bg-muted/20" : ""}>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                      {m.initials}
                    </div>
                    <div>
                      <p className="font-semibold">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-4 md:table-cell">{m.organization}</td>
                <td className="px-4 py-4">
                  <Badge>{m.fleetsCount}</Badge>
                </td>
                <td className="px-4 py-4">
                  <Badge variant={m.status === "active" ? "success" : "muted"}>
                    {m.status === "active" ? "Actif" : "Inactif"}
                  </Badge>
                </td>
                <td className="hidden px-4 py-4 text-muted-foreground lg:table-cell">
                  {m.joinedAt}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Switch
                      checked={m.status === "active"}
                      onCheckedChange={(c) =>
                        setManagers((prev) =>
                          prev.map((x) =>
                            x.id === m.id
                              ? { ...x, status: c ? "active" : "inactive" }
                              : x
                          )
                        )
                      }
                    />
                    <Button variant="ghost" size="sm">Voir profil</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
          <span>Page 1 sur 1</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" disabled>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
