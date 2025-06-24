import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { 
  Settings as SettingsIcon,
  Mail,
  Bell,
  Shield,
  Database,
  Bot,
  Save,
  Key,
  Palette,
  LogOut
} from "lucide-react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();
  const { user } = useAuth();

  const getUserInitials = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "Unknown User";
  };

  // General Settings State
  const [platformName, setPlatformName] = useState("Amazech Training Platform");
  const [welcomeMessage, setWelcomeMessage] = useState("Welcome to our comprehensive training platform");
  const [maxFileSize, setMaxFileSize] = useState("100");
  const [autoGenerateQuiz, setAutoGenerateQuiz] = useState(true);

  // Email Template State
  const [assignmentEmailSubject, setAssignmentEmailSubject] = useState("New Training Module Assigned");
  const [assignmentEmailBody, setAssignmentEmailBody] = useState(
    "Hello {{user_name}},\n\nYou have been assigned a new training module: {{module_title}}\n\nPlease complete it by {{due_date}}.\n\nBest regards,\nTraining Team"
  );
  const [reminderEmailSubject, setReminderEmailSubject] = useState("Training Reminder");
  const [reminderEmailBody, setReminderEmailBody] = useState(
    "Hello {{user_name}},\n\nThis is a reminder that you have pending training modules to complete.\n\nPlease log in to the platform to continue your learning.\n\nBest regards,\nTraining Team"
  );

  // Notification Settings State
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [assignmentReminders, setAssignmentReminders] = useState(true);

  // AI Settings State
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [chatbotEnabled, setChatbotEnabled] = useState(true);
  const [autoContentAnalysis, setAutoContentAnalysis] = useState(true);
  const [quizGenerationEnabled, setQuizGenerationEnabled] = useState(true);

  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      // In a real app, this would save to the backend
      console.log("Saving settings:", settings);
      return Promise.resolve();
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Save failed",
        description: "There was an error saving your settings.",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    const settings = {
      general: {
        platformName,
        welcomeMessage,
        maxFileSize: parseInt(maxFileSize),
        autoGenerateQuiz,
      },
      email: {
        assignmentEmailSubject,
        assignmentEmailBody,
        reminderEmailSubject,
        reminderEmailBody,
      },
      notifications: {
        emailNotifications,
        pushNotifications,
        weeklyReports,
        assignmentReminders,
      },
      ai: {
        openaiApiKey,
        chatbotEnabled,
        autoContentAnalysis,
        quizGenerationEnabled,
      },
    };

    saveSettingsMutation.mutate(settings);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-neutral-dark">Settings</h3>
        <p className="text-neutral-medium">Platform configuration and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="general">Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>User Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.profileImageUrl} alt={getUserDisplayName(user)} />
                  <AvatarFallback className="text-lg">
                    {getUserInitials(user)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{getUserDisplayName(user)}</h3>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <Badge variant="secondary" className="mt-1">
                    {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User"}
                  </Badge>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first-name">First Name</Label>
                    <Input
                      id="first-name"
                      value={user?.firstName || ""}
                      placeholder="Enter first name"
                      disabled
                    />
                  </div>
                  <div>
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input
                      id="last-name"
                      value={user?.lastName || ""}
                      placeholder="Enter last name"
                      disabled
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                  />
                </div>
                
                <div className="pt-4">
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = "/api/logout"}
                    className="w-full"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Platform Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="platform-name">Platform Name</Label>
                <Input
                  id="platform-name"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  placeholder="Enter platform name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcome-message">Welcome Message</Label>
                <Textarea
                  id="welcome-message"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Enter welcome message"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-file-size">Maximum File Size (MB)</Label>
                <Select value={maxFileSize} onValueChange={setMaxFileSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select file size limit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50 MB</SelectItem>
                    <SelectItem value="100">100 MB</SelectItem>
                    <SelectItem value="200">200 MB</SelectItem>
                    <SelectItem value="500">500 MB</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-generate Quiz Questions</Label>
                  <p className="text-sm text-neutral-medium">
                    Automatically generate quiz questions when new content is uploaded
                  </p>
                </div>
                <Switch
                  checked={autoGenerateQuiz}
                  onCheckedChange={setAutoGenerateQuiz}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <p className="text-neutral-medium">
                Customize email templates sent to users. Use variables like {{user_name}}, {{module_title}}, {{due_date}}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-neutral-dark">Assignment Notification</h4>
                <div className="space-y-2">
                  <Label htmlFor="assignment-subject">Subject Line</Label>
                  <Input
                    id="assignment-subject"
                    value={assignmentEmailSubject}
                    onChange={(e) => setAssignmentEmailSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignment-body">Email Body</Label>
                  <Textarea
                    id="assignment-body"
                    value={assignmentEmailBody}
                    onChange={(e) => setAssignmentEmailBody(e.target.value)}
                    rows={6}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-neutral-dark">Reminder Email</h4>
                <div className="space-y-2">
                  <Label htmlFor="reminder-subject">Subject Line</Label>
                  <Input
                    id="reminder-subject"
                    value={reminderEmailSubject}
                    onChange={(e) => setReminderEmailSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reminder-body">Email Body</Label>
                  <Textarea
                    id="reminder-body"
                    value={reminderEmailBody}
                    onChange={(e) => setReminderEmailBody(e.target.value)}
                    rows={6}
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Available Variables:</strong> {{user_name}}, {{module_title}}, {{due_date}}, {{platform_name}}, {{completion_rate}}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-neutral-medium">
                    Send email notifications for important events
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-neutral-medium">
                    Send browser push notifications
                  </p>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Reports</Label>
                  <p className="text-sm text-neutral-medium">
                    Send weekly training progress reports to managers
                  </p>
                </div>
                <Switch
                  checked={weeklyReports}
                  onCheckedChange={setWeeklyReports}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Assignment Reminders</Label>
                  <p className="text-sm text-neutral-medium">
                    Send reminders for overdue assignments
                  </p>
                </div>
                <Switch
                  checked={assignmentReminders}
                  onCheckedChange={setAssignmentReminders}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI & Automation Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="openai-key">OpenAI API Key</Label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Input
                      id="openai-key"
                      type="password"
                      value={openaiApiKey}
                      onChange={(e) => setOpenaiApiKey(e.target.value)}
                      placeholder="sk-..."
                    />
                    <Key className="absolute right-3 top-3 h-4 w-4 text-neutral-medium" />
                  </div>
                  <Button variant="outline" size="sm">
                    Test
                  </Button>
                </div>
                <p className="text-sm text-neutral-medium">
                  Required for AI-powered content analysis and chatbot functionality
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>AmazeBot Chatbot</Label>
                  <p className="text-sm text-neutral-medium">
                    Enable the AI-powered training assistant
                  </p>
                </div>
                <Switch
                  checked={chatbotEnabled}
                  onCheckedChange={setChatbotEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Automatic Content Analysis</Label>
                  <p className="text-sm text-neutral-medium">
                    Automatically analyze uploaded content for key topics and summaries
                  </p>
                </div>
                <Switch
                  checked={autoContentAnalysis}
                  onCheckedChange={setAutoContentAnalysis}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Quiz Generation</Label>
                  <p className="text-sm text-neutral-medium">
                    Automatically generate quiz questions from training content
                  </p>
                </div>
                <Switch
                  checked={quizGenerationEnabled}
                  onCheckedChange={setQuizGenerationEnabled}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-neutral-medium">
                      Require 2FA for admin and trainer accounts
                    </p>
                  </div>
                  <Switch defaultChecked={false} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Session Timeout</Label>
                    <p className="text-sm text-neutral-medium">
                      Automatically log out inactive users
                    </p>
                  </div>
                  <Select defaultValue="24">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="8">8 hours</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                      <SelectItem value="168">1 week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Password Policy</Label>
                    <p className="text-sm text-neutral-medium">
                      Enforce strong password requirements
                    </p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-neutral-dark">Data & Privacy</h4>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Data Retention</Label>
                    <p className="text-sm text-neutral-medium">
                      Automatically delete old user data
                    </p>
                  </div>
                  <Select defaultValue="never">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="1095">3 years</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Audit Logging</Label>
                    <p className="text-sm text-neutral-medium">
                      Track all administrative actions
                    </p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button
          onClick={handleSaveSettings}
          disabled={saveSettingsMutation.isPending}
          className="bg-primary hover:bg-primary-dark"
        >
          <Save className="h-4 w-4 mr-2" />
          {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
