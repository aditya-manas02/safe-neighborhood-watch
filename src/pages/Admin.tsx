// src/pages/Admin.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button
} from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Check,
  X,
  ArrowLeft,
  Clock,
  Trash2,
  Search,
  Users,
  Settings,
  List,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

type IncidentRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  location: string;
  type: string;
  status: "pending" | "approved" | "rejected";
  created_at: string | null;
  updated_at: string | null;
};

const STATUS_TABS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const typeColors: Record<string, string> = {
  theft: "bg-destructive text-destructive-foreground",
  vandalism: "bg-amber-500 text-white",
  suspicious: "bg-yellow-500 text-black",
  assault: "bg-red-700 text-white",
  noise: "bg-violet-600 text-white",
  emergency: "bg-red-600 text-white",
  road_hazard: "bg-sky-600 text-white",
  other: "bg-muted text-muted-foreground",
};

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading } = useAuth();
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [perPage] = useState<number>(8);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [sortDesc, setSortDesc] = useState<boolean>(true);

  // Protect route
  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchIncidents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, statusFilter, page, perPage, search, sortDesc]);

  async function fetchIncidents() {
    setLoading(true);
    try {
      const query = supabase
        .from<IncidentRow>("incidents")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: !sortDesc })
        .range((page - 1) * perPage, page * perPage - 1);

      // filter by status
      if (statusFilter !== "all") query.eq("status", statusFilter);

      // basic search across title/description/location
      if (search.trim()) {
        // use ilike for case-insensitive partial matching
        const q = `%${search.trim()}%`;
        query.or(`title.ilike.${q},description.ilike.${q},location.ilike.${q}`);
      }

      const { data, count, error } = await query;
      if (error) {
        console.error("fetchIncidents error:", error);
        toast({
          title: "Error",
          description: "Failed to fetch incidents",
          variant: "destructive",
        });
      } else {
        setIncidents(data ?? []);
        setTotalCount(count ?? 0);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Unexpected error fetching incidents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const pending = incidents.filter((i) => i.status === "pending").length;
    const approved = incidents.filter((i) => i.status === "approved").length;
    const rejected = incidents.filter((i) => i.status === "rejected").length;
    // totalCount is server-side total for the current filter; for overview we could fetch global stats separately.
    return { pending, approved, rejected, total: totalCount };
  }, [incidents, totalCount]);

  // Approve or Reject
  async function updateIncidentStatus(id: string, newStatus: "approved" | "rejected") {
    const confirmMsg =
      newStatus === "approved"
        ? "Approve this incident?"
        : "Reject this incident?";
    if (!confirm(confirmMsg)) return;

    const { error } = await supabase
      .from("incidents")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: `Failed to ${newStatus} incident`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Incident ${newStatus}`,
      });
      fetchIncidents();
    }
  }

  // Delete incident
  async function deleteIncident(id: string) {
    if (!confirm("Permanently delete this incident? This cannot be undone.")) return;

    const { error } = await supabase.from("incidents").delete().eq("id", id);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete incident",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Deleted",
        description: "Incident removed",
      });
      // if we deleted the only item on the last page, go back a page
      if (incidents.length === 1 && page > 1) setPage(page - 1);
      else fetchIncidents();
    }
  }

  // Bulk delete example (admins only)
  async function bulkDeleteSelected(ids: string[]) {
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} incidents permanently?`)) return;

    const { error } = await supabase.from("incidents").delete().in("id", ids);
    if (error) {
      toast({
        title: "Error",
        description: "Bulk delete failed",
        variant: "destructive",
      });
    } else {
      toast({ title: "Deleted", description: `Removed ${ids.length} incidents` });
      fetchIncidents();
    }
  }

  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / perPage));

  return (
    <div className="min-h-screen flex bg-background">
      {/* SIDEBAR */}
      <aside className="w-72 hidden md:flex flex-col border-r border-border bg-card p-4">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <div className="font-bold text-lg text-foreground">SafetyWatch</div>
            <div className="text-sm text-muted-foreground">Admin Dashboard</div>
          </div>
        </div>

        <nav className="flex-1">
          <ul className="space-y-1">
            <li>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3"
                onClick={() => {
                  setStatusFilter("all");
                }}
              >
                <List className="h-4 w-4" /> All Reports
              </Button>
            </li>
            <li>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3"
                onClick={() => {
                  setStatusFilter("pending");
                }}
              >
                <Clock className="h-4 w-4" /> Pending
              </Button>
            </li>
            <li>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3"
                onClick={() => {
                  setStatusFilter("approved");
                }}
              >
                <Check className="h-4 w-4" /> Approved
              </Button>
            </li>
            <li>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3"
                onClick={() => {
                  setStatusFilter("rejected");
                }}
              >
                <X className="h-4 w-4" /> Rejected
              </Button>
            </li>
          </ul>
        </nav>

        <div className="mt-6">
          <Card>
            <CardContent>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Overview</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                    <div className="text-lg font-semibold text-amber-500">{stats.pending}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Approved</div>
                    <div className="text-lg font-semibold text-green-500">{stats.approved}</div>
                  </div>
                </div>
                <div className="mt-3 text-sm text-muted-foreground">
                  Total matching: <span className="font-medium text-foreground">{stats.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          <div>Signed in as</div>
          <div className="font-medium text-foreground truncate">{user?.email}</div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Incident Management</h1>
          </div>

          <div className="flex items-center gap-3">
            <Input
              placeholder="Search title, description, location..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="max-w-md"
              leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
            />
            <Button onClick={() => { setSortDesc(!sortDesc); }}>
              {sortDesc ? "Newest" : "Oldest"}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-4">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setStatusFilter(t.key); setPage(1); }}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                statusFilter === t.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {t.label}
              {t.key !== "all" && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {/* show count for visible incidents in page (not global) */}
                  ({incidents.filter((i) => (t.key === "all" ? true : i.status === t.key)).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: list */}
          <section className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="p-8 rounded-lg border border-border text-center">
                Loading incidents...
              </div>
            ) : incidents.length === 0 ? (
              <div className="p-8 rounded-lg border border-border text-center">
                No incidents found.
              </div>
            ) : (
              incidents.map((inc) => (
                <Card key={inc.id}>
                  <CardContent className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="w-full md:flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={typeColors[inc.type] || typeColors.other}>
                          {inc.type.replace("_", " ")}
                        </Badge>
                        <Badge
                          variant={
                            inc.status === "approved"
                              ? "default"
                              : inc.status === "rejected"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {inc.status}
                        </Badge>
                        <div className="ml-auto text-xs text-muted-foreground">
                          {inc.created_at ? format(new Date(inc.created_at), "PPp") : "—"}
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-foreground">{inc.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{inc.description}</p>
                      <div className="text-xs text-muted-foreground mt-2">{inc.location}</div>
                    </div>

                    <div className="flex-shrink-0 flex flex-col items-end gap-2">
                      {inc.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => updateIncidentStatus(inc.id, "approved")}>
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateIncidentStatus(inc.id, "rejected")}
                          >
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </>
                      )}

                      {inc.status === "approved" && (
                        <Button size="sm" variant="outline" onClick={() => deleteIncident(inc.id)}>
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      )}

                      <Button size="sm" variant="ghost" onClick={() => {
                        // open incident detail in new tab (if you have a detail route)
                        window.open(`${window.location.origin}/incidents/${inc.id}`, "_blank");
                      }}>
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing page {page} of {totalPages} — {totalCount} results
              </div>

              <div className="flex items-center gap-2">
                <Button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Prev
                </Button>
                <Button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  Next
                </Button>
              </div>
            </div>
          </section>

          {/* Right: quick filters / stats / tools */}
          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => { setStatusFilter("pending"); setPage(1); }}>
                    <Clock className="mr-2 h-4 w-4" /> Show Pending
                  </Button>
                  <Button onClick={() => { setStatusFilter("approved"); setPage(1); }}>
                    <Check className="mr-2 h-4 w-4" /> Show Approved
                  </Button>
                  <Button variant="destructive" onClick={() => {
                    if (!confirm("Delete ALL approved incidents on this page?")) return;
                    const ids = incidents.filter(i => i.status === "approved").map(i => i.id);
                    bulkDeleteSelected(ids);
                  }}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Approved (page)
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-sm">
                    <div className="text-muted-foreground">Pending</div>
                    <div className="text-lg font-semibold text-amber-500">{stats.pending}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Approved</div>
                    <div className="text-lg font-semibold text-green-500">{stats.approved}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Rejected</div>
                    <div className="text-lg font-semibold text-destructive">{stats.rejected}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Page</div>
                    <div className="text-lg font-semibold">{page}/{totalPages}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Admin Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button variant="ghost" onClick={() => navigate("/users")}>
                    <Users className="mr-2 h-4 w-4" /> Manage Users
                  </Button>
                  <Button variant="ghost" onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
