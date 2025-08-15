import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthContext } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { UserManager } from "@/components/admin/UserManager";
import { BranchManager } from "@/components/admin/BranchManager";
import { BulkUploadManager } from "@/components/admin/BulkUploadManager";
import { BranchDeliveryPage } from "@/components/admin/BranchDeliveryPage";
import { LogOut, Users, Tags, MapPin, ArrowLeft, Upload, QrCode } from "lucide-react";
import { Link } from "wouter";
import logoUrl from "@/assets/logo.png";

export default function AdminDashboard() {
  const { user, isSuperAdmin, isDeliveryAdmin } = useAuthContext();
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <img src={logoUrl} alt="Laundry Logo" className="w-8 h-8 object-cover rounded" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Laundry Management - Admin
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to POS
                </Button>
              </Link>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {user.firstName} {user.lastName} ({user.role})
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} disabled={logoutMutation.isPending}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage system settings, categories, users, and branches
          </p>
        </div>

        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList
            className={`grid w-full ${
              isSuperAdmin
                ? "grid-cols-5"
                : isDeliveryAdmin
                  ? "grid-cols-2"
                  : "grid-cols-1"
            }`}
          >
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Tags className="w-4 h-4" />
              Categories
            </TabsTrigger>
            {(isSuperAdmin || isDeliveryAdmin) && (
              <TabsTrigger value="delivery-qr" className="flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                Delivery QR
              </TabsTrigger>
            )}
            {isSuperAdmin && (
              <>
                <TabsTrigger value="branches" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Branches
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="bulk-upload" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Bulk Upload
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="categories" className="space-y-6">
            <CategoryManager />
          </TabsContent>

          {(isSuperAdmin || isDeliveryAdmin) && (
            <TabsContent value="delivery-qr" className="space-y-6">
              <BranchDeliveryPage />
            </TabsContent>
          )}

          {isSuperAdmin && (
            <TabsContent value="branches" className="space-y-6">
              <BranchManager />
            </TabsContent>
          )}

          {isSuperAdmin && (
            <TabsContent value="users" className="space-y-6">
              <UserManager />
            </TabsContent>
          )}

          {isSuperAdmin && (
            <TabsContent value="bulk-upload" className="space-y-6">
              <BulkUploadManager />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
