"use client";

import { useActionState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";

import { createProjectAction } from "@/app/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function NewProjectForm({ disabled = false }: { disabled?: boolean }) {
  const [state, action, pending] = useActionState(createProjectAction, {});

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Tên dự án
          <Input name="title" placeholder="Ví dụ: StudyMatch Proposal" disabled={disabled} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Lĩnh vực
          <Input name="industry" placeholder="EdTech, FinTech..." disabled={disabled} />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium">
        Ý tưởng startup
        <Textarea
          name="startupIdea"
          placeholder="Mô tả vấn đề và giải pháp bạn đang nghĩ tới..."
          className="min-h-28 resize-none"
          disabled={disabled}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Khách hàng mục tiêu
        <Input
          name="targetCustomer"
          placeholder="Ví dụ: Sinh viên năm nhất FPTU"
          disabled={disabled}
        />
      </label>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button className="btn-liquid h-11 w-fit" disabled={disabled || pending}>
        {pending ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
        Tạo workspace có hướng dẫn
      </Button>
    </form>
  );
}
