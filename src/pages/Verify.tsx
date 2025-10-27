import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ShieldCheck, Timer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Verify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId } = location.state || {};
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      navigate("/");
      return;
    }

    // Check for existing OTP
    const checkSession = async () => {
      const { data } = await supabase
        .from("sessions")
        .select("otp, otp_expires_at, otp_attempts")
        .eq("id", sessionId)
        .single();

      if (data?.otp_attempts) {
        setAttempts(data.otp_attempts);
      }
    };

    checkSession();

    // Timer countdown
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error("OTP expired. Please request a new session.");
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionId, navigate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    if (attempts >= 3) {
      toast.error("Maximum OTP attempts reached. Please start a new session.");
      navigate("/");
      return;
    }

    setIsLoading(true);

    try {
      // Get session with OTP
      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .select("*, devices(*)")
        .eq("id", sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Check if OTP matches
      if (session.otp === otp) {
        // Update session to active
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + session.duration * 60000);

        await supabase
          .from("sessions")
          .update({
            status: "active",
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString()
          })
          .eq("id", sessionId);

        // Unlock device
        await supabase
          .from("devices")
          .update({
            status: "unlocked",
            current_session_id: sessionId
          })
          .eq("id", session.device_id);

        toast.success("OTP verified! Console unlocking...");
        navigate("/session", { state: { sessionId, duration: session.duration } });
      } else {
        // Increment attempts
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        await supabase
          .from("sessions")
          .update({ otp_attempts: newAttempts })
          .eq("id", sessionId);

        if (newAttempts >= 3) {
          toast.error("Maximum attempts reached. Please start a new session.");
          navigate("/");
        } else {
          toast.error(`Invalid OTP. ${3 - newAttempts} attempts remaining.`);
        }
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to verify OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-gaming relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-16 h-16 bg-accent rounded-full opacity-20 animate-bounce-slow"></div>
        <div className="absolute bottom-20 right-20 w-20 h-20 bg-secondary rounded-full opacity-20 animate-bounce-slow" style={{ animationDelay: "0.5s" }}></div>
      </div>

      <Card className="w-full max-w-md shadow-mario relative z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ShieldCheck className="w-16 h-16 text-secondary animate-pulse-glow" />
          </div>
          <CardTitle className="text-3xl bg-gradient-to-r from-secondary via-info to-accent bg-clip-text text-transparent">
            Enter OTP Code
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Admin will send a 6-digit code to your phone
          </CardDescription>
          <div className="flex items-center justify-center gap-2 mt-4 text-warning">
            <Timer className="w-5 h-5" />
            <span className="text-lg font-bold">{formatTime(timeLeft)}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Attempts: {attempts}/3
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => setOtp(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            onClick={handleVerify}
            disabled={isLoading || otp.length !== 6 || attempts >= 3}
            className="w-full bg-secondary hover:bg-secondary/90 shadow-mario transition-all hover:scale-105"
          >
            {isLoading ? "Verifying..." : "Verify & Unlock"}
          </Button>

          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="w-full"
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Verify;
