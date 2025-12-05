// src/pages/Settings.tsx

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Settings, Globe, Bell, Shield } from "lucide-react";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  return (
    <div className="min-h-screen p-6 bg-background">
      {/* HEADER */}
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {/* SETTINGS GRID */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* GENERAL SETTINGS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" /> General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="text-sm font-medium">Site Name</label>
            <Input placeholder="SafetyWatch" />

            <label className="text-sm font-medium">Support Email</label>
            <Input placeholder="support@safetywatch.com" />

            <Button className="w-full mt-3">Save Changes</Button>
          </CardContent>
        </Card>

        {/* NOTIFICATION SETTINGS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">Admin Alerts</label>
              <Input placeholder="admin@example.com" />
            </div>

            <div>
              <label className="text-sm font-medium">SMS Number (Optional)</label>
              <Input placeholder="+91 98765 43210" />
            </div>

            <Button className="w-full mt-3">Update Notifications</Button>
          </CardContent>
        </Card>

        {/* SECURITY */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="text-sm font-medium">Change Admin Password</label>
            <Input type="password" placeholder="New password" />

            <Input type="password" placeholder="Confirm password" />

            <Button className="w-full mt-3">Update Password</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
