"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import config from "@/lib/config";
import { useState, useTransition } from "react";

interface FinishItemCheckboxProps {
  itemId: string;
  itemType: "event" | "task";
  className?: string;
  onCheckCallBack: (itemId: string) => void;
}

export function FinishItemCheckbox({
  itemId,
  itemType,
  className,
  onCheckCallBack,
}: FinishItemCheckboxProps) {
  const [isPending] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const checkboxId = `finish-${itemType}-${itemId}`;

  const handleFinish = async () => {
    setError(null); // Clear previous errors
    try {
      const response = await fetch(
        `${config.storageUrl}/${itemType}s/finished/${itemId}`,
        {
          method: "PATCH",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Failed to mark ${itemType} as finished.`,
        }));
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }

      onCheckCallBack(itemId);
      // Refresh server components and re-fetch data
      // startTransition(() => {
      //   router.refresh();
      // });
    } catch (err) {
      console.error(`Error finishing ${itemType} ${itemId}:`, err);
      setError(err instanceof Error ? err.message : String(err));
      // Optionally, inform the user via a toast notification or inline message
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Checkbox
        id={checkboxId}
        onCheckedChange={(checked) => {
          // `checked` can be true, false, or 'indeterminate' for shadcn Checkbox
          if (checked === true) {
            handleFinish();
          }
        }}
        disabled={isPending}
        aria-label={`Mark this ${itemType} as done`}
      />
      <Label
        htmlFor={checkboxId}
        className="text-sm cursor-pointer select-none"
      >
        Done
      </Label>
      {error && <p className="text-xs text-destructive ml-2">{error}</p>}
    </div>
  );
}
