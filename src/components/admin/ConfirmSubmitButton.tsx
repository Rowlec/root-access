"use client";

import type { MouseEvent } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ConfirmSubmitButton({ message }: { message: string }) {
  function confirmSubmit(event: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(message)) event.preventDefault();
  }

  return (
    <Button type="submit" size="sm" variant="destructive" onClick={confirmSubmit}>
      <Trash2 /> Xóa
    </Button>
  );
}
