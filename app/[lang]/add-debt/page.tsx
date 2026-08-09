import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AddDebtForm from "@/app/components/AddDebtForm";
import { getSession } from "@/app/lib/session";
import { getDictionary, isValidLocale, type Locale } from "@/app/lib/i18n";

export default async function AddDebtPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const t = await getDictionary(lang as Locale);

  const session = await getSession();
  if (!session) redirect(`/${lang}`);

  return (
    <div className="bg-[#f8f9fa] text-[#191c1d] min-h-screen flex flex-col">
      <header className="flex items-center w-full px-6 pt-12 pb-6 bg-gradient-to-b from-[#2f4c39] to-[#183524] text-white">
        <Link
          href={`/${lang}/customers`}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-all"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="ml-4 text-xl font-bold tracking-tight">{t.debt.newCustomerDebt}</h1>
      </header>

      <AddDebtForm lang={lang} t={t.debt} />
    </div>
  );
}
