import { Shirt, Store, User, LogOut, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface POSHeaderProps {
  cartItemCount?: number;
  onToggleCart?: () => void;
}

export function POSHeader({ cartItemCount = 0, onToggleCart }: POSHeaderProps) {
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
            
            {/* Cart Button */}
            <Button 
              variant="ghost" 
              size="sm"
              className="relative p-2 hover:bg-blue-700 text-white hover:text-white flex items-center space-x-2"
              onClick={onToggleCart}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Button>
            
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
