import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Check, X, ArrowLeft, Clock, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface PendingIncident {
  id: string;
  type: string;
  title: string;
  description: string;
  location: string;
  status: string;
  created_at: string;
}

const typeColors: Record<string, string> = {
  suspicious: "bg-yellow-500 text-black",
  theft: "bg-destructive text-destructive-foreground",
  vandalism: "bg-amber-600 text-white",
  assault: "bg-red-700 text-white",
  noise: "bg-blue-500 text-white",
  emergency: "bg-red-600 text-white",
  road_hazard: "bg-orange-500 text-white",
  other: "bg-muted text-muted-foreground",
};


const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading } = useAuth();
  const [incidents, setIncidents] = useState<PendingIncident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchPendingIncidents();
    }
  }, [isAdmin]);

  // Fetch all incidents
  const fetchPendingIncidents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch incidents",
        variant: "destructive",
      });
    } else {
      setIncidents(data || []);
    }
    setLoading(false);
  };

  // Approve / Reject
  const updateIncidentStatus = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("incidents")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: `Failed to ${status} incident`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Incident ${status}`,
      });
      fetchPendingIncidents();
    }
  };

  // DELETE approved incident
  const deleteIncident = async (id: string) => {
    const confirmed = confirm("Are you sure you want to permanently delete this incident?");
    if (!confirmed) return;

    const { error } = await supabase.from("incidents").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete incident",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Incident deleted successfully",
    });

    fetchPendingIncidents();
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const pendingCount = incidents.filter(i => i.status === "pending").length;
  const approvedCount = incidents.filter(i => i.status === "approved").length;
  const rejectedCount = incidents.filter(i => i.status === "rejected").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-foreground">Admin Dashboard</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold text-amber-500">{pendingCount}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-3xl font-bold text-green-500">{approvedCount}</p>
                </div>
                <Check className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-3xl font-bold text-destructive">{rejectedCount}</p>
                </div>
                <X className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Incidents List */}
        <Card>
          <CardHeader>
            <CardTitle>All Incident Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {incidents.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No incidents to review</p>
            ) : (
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-border rounded-lg gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={typeColors[incident.type] || typeColors.other}>
                          {incident.type}
                        </Badge>
                        <Badge
                          variant={
                            incident.status === "approved"
                              ? "default"
                              : incident.status === "rejected"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {incident.status}
                        </Badge>
                      </div>

                      <h3 className="font-semibold text-foreground">{incident.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{incident.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {incident.location} • {format(new Date(incident.created_at), "PPp")}
                      </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2">
                      {incident.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateIncidentStatus(incident.id, "approved")}
                          >
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateIncidentStatus(incident.id, "rejected")}
                          >
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </>
                      )}

                      {/* DELETE BUTTON only for approved incidents */}
                      {incident.status === "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteIncident(incident.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
