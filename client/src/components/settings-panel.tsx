import { useState } from "react";
import { Settings, Save, User, DollarSign, Receipt, Bell, Shield, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { SecuritySettings } from "./security-settings";
import { ProfileSettings } from "./profile-settings";

export function SettingsPanel() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    // Business Settings
    businessName: "Main Store Laundry",
    address: "123 Business St, City, State 12345",
    phone: "(555) 123-4567",
    email: "info@mainstore.com",
    taxRate: "8.5",
    currency: "USD",
    
    // Receipt Settings
    receiptHeader: "Thank you for your business!",
    receiptFooter: "Visit us again soon",
    printLogo: true,
    
    // System Settings
    autoLogout: "30",
    enableNotifications: true,
    soundEffects: true,
    
    // Pricing Settings
    roundingMethod: "nearest",
    minimumOrder: "0",
    
    // Appearance
    theme: "light",
    primaryColor: "#3b82f6",
    compactMode: false
  });

  const { toast } = useToast();
  const { isAdmin, isSuperAdmin } = useAuth();
  const hasAdminAccess = isAdmin || isSuperAdmin;

  const handleSettingChange = (key: string, value: string | boolean | number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = () => {
    // In a real app, this would save to backend
    localStorage.setItem('laundrySettings', JSON.stringify(settings));
    toast({
      title: t.settingsSaved,
      description: t.preferencesUpdated
    });
  };

  const resetSettings = () => {
    localStorage.removeItem('laundrySettings');
    setSettings({
      businessName: "Main Store Laundry",
      address: "123 Business St, City, State 12345",
      phone: "(555) 123-4567",
      email: "info@mainstore.com",
      taxRate: "8.5",
      currency: "USD",
      receiptHeader: "Thank you for your business!",
      receiptFooter: "Visit us again soon",
      printLogo: true,
      autoLogout: "30",
      enableNotifications: true,
      soundEffects: true,
      roundingMethod: "nearest",
      minimumOrder: "0",
      theme: "light",
      primaryColor: "#3b82f6",
      compactMode: false
    });
    toast({
      title: t.settingsReset,
      description: t.settingsRestored
    });
  };

  return (
    <div className="flex-1 p-6 bg-pos-background">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Settings className="h-8 w-8 text-pos-primary" />
            <h1 className="text-3xl font-bold text-gray-900">{t.systemSettings}</h1>
          </div>

          <div className="flex space-x-3">
            <Button variant="outline" onClick={resetSettings}>
              {t.resetToDefaults}
            </Button>
            <Button onClick={saveSettings} className="bg-pos-secondary hover:bg-green-600">
              <Save className="h-4 w-4 mr-2" />
              {t.saveChanges}
            </Button>
          </div>
        </div>

        <Tabs
          defaultValue={hasAdminAccess ? "business" : "profile"}
          className="space-y-6"
        >
          <TabsList
            className={cn(
              "grid w-full",
              hasAdminAccess ? "grid-cols-7" : "grid-cols-3"
            )}
          >
            <TabsTrigger value="profile">{t.profile}</TabsTrigger>
            {hasAdminAccess && <TabsTrigger value="business">{t.business}</TabsTrigger>}
            {hasAdminAccess && <TabsTrigger value="receipts">{t.receipts}</TabsTrigger>}
            <TabsTrigger value="system">{t.system}</TabsTrigger>
            {hasAdminAccess && <TabsTrigger value="pricing">{t.pricing}</TabsTrigger>}
            <TabsTrigger value="appearance">{t.appearance}</TabsTrigger>
            {hasAdminAccess && <TabsTrigger value="security">{t.security}</TabsTrigger>}
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <ProfileSettings />
          </TabsContent>

          {hasAdminAccess && (
            <TabsContent value="business" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>{t.businessInformation}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">{t.businessNameLabel}</Label>
                      <Input
                        id="businessName"
                        value={settings.businessName}
                        onChange={(e) =>
                          handleSettingChange('businessName', e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t.phoneNumber}</Label>
                      <Input
                        id="phone"
                        value={settings.phone}
                        onChange={(e) =>
                          handleSettingChange('phone', e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">{t.businessAddress}</Label>
                    <Input
                      id="address"
                      value={settings.address}
                      onChange={(e) =>
                        handleSettingChange('address', e.target.value)
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">{t.emailAddress}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={settings.email}
                        onChange={(e) =>
                          handleSettingChange('email', e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">{t.currency}</Label>
                      <Select
                        value={settings.currency}
                        onValueChange={(value) =>
                          handleSettingChange('currency', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">{t.usDollar}</SelectItem>
                          <SelectItem value="EUR">{t.euro}</SelectItem>
                          <SelectItem value="GBP">{t.britishPound}</SelectItem>
                          <SelectItem value="CAD">{t.canadianDollar}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {hasAdminAccess && (
            <TabsContent value="receipts" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Receipt className="h-5 w-5" />
                    <span>{t.receiptConfiguration}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="receiptHeader">{t.receiptHeaderMessage}</Label>
                    <Input
                      id="receiptHeader"
                      value={settings.receiptHeader}
                      onChange={(e) =>
                        handleSettingChange('receiptHeader', e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receiptFooter">{t.receiptFooterMessage}</Label>
                    <Input
                      id="receiptFooter"
                      value={settings.receiptFooter}
                      onChange={(e) =>
                        handleSettingChange('receiptFooter', e.target.value)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t.printBusinessLogo}</Label>
                      <div className="text-sm text-gray-600">
                        {t.includeLogoPrintedReceipts}
                      </div>
                    </div>
                    <Switch
                      checked={settings.printLogo}
                      onCheckedChange={(checked) =>
                        handleSettingChange('printLogo', checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>{t.systemPreferences}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="autoLogout">{t.autoLogoutMinutes}</Label>
                    <Select 
                      value={settings.autoLogout} 
                      onValueChange={(value) => handleSettingChange('autoLogout', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">{t.minutes15}</SelectItem>
                        <SelectItem value="30">{t.minutes30}</SelectItem>
                        <SelectItem value="60">{t.oneHour}</SelectItem>
                        <SelectItem value="120">{t.twoHours}</SelectItem>
                        <SelectItem value="never">{t.never}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t.enableNotifications}</Label>
                      <div className="text-sm text-gray-600">{t.showSystemNotificationsAlerts}</div>
                    </div>
                    <Switch
                      checked={settings.enableNotifications}
                      onCheckedChange={(checked) => handleSettingChange('enableNotifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t.soundEffects}</Label>
                      <div className="text-sm text-gray-600">{t.playSoundsForClicks}</div>
                    </div>
                    <Switch
                      checked={settings.soundEffects}
                      onCheckedChange={(checked) => handleSettingChange('soundEffects', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {hasAdminAccess && (
            <TabsContent value="pricing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>{t.pricingTaxSettings}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="taxRate">{t.taxRate}</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        step="0.1"
                        value={settings.taxRate}
                        onChange={(e) =>
                          handleSettingChange('taxRate', e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="minimumOrder">{t.minimumOrderAmount}</Label>
                      <Input
                        id="minimumOrder"
                        type="number"
                        step="0.01"
                        value={settings.minimumOrder}
                        onChange={(e) =>
                          handleSettingChange('minimumOrder', e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t.priceRoundingMethod}</Label>
                    <Select
                      value={settings.roundingMethod}
                      onValueChange={(value) =>
                        handleSettingChange('roundingMethod', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nearest">{t.roundToNearestCent}</SelectItem>
                        <SelectItem value="up">{t.alwaysRoundUp}</SelectItem>
                        <SelectItem value="down">{t.alwaysRoundDown}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>{t.appearanceSettings}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t.theme}</Label>
                    <Select 
                      value={settings.theme} 
                      onValueChange={(value) => handleSettingChange('theme', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">{t.lightTheme}</SelectItem>
                        <SelectItem value="dark">{t.darkTheme}</SelectItem>
                        <SelectItem value="auto">{t.autoSystem}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">{t.primaryColor}</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        value={settings.primaryColor}
                        onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t.compactMode}</Label>
                    <div className="text-sm text-gray-600">{t.useSmallerSpacingFonts}</div>
                  </div>
                  <Switch
                    checked={settings.compactMode}
                    onCheckedChange={(checked) => handleSettingChange('compactMode', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {hasAdminAccess && (
            <TabsContent value="security" className="space-y-6">
              <SecuritySettings />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}