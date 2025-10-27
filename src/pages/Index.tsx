import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, Shield, Monitor, Users } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-gaming relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-20 h-20 bg-accent rounded-full opacity-20 animate-bounce-slow"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-secondary rounded-full opacity-20 animate-bounce-slow" style={{ animationDelay: "0.5s" }}></div>
        <div className="absolute top-40 right-40 w-16 h-16 bg-primary rounded-full opacity-20 animate-bounce-slow" style={{ animationDelay: "1s" }}></div>
        <div className="absolute bottom-40 left-40 w-20 h-20 bg-info rounded-full opacity-20 animate-bounce-slow" style={{ animationDelay: "1.5s" }}></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        <div className="text-center space-y-6 mb-12 max-w-4xl">
          <div className="flex justify-center mb-6">
            <Gamepad2 className="w-24 h-24 text-primary animate-pulse-glow" />
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary via-info to-secondary bg-clip-text text-transparent">
            Mario Gaming Centre
          </h1>
          
          <p className="text-xl md:text-2xl text-foreground/80 max-w-2xl mx-auto">
            Welcome to the ultimate gaming experience! Manage sessions, payments, and unlock your console with ease.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
          <Card className="shadow-mario hover:scale-105 transition-transform cursor-pointer" onClick={() => navigate("/console")}>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Monitor className="w-12 h-12 text-primary" />
              </div>
              <CardTitle className="text-2xl">Customer Console</CardTitle>
              <CardDescription>
                Start a gaming session on your console or PC
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-primary hover:bg-primary/90 shadow-mario transition-all hover:scale-105">
                Access Console
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-mario hover:scale-105 transition-transform cursor-pointer" onClick={() => navigate("/admin")}>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Shield className="w-12 h-12 text-secondary" />
              </div>
              <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
              <CardDescription>
                Manage requests, sessions, and monitor devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-secondary hover:bg-secondary/90 shadow-mario transition-all hover:scale-105">
                Admin Login
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h3 className="font-bold text-lg">Easy Registration</h3>
            <p className="text-sm text-muted-foreground">
              Quick form to start your session
            </p>
          </div>

          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
                <Shield className="w-8 h-8 text-secondary" />
              </div>
            </div>
            <h3 className="font-bold text-lg">Secure OTP</h3>
            <p className="text-sm text-muted-foreground">
              Verify with one-time password
            </p>
          </div>

          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                <Gamepad2 className="w-8 h-8 text-accent" />
              </div>
            </div>
            <h3 className="font-bold text-lg">Auto Lock/Unlock</h3>
            <p className="text-sm text-muted-foreground">
              Seamless session management
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
