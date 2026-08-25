"use client";

import { useState } from "react";

interface ToggleProps {
  defaultChecked?: boolean;
  id?: string;
  name?: string;
  onChange?: (checked: boolean) => void;
}

export default function Toggle({ defaultChecked = false, id, name, onChange }: ToggleProps) {
  const [checked, setChecked] = useState(defaultChecked);

  const handleChange = () => {
    const next = !checked;
    setChecked(next);
    if (onChange) onChange(next);
  };

  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        id={id}
        name={name}
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={handleChange}
      />
      <div className="w-11 h-6 bg-zinc-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-[#a3e635]/30 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-transparent after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#18181b] peer-checked:after:bg-[#a3e635]"></div>
    </label>
  );
}
