import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) redirect("/");

  return (
    <div className="flex justify-center py-10">
      <AuthForm initialMode="register" />
    </div>
  );
}