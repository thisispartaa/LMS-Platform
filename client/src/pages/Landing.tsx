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
              <h1 className="text-2xl font-bold text-neutral-dark">Amazech University</h1>
              <p className="text-neutral-medium">
                Welcome to your comprehensive employee training platform with AI-powered content generation and chatbot assistance.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-4">
                <p className="text-sm text-neutral-medium mb-4">Choose your access level:</p>
                <Button asChild size="lg" className="w-full bg-primary hover:bg-primary/90">
                  <a href="/api/login">
                    <GraduationCap className="mr-2 h-5 w-5" />
                    Login as Admin (parth.b@amazech.com)
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full">
                  <a href="/api/login">
                    <GraduationCap className="mr-2 h-5 w-5" />
                    Login as Employee (parth@catenate.io)
                  </a>
                </Button>
                
                <p className="text-xs text-neutral-medium">
                  Access your training modules, take quizzes, and get help from AmazeBot.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
