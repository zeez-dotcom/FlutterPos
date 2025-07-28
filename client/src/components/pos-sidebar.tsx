import { ShoppingCart, Package, BarChart3, Settings, Users, Truck, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface POSSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function POSSidebar({ activeView, onViewChange }: POSSidebarProps) {
  const menuItems = [
    { id: "sales", label: "Sales", icon: ShoppingCart },
    { id: "customers", label: "Customers", icon: Users },
    { id: "orders", label: "Orders", icon: Truck },
    { id: "reports", label: "Reports", icon: TrendingUp },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  return (
    <nav className="hidden lg:flex flex-col w-64 bg-pos-surface shadow-material border-r border-gray-200">
      <div className="p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Navigation</h2>
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <li key={item.id}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start space-x-3 px-4 py-3 ${
                    isActive 
                      ? "bg-blue-50 text-pos-primary font-medium" 
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => onViewChange(item.id)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
