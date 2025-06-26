import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [isLoading, setIsLoading] = useState(false);
  const [localEmail, setLocalEmail] = useState("");
  const [localPassword, setLocalPassword] = useState("");
  const { toast } = useToast();

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      window.location.href = '/api/login';
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/local/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: localEmail,
          password: localPassword
        }),
        credentials: 'include'
      });

      if (response.ok) {
        window.location.href = '/';
      } else {
        const error = await response.json();
        toast({
          title: "Login Failed",
          description: error.message || "Invalid email or password",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Local login error:', error);
      toast({
        title: "Login Failed", 
        description: "An error occurred during login",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <GraduationCap className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to Amazech Training</CardTitle>
          <CardDescription>
            Sign in to access your personalized training dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="local" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="local">Employee Login</TabsTrigger>
              <TabsTrigger value="replit">Replit Auth</TabsTrigger>
            </TabsList>
            
            <TabsContent value="replit" className="space-y-4">
              <Button 
                onClick={handleSignIn}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? "Signing in..." : "Sign in with Replit"}
              </Button>
            </TabsContent>
            
            <TabsContent value="local" className="space-y-4">
              <div className="text-center text-sm text-blue-600 bg-blue-50 p-3 rounded-lg mb-4">
                💡 Demo credentials:<br/>
                Admin: parth.b@amazech.com / admin123<br/>
                Employee: pbhingarde95@gmail.com / employee123
              </div>
              <form onSubmit={handleLocalLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={localEmail}
                    onChange={(e) => setLocalEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={localPassword}
                    onChange={(e) => setLocalPassword(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
