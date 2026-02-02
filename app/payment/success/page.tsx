import PaymentSuccess from "@/components/membership/PaymentSuccess";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    paymentKey?: string;
    orderId?: string;
    amount?: string;
    userId?: string;
    interval?: string;
  }>;
}) {
  const params = await searchParams;
  return (
    <PaymentSuccess
      paymentKey={params.paymentKey ?? ""}
      orderId={params.orderId ?? ""}
      amount={Number(params.amount ?? "0")}
      userId={params.userId ?? ""}
      interval={params.interval ?? "monthly"}
    />
  );
}
