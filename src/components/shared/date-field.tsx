"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@/components/shared/icons";
import { useDismiss } from "@/components/shared/use-dismiss";
import { Eyebrow } from "@/components/ui/eyebrow";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";
import {
  clampDate,
  dayOfMonth,
  formatDateLong,
  formatMonthTitle,
  formatWeekdayShort,
  monthEnd,
  monthGrid,
  monthStart,
  shiftDate,
  shiftMonth,
} from "@/lib/plan/dates";
import { EDGE, placeFloating, type Viewport } from "@/lib/picker/position";

const POPOVER_WIDTH = 296;
const POPOVER_HEIGHT = 400;

type DateFieldProps = {
  value: string;
  onChange: (value: string) => void;
  today: string;
  min?: string;
  max?: string;
  label?: string;
  placeholder?: string;
  onClear?: () => void;
  onOpenChange?: (open: boolean) => void;
};

type CalendarProps = {
  value: string;
  today: string;
  min?: string;
  max?: string;
  anchor: HTMLElement;
  containerRef: RefObject<HTMLDivElement | null>;
  onPick: (value: string) => void;
};

function inRange(date: string, min?: string, max?: string): boolean {
  return (min === undefined || date >= min) && (max === undefined || date <= max);
}

function readViewport(): Viewport {
  return { width: window.innerWidth, height: window.innerHeight };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function Calendar({ value, today, min, max, anchor, containerRef, onPick }: CalendarProps) {
  const [viewport, setViewport] = useState(readViewport);
  const [focusDate, setFocusDate] = useState(() => clampDate(value || today, min, max));
  const [month, setMonth] = useState(() => monthStart(clampDate(value || today, min, max)));
  const keyboardMoveRef = useRef(false);
  const grid = useMemo(() => monthGrid(month), [month]);
  const tabbable = useMemo(() => {
    const cells = grid.flat();
    if (cells.some((cell) => cell.date === focusDate && inRange(cell.date, min, max))) {
      return focusDate;
    }
    return cells.find((cell) => cell.inMonth && inRange(cell.date, min, max))?.date ?? null;
  }, [grid, focusDate, min, max]);
  const tomorrow = shiftDate(today, 1, "day");
  const quick = [
    { date: today, label: messages.planToday },
    { date: tomorrow, label: messages.planTomorrow },
  ].filter((chip) => inRange(chip.date, min, max));
  const prevDisabled = min !== undefined && monthEnd(shiftMonth(month, -1)) < min;
  const nextDisabled = max !== undefined && shiftMonth(month, 1) > max;

  const placement = useMemo(
    () => placeFloating(anchor.getBoundingClientRect(), POPOVER_WIDTH, POPOVER_HEIGHT, viewport),
    [anchor, viewport],
  );

  useEffect(() => {
    const reposition = () => setViewport(readViewport());
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const target =
      container?.querySelector<HTMLElement>("[data-selected]:not(:disabled)") ??
      container?.querySelector<HTMLElement>("button:not(:disabled)");
    target?.focus({ preventScroll: true });
  }, [containerRef]);

  useEffect(() => {
    if (!keyboardMoveRef.current) return;
    keyboardMoveRef.current = false;
    containerRef.current
      ?.querySelector<HTMLElement>(`[data-date="${focusDate}"]`)
      ?.focus({ preventScroll: true });
  }, [containerRef, focusDate, month]);

  const onGridKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const from = tabbable ?? focusDate;
    let next: string;
    switch (event.key) {
      case "ArrowLeft":
        next = shiftDate(from, -1, "day");
        break;
      case "ArrowRight":
        next = shiftDate(from, 1, "day");
        break;
      case "ArrowUp":
        next = shiftDate(from, -1, "week");
        break;
      case "ArrowDown":
        next = shiftDate(from, 1, "week");
        break;
      case "PageUp":
      case "PageDown": {
        const first = shiftMonth(from, event.key === "PageUp" ? -1 : 1);
        const day = Math.min(dayOfMonth(from), dayOfMonth(monthEnd(first)));
        next = `${first.slice(0, 8)}${pad(day)}`;
        break;
      }
      case "Home":
      case "End": {
        const row = grid.find((cells) => cells.some((cell) => cell.date === from));
        const cell = row?.[event.key === "Home" ? 0 : row.length - 1];
        if (!cell) return;
        next = cell.date;
        break;
      }
      default:
        return;
    }
    event.preventDefault();
    if (!inRange(next, min, max)) return;
    keyboardMoveRef.current = true;
    setFocusDate(next);
    if (!grid.flat().some((cell) => cell.date === next)) setMonth(monthStart(next));
  };

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-label={messages.dateChooseDay}
      className="fixed z-[var(--z-float)] rounded-field border border-border bg-surface p-2"
      style={{
        left: Math.max(EDGE, placement.left),
        top: placement.top ?? undefined,
        bottom: placement.bottom ?? undefined,
        width: POPOVER_WIDTH,
      }}
    >
      {quick.length > 0 ? (
        <div className="flex gap-2 px-1 pb-2 pt-1">
          {quick.map((chip) => (
            <button
              key={chip.date}
              type="button"
              aria-pressed={value === chip.date}
              onClick={() => onPick(chip.date)}
              className={cn(
                "press rounded-full px-[11px] py-[7px] text-small",
                value === chip.date
                  ? "bg-primary-soft font-medium text-primary"
                  : "bg-fill hover:bg-fill-hover",
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex items-center justify-between px-1 pb-1">
        <IconButton
          size="xs"
          label={messages.dateMonthPrevious}
          disabled={prevDisabled}
          onClick={() => setMonth(shiftMonth(month, -1))}
        >
          <ChevronLeftIcon size={16} />
        </IconButton>
        <div aria-live="polite" className="num text-ui font-semibold">
          {formatMonthTitle(month)}
        </div>
        <IconButton
          size="xs"
          label={messages.dateMonthNext}
          disabled={nextDisabled}
          onClick={() => setMonth(shiftMonth(month, 1))}
        >
          <ChevronRightIcon size={16} />
        </IconButton>
      </div>
      <div className="grid grid-cols-7" onKeyDown={onGridKeyDown}>
        {grid[0].map((cell) => (
          <div
            key={cell.date}
            aria-hidden="true"
            className="py-1 text-center text-eyebrow font-medium text-text-faint"
          >
            {formatWeekdayShort(cell.date).slice(0, 2)}
          </div>
        ))}
        {grid.flat().map((cell) => {
          const selected = cell.date === value;
          const enabled = inRange(cell.date, min, max);
          return (
            <button
              key={cell.date}
              type="button"
              disabled={!enabled}
              aria-pressed={selected}
              aria-label={formatDateLong(cell.date)}
              data-selected={selected ? "" : undefined}
              data-date={cell.date}
              tabIndex={cell.date === tabbable ? 0 : -1}
              onClick={() => onPick(cell.date)}
              className={cn(
                "num mx-auto my-px size-9 rounded-full text-small",
                selected
                  ? "bg-primary-soft font-semibold text-primary"
                  : cell.inMonth
                    ? "hover:bg-fill"
                    : "text-text-faint hover:bg-fill",
                cell.date === today &&
                  !selected &&
                  "font-semibold text-primary ring-1 ring-primary",
                !enabled && "cursor-not-allowed opacity-35 hover:bg-transparent",
              )}
            >
              {dayOfMonth(cell.date)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DateField({
  value,
  onChange,
  today,
  min,
  max,
  label,
  placeholder,
  onClear,
  onOpenChange,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const buttonId = useId();
  const close = useCallback(() => setOpen(false), []);
  const closeAndFocus = useDismiss(popoverRef, triggerRef, open, close);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  return (
    <div className="flex flex-col gap-2">
      {label ? <Eyebrow id={labelId}>{label}</Eyebrow> : null}
      <div className="relative">
        <button
          id={buttonId}
          ref={(element) => {
            triggerRef.current = element;
            setTrigger(element);
          }}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-labelledby={label ? `${labelId} ${buttonId}` : undefined}
          onClick={() => setOpen((current) => !current)}
          className={cn(
            "num min-h-[52px] w-full rounded-field bg-fill px-4 text-left text-body text-text transition-colors hover:bg-fill-hover",
            onClear && value && "pr-12",
          )}
        >
          {value ? formatDateLong(value) : <span className="text-text-faint">{placeholder}</span>}
        </button>
        {onClear && value ? (
          <IconButton
            size="xs"
            label={messages.settingsClearDate}
            className="absolute right-2 top-1/2 -translate-y-1/2"
            onClick={onClear}
          >
            <CloseIcon size={16} />
          </IconButton>
        ) : null}
      </div>
      {open && trigger
        ? createPortal(
            <Calendar
              value={value}
              today={today}
              min={min}
              max={max}
              anchor={trigger}
              containerRef={popoverRef}
              onPick={(next) => {
                onChange(next);
                closeAndFocus();
              }}
            />,
            document.body,
          )
        : null}
    </div>
  );
}
