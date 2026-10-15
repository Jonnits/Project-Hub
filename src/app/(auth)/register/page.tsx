import { Suspense } from "react";

import { AuthChrome } from "@/components/auth-chrome";
import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
  return (
    <AuthChrome
      title="Create an account"
      subtitle="New accounts start empty. Create a project, or open a share link after you register."
    >
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <RegisterForm />
      </Suspense>
    </AuthChrome>
  );
}
