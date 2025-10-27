import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, DollarSign, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId, amount } = location.state || {};
  const [isLoading, setIsLoading] = useState(false);

  if (!sessionId) {
    navigate("/");
    return null;
  }

  const handlePayment = async (method: "online" | "cash") => {
    setIsLoading(true);

    try {
      // Update session with payment method
      const { error } = await supabase
        .from("sessions")
        .update({
          payment_method: method,
          payment_status: method === "cash" ? "pending" : "paid"
        })
        .eq("id", sessionId);

      if (error) throw error;

      if (method === "online") {
        // Simulate online payment processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        await supabase
          .from("sessions")
          .update({ payment_status: "paid" })
          .eq("id", sessionId);
      }

      toast.success(`Payment method selected: ${method.toUpperCase()}`);
      navigate("/verify", { state: { sessionId } });
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to process payment");
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
            <DollarSign className="w-16 h-16 text-accent shadow-glow" />
          </div>
          <CardTitle className="text-3xl bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent">
            Choose Payment Method
          </CardTitle>
          <CardDescription className="text-lg font-semibold mt-2">
            Amount: ${amount?.toFixed(2)}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button
            onClick={() => handlePayment("online")}
            disabled={isLoading}
            className="w-full h-20 bg-secondary hover:bg-secondary/90 shadow-mario transition-all hover:scale-105"
          >
            <CreditCard className="w-6 h-6 mr-3" />
            <span className="text-lg">Pay Online (Stripe/PayPal)</span>
          </Button>

          <Button
            onClick={() => handlePayment("cash")}
            disabled={isLoading}
            className="w-full h-20 bg-primary hover:bg-primary/90 shadow-mario transition-all hover:scale-105"
          >
            <DollarSign className="w-6 h-6 mr-3" />
            <span className="text-lg">Pay with Cash</span>
          </Button>

          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Console
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Payment;
