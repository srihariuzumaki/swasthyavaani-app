import { Link, useLocation } from "react-router-dom";
import { Home, Activity, Bell, User, HelpCircle } from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: Activity, label: "Symptoms", path: "/symptoms" },
  { icon: Bell, label: "Reminders", path: "/reminders" },
  { icon: User, label: "Profile", path: "/profile" },
  { icon: HelpCircle, label: "Help", path: "/help" },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon 
                className={`w-5 h-5 transition-transform ${
                  isActive ? "scale-110" : ""
                }`} 
              />
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 w-12 h-1 bg-gradient-to-r from-primary to-secondary rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
