"use client";

import { useMemo, useState } from "react";
import Toggle from "@/app/components/Toggle";
import type { Dictionary } from "@/app/lib/i18n";
import { updateSettings } from "@/app/actions/merchant";

type Props = {
  settings: Record<string, any>;
  t: Dictionary;
};

export default function SettingsForm({ settings, t }: Props) {
  const initialMaxDebt = String(settings.max_debt_limit ?? 0);
  const initialCash = Boolean(settings.cash_enabled ?? false);
  const initialMtn = Boolean(settings.mtn_enabled ?? false);
  const initialOrange = Boolean(settings.orange_enabled ?? false);
  const initialReminders = Boolean(settings.debt_reminders ?? false);
  const initialReports = Boolean(settings.weekly_reports ?? false);

  const [maxDebtLimit, setMaxDebtLimit] = useState(initialMaxDebt);
  const [cashEnabled, setCashEnabled] = useState(initialCash);
  const [mtnEnabled, setMtnEnabled] = useState(initialMtn);
  const [orangeEnabled, setOrangeEnabled] = useState(initialOrange);
  const [debtReminders, setDebtReminders] = useState(initialReminders);
  const [weeklyReports, setWeeklyReports] = useState(initialReports);

  const isDirty = useMemo(() => {
    if (maxDebtLimit !== initialMaxDebt) return true;
    if (cashEnabled !== initialCash) return true;
    if (mtnEnabled !== initialMtn) return true;
    if (orangeEnabled !== initialOrange) return true;
    if (debtReminders !== initialReminders) return true;
    if (weeklyReports !== initialReports) return true;
    return false;
  }, [
    maxDebtLimit,
    cashEnabled,
    mtnEnabled,
    orangeEnabled,
    debtReminders,
    weeklyReports,
    initialMaxDebt,
    initialCash,
    initialMtn,
    initialOrange,
    initialReminders,
    initialReports,
  ]);

  return (
    <form action={updateSettings} className="space-y-6">
      {/* Credit & Debt Limits */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-[#18181b] pl-2 uppercase tracking-widest text-[10px] text-zinc-400">
          {t.settings.creditControls}
        </h3>
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
              value={maxDebtLimit}
              onChange={(e) => setMaxDebtLimit(e.target.value)}
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
        <h3 className="font-extrabold text-[#18181b] pl-2 uppercase tracking-widest text-[10px] text-zinc-400">
          {t.settings.account}
        </h3>
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
        <h3 className="font-extrabold text-[#18181b] pl-2 uppercase tracking-widest text-[10px] text-zinc-400">
          {t.settings.payments}
        </h3>
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-zinc-200/80 divide-y divide-zinc-100">
          {[
            {
              icon: "payments",
              label: t.settings.cashPayments,
              sub: t.settings.cashPaymentsSub,
              key: "cash_enabled",
              val: cashEnabled,
              set: setCashEnabled,
            },
            {
              icon: "smartphone",
              label: t.settings.mtnMoney,
              sub: t.settings.mtnMoneySub,
              key: "mtn_enabled",
              val: mtnEnabled,
              set: setMtnEnabled,
            },
            {
              icon: "account_balance_wallet",
              label: t.settings.orangeMoney,
              sub: t.settings.orangeMoneySub,
              key: "orange_enabled",
              val: orangeEnabled,
              set: setOrangeEnabled,
            },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-[#18181b]">{item.icon}</span>
                <div>
                  <p className="font-bold text-sm text-[#18181b] leading-tight">{item.label}</p>
                  <p className="text-xs text-zinc-400">{item.sub}</p>
                </div>
              </div>
              <Toggle
                name={item.key}
                defaultChecked={item.val}
                onChange={(checked) => item.set(checked)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-[#18181b] pl-2 uppercase tracking-widest text-[10px] text-zinc-400">
          {t.settings.notifications}
        </h3>
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-zinc-200/80 divide-y divide-zinc-100">
          {[
            {
              icon: "history_edu",
              label: t.settings.debtReminders,
              sub: t.settings.debtRemindersSub,
              key: "debt_reminders",
              val: debtReminders,
              set: setDebtReminders,
            },
            {
              icon: "analytics",
              label: t.settings.weeklyReports,
              sub: t.settings.weeklyReportsSub,
              key: "weekly_reports",
              val: weeklyReports,
              set: setWeeklyReports,
            },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-[#18181b]">{item.icon}</span>
                <div>
                  <p className="font-bold text-sm text-[#18181b] leading-tight">{item.label}</p>
                  <p className="text-xs text-zinc-400">{item.sub}</p>
                </div>
              </div>
              <Toggle
                name={item.key}
                defaultChecked={item.val}
                onChange={(checked) => item.set(checked)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save Settings */}
      <button
        type="submit"
        disabled={!isDirty}
        className="w-full py-4 bg-[#18181b] hover:bg-[#27272a] text-white rounded-2xl font-extrabold text-base shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <span className="material-symbols-outlined text-[#a3e635]">save</span>
        Save Settings
      </button>
    </form>
  );
}
