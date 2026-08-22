import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import OrderReceiptClient from "@/app/components/OrderReceiptClient";
import { getSession } from "@/app/lib/session";
import { getOrderById } from "@/app/actions/orders";
import { getCustomers } from "@/app/actions/customers";
import { getMerchant } from "@/app/actions/merchant";
import { getDictionary, isValidLocale, type Locale } from "@/app/lib/i18n";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  if (!isValidLocale(lang)) notFound();
  const t = await getDictionary(lang as Locale);

  const session = await getSession();
  if (!session) redirect(`/${lang}`);

  const [order, customers, merchant] = await Promise.all([
    getOrderById(id),
    getCustomers(),
    getMerchant(),
  ]);

  if (!order) redirect(`/${lang}/orders`);

  return (
    <div className="bg-[#f8f9fa] text-[#191c1d] min-h-screen flex flex-col">
      <header className="flex items-center w-full px-6 pt-10 pb-6 bg-[#18181b] text-white sticky top-0 z-40 shadow-lg border-b border-zinc-800/50 print:hidden">
        <Link
          href={`/${lang}/orders`}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-white transition-colors border border-zinc-700/40"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </Link>
        <h1 className="ml-4 text-xl font-bold tracking-tight">{t.orders.receiptTitle}</h1>
      </header>

      <main className="flex-grow px-6 pt-6 pb-10">
        <OrderReceiptClient
          order={order}
          customers={customers}
          merchantName={merchant?.merchant_name}
          shopName={merchant?.shop_name}
          t={t.orders}
        />
      </main>
    </div>
  );
}
