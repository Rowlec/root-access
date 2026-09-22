export const creditPackages = {
  starter: {
    credits: 30,
    id: "starter",
    name: "Starter",
    priceVnd: 19_000,
  },
  pro: {
    credits: 80,
    id: "pro",
    name: "Pro",
    priceVnd: 39_000,
  },
} as const;

export type CreditPackageId = keyof typeof creditPackages;
