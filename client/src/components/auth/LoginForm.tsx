import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import logoUrl from "@/assets/logo.png";
import { useTranslation } from "@/lib/i18n";

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/login", credentials);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: t.loginSuccess,
        description: t.welcome,
      });
      // Force refresh the auth state
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
      onLoginSuccess?.();
    },
    onError: (error) => {
      toast({
        title: t.loginFailed,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: t.error,
        description: t.missingCredentials,
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoUrl} alt="Laundry Logo" className="w-16 h-16 object-cover rounded-lg" />
          </div>
          <CardTitle className="text-2xl">{t.loginTitle}</CardTitle>
          <CardDescription>{t.loginDescription}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t.usernameLabel}</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t.usernameLabel}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.passwordLabel}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordLabel}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? t.signingIn : t.loginButton}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}