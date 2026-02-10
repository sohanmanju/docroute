"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export default function TextInput({
  onSubmit,
  placeholder = "Paste your text here...",
  buttonLabel = "Analyze",
}: {
  onSubmit: (text: string) => void;
  placeholder?: string;
  buttonLabel?: string;
}) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
      setText("");
    }
  };

  return (
    <div className="glass-card p-4 space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={6}
        className="w-full bg-white border border-[#E2E3E0] rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-text-dim resize-none focus:outline-none focus:border-accent-green/50 transition-colors"
      />
      <button
        onClick={handleSubmit}
        disabled={!text.trim()}
        className="flex items-center gap-2 px-5 py-2.5 bg-accent-bright text-[#163300] rounded-lg text-sm font-medium hover:bg-accent-bright/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Send className="w-4 h-4" />
        {buttonLabel}
      </button>
    </div>
  );
}
