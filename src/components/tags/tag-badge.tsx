import React from "react";
import type { ProspectTag } from "@/server/prospects";

type Props = {
  tag: ProspectTag;
  onRemove?: () => void;
  size?: "sm" | "md";
};

export function TagBadge({ tag, onRemove, size = "sm" }: Props) {
  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium shadow-xs transition-colors ${sizeClasses}`}
      style={{
        backgroundColor: `${tag.color}18`, // 10% opacity background
        color: tag.color,
        border: `1px solid ${tag.color}40`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ backgroundColor: tag.color }}
      />
      <span>{tag.label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:opacity-75 focus:outline-none"
          title={`Retirer l'étiquette ${tag.label}`}
        >
          ×
        </button>
      )}
    </span>
  );
}
