import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Upload,
  HelpCircle,
  Users,
  BarChart3,
  Settings,
  LogOut
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const baseNavigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Training Modules", href: "/modules", icon: BookOpen },
  ];

  const adminNavigation = [
    { name: "Upload Content", href: "/upload", icon: Upload },
    { name: "Quizzes", href: "/quiz", icon: HelpCircle },
    { name: "User Management", href: "/users", icon: Users },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
  ];

  const navigation = [
    ...baseNavigation,
    ...(user?.role === "admin" || user?.role === "trainer" ? adminNavigation : []),
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-dark">Amazech</h1>
            <p className="text-sm text-neutral-medium">Training Platform</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive
                    ? "text-primary bg-blue-50"
                    : "text-neutral-medium hover:text-primary hover:bg-gray-50"
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </a>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.firstName?.[0] || user?.email?.[0] || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-dark truncate">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user?.email || "User"
              }
            </p>
            <p className="text-xs text-neutral-medium truncate capitalize">
              {user?.role || "Employee"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-neutral-medium hover:text-neutral-dark"
          onClick={() => window.location.href = "/api/logout"}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
