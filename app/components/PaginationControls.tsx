"use client";

type Props = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
};

export default function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
}: Props) {
  if (totalItems === 0 || totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers array with smart ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-200/80">
      {/* Item info & page size dropdown */}
      <div className="flex items-center gap-3 text-xs font-semibold text-zinc-500">
        <span>
          Showing <strong className="text-[#18181b]">{startItem}-{endItem}</strong> of{" "}
          <strong className="text-[#18181b]">{totalItems}</strong>
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-zinc-400">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-zinc-100 border border-zinc-200 text-[#18181b] font-bold py-1 px-2 rounded-xl text-xs focus:ring-2 focus:ring-[#18181b] focus:outline-none cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page Navigation Buttons */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-zinc-200 text-[#18181b] font-bold text-xs hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all shadow-sm cursor-pointer"
          title="Previous Page"
        >
          <span className="material-symbols-outlined text-base">chevron_left</span>
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) =>
            typeof p === "number" ? (
              <button
                key={idx}
                type="button"
                onClick={() => onPageChange(p)}
                className={`min-w-9 h-9 px-2 flex items-center justify-center rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  currentPage === p
                    ? "bg-[#18181b] text-[#a3e635] shadow-md shadow-[#18181b]/10"
                    : "bg-white border border-zinc-200/80 text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                {p}
              </button>
            ) : (
              <span key={idx} className="px-1 text-zinc-400 font-bold text-xs">
                ...
              </span>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-zinc-200 text-[#18181b] font-bold text-xs hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all shadow-sm cursor-pointer"
          title="Next Page"
        >
          <span className="material-symbols-outlined text-base">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
