import { UserProfile } from "@clerk/nextjs";

export default function AccountPage() {
  return (
    <main className="mx-auto grid min-h-svh w-full max-w-5xl place-items-start px-5 py-8 sm:px-8 lg:px-10">
      <UserProfile routing="hash" />
    </main>
  );
}
