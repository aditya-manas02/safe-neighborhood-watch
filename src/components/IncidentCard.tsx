import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface Incident {
  id: string;
  type: "suspicious" | "theft" | "vandalism" | "noise" | "emergency" | "other";
  title: string;
  description: string;
  location: string;
  timestamp: Date;
}

const typeConfig = {
  suspicious: { label: "Suspicious Activity", color: "bg-amber-500" },
  theft: { label: "Theft", color: "bg-destructive" },
  vandalism: { label: "Vandalism", color: "bg-orange-500" },
  noise: { label: "Noise Complaint", color: "bg-blue-500" },
  emergency: { label: "Emergency", color: "bg-red-600" },
  other: { label: "Other", color: "bg-muted-foreground" },
};

interface IncidentCardProps {
  incident: Incident;
}

const IncidentCard = ({ incident }: IncidentCardProps) => {
  const config = typeConfig[incident.type];
  
  return (
    <Card className="p-6 hover:shadow-card transition-shadow">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${config.color} text-white`}>
                {config.label}
              </Badge>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {incident.title}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-2">
              {incident.description}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{incident.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{formatDistanceToNow(incident.timestamp, { addSuffix: true })}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default IncidentCard;
