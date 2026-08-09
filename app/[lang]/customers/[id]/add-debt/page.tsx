import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AddDebtCustomerForm from "@/app/components/AddDebtCustomerForm";
import { getSession } from "@/app/lib/session";
import { getDictionary, isValidLocale, type Locale } from "@/app/lib/i18n";

export default async function AddDebtPage({
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
    <div className="bg-[#f8f9fa] text-[#191c1d] min-h-screen flex flex-col">
      <header className="flex justify-between items-center w-full px-6 pt-12 pb-6 bg-gradient-to-b from-[#2f4c39] to-[#183524] text-white">
        <div className="flex items-center gap-4">
          <Link
            href={`/${lang}/customers/${id}`}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-all"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-xl font-bold tracking-tight">{t.debt.recordDebt}</h1>
        </div>
      </header>

      <AddDebtCustomerForm id={id} t={t.debt} />
    </div>
  );
}
