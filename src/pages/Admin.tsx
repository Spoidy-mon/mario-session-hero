import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, CheckCircle, XCircle, Clock, Users, Monitor } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Session {
  id: string;
  customer_id: string;
  device_id: string;
  duration: number;
  amount: number;
  payment_status: string;
  payment_method: string;
  status: string;
  start_time: string;
  end_time: string;
  created_at: string;
  customers: {
    name: string;
    phone: string;
    address: string;
  };
  devices: {
    device_id: string;
    name: string;
    status: string;
  };
}

const Admin = () => {
  const navigate = useNavigate();
  const [pendingSessions, setPendingSessions] = useState<Session[]>([]);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSessions();
    
    // Real-time subscription for new sessions
    const channel = supabase
      .channel('session-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions'
        },
        () => {
          loadSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select(`
          *,
          customers (*),
          devices (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPendingSessions(data?.filter(s => s.status === 'pending') || []);
      setActiveSessions(data?.filter(s => s.status === 'active') || []);
    } catch (error: any) {
      console.error("Error loading sessions:", error);
      toast.error("Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  };

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleApprove = async (sessionId: string) => {
    try {
      const otp = generateOTP();
      const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

      await supabase
        .from("sessions")
        .update({
          status: "approved",
          otp: otp,
          otp_expires_at: otpExpiresAt.toISOString()
        })
        .eq("id", sessionId);

      toast.success(`Session approved! OTP: ${otp} (Valid for 5 minutes)`, {
        duration: 10000,
      });
      loadSessions();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Failed to approve session");
    }
  };

  const handleReject = async (sessionId: string) => {
    try {
      await supabase
        .from("sessions")
        .update({ status: "rejected" })
        .eq("id", sessionId);

      toast.success("Session rejected");
      loadSessions();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Failed to reject session");
    }
  };

  const handleEndSession = async (sessionId: string, deviceId: string) => {
    try {
      await supabase
        .from("sessions")
        .update({ status: "completed" })
        .eq("id", sessionId);

      await supabase
        .from("devices")
        .update({
          status: "locked",
          current_session_id: null
        })
        .eq("id", deviceId);

      toast.success("Session ended and device locked");
      loadSessions();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Failed to end session");
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-accent text-accent-foreground",
      approved: "bg-info text-info-foreground",
      active: "bg-secondary text-secondary-foreground",
      completed: "bg-muted text-muted-foreground",
      rejected: "bg-destructive text-destructive-foreground"
    };
    return colors[status] || "bg-muted";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="shadow-mario">
          <CardHeader className="bg-gradient-mario text-primary-foreground">
            <div className="flex items-center gap-4">
              <Shield className="w-12 h-12" />
              <div>
                <CardTitle className="text-3xl">Admin Dashboard</CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  Mario Gaming Centre Management System
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{pendingSessions.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Users className="w-4 h-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{activeSessions.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Available Devices</CardTitle>
              <Monitor className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {5 - activeSessions.length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">Pending Requests ({pendingSessions.length})</TabsTrigger>
            <TabsTrigger value="active">Active Sessions ({activeSessions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <ScrollArea className="h-[600px] rounded-lg border p-4">
              {isLoading ? (
                <p className="text-center text-muted-foreground">Loading...</p>
              ) : pendingSessions.length === 0 ? (
                <p className="text-center text-muted-foreground">No pending requests</p>
              ) : (
                <div className="space-y-4">
                  {pendingSessions.map((session) => (
                    <Card key={session.id} className="shadow-sm">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{session.customers?.name}</CardTitle>
                            <CardDescription>
                              Phone: {session.customers?.phone}
                              {session.customers?.address && ` • ${session.customers.address}`}
                            </CardDescription>
                          </div>
                          <Badge className={getStatusBadge(session.payment_status)}>
                            {session.payment_status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Device</p>
                            <p className="font-semibold">{session.devices?.name}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Duration</p>
                            <p className="font-semibold">{session.duration} minutes</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Amount</p>
                            <p className="font-semibold">${session.amount}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Payment Method</p>
                            <p className="font-semibold capitalize">{session.payment_method || 'N/A'}</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApprove(session.id)}
                            className="flex-1 bg-secondary hover:bg-secondary/90"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve & Send OTP
                          </Button>
                          <Button
                            onClick={() => handleReject(session.id)}
                            variant="destructive"
                            className="flex-1"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <ScrollArea className="h-[600px] rounded-lg border p-4">
              {isLoading ? (
                <p className="text-center text-muted-foreground">Loading...</p>
              ) : activeSessions.length === 0 ? (
                <p className="text-center text-muted-foreground">No active sessions</p>
              ) : (
                <div className="space-y-4">
                  {activeSessions.map((session) => (
                    <Card key={session.id} className="shadow-sm border-secondary">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{session.customers?.name}</CardTitle>
                            <CardDescription>
                              Phone: {session.customers?.phone}
                            </CardDescription>
                          </div>
                          <Badge className="bg-secondary text-secondary-foreground">
                            Active
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Device</p>
                            <p className="font-semibold">{session.devices?.name}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Duration</p>
                            <p className="font-semibold">{session.duration} minutes</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Start Time</p>
                            <p className="font-semibold">
                              {new Date(session.start_time).toLocaleTimeString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">End Time</p>
                            <p className="font-semibold">
                              {new Date(session.end_time).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => handleEndSession(session.id, session.device_id)}
                          variant="destructive"
                          className="w-full"
                        >
                          End Session & Lock Device
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
