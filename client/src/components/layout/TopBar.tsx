import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Bell } from "lucide-react";
import { useLocation } from "wouter";

const pageConfig = {
  "/": {
    title: "Dashboard",
    subtitle: "Overview of training platform metrics"
  },
  "/modules": {
    title: "Training Modules",
    subtitle: "Manage and organize your training content"
  },
  "/upload": {
    title: "Upload Content",
    subtitle: "Upload files to create new training modules"
  },
  "/quizzes": {
    title: "Quiz Management",
    subtitle: "Create, edit, and manage quiz questions"
  },
  "/users": {
    title: "User Management",
    subtitle: "Manage users and assign training modules"
  },
  "/analytics": {
    title: "Analytics",
    subtitle: "Training performance and user analytics"
  },
  "/settings": {
    title: "Settings",
    subtitle: "Platform configuration and preferences"
  }
};

export default function TopBar() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  const currentPage = pageConfig[location as keyof typeof pageConfig] || {
    title: "Page",
    subtitle: "Content"
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-dark">{currentPage.title}</h2>
          <p className="text-neutral-medium">{currentPage.subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-medium" />
          </div>
          
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5 text-neutral-medium" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}
