"use client";

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-fade-in">
      <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-[hsl(var(--border))]">
        <img src="/kaori-avatar.png" alt="Kaori" className="w-full h-full object-cover" />
      </div>
      <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-[hsl(var(--assistant-bubble))] border border-[hsl(var(--border))]">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}
