import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center px-6 py-12">
          <div className="text-muted-foreground">Laster innloggingsside…</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
