import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Hero from "@/components/Hero";
import IncidentCard, { Incident } from "@/components/IncidentCard";
import ReportForm from "@/components/ReportForm";
import { Shield, AlertCircle, LogIn, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { user, isAdmin, signOut, isLoading } = useAuth();
  const [showReportForm, setShowReportForm] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    setLoadingIncidents(true);
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching incidents:", error);
    } else {
      setIncidents(
        (data || []).map((item) => ({
          id: item.id,
          type: item.type as Incident["type"],
          title: item.title,
          description: item.description,
          location: item.location,
          timestamp: new Date(item.created_at),
        }))
      );
    }
    setLoadingIncidents(false);
  };

  const handleNewReport = async (report: {
    type: string;
    title: string;
    description: string;
    location: string;
  }) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to report an incident",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    const { error } = await supabase.from("incidents").insert({
      user_id: user.id,
      type: report.type as
  | "suspicious"
  | "theft"
  | "vandalism"
  | "assault"
  | "noise"
  | "emergency"
  | "road_hazard"
  | "other",

      title: report.title,
      description: report.description,
      location: report.location,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Report submitted",
        description: "Your report is pending admin approval.",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">SafetyWatch</span>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button variant="outline" onClick={() => navigate("/admin")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Admin
                </Button>
              )}
              {user ? (
                <>
                  <Button onClick={() => setShowReportForm(true)}>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Report Incident
                  </Button>
                  <Button variant="ghost" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button onClick={() => navigate("/auth")}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <Hero onReportClick={() => user ? setShowReportForm(true) : navigate("/auth")} />

      {/* Recent Incidents */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">Recent Reports</h2>
            <p className="text-muted-foreground text-lg">
              Stay informed about incidents in your neighborhood
            </p>
          </div>

          {loadingIncidents ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : incidents.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No approved incidents yet. Be the first to report!
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {incidents.map((incident) => (
                <IncidentCard key={incident.id} incident={incident} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Report Form Modal */}
      {showReportForm && (
        <ReportForm
          onClose={() => setShowReportForm(false)}
          onSubmit={handleNewReport}
        />
      )}
    </div>
  );
};

export default Index;
