import { notFound, redirect } from "next/navigation";
import { getCustomer, getCustomerTransactions } from "@/app/actions/customers";
import { getDictionary, isValidLocale, type Locale } from "@/app/lib/i18n";
import CustomerDetailClient from "@/app/components/CustomerDetailClient";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  if (!isValidLocale(lang)) notFound();
  const t = await getDictionary(lang as Locale);

  const [customer, transactions] = await Promise.all([
    getCustomer(id),
    getCustomerTransactions(id),
  ]);

  if (!customer) redirect(`/${lang}/customers`);

  return (
    <CustomerDetailClient
      customer={customer}
      transactions={transactions}
      lang={lang}
      t={t.customers}
      debtDict={t.debt}
      paymentDict={t.payment}
      orderDict={t.order}
    />
  );
}
