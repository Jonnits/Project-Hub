import { Suspense } from "react";

import { AuthChrome } from "@/components/auth-chrome";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <AuthChrome
      title="Sign in"
      subtitle="Your boards live on this machine and sync when you have a connection. Demo accounts share the sample workspace."
    >
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </AuthChrome>
  );
}
