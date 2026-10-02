"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthInput } from "@/components/shared/form-input";
import { LoadingSpinner } from "@/components/shared";
import { loginSchema, type LoginFormData } from "@/utils/validation";
import Link from "next/link";
import { DemoRoleLogin } from "./DemoRoleLogin";

interface LoginFormProps {
  onSubmit: (data: { email: string; password: string }) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export function LoginForm({
  onSubmit,
  isLoading = false,
  error,
}: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const onSubmitForm = async (data: LoginFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <Card className="w-full">
        <CardHeader className="text-center pb-5">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
            Sign In
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Access your account or explore the live platform
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          {/* Top Primary Action: 1-Click Interactive Demo */}
          <DemoRoleLogin />

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/70" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2.5 text-muted-foreground font-normal">
                Or continue with email &amp; password
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <AuthInput
              type="email"
              error={errors.email?.message}
              {...register("email")}
            />

            <AuthInput
              type="password"
              error={errors.password?.message}
              showPasswordToggle={true}
              {...register("password")}
            />

            <div className="text-right">
              <Link
                href="/reset-password"
                className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors duration-200"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-10 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={isLoading || isSubmitting}
            >
              {isLoading || isSubmitting ? (
                <LoadingSpinner 
                  inline 
                  size="sm" 
                  variant="white" 
                  text="Signing In..." 
                />
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
