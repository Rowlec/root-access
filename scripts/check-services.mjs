import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const required = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "ADMIN_USER_IDS",
  "GEMINI_API_KEY",
];
const optionalForBilling = [
  "PAYOS_CLIENT_ID",
  "PAYOS_API_KEY",
  "PAYOS_CHECKSUM_KEY",
];
const missingRequired = required.filter((key) => !process.env[key]);
const missingBilling = optionalForBilling.filter((key) => !process.env[key]);

console.log(`Core environment: ${missingRequired.length ? "incomplete" : "configured"}`);
console.log(`Billing environment: ${missingBilling.length ? "incomplete" : "configured"}`);
console.log(`Site URL: ${process.env.NEXT_PUBLIC_SITE_URL ? "configured" : "missing"}`);

if (missingRequired.length) {
  console.error(`Missing core variables: ${missingRequired.join(", ")}`);
  process.exitCode = 1;
}

if (process.env.CLERK_SECRET_KEY) {
  try {
    const response = await fetch("https://api.clerk.com/v1/users?limit=1", {
      headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
    });
    console.log(`Clerk API: ${response.ok ? "reachable" : `failed (${response.status})`}`);
    if (!response.ok) process.exitCode = 1;
  } catch (error) {
    console.error(
      `Clerk API: failed (${error instanceof Error ? error.message : "network error"})`,
    );
    process.exitCode = 1;
  }
}

if (process.env.GEMINI_API_KEY) {
  try {
    const model = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}?key=${process.env.GEMINI_API_KEY}`,
    );
    console.log(`Gemini API: ${response.ok ? "reachable" : `failed (${response.status})`}`);
    if (!response.ok) process.exitCode = 1;
  } catch (error) {
    console.error(
      `Gemini API: failed (${error instanceof Error ? error.message : "network error"})`,
    );
    process.exitCode = 1;
  }
}

if (missingBilling.length) {
  console.log(`Billing disabled until configured: ${missingBilling.join(", ")}`);
}
