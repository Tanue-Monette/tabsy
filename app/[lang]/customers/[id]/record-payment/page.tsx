import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import RecordPaymentForm from "@/app/components/RecordPaymentForm";
import { getSession } from "@/app/lib/session";
import { getDictionary, isValidLocale, type Locale } from "@/app/lib/i18n";

export default async function RecordPaymentPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  if (!isValidLocale(lang)) notFound();
  const t = await getDictionary(lang as Locale);

  const session = await getSession();
  if (!session) redirect(`/${lang}`);

  return (
    <div className="bg-[#f8f9fa] min-h-screen flex flex-col">
      <header className="w-full px-6 pt-12 pb-6 flex items-center justify-between">
        <Link href={`/${lang}/customers/${id}`} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-[#e7e8e9] transition-colors">
          <span className="material-symbols-outlined text-[#191c1d]">arrow_back</span>
        </Link>
        <h1 className="text-[1.75rem] font-bold text-[#183524]">{t.payment.recordPayment}</h1>
        <div className="w-12" />
      </header>

      <RecordPaymentForm id={id} t={t.payment} />
    </div>
  );
}
