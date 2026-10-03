"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, FolderGit2, Plus, Sparkles, Tag, Users } from "lucide-react";
import { IdeaStudio } from "@/components/studio/IdeaStudio";

interface ProjectItem {
  id: string;
  title: string;
  oneLiner?: string | null;
  niche?: string | null;
  domain?: string | null;
  packId?: string | null;
  startupIdea?: string | null;
  targetCustomer?: string | null;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface DashboardProjectsViewProps {
  projects: ProjectItem[];
  walletBalance: number;
}

export function DashboardProjectsView({
  projects,
  walletBalance,
}: DashboardProjectsViewProps) {
  const [showStudio, setShowStudio] = useState(projects.length === 0);

  if (showStudio) {
    return (
      <div className="space-y-6">
        {projects.length > 0 && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowStudio(false)}
              className="inline-flex items-center gap-2 text-xs text-[var(--muted)] hover:text-[var(--ink)] font-semibold transition-colors"
            >
              ← Quay lại danh sách dự án
            </button>
          </div>
        )}

        <IdeaStudio
          onComplete={(project: { id: string }) => {
            window.location.href = `/app/projects/${project.id}`;
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-[var(--ink)]">
            Tất cả dự án ({projects.length})
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Chọn dự án để mở sổ chấm bài hoặc kiểm tra proposal toàn bộ.
          </p>
        </div>

        <button
          onClick={() => setShowStudio(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--accent)] text-white font-medium text-sm hover:opacity-90 shadow-sm transition-all"
        >
          <Plus className="size-4" />
          Tạo dự án mới
        </button>
      </div>

      {/* Projects Grid or Empty State */}
      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line-2)] bg-[var(--surface)] p-8 sm:p-12 text-center space-y-3">
          <div className="size-12 rounded-xl bg-[var(--accent-weak)] text-[var(--accent)] flex items-center justify-center mx-auto">
            <BookOpen className="size-6" />
          </div>
          <h3 className="font-serif font-bold text-base text-[var(--ink)]">
            Bạn chưa có dự án nào
          </h3>
          <p className="text-xs text-[var(--muted)] max-w-sm mx-auto leading-relaxed">
            Dùng Idea Studio để bắt đầu tạo ý tưởng, chọn ngách và xây dựng Startup Proposal chuẩn rubric môn EXE.
          </p>
          <button
            onClick={() => setShowStudio(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--accent)] text-white font-medium text-xs hover:opacity-90 shadow-sm transition-all"
          >
            <Plus className="size-3.5" />
            Bắt đầu tạo dự án với Idea Studio
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const displayDesc =
              project.oneLiner || project.startupIdea || "Chưa có mô tả ý tưởng";
            const displayNiche = project.niche || project.targetCustomer;

            return (
              <Link
                key={project.id}
                href={`/app/projects/${project.id}`}
                className="group flex flex-col justify-between rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 hover:border-[var(--accent)] hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif font-bold text-lg text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                      {project.title}
                    </h3>
                    <span className="shrink-0 text-xs px-2 py-0.5 rounded bg-[var(--sunken)] text-[var(--muted)] font-mono">
                      {project.packId ? project.packId.toUpperCase() : "EXE101"}
                    </span>
                  </div>

                  <p className="mt-2.5 text-xs text-[var(--ink-2)] line-clamp-2 leading-relaxed">
                    {displayDesc}
                  </p>

                  {displayNiche && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-[var(--muted)]">
                      <span className="font-medium text-[var(--ink)]">Ngách:</span>
                      <span className="line-clamp-1">{displayNiche}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-[var(--line-2)] flex items-center justify-between text-xs text-[var(--muted)]">
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="size-3.5" />
                    Mở sổ dự án
                  </span>
                  <ArrowRight className="size-3.5 text-[var(--accent)] transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
