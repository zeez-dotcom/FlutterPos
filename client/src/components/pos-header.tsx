import { Shirt, Store, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function POSHeader() {
  return (
    <header className="bg-pos-primary text-white shadow-material-lg sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Shirt className="text-2xl h-6 w-6" />
            <h1 className="text-xl font-medium">Laundry System</h1>
          </div>
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-2 text-sm">
              <Store className="h-4 w-4" />
              <span>Main Store</span>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-sm">
              <User className="h-4 w-4" />
              <span>Sarah Johnson</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              className="p-2 hover:bg-blue-700 text-white hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
