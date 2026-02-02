import PricingPage from "@/components/membership/PricingPage";

export default async function Pricing({
  searchParams,
}: {
  searchParams: Promise<{ user?: string }>;
}) {
  const params = await searchParams;
  const userId = params.user ?? "4b2d8b80-222d-4783-a683-f1e96f1dbac3";

  return <PricingPage userId={userId} />;
}
