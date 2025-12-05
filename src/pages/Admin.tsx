// src/pages/Admin.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  noise: "bg-purple-600 text-white",
  emergency: "bg-red-600 text-white",
  road_hazard: "bg-blue-600 text-white",
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
  const perPage = 8;

  const [totalCount, setTotalCount] = useState(0);
  const [sortDesc, setSortDesc] = useState(true);

  // Protect route
  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) navigate("/");
  }, [user, isAdmin, isLoading, navigate]);

  // Fetch incidents
  useEffect(() => {
    if (isAdmin) fetchIncidents();
  }, [isAdmin, page, perPage, search, statusFilter, sortDesc]);

  async function fetchIncidents() {
    setLoading(true);

    try {
      const query = supabase
        .from("incidents")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: !sortDesc })
        .range((page - 1) * perPage, page * perPage - 1);

      if (statusFilter !== "all") query.eq("status", statusFilter);

      if (search.trim()) {
        const text = `%${search.trim()}%`;
        query.or(`title.ilike.${text},description.ilike.${text},location.ilike.${text}`);
      }

      const { data, count, error } = await query;

      if (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Failed to fetch incidents",
          variant: "destructive",
        });
      } else {
        setIncidents(data || []);
        setTotalCount(count || 0);
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateIncidentStatus(id: string, newStatus: "approved" | "rejected") {
    if (!confirm(`Confirm ${newStatus}?`)) return;

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
        description: "Failed to delete incident",
        variant: "destructive",
      });
    } else {
      toast({ title: "Deleted", description: "Incident removed." });

      if (incidents.length === 1 && page > 1) setPage(page - 1);
      else fetchIncidents();
    }
  }

  const stats = useMemo(() => {
    return {
      pending: incidents.filter(i => i.status === "pending").length,
      approved: incidents.filter(i => i.status === "approved").length,
      rejected: incidents.filter(i => i.status === "rejected").length,
      total: totalCount
    };
  }, [incidents, totalCount]);

  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));

  return (
    <div className="min-h-screen flex bg-background">

      {/* SIDEBAR */}
      <aside className="w-72 hidden md:flex flex-col border-r border-border bg-card p-4">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <div className="font-bold text-lg">SafetyWatch</div>
            <div className="text-sm text-muted-foreground">Admin Dashboard</div>
          </div>
        </div>

        <nav className="flex-1">
          <ul className="space-y-1">
            {STATUS_TABS.map(tab => (
              <li key={tab.key}>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3"
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
          <div>Signed in as</div>
          <div className="font-medium truncate">{user?.email}</div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
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
              placeholder="Search incidents..."
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

        {/* Filters Tabs */}
        <div className="flex items-center gap-2 mb-4">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                statusFilter === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* INCIDENT LIST */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT LIST */}
          <section className="lg:col-span-2 space-y-4">

            {loading ? (
              <div className="p-10 text-center border rounded-lg">
                Loading incidents...
              </div>
            ) : incidents.length === 0 ? (
              <div className="p-10 text-center border rounded-lg">
                No incidents found.
              </div>
            ) : (
              incidents.map((inc) => (
                <Card key={inc.id}>
                  <CardContent className="flex flex-col md:flex-row md:items-start gap-4 p-4">

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

                        <span className="ml-auto text-xs text-muted-foreground">
                          {inc.created_at && format(new Date(inc.created_at), "PPp")}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold">{inc.title}</h3>
                      <p className="text-sm text-muted-foreground">{inc.description}</p>
                      <div className="text-xs text-muted-foreground mt-2">{inc.location}</div>
                    </div>

                    <div className="flex flex-col gap-2 items-end">
                      {inc.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateIncidentStatus(inc.id, "approved")}
                          >
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteIncident(inc.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          window.open(`/incidents/${inc.id}`, "_blank")
                        }
                      >
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages} — {totalCount} results
              </span>

              <div className="flex gap-2">
                <Button disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Prev
                </Button>
                <Button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          </section>

          {/* RIGHT SIDEBAR PANEL */}
          <aside className="space-y-4">

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={() => setStatusFilter("pending")}>
                  <Clock className="h-4 w-4 mr-2" /> Show Pending
                </Button>

                <Button onClick={() => setStatusFilter("approved")}>
                  <Check className="h-4 w-4 mr-2" /> Show Approved
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => {
                    const ids = incidents.filter(i => i.status === "approved").map(i => i.id);
                    if (ids.length === 0) return;
                    if (!confirm(`Delete ${ids.length} approved incidents?`)) return;

                    supabase.from("incidents")
                      .delete()
                      .in("id", ids)
                      .then(() => {
                        toast({ title: "Deleted", description: "Approved incidents removed" });
                        fetchIncidents();
                      });
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Approved (Page)
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stats</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-muted-foreground text-sm">Pending</div>
                  <div className="text-lg font-semibold text-amber-500">{stats.pending}</div>
                </div>

                <div>
                  <div className="text-muted-foreground text-sm">Approved</div>
                  <div className="text-lg font-semibold text-green-500">{stats.approved}</div>
                </div>

                <div>
                  <div className="text-muted-foreground text-sm">Rejected</div>
                  <div className="text-lg font-semibold text-destructive">{stats.rejected}</div>
                </div>

                <div>
                  <div className="text-muted-foreground text-sm">Pages</div>
                  <div className="text-lg font-semibold">{page}/{totalPages}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Admin Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost">
                  <Users className="h-4 w-4 mr-2" /> Manage Users
                </Button>
                <Button variant="ghost">
                  <Settings className="h-4 w-4 mr-2" /> Settings
                </Button>
              </CardContent>
            </Card>

          </aside>
        </div>
      </main>
    </div>
  );
}
