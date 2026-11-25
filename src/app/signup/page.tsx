import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <AuthShell titulo="Criar conta" descricao="Leva menos de um minuto.">
      <SignupForm />
    </AuthShell>
  );
}
