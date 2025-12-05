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

const STATUS_TABS = [
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
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(8);
  const [totalCount, setTotalCount] = useState(0);
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) navigate("/");
  }, [user, isAdmin, isLoading]);

  useEffect(() => {
    if (isAdmin) fetchIncidents();
  }, [statusFilter, page, search, sortDesc]);

  async function fetchIncidents() {
    setLoading(true);

    const query = supabase
      .from("incidents")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: !sortDesc })
      .range((page - 1) * perPage, page * perPage - 1);

    if (statusFilter !== "all") query.eq("status", statusFilter);

    if (search.trim()) {
      const q = `%${search.trim()}%`;
      query.or(`title.ilike.${q},description.ilike.${q},location.ilike.${q}`);
    }

    const { data, count, error } = await query;

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load incidents",
        variant: "destructive",
      });
    } else {
      setIncidents(data || []);
      setTotalCount(count || 0);
    }

    setLoading(false);
  }

  const stats = useMemo(() => {
    return {
      pending: incidents.filter((i) => i.status === "pending").length,
      approved: incidents.filter((i) => i.status === "approved").length,
      rejected: incidents.filter((i) => i.status === "rejected").length,
      total: totalCount,
    };
  }, [incidents, totalCount]);

  async function updateIncidentStatus(id: string, newStatus: "approved" | "rejected") {
    if (!confirm(`Are you sure to ${newStatus} this report?`)) return;

    const { error } = await supabase
      .from("incidents")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: `Could not ${newStatus} incident`,
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: `Incident ${newStatus}` });
      fetchIncidents();
    }
  }

  async function deleteIncident(id: string) {
    if (!confirm("Delete this incident permanently?")) return;

    const { error } = await supabase.from("incidents").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete",
        variant: "destructive",
      });
    } else {
      toast({ title: "Deleted", description: "Incident removed" });
      fetchIncidents();
    }
  }

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="min-h-screen flex bg-background overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-72 hidden md:flex flex-col border-r border-border bg-card p-4">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <div className="font-bold text-lg">SafetyWatch</div>
            <div className="text-sm text-muted-foreground">Admin Panel</div>
          </div>
        </div>

        <nav className="flex-1">
          <ul className="space-y-1">
            {STATUS_TABS.map((tab) => (
              <li key={tab.key}>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 pointer-events-auto"
                  onClick={() => {
                    setStatusFilter(tab.key);
                    setPage(1);
                  }}
                >
                  {tab.key === "all" && <List className="h-4 w-4" />}
                  {tab.key === "pending" && <Clock className="h-4 w-4" />}
                  {tab.key === "approved" && <Check className="h-4 w-4" />}
                  {tab.key === "rejected" && <X className="h-4 w-4" />}
                  {tab.label}
                </Button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-4 text-xs text-muted-foreground">
          <div>Signed in:</div>
          <div className="font-medium text-foreground">{user?.email}</div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Incident Management</h1>
          </div>

          <div className="flex items-center gap-3">
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="max-w-md"
            />
            <Button onClick={() => setSortDesc(!sortDesc)}>
              {sortDesc ? "Newest" : "Oldest"}
            </Button>
          </div>
        </div>

        {/* STATUS TABS */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setStatusFilter(t.key);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                statusFilter === t.key
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* INCIDENT LIST */}
          <section className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="p-8 border rounded-lg text-center">Loading...</div>
            ) : incidents.length === 0 ? (
              <div className="p-8 border rounded-lg text-center">
                No incidents found
              </div>
            ) : (
              incidents.map((inc) => (
                <Card key={inc.id} className="relative">
                  <CardContent className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
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
                          {inc.created_at
                            ? format(new Date(inc.created_at), "PPp")
                            : ""}
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold">{inc.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {inc.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {inc.location}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {inc.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() =>
                              updateIncidentStatus(inc.id, "approved")
                            }
                          >
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              updateIncidentStatus(inc.id, "rejected")
                            }
                          >
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteIncident(inc.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            {/* PAGINATION */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm">
                Page {page} of {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <Button disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Prev
                </Button>
                <Button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </section>

          {/* RIGHT SIDEBAR */}
          <aside className="space-y-4 relative z-10 pointer-events-auto">
            {/* Quick Actions Card */}
            <Card className="pointer-events-auto">
              <CardHeader>
                <CardTitle>Admin Tools</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button
                  className="pointer-events-auto"
                  onClick={() => navigate("/users")}
                >
                  <Users className="mr-2 h-4 w-4" /> Manage Users
                </Button>

                <Button
                  className="pointer-events-auto"
                  variant="outline"
                  onClick={() => navigate("/settings")}
                >
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </Button>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Pending</p>
                    <p className="text-xl font-semibold text-amber-500">{stats.pending}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Approved</p>
                    <p className="text-xl font-semibold text-green-500">{stats.approved}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Rejected</p>
                    <p className="text-xl font-semibold text-destructive">{stats.rejected}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Total</p>
                    <p className="text-xl font-semibold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
