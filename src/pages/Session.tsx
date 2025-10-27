import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Gamepad2, Clock, Unlock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Session = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId, duration } = location.state || {};
  const [timeLeft, setTimeLeft] = useState(duration * 60); // Convert minutes to seconds
  const [hasWarned, setHasWarned] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      navigate("/");
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSessionEnd();
          return 0;
        }

        // Warning at 5 minutes remaining
        if (prev === 300 && !hasWarned) {
          toast.warning("⏰ 5 minutes remaining in your session!", {
            duration: 5000,
          });
          setHasWarned(true);
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionId, hasWarned, navigate]);

  const handleSessionEnd = async () => {
    try {
      // Get session details
      const { data: session } = await supabase
        .from("sessions")
        .select("device_id")
        .eq("id", sessionId)
        .single();

      if (session) {
        // Update session status
        await supabase
          .from("sessions")
          .update({
            status: "completed"
          })
          .eq("id", sessionId);

        // Lock device
        await supabase
          .from("devices")
          .update({
            status: "locked",
            current_session_id: null
          })
          .eq("id", session.device_id);
      }

      toast.success("Session ended. Console locked.");
      navigate("/");
    } catch (error) {
      console.error("Error ending session:", error);
      toast.error("Error ending session");
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;
  const isWarning = timeLeft <= 300; // Last 5 minutes

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-gaming relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-16 h-16 bg-accent rounded-full opacity-20 animate-bounce-slow"></div>
        <div className="absolute bottom-20 right-20 w-20 h-20 bg-secondary rounded-full opacity-20 animate-bounce-slow" style={{ animationDelay: "0.5s" }}></div>
        <div className="absolute top-40 right-40 w-12 h-12 bg-primary rounded-full opacity-20 animate-bounce-slow" style={{ animationDelay: "1s" }}></div>
      </div>

      <Card className="w-full max-w-2xl shadow-mario relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Unlock className="w-20 h-20 text-secondary animate-pulse-glow" />
              <Gamepad2 className="w-10 h-10 text-primary absolute -bottom-2 -right-2 animate-bounce" />
            </div>
          </div>
          <div>
            <CardTitle className="text-4xl bg-gradient-to-r from-secondary via-accent to-secondary bg-clip-text text-transparent">
              Session Active
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              Console Unlocked - Enjoy Your Gaming!
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Clock className={`w-8 h-8 ${isWarning ? 'text-destructive animate-pulse' : 'text-accent'}`} />
              <div className={`text-6xl font-bold ${isWarning ? 'text-destructive' : 'text-foreground'}`}>
                {formatTime(timeLeft)}
              </div>
            </div>
            <p className="text-muted-foreground">Time Remaining</p>
          </div>

          <div className="space-y-2">
            <Progress 
              value={progress} 
              className="h-4"
            />
            <p className="text-sm text-center text-muted-foreground">
              {Math.round(progress)}% of session used
            </p>
          </div>

          {isWarning && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
              <p className="text-destructive font-semibold">
                ⚠️ Less than 5 minutes remaining!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Console will lock automatically when time expires
              </p>
            </div>
          )}

          <div className="bg-muted rounded-lg p-6 text-center space-y-2">
            <p className="text-sm font-semibold text-primary">Session Duration: {duration} minutes</p>
            <p className="text-xs text-muted-foreground">
              The system will automatically lock when your session ends
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Session;
