// src/pages/Users.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Shield, User, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface UserRow {
  id: string;
  email: string;
  role: string;
}

export default function UsersPage() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) navigate("/");
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_roles")
      .select("user_id, role, profiles(email)");

    if (error) {
      toast({ title: "Error", description: "Failed to fetch users", variant: "destructive" });
    } else {
      const formatted = data.map((u: any) => ({
        id: u.user_id,
        role: u.role,
        email: u.profiles?.email || "Unknown",
      }));
      setUsers(formatted);
    }
    setLoading(false);
  }

  async function deleteUser(id: string) {
    if (!confirm("Remove this user permanently?")) return;

    const { error } = await supabase.from("user_roles").delete().eq("user_id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
    } else {
      toast({ title: "User removed" });
      fetchUsers();
    }
  }

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen p-6 bg-background">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">User Management</h1>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
        <Input
          placeholder="Search users by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-lg w-full"
        />
        <Button variant="secondary">
          <Search className="w-4 h-4 mr-1" /> Search
        </Button>
      </div>

      {/* USER LIST */}
      {loading ? (
        <div className="text-center py-10">Loading users...</div>
      ) : filteredUsers.length === 0 ? (
        <p className="text-center py-10 text-muted-foreground">No users found</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((u) => (
            <Card key={u.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  {u.email}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                  {u.role}
                </Badge>

                <div className="flex items-center justify-end gap-2">
                  {u.role !== "admin" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteUser(u.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
