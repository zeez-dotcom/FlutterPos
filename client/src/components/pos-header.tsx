import { Shirt, Store, User, LogOut, ShoppingCart, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "@/context/AuthContext";
import defaultLogo from "@/assets/logo.png";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LanguageSelector } from "@/components/language-selector";
import { Link } from "wouter";
import { useTranslation } from "@/lib/i18n";

interface POSHeaderProps {
  cartItemCount?: number;
  onToggleCart?: () => void;
}

export function POSHeader({ cartItemCount = 0, onToggleCart }: POSHeaderProps) {
  const { user, branch } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/logout");
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: t.logoutSuccess });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      toast({
        title: t.logoutFailed,
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
              src={branch?.logoUrl || defaultLogo}
              alt={t.laundryManagementSystem}
              className="w-8 h-8 object-cover rounded"
            />
            <h1 className="text-xl font-medium">{t.laundryManagementSystem}</h1>
          </div>
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-2 text-sm">
              <Store className="h-4 w-4" />
              <span>{branch?.name || t.mainStore}</span>
            </div>
            
            {/* Cart Button */}
            <Button 
              variant="ghost" 
              size="sm"
              className="relative p-2 hover:bg-blue-700 text-white hover:text-white flex items-center space-x-2"
              onClick={onToggleCart}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">{t.cart}</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Button>
            
            {/* Language Selector */}
            <LanguageSelector />
            
            {/* Admin Access */}
            {user &&
              (user.role === 'admin' ||
                user.role === 'super_admin' ||
                user.role === 'delivery_admin') && (
              <Link href="/admin">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-blue-700 text-white hover:text-white flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.admin}</span>
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
