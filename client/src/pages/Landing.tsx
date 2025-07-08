import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, UserPlus, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignupMode, setIsSignupMode] = useState(false);
  
  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Signup form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");
  
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/local/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
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
      console.error('Login error:', error);
      toast({
        title: "Login Failed", 
        description: "An error occurred during login",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/local/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          role
        }),
        credentials: 'include'
      });

      if (response.ok) {
        toast({
          title: "Account Created",
          description: "Your account has been created successfully. Please log in.",
          variant: "default"
        });
        // Switch to login mode and clear signup form
        setIsSignupMode(false);
        setFirstName("");
        setLastName("");
        setRole("");
        // Keep email and password for convenience
      } else {
        const error = await response.json();
        toast({
          title: "Signup Failed",
          description: error.message || "Failed to create account",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Signup Failed", 
        description: "An error occurred during signup",
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
            {isSignupMode ? 
              "Create your account to get started with training" : 
              "Sign in to access your personalized training dashboard"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSignupMode ? (
            // Login Form
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit"
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                <LogIn className="mr-2 h-4 w-4" />
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setIsSignupMode(true)}
                  className="text-sm"
                >
                  Don't have an account? Sign up
                </Button>
              </div>
            </form>
          ) : (
            // Signup Form
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signupEmail">Email</Label>
                <Input
                  id="signupEmail"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signupPassword">Password</Label>
                <Input
                  id="signupPassword"
                  type="password"
                  placeholder="Create a password (min 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Account Type</Label>
                <Select value={role} onValueChange={setRole} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee - Access training assignments</SelectItem>
                    <SelectItem value="trainer">Trainer - Manage training content</SelectItem>
                    <SelectItem value="admin">Administrator - Full system access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                type="submit"
                disabled={isLoading || !role}
                className="w-full"
                size="lg"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setIsSignupMode(false)}
                  className="text-sm"
                >
                  Already have an account? Sign in
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
