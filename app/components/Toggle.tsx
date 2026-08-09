"use client";

import { useState } from "react";

interface ToggleProps {
  defaultChecked?: boolean;
  id?: string;
}

export default function Toggle({ defaultChecked = false, id }: ToggleProps) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        id={id}
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={() => setChecked(!checked)}
      />
      <div className="w-11 h-6 bg-[#e1e3e4] rounded-full peer peer-focus:ring-2 peer-focus:ring-[#c9ebd1] peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#fd761a]"></div>
    </label>
  );
}
