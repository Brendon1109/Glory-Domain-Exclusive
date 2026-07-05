"use client";
import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { getBook } from "@/lib/bible-books";
import { suggestBibleRefs, type BibleRefSuggestion } from "@/lib/bible-ref";
import { cn } from "@/lib/utils";

export function VerseJump() {
  const router = useRouter();
  const listboxId = useId();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const suggestions = useMemo(() => suggestBibleRefs(value), [value]);
  const expanded = open && suggestions.length > 0;
  const activeIndex = Math.min(active, suggestions.length - 1);

  function select(s: BibleRefSuggestion) {
    setValue("");
    setOpen(false);
    setActive(0);
    router.push(s.href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((activeIndex + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActive((activeIndex - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(suggestions[activeIndex] ?? suggestions[0]);
    }
  }

  return (
    <div className="relative">
      <Input
        role="combobox"
        aria-expanded={expanded}
        aria-controls={listboxId}
        aria-activedescendant={
          expanded ? `${listboxId}-option-${activeIndex}` : undefined
        }
        aria-autocomplete="list"
        autoComplete="off"
        spellCheck={false}
        placeholder={'Go to verse - try "John 3:16"'}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      {expanded ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Bible references"
          className="absolute left-0 right-0 top-full z-10 mt-1.5 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-sm"
        >
          {suggestions.map((s, i) => (
            <li key={s.href} role="presentation">
              <button
                type="button"
                id={`${listboxId}-option-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                tabIndex={-1}
                className={cn(
                  "flex w-full items-baseline gap-1.5 px-3.5 py-2.5 text-left text-sm transition-colors",
                  i === activeIndex && "bg-stone-50",
                )}
                // onMouseDown so selection fires before the input's blur
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(s);
                }}
                onMouseEnter={() => setActive(i)}
              >
                <span className="font-medium text-ink">
                  {getBook(s.bookId)?.name ?? s.label}
                </span>
                {s.chapter !== undefined ? (
                  <span className="text-muted">
                    {s.chapter}
                    {s.verse !== undefined ? `:${s.verse}` : ""}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
