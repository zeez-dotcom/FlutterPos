import { Shirt, Store, User, LogOut, ShoppingCart, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

interface POSHeaderProps {
  cartItemCount?: number;
  onToggleCart?: () => void;
}

export function POSHeader({ cartItemCount = 0, onToggleCart }: POSHeaderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/logout");
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Logged out successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-pos-primary text-white shadow-material-lg sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%2Fid%2FOIP.J1FnT7YsQoJUjS4LBElT7wHaHa%3Fpid%3DApi&f=1&ipt=5545e86aaec86b0fec9027bbad0987fd75958cd64b12cb0b558f87bdc7217f1a&ipo=images" 
              alt="Laundry Logo" 
              className="w-8 h-8 object-cover rounded" 
            />
            <h1 className="text-xl font-medium">Laundry Management System</h1>
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
            
            {/* Admin Access */}
            {user && (user.role === 'admin' || user.role === 'super_admin') && (
              <Link href="/admin">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="p-2 hover:bg-blue-700 text-white hover:text-white flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              </Link>
            )}
            
            <div className="hidden md:flex items-center space-x-2 text-sm">
              <User className="h-4 w-4" />
              <span>{user?.firstName} {user?.lastName}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              className="p-2 hover:bg-blue-700 text-white hover:text-white"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
