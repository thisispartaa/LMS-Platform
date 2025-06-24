import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-neutral-dark">Amazech Training Platform</h1>
              <p className="text-neutral-medium">
                Welcome to your comprehensive employee training platform with AI-powered content generation and chatbot assistance.
              </p>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={() => window.location.href = "/api/login"}
                className="w-full bg-primary hover:bg-primary-dark"
                size="lg"
              >
                Sign In to Continue
              </Button>
              
              <p className="text-xs text-neutral-medium">
                Access your training modules, take quizzes, and get help from AmazeBot.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
