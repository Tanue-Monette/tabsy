type Props = {
  title: string;
  amount: number;
  currency?: string;
};

export default function AmountBanner({ title, amount, currency = "FCFA" }: Props) {
  return (
    <section className="bg-gradient-to-br from-[#18181b] via-[#27272a] to-[#18181b] rounded-3xl p-6 shadow-xl ring-1 ring-white/10 relative overflow-hidden text-white">
      <div className="absolute -right-8 -top-8 w-36 h-36 bg-[#a3e635]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10">
        <p className="text-white/60 font-semibold text-xs uppercase tracking-wider mb-2">{title}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl sm:text-5xl font-black text-white leading-none">
            {amount.toLocaleString()}
          </span>
          <span className="text-lg font-extrabold text-[#a3e635] tracking-tight">{currency}</span>
        </div>
      </div>
    </section>
  );
}
