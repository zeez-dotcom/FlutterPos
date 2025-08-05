import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClothingItem, LaundryService, insertClothingItemSchema, insertLaundryServiceSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";

export function InventoryManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isClothingModalOpen, setIsClothingModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingClothing, setEditingClothing] = useState<ClothingItem | null>(null);
  const [editingService, setEditingService] = useState<LaundryService | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { language } = useTranslation();

  // Fetch clothing items
  const { data: clothingItems = [] } = useQuery({
    queryKey: ["/api/clothing-items"],
    queryFn: async () => {
      const response = await fetch("/api/clothing-items");
      return response.json();
    }
  }) as { data: ClothingItem[] };

  // Fetch laundry services
  const { data: services = [] } = useQuery({
    queryKey: ["/api/laundry-services"],
    queryFn: async () => {
      const response = await fetch("/api/laundry-services");
      return response.json();
    }
  }) as { data: LaundryService[] };

  // Forms
  const clothingForm = useForm({
    resolver: zodResolver(insertClothingItemSchema),
    defaultValues: {
      name: "",
      nameAr: "",
      description: "",
      categoryId: "",
      imageUrl: ""
    }
  });

  const serviceForm = useForm({
    resolver: zodResolver(insertLaundryServiceSchema),
    defaultValues: {
      name: "",
      nameAr: "",
      description: "",
      price: "",
      categoryId: ""
    }
  });

  // Mutations for clothing items
  const createClothingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/clothing-items", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clothing-items"] });
      setIsClothingModalOpen(false);
      clothingForm.reset();
      toast({ title: "Clothing item created successfully" });
    }
  });

  const updateClothingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const response = await apiRequest("PUT", `/api/clothing-items/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clothing-items"] });
      setIsClothingModalOpen(false);
      setEditingClothing(null);
      clothingForm.reset();
      toast({ title: "Clothing item updated successfully" });
    }
  });

  // Mutations for services
  const createServiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/laundry-services", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/laundry-services"] });
      setIsServiceModalOpen(false);
      serviceForm.reset();
      toast({ title: "Service created successfully" });
    }
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const response = await apiRequest("PUT", `/api/laundry-services/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/laundry-services"] });
      setIsServiceModalOpen(false);
      setEditingService(null);
      serviceForm.reset();
      toast({ title: "Service updated successfully" });
    }
  });

  const handleClothingSubmit = (data: any) => {
    if (editingClothing) {
      updateClothingMutation.mutate({ id: editingClothing.id, data });
    } else {
      createClothingMutation.mutate(data);
    }
  };

  const handleServiceSubmit = (data: any) => {
    if (editingService) {
      updateServiceMutation.mutate({ id: editingService.id, data });
    } else {
      createServiceMutation.mutate(data);
    }
  };

  const handleEditClothing = (item: ClothingItem) => {
    setEditingClothing(item);
    clothingForm.reset({
      name: item.name,
      nameAr: item.nameAr || "",
      description: item.description || "",
      categoryId: item.categoryId,
      imageUrl: item.imageUrl || ""
    });
    setIsClothingModalOpen(true);
  };

  const handleEditService = (service: LaundryService) => {
    setEditingService(service);
    serviceForm.reset({
      name: service.name,
      nameAr: service.nameAr || "",
      description: service.description || "",
      price: service.price,
      categoryId: service.categoryId
    });
    setIsServiceModalOpen(true);
  };

  // Filter items based on search
  const filteredClothing = clothingItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.nameAr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.categoryId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.nameAr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.categoryId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 bg-pos-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-pos-primary" />
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          </div>
          
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search items and services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs defaultValue="clothing" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="clothing">Clothing Items</TabsTrigger>
            <TabsTrigger value="services">Laundry Services</TabsTrigger>
          </TabsList>

          <TabsContent value="clothing" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Clothing Items ({filteredClothing.length})</h2>
              <Dialog open={isClothingModalOpen} onOpenChange={setIsClothingModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-pos-primary hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Clothing Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingClothing ? "Edit Clothing Item" : "Add New Clothing Item"}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...clothingForm}>
                    <form onSubmit={clothingForm.handleSubmit(handleClothingSubmit)} className="space-y-4">
                      <FormField
                        control={clothingForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Pants, Shirt" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={clothingForm.control}
                        name="nameAr"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Arabic Name</FormLabel>
                            <FormControl>
                              <Input placeholder="الاسم بالعربي" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={clothingForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Brief description..." {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={clothingForm.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pants">Pants</SelectItem>
                                <SelectItem value="shirts">Shirts</SelectItem>
                                <SelectItem value="traditional">Traditional</SelectItem>
                                <SelectItem value="dresses">Dresses</SelectItem>
                                <SelectItem value="formal">Formal</SelectItem>
                                <SelectItem value="linens">Linens</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={clothingForm.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Image URL (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="https://..." {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full bg-pos-secondary hover:bg-green-600">
                        {editingClothing ? "Update Item" : "Create Item"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClothing.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{language === 'ar' && item.nameAr ? item.nameAr : item.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded capitalize">
                          {item.categoryId}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClothing(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Laundry Services ({filteredServices.length})</h2>
              <Dialog open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-pos-primary hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingService ? "Edit Service" : "Add New Service"}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...serviceForm}>
                    <form onSubmit={serviceForm.handleSubmit(handleServiceSubmit)} className="space-y-4">
                      <FormField
                        control={serviceForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Service Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Wash & Fold" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={serviceForm.control}
                        name="nameAr"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Arabic Name</FormLabel>
                            <FormControl>
                              <Input placeholder="اسم الخدمة بالعربي" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={serviceForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Service description..." {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={serviceForm.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price ($)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0.00" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={serviceForm.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="basic">Basic</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                                <SelectItem value="specialty">Specialty</SelectItem>
                                <SelectItem value="express">Express</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full bg-pos-secondary hover:bg-green-600">
                        {editingService ? "Update Service" : "Create Service"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((service) => (
                <Card key={service.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{language === 'ar' && service.nameAr ? service.nameAr : service.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-pos-primary">
                            ${parseFloat(service.price).toFixed(2)}
                          </span>
                          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded capitalize">
                            {service.categoryId}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditService(service)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}