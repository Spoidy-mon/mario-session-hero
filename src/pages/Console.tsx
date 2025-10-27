import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Console = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    duration: "",
    deviceId: ""
  });

  const durationOptions = [
    { value: "30", label: "30 Minutes - $5", price: 5 },
    { value: "60", label: "1 Hour - $8", price: 8 },
    { value: "120", label: "2 Hours - $15", price: 15 }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate phone number (10 digits)
      if (!/^\d{10}$/.test(formData.phone)) {
        toast.error("Please enter a valid 10-digit phone number");
        setIsLoading(false);
        return;
      }

      // Create customer
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .insert({
          name: formData.name,
          phone: formData.phone,
          address: formData.address || null
        })
        .select()
        .single();

      if (customerError) throw customerError;

      // Get device
      const { data: device, error: deviceError } = await supabase
        .from("devices")
        .select()
        .eq("device_id", formData.deviceId)
        .single();

      if (deviceError) throw deviceError;

      // Calculate amount based on duration
      const selectedDuration = durationOptions.find(d => d.value === formData.duration);
      const amount = selectedDuration?.price || 0;

      // Create session
      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .insert({
          customer_id: customer.id,
          device_id: device.id,
          duration: parseInt(formData.duration),
          amount: amount,
          status: "pending",
          payment_status: "pending"
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      toast.success("Request submitted! Please proceed to payment.");
      navigate("/payment", { state: { sessionId: session.id, amount } });
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to submit request");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-gaming relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-16 h-16 bg-accent rounded-full opacity-20 animate-bounce-slow"></div>
        <div className="absolute bottom-20 right-20 w-20 h-20 bg-secondary rounded-full opacity-20 animate-bounce-slow" style={{ animationDelay: "0.5s" }}></div>
        <div className="absolute top-40 right-40 w-12 h-12 bg-primary rounded-full opacity-20 animate-bounce-slow" style={{ animationDelay: "1s" }}></div>
      </div>

      <Card className="w-full max-w-md shadow-mario relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Lock className="w-16 h-16 text-primary animate-pulse-glow" />
              <Gamepad2 className="w-8 h-8 text-secondary absolute -bottom-2 -right-2" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl bg-gradient-to-r from-primary via-info to-secondary bg-clip-text text-transparent">
              Mario Gaming Centre
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Console Locked - Enter Details to Start Session
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deviceId">Select Device</Label>
              <Select
                value={formData.deviceId}
                onValueChange={(value) => setFormData({ ...formData, deviceId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose your console/PC" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONSOLE-01">Console 1</SelectItem>
                  <SelectItem value="CONSOLE-02">Console 2</SelectItem>
                  <SelectItem value="PC-01">PC 1</SelectItem>
                  <SelectItem value="PC-02">PC 2</SelectItem>
                  <SelectItem value="PC-03">PC 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="10-digit phone number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                required
                maxLength={10}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address (Optional)</Label>
              <Input
                id="address"
                placeholder="Enter your address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Session Duration</Label>
              <Select
                value={formData.duration}
                onValueChange={(value) => setFormData({ ...formData, duration: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 shadow-mario transition-all hover:scale-105"
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Console;
