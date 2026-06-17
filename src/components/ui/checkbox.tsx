"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function Checkbox({
  className,
  checked,
  onCheckedChange,
  ...props
}: React.ComponentProps<"input"> & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <input
      type="checkbox"
      data-slot="checkbox"
      checked={checked}
      onChange={(event) => onCheckedChange?.(event.currentTarget.checked)}
      className={cn(
        "size-4 rounded border-zinc-300 text-accent focus:ring-2 focus:ring-accent/30",
        className,
      )}
      {...props}
    />
  );
}

export { Checkbox };
