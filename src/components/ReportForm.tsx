import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { AlertCircle, X } from "lucide-react";
import { toast } from "sonner";

interface ReportFormProps {
  onClose: () => void;
  onSubmit: (report: {
    type: string;
    title: string;
    description: string;
    location: string;
  }) => void;
}

const ReportForm = ({ onClose, onSubmit }: ReportFormProps) => {
  const [formData, setFormData] = useState({
    type: "",
    title: "",
    description: "",
    location: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type || !formData.title || !formData.description || !formData.location) {
      toast.error("Please fill in all fields");
      return;
    }

    onSubmit(formData);
    toast.success("Incident reported successfully");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-6 relative shadow-elevated">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Report an Incident</h2>
            <p className="text-muted-foreground mt-1">
              Help keep your community informed and safe
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Incident Type *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select incident type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suspicious">Suspicious Activity</SelectItem>
                  <SelectItem value="theft">Theft</SelectItem>
                  <SelectItem value="vandalism">Vandalism</SelectItem>
                  <SelectItem value="assault">Assault</SelectItem>
                  <SelectItem value="noise">Noise Complaint</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="road_hazard">Road Hazard</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select> 
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Brief description of the incident"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                placeholder="Street address or intersection"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Provide detailed information about what happened"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/10 border border-accent/20">
              <AlertCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                For emergencies, please call 911 immediately. This form is for community awareness only.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1">
                Submit Report
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default ReportForm;
