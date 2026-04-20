import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export const metadata = { title: "Sign in · NSMT" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/");

  const { error } = await searchParams;
  const errorCopy =
    error === "AccessDenied"
      ? "This dashboard is restricted to @nsmtsports.com accounts."
      : error
        ? "Sign-in failed. Try again."
        : null;

  return (
    <main className="login-shell">
      <div className="login-card">
        <div className="login-mark" aria-hidden="true">
          N
        </div>
        <h1 className="login-title">NSMT Dashboard</h1>
        <p className="login-sub">Restricted to nsmtsports.com accounts.</p>
        {errorCopy ? <p className="login-error">{errorCopy}</p> : null}
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button type="submit" className="login-btn">
            <span className="login-btn-g" aria-hidden="true">
              G
            </span>
            Sign in with Google
          </button>
        </form>
      </div>
    </main>
  );
}
