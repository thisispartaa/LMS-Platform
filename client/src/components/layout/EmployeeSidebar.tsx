import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  BookOpen, 
  BarChart3, 
  Bot 
} from "lucide-react";
import amazechLogo from "@assets/amazech-solutions-squarelogo-1457021863749_1750857780985.png";

const employeeNavItems = [
  { name: "My Dashboard", href: "/", icon: LayoutDashboard },
  { name: "My Training", href: "/training", icon: BookOpen },
  { name: "My Progress", href: "/progress", icon: BarChart3 },
  { name: "AmazeBot", href: "/chat", icon: Bot },
];

export default function EmployeeSidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-neutral-light">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <img 
            src={amazechLogo} 
            alt="Amazech Logo" 
            className="h-10 w-10 object-contain"
          />
          <div>
            <h1 className="text-xl font-bold text-neutral-dark">AmazechUniversity</h1>
            <p className="text-sm text-neutral-medium">Learning Portal</p>
          </div>
        </div>
      </div>
      
      <nav className="px-4 pb-4">
        <ul className="space-y-2">
          {employeeNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <a className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    location === item.href
                      ? "bg-blue-50 text-blue-700"
                      : "text-neutral-dark hover:bg-neutral-light"
                  )}>
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}