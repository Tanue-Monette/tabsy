import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Toggle from "@/app/components/Toggle";
import BottomNav from "@/app/components/BottomNav";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import { getSession } from "@/app/lib/session";
import { getMerchant } from "@/app/actions/merchant";
import { logout } from "@/app/actions/auth";
import { getDictionary, isValidLocale, type Locale } from "@/app/lib/i18n";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const t = await getDictionary(lang as Locale);

  const session = await getSession();
  if (!session) redirect(`/${lang}`);

  const merchant = await getMerchant();
  const settings = merchant?.settings ?? {};

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-32">
      <header className="bg-gradient-to-b from-emerald-900 to-emerald-950 text-emerald-50 flex justify-between items-center w-full px-6 pt-12 pb-6 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href={`/${lang}/dashboard`} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-emerald-900/50 transition-opacity duration-200">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{t.settings.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher currentLocale={lang as Locale} />
          <div className="w-10 h-10 rounded-full bg-[#2f4c39] flex items-center justify-center">
            <span className="material-symbols-outlined text-[#9bbca3]">person</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-10 space-y-8">
        {/* Profile Card */}
        <section className="bg-white rounded-xl p-6 flex items-center gap-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="w-16 h-16 rounded-full bg-[#2f4c39] flex items-center justify-center text-[#9bbca3]">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#183524] tracking-tight">{merchant?.shop_name ?? "Your Shop"}</h2>
            <p className="text-[#424843] font-medium">+237 {merchant?.phone}</p>
            <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              {t.settings.verifiedMerchant}
            </span>
          </div>
        </section>

        {/* Account */}
        <div className="space-y-4">
          <h3 className="font-bold text-[#183524] pl-2 opacity-80 uppercase tracking-widest text-xs">{t.settings.account}</h3>
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-5 hover:bg-[#f3f4f5] transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-[#2f4c39]">person</span>
                <span className="font-medium">{t.settings.personalInfo}</span>
              </div>
              <span className="material-symbols-outlined text-[#c2c8c1] group-hover:text-[#183524]">chevron_right</span>
            </div>
            <div className="flex items-center justify-between p-5 hover:bg-[#f3f4f5] transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-[#2f4c39]">business_center</span>
                <span className="font-medium">{t.settings.businessLicenses}</span>
              </div>
              <span className="material-symbols-outlined text-[#c2c8c1] group-hover:text-[#183524]">chevron_right</span>
            </div>
          </div>
        </div>

        {/* Payments */}
        <div className="space-y-4">
          <h3 className="font-bold text-[#183524] pl-2 opacity-80 uppercase tracking-widest text-xs">{t.settings.payments}</h3>
          <div className="bg-white rounded-xl overflow-hidden shadow-sm divide-y divide-[#edeeef]">
            {[
              { icon: "payments", label: t.settings.cashPayments, sub: t.settings.cashPaymentsSub, key: "cash_enabled" },
              { icon: "smartphone", label: t.settings.mtnMoney, sub: t.settings.mtnMoneySub, key: "mtn_enabled" },
              { icon: "account_balance_wallet", label: t.settings.orangeMoney, sub: t.settings.orangeMoneySub, key: "orange_enabled" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-[#2f4c39]">{item.icon}</span>
                  <div>
                    <p className="font-medium leading-tight">{item.label}</p>
                    <p className="text-xs text-[#424843]">{item.sub}</p>
                  </div>
                </div>
                <Toggle defaultChecked={settings[item.key] ?? false} />
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-4">
          <h3 className="font-bold text-[#183524] pl-2 opacity-80 uppercase tracking-widest text-xs">{t.settings.notifications}</h3>
          <div className="bg-white rounded-xl overflow-hidden shadow-sm divide-y divide-[#edeeef]">
            {[
              { icon: "history_edu", label: t.settings.debtReminders, sub: t.settings.debtRemindersSub, key: "debt_reminders" },
              { icon: "analytics", label: t.settings.weeklyReports, sub: t.settings.weeklyReportsSub, key: "weekly_reports" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-[#2f4c39]">{item.icon}</span>
                  <div>
                    <p className="font-medium leading-tight">{item.label}</p>
                    <p className="text-xs text-[#424843]">{item.sub}</p>
                  </div>
                </div>
                <Toggle defaultChecked={settings[item.key] ?? false} />
              </div>
            ))}
          </div>
        </div>

        {/* Sign Out */}
        <div className="pt-6">
          <form action={logout}>
            <button type="submit" className="w-full flex items-center justify-center gap-3 p-4 bg-[#ffdad6] text-[#93000a] rounded-xl font-bold hover:bg-red-100 transition-colors">
              <span className="material-symbols-outlined">logout</span>{t.auth.logout}
            </button>
          </form>
          <p className="text-center text-[10px] text-[#424843] mt-8 uppercase tracking-widest font-bold">
            {t.settings.appVersion}
          </p>
        </div>
      </main>

      <BottomNav lang={lang} t={t.nav} />
    </div>
  );
}
