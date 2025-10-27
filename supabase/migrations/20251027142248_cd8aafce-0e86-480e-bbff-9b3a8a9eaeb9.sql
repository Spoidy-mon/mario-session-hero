-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create devices table
CREATE TABLE public.devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'unlocked')),
  current_session_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sessions table
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  payment_method TEXT CHECK (payment_method IN ('online', 'cash')),
  amount DECIMAL(10, 2) NOT NULL,
  otp TEXT,
  otp_expires_at TIMESTAMP WITH TIME ZONE,
  otp_attempts INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'completed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is an internal gaming center system)
CREATE POLICY "Allow public read access to customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Allow public insert customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update customers" ON public.customers FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to devices" ON public.devices FOR SELECT USING (true);
CREATE POLICY "Allow public insert devices" ON public.devices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update devices" ON public.devices FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to sessions" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert sessions" ON public.sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update sessions" ON public.sessions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete sessions" ON public.sessions FOR DELETE USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_sessions_updated_at
BEFORE UPDATE ON public.sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample devices
INSERT INTO public.devices (device_id, name, status) VALUES
  ('CONSOLE-01', 'Console 1', 'locked'),
  ('CONSOLE-02', 'Console 2', 'locked'),
  ('PC-01', 'PC 1', 'locked'),
  ('PC-02', 'PC 2', 'locked'),
  ('PC-03', 'PC 3', 'locked');