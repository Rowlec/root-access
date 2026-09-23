import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="grid min-h-svh place-items-center px-5 py-10">
      <SignIn
        fallbackRedirectUrl="/app"
        forceRedirectUrl="/app"
        routing="hash"
        signUpUrl="/sign-up"
      />
    </main>
  );
}
