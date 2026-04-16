import AttoCharacter, { type AttoState } from "@/components/atto/AttoCharacter";
import ReadAloud from "./ReadAloud";
import { cn } from "@/lib/utils/cn";

export interface Message {
  id: string;
  role: "atto" | "child";
  content: string;
  attoState?: AttoState;
  isVoice?: boolean;
  createdAt?: Date;
}

interface MessageBubbleProps {
  message: Message;
  lang?: "ro" | "en";
}

export default function MessageBubble({ message, lang = "ro" }: MessageBubbleProps) {
  const isAtto = message.role === "atto";

  return (
    <div
      className={cn(
        "flex gap-2 items-end animate-slide-up",
        !isAtto && "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      {isAtto ? (
        <AttoCharacter
          state={message.attoState ?? "neutral"}
          size={28}
          className="flex-shrink-0 mb-1"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-[#E8A020]/20 border border-[#E8A020]/30 flex items-center justify-center flex-shrink-0 mb-1">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="5" r="3" fill="#E8A020" />
            <path d="M1 13c0-3.314 2.686-5 6-5s6 1.686 6 5" fill="#E8A020" opacity="0.6" />
          </svg>
        </div>
      )}

      {/* Bubble + Read Aloud */}
      <div className={cn("flex flex-col max-w-[78%]", !isAtto && "items-end")}>
        <div
          className={cn(
            "px-4 py-3 text-sm leading-relaxed",
            isAtto ? "bubble-atto text-[#1B5E4F]" : "bubble-child"
          )}
        >
          {message.isVoice && (
            <span className="inline-flex items-center gap-1 text-xs opacity-60 mb-1 block">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="4" fill="currentColor" opacity="0.4" />
                <path d="M3 5a2 2 0 014 0" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" />
              </svg>
              vocal
            </span>
          )}
          {message.content}
        </div>

        {/* Read Aloud — only on Atto messages */}
        {isAtto && (
          <ReadAloud text={message.content} lang={lang} />
        )}
      </div>
    </div>
  );
}
