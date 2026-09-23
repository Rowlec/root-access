import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="grid min-h-svh place-items-center px-5 py-10">
      <SignUp
        fallbackRedirectUrl="/app"
        forceRedirectUrl="/app"
        routing="hash"
        signInUrl="/sign-in"
      />
    </main>
  );
}
