import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import heroImage from "@/assets/hero-neighborhood.jpg";

interface HeroProps {
  onReportClick: () => void;
  onViewReportsClick: () => void; // NEW PROP
}

const Hero = ({ onReportClick, onViewReportsClick }: HeroProps) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          
          {/* Left Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Shield className="h-4 w-4" />
              Community Safety Platform
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Keep Your Neighborhood{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Safe & Informed
              </span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl">
              Report incidents, stay alert, and work together to build a safer community. 
              Real-time updates keep everyone informed and protected.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={onReportClick}
                className="text-base font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Report an Incident
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={onViewReportsClick}   // <-- ADDED CLICK ACTION
                className="text-base font-semibold"
              >
                View Recent Reports
              </Button>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="aspect-video overflow-hidden rounded-2xl shadow-elevated">
              <img
                src={heroImage}
                alt="Safe neighborhood community"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-accent/20 blur-3xl" />
            <div className="absolute -top-6 -left-6 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
