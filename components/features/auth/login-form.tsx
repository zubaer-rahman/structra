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
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
            Sign In
          </CardTitle>
          <CardDescription className="text-base text-gray-600">
            Access your account
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
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
              <p className="text-sm text-gray-600">
                No account?{" "}
                <Link
                  href="/register"
                  className="text-orange-600 hover:text-orange-700 font-medium transition-colors duration-200"
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
