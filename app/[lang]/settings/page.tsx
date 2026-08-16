import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Toggle from "@/app/components/Toggle";
import BottomNav from "@/app/components/BottomNav";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import { getSession } from "@/app/lib/session";
import { getMerchant, updateSettings } from "@/app/actions/merchant";
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
      <header className="bg-[#18181b] text-white flex justify-between items-center w-full px-6 pt-10 pb-6 sticky top-0 z-40 shadow-lg border-b border-zinc-800/50">
        <div className="flex items-center gap-4">
          <Link href={`/${lang}/dashboard`} className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-white transition-colors border border-zinc-700/40">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </Link>
          <h1 className="text-xl font-bold tracking-tight">{t.settings.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher currentLocale={lang as Locale} />
          <div className="w-10 h-10 rounded-xl bg-[#27272a] border border-zinc-700/50 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#a3e635] text-lg">person</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-6 space-y-6">
        <form action={updateSettings} className="space-y-6">
          {/* Profile Card */}
          <section className="bg-white rounded-3xl p-6 flex items-center gap-5 shadow-sm border border-zinc-200/80">
            <div className="w-16 h-16 rounded-2xl bg-[#18181b] flex items-center justify-center text-[#a3e635] shrink-0 border border-zinc-800">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#18181b] tracking-tight">{merchant?.shop_name ?? "Your Shop"}</h2>
              <p className="text-zinc-500 font-medium text-xs mt-0.5">+237 {merchant?.phone}</p>
              <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#a3e635]/20 text-[#365314] uppercase tracking-wider">
                {t.settings.verifiedMerchant}
              </span>
            </div>
          </section>

          {/* Credit & Debt Limits */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-[#18181b] pl-2 uppercase tracking-widest text-[10px] text-zinc-400">{t.settings.creditControls}</h3>
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-[#18181b]">account_balance_wallet</span>
                  <div>
                    <p className="font-bold text-sm text-[#18181b] leading-tight">{t.settings.maxDebtLimit}</p>
                    <p className="text-xs text-zinc-400">{t.settings.maxDebtLimitSub}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input
                  name="max_debt_limit"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  defaultValue={settings.max_debt_limit ?? 0}
                  placeholder="e.g. 100000 (0 for no limit)"
                  className="flex-1 h-12 px-4 bg-zinc-100 border-none rounded-2xl text-[#18181b] font-bold text-sm focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all placeholder:text-zinc-400"
                />
                <span className="text-xs font-black text-[#a3e635] bg-[#18181b] px-3 py-3 rounded-2xl">FCFA</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium px-1">Set to 0 for unlimited customer credit.</p>
            </div>
          </div>

          {/* Account */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-[#18181b] pl-2 uppercase tracking-widest text-[10px] text-zinc-400">{t.settings.account}</h3>
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-zinc-200/80 divide-y divide-zinc-100">
              <div className="flex items-center justify-between p-5 hover:bg-zinc-50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-[#18181b]">person</span>
                  <span className="font-bold text-sm text-[#18181b]">{t.settings.personalInfo}</span>
                </div>
                <span className="material-symbols-outlined text-zinc-400 group-hover:text-[#18181b]">chevron_right</span>
              </div>
              <div className="flex items-center justify-between p-5 hover:bg-zinc-50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-[#18181b]">business_center</span>
                  <span className="font-bold text-sm text-[#18181b]">{t.settings.businessLicenses}</span>
                </div>
                <span className="material-symbols-outlined text-zinc-400 group-hover:text-[#18181b]">chevron_right</span>
              </div>
            </div>
          </div>

          {/* Payments */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-[#18181b] pl-2 uppercase tracking-widest text-[10px] text-zinc-400">{t.settings.payments}</h3>
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-zinc-200/80 divide-y divide-zinc-100">
              {[
                { icon: "payments", label: t.settings.cashPayments, sub: t.settings.cashPaymentsSub, key: "cash_enabled" },
                { icon: "smartphone", label: t.settings.mtnMoney, sub: t.settings.mtnMoneySub, key: "mtn_enabled" },
                { icon: "account_balance_wallet", label: t.settings.orangeMoney, sub: t.settings.orangeMoneySub, key: "orange_enabled" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-[#18181b]">{item.icon}</span>
                    <div>
                      <p className="font-bold text-sm text-[#18181b] leading-tight">{item.label}</p>
                      <p className="text-xs text-zinc-400">{item.sub}</p>
                    </div>
                  </div>
                  <Toggle name={item.key} defaultChecked={settings[item.key] ?? false} />
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-[#18181b] pl-2 uppercase tracking-widest text-[10px] text-zinc-400">{t.settings.notifications}</h3>
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-zinc-200/80 divide-y divide-zinc-100">
              {[
                { icon: "history_edu", label: t.settings.debtReminders, sub: t.settings.debtRemindersSub, key: "debt_reminders" },
                { icon: "analytics", label: t.settings.weeklyReports, sub: t.settings.weeklyReportsSub, key: "weekly_reports" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-[#18181b]">{item.icon}</span>
                    <div>
                      <p className="font-bold text-sm text-[#18181b] leading-tight">{item.label}</p>
                      <p className="text-xs text-zinc-400">{item.sub}</p>
                    </div>
                  </div>
                  <Toggle name={item.key} defaultChecked={settings[item.key] ?? false} />
                </div>
              ))}
            </div>
          </div>

          {/* Save Settings */}
          <button
            type="submit"
            className="w-full py-4 bg-[#18181b] hover:bg-[#27272a] text-white rounded-2xl font-extrabold text-base shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[#a3e635]">save</span>
            Save Settings
          </button>
        </form>

        {/* Sign Out */}
        <div className="pt-2">
          <form action={logout}>
            <button type="submit" className="w-full flex items-center justify-center gap-3 p-4 bg-rose-50 text-rose-600 rounded-2xl font-bold hover:bg-rose-100 transition-colors border border-rose-100">
              <span className="material-symbols-outlined">logout</span>{t.auth.logout}
            </button>
          </form>
          <p className="text-center text-[10px] text-zinc-400 mt-6 uppercase tracking-widest font-bold">
            {t.settings.appVersion}
          </p>
        </div>
      </main>

      <BottomNav lang={lang} t={t.nav} />
    </div>
  );
}
