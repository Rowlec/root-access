"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  Lightbulb,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";

type EntryType = "A" | "B" | "C";

interface IdeaDirection {
  id: string;
  name: string;
  description: string;
  target_user: string;
  test_in_one_week: string;
  biggest_risk: string;
}

interface NicheOption {
  id: string;
  name: string;
  tradeoffs: string[];
}

interface NameOption {
  name: string;
  style: string;
}

const DOMAIN_OPTIONS = [
  "Ăn uống",
  "Học tập",
  "Nhà trọ/KTX",
  "Đi lại",
  "Thú cưng",
  "Sức khoẻ tinh thần",
  "Đồ cũ/thời trang",
  "Việc làm thêm",
];

const STRENGTH_OPTIONS = [
  "Code web/app",
  "Thiết kế",
  "Bán hàng online",
  "Quay dựng video",
  "Nấu ăn/làm đồ thủ công",
  "Có người quen kinh doanh",
];

const CONSTRAINT_OPTIONS = [
  "Phải test được trong campus",
  "Vốn gần như 0đ",
  "Có MVP trong 4 tuần",
  "Không làm app phức tạp",
];

export function IdeaStudio({
  onProjectCreated,
  onComplete,
}: {
  onProjectCreated?: (project: any) => void;
  onComplete?: (project: any) => void;
}) {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [entry, setEntry] = useState<EntryType>("B");

  // Form State
  const [q1Idea, setQ1Idea] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<string[]>(["Ăn uống"]);
  const [customDomain, setCustomDomain] = useState("");
  const [observedProblem, setObservedProblem] = useState("");
  const [selectedStrengths, setSelectedStrengths] = useState<string[]>([]);
  const [selectedConstraints, setSelectedConstraints] = useState<string[]>([]);

  // AI-generated Clarifying Questions (Entry A)
  const [clarifyQuestions, setClarifyQuestions] = useState<Array<{ id: string; question: string; chips: string[] }>>([]);
  const [clarifyAnswers, setClarifyAnswers] = useState<Record<string, string>>({});
  const [loadingClarify, setLoadingClarify] = useState(false);

  // Situation suggestions for "Chưa nghĩ ra"
  const [situations, setSituations] = useState<string[]>([]);
  const [loadingSituations, setLoadingSituations] = useState(false);

  // Step 2: Directions
  const [directions, setDirections] = useState<IdeaDirection[]>([]);
  const [selectedDirection, setSelectedDirection] = useState<IdeaDirection | null>(null);
  const [loadingDirections, setLoadingDirections] = useState(false);
  const [selectedForCombine, setSelectedForCombine] = useState<string[]>([]);

  // Step 3: Niches & Names
  const [niches, setNiches] = useState<NicheOption[]>([]);
  const [selectedNiche, setSelectedNiche] = useState<string>("");
  const [loadingNiches, setLoadingNiches] = useState(false);

  const [names, setNames] = useState<NameOption[]>([]);
  const [selectedName, setSelectedName] = useState<string>("");
  const [customName, setCustomName] = useState<string>("");
  const [loadingNames, setLoadingNames] = useState(false);

  // Submitting
  const [savingProject, setSavingProject] = useState(false);
  const [createdProject, setCreatedProject] = useState<any>(null);

  // Load existing session if any
  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch("/api/studio/session");
        if (res.ok) {
          const data = await res.json();
          if (data?.session) {
            const s = data.session;
            if (s.entry) setEntry(s.entry);
            if (s.answers?.q1) setQ1Idea(s.answers.q1);
            if (s.answers?.domains) setSelectedDomains(s.answers.domains);
            if (s.answers?.observed_problem) setObservedProblem(s.answers.observed_problem);
            if (s.answers?.strengths) setSelectedStrengths(s.answers.strengths);
            if (s.answers?.constraints) setSelectedConstraints(s.answers.constraints);
            if (s.chosen?.direction) setSelectedDirection(s.chosen.direction);
            if (s.chosen?.niche) setSelectedNiche(s.chosen.niche);
            if (s.chosen?.name) setSelectedName(s.chosen.name);
          }
        }
      } catch (err) {
        console.warn("Could not load session:", err);
      }
    }
    loadSession();
  }, []);

  // Save session auto
  const saveSession = async (updatedChosen?: any) => {
    try {
      await fetch("/api/studio/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry,
          answers: {
            q1: q1Idea,
            domains: selectedDomains,
            observed_problem: observedProblem,
            strengths: selectedStrengths,
            constraints: selectedConstraints,
            clarify: clarifyAnswers,
          },
          suggestions: {
            directions,
            niches,
            names,
          },
          chosen: updatedChosen || {
            direction: selectedDirection,
            niche: selectedNiche,
            name: selectedName || customName,
          },
        }),
      });
    } catch (e) {
      console.warn("Auto save session failed:", e);
    }
  };

  // Helper toggle domain
  const toggleDomain = (d: string) => {
    if (selectedDomains.includes(d)) {
      setSelectedDomains(selectedDomains.filter((x) => x !== d));
    } else {
      if (selectedDomains.length < 2) {
        setSelectedDomains([...selectedDomains, d]);
      } else {
        setSelectedDomains([selectedDomains[1], d]);
      }
    }
  };

  // Helper toggle strength
  const toggleStrength = (s: string) => {
    setSelectedStrengths((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  // Helper toggle constraint
  const toggleConstraint = (c: string) => {
    setSelectedConstraints((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  };

  // Custom options state for Entry C & B
  const [customStrengthInput, setCustomStrengthInput] = useState("");
  const [showCustomStrength, setShowCustomStrength] = useState(false);

  const [customConstraintInput, setCustomConstraintInput] = useState("");
  const [showCustomConstraint, setShowCustomConstraint] = useState(false);

  const [customDomainInput, setCustomDomainInput] = useState("");
  const [showCustomDomain, setShowCustomDomain] = useState(false);

  const addCustomStrength = () => {
    const val = customStrengthInput.trim();
    if (!val) return;
    if (!selectedStrengths.includes(val)) {
      setSelectedStrengths((prev) => [...prev, val]);
    }
    setCustomStrengthInput("");
    setShowCustomStrength(false);
  };

  const addCustomConstraint = () => {
    const val = customConstraintInput.trim();
    if (!val) return;
    if (!selectedConstraints.includes(val)) {
      setSelectedConstraints((prev) => [...prev, val]);
    }
    setCustomConstraintInput("");
    setShowCustomConstraint(false);
  };

  const addCustomDomain = () => {
    const val = customDomainInput.trim();
    if (!val) return;
    if (!selectedDomains.includes(val)) {
      if (selectedDomains.length < 2) {
        setSelectedDomains((prev) => [...prev, val]);
      } else {
        setSelectedDomains((prev) => [prev[1], val]);
      }
    }
    setCustomDomainInput("");
    setShowCustomDomain(false);
  };

  // Entry A clarify fetch
  const handleClarifyEntryA = async () => {
    if (!q1Idea.trim()) return;
    setLoadingClarify(true);
    try {
      const res = await fetch("/api/studio/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: q1Idea }),
      });
      if (res.ok) {
        const data = await res.json();
        setClarifyQuestions(data.questions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingClarify(false);
    }
  };

  // Fetch situations when user clicks "Chưa nghĩ ra"
  const handleLoadSituations = async () => {
    const domain = selectedDomains[0] || "Ăn uống";
    setLoadingSituations(true);
    try {
      const res = await fetch("/api/studio/situations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      if (res.ok) {
        const data = await res.json();
        setSituations(data.situations || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSituations(false);
    }
  };

  // Generate 3 Directions for Step 2
  const handleGenerateDirections = async () => {
    setLoadingDirections(true);
    setStep(2);
    try {
      const res = await fetch("/api/studio/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: {
            domain: selectedDomains.join(", "),
            observed_problem: observedProblem || q1Idea,
            team_strengths: selectedStrengths,
            constraints: selectedConstraints,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDirections(data.ideas || []);
        if (data.ideas?.[0]) setSelectedDirection(data.ideas[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDirections(false);
      saveSession();
    }
  };

  // Combine 2 selected directions
  const handleCombineDirections = async () => {
    if (selectedForCombine.length < 2) return;
    const idea1 = directions.find((d) => d.id === selectedForCombine[0]);
    const idea2 = directions.find((d) => d.id === selectedForCombine[1]);
    if (!idea1 || !idea2) return;

    setLoadingDirections(true);
    try {
      const res = await fetch("/api/studio/combine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea1, idea2 }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.idea) {
          setDirections([data.idea, ...directions]);
          setSelectedDirection(data.idea);
          setSelectedForCombine([]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDirections(false);
    }
  };

  // Step 3: Proceed to Niches and Names
  const handleProceedToStep3 = async (direction?: IdeaDirection) => {
    const targetDir = direction || selectedDirection;
    if (!targetDir) return;
    setSelectedDirection(targetDir);
    setStep(3);

    setLoadingNiches(true);
    setLoadingNames(true);

    try {
      const nichePromise = fetch("/api/studio/niches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction: targetDir }),
      })
        .then((r) => r.json())
        .then((data) => {
          setNiches(data.niches || []);
          if (data.niches?.[0]) setSelectedNiche(data.niches[0].name);
          return data.niches?.[0]?.name || "";
        });

      const firstNicheName = await nichePromise;

      const namesRes = await fetch("/api/studio/names", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction: targetDir,
          niche: firstNicheName,
        }),
      });

      if (namesRes.ok) {
        const namesData = await namesRes.json();
        setNames(namesData.names || []);
        if (namesData.names?.[0]) setSelectedName(namesData.names[0].name);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingNiches(false);
      setLoadingNames(false);
      saveSession();
    }
  };

  // Save Final Project Card
  const handleCompleteProject = async (mode: "chatgpt" | "web") => {
    const name = (customName || selectedName || "Dự án mới").trim();
    const oneLiner = selectedDirection?.description || q1Idea || "Chưa có mô tả";
    const niche = selectedNiche || "Sinh viên";
    const domain = selectedDomains[0] || "Khởi nghiệp";
    const problem = observedProblem || selectedDirection?.target_user || "";
    const assumption = selectedDirection?.biggest_risk || "";

    setSavingProject(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          title: name,
          one_liner: oneLiner,
          idea: oneLiner,
          domain,
          niche,
          target_customer: niche,
          observed_problem: problem,
          biggest_assumption: assumption,
          team_strengths: selectedStrengths,
          constraints: selectedConstraints,
          created_via: "studio",
          pack_id: "exe101-cp2",
        }),
      });

      if (res.ok) {
        const newProj = await res.json();
        setCreatedProject(newProj);
        if (onProjectCreated) onProjectCreated(newProj);
        if (onComplete) onComplete(newProj);

        if (mode === "chatgpt") {
          // Open ChatGPT in a new tab
          window.open("https://chatgpt.com", "_blank");
          router.push(`/app/projects/${newProj.id}`);
        } else {
          router.push(`/app/projects/${newProj.id}`);
        }
      } else {
        alert("Lỗi khi lưu dự án. Vui lòng thử lại.");
      }
    } catch (e: any) {
      alert(e.message || "Lỗi khi lưu dự án.");
    } finally {
      setSavingProject(false);
    }
  };

  // Computed live project card values
  const cardName = customName || selectedName || (step >= 3 ? "Bếp 15'" : "Tên dự án");
  const cardDomain = selectedDomains.join(", ") || "Lĩnh vực";
  const cardProblem = observedProblem || "Vấn đề bạn đã thấy...";
  const cardOneLiner = selectedDirection?.description || q1Idea || "Mô tả ý tưởng...";
  const cardNiche = selectedNiche || "Khách hàng ngách đầu tiên...";
  const cardAssumption = selectedDirection?.biggest_risk || "Giả định lớn nhất cần kiểm chứng...";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      {/* LEFT COLUMN: INTERACTIVE QUESTION WIZARD */}
      <div className="space-y-6">
        {/* Stepper Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tạo dự án · khoảng 3 phút
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={step === 1 ? "font-bold text-primary" : ""}>1. Ý tưởng</span>
            <span>→</span>
            <span className={step === 2 ? "font-bold text-primary" : ""}>2. Chọn hướng</span>
            <span>→</span>
            <span className={step === 3 ? "font-bold text-primary" : ""}>3. Ngách & tên</span>
            <span>→</span>
            <span className={step === 4 ? "font-bold text-primary" : ""}>4. Bắt đầu viết</span>
          </div>
        </div>

        {/* STEP 1: CHỌN LỐI VÀO & TRẢ LỜI CÂU HỎI */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-serif tracking-tight text-foreground">
              Nhóm bạn đang ở đâu với ý tưởng?
            </h2>
            <p className="text-sm text-muted-foreground -mt-3">
              Chưa có cũng không sao. Trả lời vài câu ngắn, RootAccess gợi ý để bạn chọn.
            </p>

            {/* 3 Entry Choice Cards */}
            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setEntry("A")}
                className={`rounded-xl border p-4 text-left transition-all ${
                  entry === "A"
                    ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                    : "border-border bg-card hover:bg-secondary/40"
                }`}
              >
                <div className="font-semibold text-sm text-foreground">Đã có ý tưởng rõ</div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Viết 1 câu, mình hỏi thêm 3 câu để làm rõ.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setEntry("B")}
                className={`rounded-xl border p-4 text-left transition-all ${
                  entry === "B"
                    ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                    : "border-border bg-card hover:bg-secondary/40"
                }`}
              >
                <div className="font-semibold text-sm text-foreground">Có hướng, chưa rõ</div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Ví dụ &ldquo;cái gì đó về ăn uống&rdquo;. Mình gợi ý 3 hướng cụ thể.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setEntry("C")}
                className={`rounded-xl border p-4 text-left transition-all ${
                  entry === "C"
                    ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                    : "border-border bg-card hover:bg-secondary/40"
                }`}
              >
                <div className="font-semibold text-sm text-foreground">Chưa có gì</div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Bắt đầu từ sở thích và thế mạnh của nhóm.
                </p>
              </button>
            </div>

            {/* ENTRY A FORM */}
            {entry === "A" && (
              <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
                <label className="block text-sm font-semibold text-foreground">
                  Viết ý tưởng của nhóm trong 1 câu: làm gì, cho ai?
                </label>
                <textarea
                  value={q1Idea}
                  onChange={(e) => setQ1Idea(e.target.value)}
                  placeholder="Ví dụ: Giao hộp nguyên liệu sơ chế chia sẵn cho sinh viên trọ tự nấu trong 15 phút..."
                  rows={3}
                  className="w-full rounded-xl border border-input bg-background p-3 text-sm focus:border-primary focus:outline-none"
                />

                {clarifyQuestions.length === 0 ? (
                  <button
                    type="button"
                    onClick={handleClarifyEntryA}
                    disabled={!q1Idea.trim() || loadingClarify}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {loadingClarify ? <Loader2 className="animate-spin size-4" /> : <Lightbulb className="size-4" />}
                    Làm rõ ý tưởng này →
                  </button>
                ) : (
                  <div className="space-y-4 pt-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      3 câu hỏi làm rõ của AI:
                    </p>
                    {clarifyQuestions.map((q, idx) => (
                      <div key={q.id} className="space-y-2 rounded-xl border border-border/60 bg-secondary/30 p-3">
                        <label className="text-xs font-medium text-foreground">
                          {idx + 1}. {q.question}
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {q.chips.map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() =>
                                setClarifyAnswers((prev) => ({ ...prev, [q.id]: chip }))
                              }
                              className={`rounded-full px-3 py-1 text-xs border transition-colors ${
                                clarifyAnswers[q.id] === chip
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-background hover:bg-secondary text-foreground"
                              }`}
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleProceedToStep3({
                        id: "direct_a",
                        name: q1Idea.slice(0, 40),
                        description: q1Idea,
                        target_user: clarifyAnswers["qa1"] || "Sinh viên",
                        test_in_one_week: "Khảo sát và phỏng vấn 5 người trong nhóm lớp.",
                        biggest_risk: clarifyAnswers["qa3"] || "Cần kiểm chứng nhu cầu thực tế.",
                      })}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      Tiếp tục chọn Ngách & Tên →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ENTRY B FORM */}
            {entry === "B" && (
              <div className="space-y-5 rounded-2xl border border-border bg-card p-5">
                {/* Domain Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-foreground">
                      Hướng đó liên quan đến chuyện gì?
                    </label>
                    <span className="text-xs text-muted-foreground">Chọn tối đa 2</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {DOMAIN_OPTIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDomain(d)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors ${
                          selectedDomains.includes(d)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background hover:bg-secondary text-foreground"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Problem Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">
                    Bạn từng thấy ai gặp rắc rối gì với chuyện {selectedDomains[0] || "này"}?
                  </label>
                  <textarea
                    value={observedProblem}
                    onChange={(e) => setObservedProblem(e.target.value)}
                    placeholder="Bạn cùng phòng mình hay nhịn bữa tối vì đi học về muộn, ngại đi chợ xa..."
                    rows={3}
                    className="w-full rounded-xl border border-input bg-background p-3 text-sm focus:border-primary focus:outline-none"
                  />

                  {/* Quick Helper Chips */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleLoadSituations}
                      disabled={loadingSituations}
                      className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      {loadingSituations ? <Loader2 className="animate-spin size-3" /> : <HelpCircle className="size-3" />}
                      Chưa nghĩ ra? Xem 3 tình huống hay gặp
                    </button>
                  </div>

                  {situations.length > 0 && (
                    <div className="grid gap-2 pt-2">
                      {situations.map((sit, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setObservedProblem(sit)}
                          className="rounded-xl border border-border/80 bg-secondary/30 p-2.5 text-left text-xs text-foreground hover:bg-secondary transition-colors"
                        >
                          &ldquo;{sit}&rdquo;
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Optional Team Strengths */}
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Nhóm có ai làm được việc gì? (Tuỳ chọn)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {STRENGTH_OPTIONS.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => toggleStrength(st)}
                        className={`rounded-full px-3 py-1 text-xs border transition-colors ${
                          selectedStrengths.includes(st)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background hover:bg-secondary text-foreground"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGenerateDirections}
                    disabled={!observedProblem.trim() || loadingDirections}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shadow-sm"
                  >
                    {loadingDirections ? <Loader2 className="animate-spin size-4" /> : <Sparkles className="size-4" />}
                    Gợi ý cho tôi 3 hướng đi →
                  </button>
                </div>
              </div>
            )}

            {/* ENTRY C FORM */}
            {entry === "C" && (
              <div className="space-y-5 rounded-2xl border border-border bg-card p-5">
                {/* 1. STRENGTHS */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    1. Nhóm có ai làm được việc gì tốt nhất?
                  </label>
                  <div className="flex flex-wrap gap-2 items-center">
                    {STRENGTH_OPTIONS.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => toggleStrength(st)}
                        className={`rounded-full px-3.5 py-1.5 text-xs border transition-colors ${
                          selectedStrengths.includes(st)
                            ? "border-primary bg-primary text-primary-foreground font-medium"
                            : "border-border bg-background hover:bg-secondary text-foreground"
                        }`}
                      >
                        {st}
                      </button>
                    ))}

                    {/* Custom added strengths */}
                    {selectedStrengths
                      .filter((st) => !STRENGTH_OPTIONS.includes(st))
                      .map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => toggleStrength(st)}
                          className="rounded-full px-3.5 py-1.5 text-xs border transition-colors border-primary bg-primary text-primary-foreground font-medium flex items-center gap-1.5"
                        >
                          <span>{st}</span>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStrengths((prev) => prev.filter((x) => x !== st));
                            }}
                            className="hover:opacity-75 font-bold ml-0.5"
                            title="Xóa tùy chọn này"
                          >
                            ✕
                          </span>
                        </button>
                      ))}

                    {/* Add Custom Strength */}
                    {showCustomStrength ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          autoFocus
                          value={customStrengthInput}
                          onChange={(e) => setCustomStrengthInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCustomStrength();
                            } else if (e.key === "Escape") {
                              setShowCustomStrength(false);
                            }
                          }}
                          placeholder="Nhập thế mạnh khác..."
                          className="rounded-full px-3 py-1.5 text-xs border border-primary bg-background text-foreground focus:outline-none w-44"
                        />
                        <button
                          type="button"
                          onClick={addCustomStrength}
                          className="rounded-full px-3 py-1.5 text-xs bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                        >
                          Thêm
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCustomStrength(false)}
                          className="text-xs text-muted-foreground hover:text-foreground px-1"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowCustomStrength(true)}
                        className="rounded-full px-3.5 py-1.5 text-xs border border-dashed border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                      >
                        + Tùy chọn khác
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. CONSTRAINTS */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    2. Nhóm có giới hạn hoặc điều kiện gì?
                  </label>
                  <div className="flex flex-wrap gap-2 items-center">
                    {CONSTRAINT_OPTIONS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleConstraint(c)}
                        className={`rounded-full px-3.5 py-1.5 text-xs border transition-colors ${
                          selectedConstraints.includes(c)
                            ? "border-primary bg-primary text-primary-foreground font-medium"
                            : "border-border bg-background hover:bg-secondary text-foreground"
                        }`}
                      >
                        {c}
                      </button>
                    ))}

                    {/* Custom added constraints */}
                    {selectedConstraints
                      .filter((c) => !CONSTRAINT_OPTIONS.includes(c))
                      .map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleConstraint(c)}
                          className="rounded-full px-3.5 py-1.5 text-xs border transition-colors border-primary bg-primary text-primary-foreground font-medium flex items-center gap-1.5"
                        >
                          <span>{c}</span>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedConstraints((prev) => prev.filter((x) => x !== c));
                            }}
                            className="hover:opacity-75 font-bold ml-0.5"
                            title="Xóa tùy chọn này"
                          >
                            ✕
                          </span>
                        </button>
                      ))}

                    {/* Add Custom Constraint */}
                    {showCustomConstraint ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          autoFocus
                          value={customConstraintInput}
                          onChange={(e) => setCustomConstraintInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCustomConstraint();
                            } else if (e.key === "Escape") {
                              setShowCustomConstraint(false);
                            }
                          }}
                          placeholder="Nhập giới hạn khác..."
                          className="rounded-full px-3 py-1.5 text-xs border border-primary bg-background text-foreground focus:outline-none w-44"
                        />
                        <button
                          type="button"
                          onClick={addCustomConstraint}
                          className="rounded-full px-3 py-1.5 text-xs bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                        >
                          Thêm
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCustomConstraint(false)}
                          className="text-xs text-muted-foreground hover:text-foreground px-1"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowCustomConstraint(true)}
                        className="rounded-full px-3.5 py-1.5 text-xs border border-dashed border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                      >
                        + Tùy chọn khác
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. DOMAINS */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    3. Lĩnh vực nhóm quan tâm:
                  </label>
                  <div className="flex flex-wrap gap-2 items-center">
                    {DOMAIN_OPTIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDomain(d)}
                        className={`rounded-full px-3.5 py-1.5 text-xs border transition-colors ${
                          selectedDomains.includes(d)
                            ? "border-primary bg-primary text-primary-foreground font-medium"
                            : "border-border bg-background hover:bg-secondary text-foreground"
                        }`}
                      >
                        {d}
                      </button>
                    ))}

                    {/* Custom added domains */}
                    {selectedDomains
                      .filter((d) => !DOMAIN_OPTIONS.includes(d))
                      .map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDomain(d)}
                          className="rounded-full px-3.5 py-1.5 text-xs border transition-colors border-primary bg-primary text-primary-foreground font-medium flex items-center gap-1.5"
                        >
                          <span>{d}</span>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDomains((prev) => prev.filter((x) => x !== d));
                            }}
                            className="hover:opacity-75 font-bold ml-0.5"
                            title="Xóa tùy chọn này"
                          >
                            ✕
                          </span>
                        </button>
                      ))}

                    {/* Add Custom Domain */}
                    {showCustomDomain ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          autoFocus
                          value={customDomainInput}
                          onChange={(e) => setCustomDomainInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCustomDomain();
                            } else if (e.key === "Escape") {
                              setShowCustomDomain(false);
                            }
                          }}
                          placeholder="Nhập lĩnh vực khác..."
                          className="rounded-full px-3 py-1.5 text-xs border border-primary bg-background text-foreground focus:outline-none w-44"
                        />
                        <button
                          type="button"
                          onClick={addCustomDomain}
                          className="rounded-full px-3 py-1.5 text-xs bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                        >
                          Thêm
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCustomDomain(false)}
                          className="text-xs text-muted-foreground hover:text-foreground px-1"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowCustomDomain(true)}
                        className="rounded-full px-3.5 py-1.5 text-xs border border-dashed border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                      >
                        + Tùy chọn khác
                      </button>
                    )}
                  </div>
                </div>

                {/* 4. OPTIONAL NOTE / CUSTOM IDEA */}
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                    <span>4. Ghi chú thêm hoặc ý tưởng ban đầu (Tùy chọn):</span>
                  </label>
                  <textarea
                    value={observedProblem}
                    onChange={(e) => setObservedProblem(e.target.value)}
                    placeholder="Nếu nhóm đã có sẵn ý tưởng sơ bộ hoặc mong muốn cụ thể nào, hãy ghi vào đây..."
                    rows={2}
                    className="w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGenerateDirections}
                    disabled={selectedDomains.length === 0 || loadingDirections}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {loadingDirections ? <Loader2 className="animate-spin size-4" /> : <Sparkles className="size-4" />}
                    Tìm ý tưởng từ thế mạnh nhóm →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: 3 HƯỚNG ĐI TỪ ĐIỀU BẠN KỂ */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold font-serif tracking-tight text-foreground">
                  3 hướng đi từ điều bạn kể
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Đây là giả định để bắt đầu, chưa phải kết luận. Chọn một, kết hợp hai, hoặc xin gợi ý khác.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <ArrowLeft className="size-3.5" /> Sửa câu trả lời
              </button>
            </div>

            {loadingDirections ? (
              <div className="flex h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60">
                <Loader2 className="animate-spin size-6 text-primary mb-2" />
                <p className="text-xs text-muted-foreground">Đang tính toán 3 hướng đi phù hợp với nguồn lực sinh viên...</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {directions.map((d, index) => {
                  const isSelected = selectedDirection?.id === d.id;
                  const isCheckedCombine = selectedForCombine.includes(d.id);

                  return (
                    <div
                      key={d.id}
                      className={`relative flex flex-col justify-between rounded-2xl border p-4.5 transition-all ${
                        isSelected
                          ? "border-primary bg-card ring-1 ring-primary shadow-sm"
                          : "border-border bg-card/70 hover:bg-card"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            HƯỚNG {index + 1}
                          </span>
                          <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                            Giả định cần kiểm chứng
                          </span>
                        </div>

                        <h3 className="font-serif font-bold text-base text-foreground leading-snug">
                          {d.name}
                        </h3>

                        <p className="text-xs text-foreground/80 leading-relaxed">
                          {d.description}
                        </p>

                        <div className="space-y-1.5 border-t border-border/60 pt-2 text-[11px]">
                          <div>
                            <span className="text-muted-foreground">Ai gặp vấn đề: </span>
                            <span className="text-foreground font-medium">{d.target_user}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Test trong 1 tuần: </span>
                            <span className="text-foreground">{d.test_in_one_week}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Rủi ro lớn nhất: </span>
                            <span className="text-foreground font-medium text-destructive">{d.biggest_risk}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDirection(d);
                            handleProceedToStep3(d);
                          }}
                          className="flex-1 rounded-xl bg-primary px-3 py-2 text-center text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          Chọn hướng này →
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (isCheckedCombine) {
                              setSelectedForCombine(selectedForCombine.filter((x) => x !== d.id));
                            } else {
                              if (selectedForCombine.length < 2) {
                                setSelectedForCombine([...selectedForCombine, d.id]);
                              }
                            }
                          }}
                          className={`rounded-xl border px-2.5 py-2 text-xs transition-colors ${
                            isCheckedCombine
                              ? "border-primary bg-primary/10 text-primary font-medium"
                              : "border-border hover:bg-secondary text-muted-foreground"
                          }`}
                          title="Ghép 2 ý thành 1"
                        >
                          {isCheckedCombine ? "✓ Đã chọn" : "+ Ghép"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/80 pt-4">
              <button
                type="button"
                onClick={handleGenerateDirections}
                disabled={loadingDirections}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="size-3.5" /> Gợi ý 3 hướng khác
              </button>

              {selectedForCombine.length === 2 && (
                <button
                  type="button"
                  onClick={handleCombineDirections}
                  className="rounded-xl border border-primary bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20"
                >
                  Kết hợp 2 hướng đã chọn →
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const custom = prompt("Nhập ý tưởng bạn tự nghĩ ra:");
                  if (custom && custom.trim()) {
                    handleProceedToStep3({
                      id: "custom_" + Date.now(),
                      name: custom.slice(0, 30),
                      description: custom,
                      target_user: "Sinh viên",
                      test_in_one_week: "Thực hiện khảo sát và phỏng vấn trực tiếp.",
                      biggest_risk: "Cần kiểm chứng nhu cầu thị trường.",
                    });
                  }
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Tôi tự viết ý tưởng
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: NGÁCH VÀ TÊN */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold font-serif tracking-tight text-foreground">
                Ai là người đầu tiên bạn phục vụ?
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Ngách càng hẹp, phần Vấn đề và Khách hàng càng dễ viết cụ thể và dễ đi hỏi thật.
              </p>
            </div>

            {/* 3 Niches Choices */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Chọn ngách khách hàng đầu tiên
              </label>

              {loadingNiches ? (
                <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-border">
                  <Loader2 className="animate-spin size-5 text-primary" />
                </div>
              ) : (
                <div className="grid gap-3">
                  {niches.map((n) => {
                    const isSelected = selectedNiche === n.name;
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => setSelectedNiche(n.name)}
                        className={`rounded-xl border p-4 text-left transition-all ${
                          isSelected
                            ? "border-primary bg-card ring-1 ring-primary shadow-sm"
                            : "border-border bg-card/70 hover:bg-card"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-semibold text-sm text-foreground">{n.name}</span>
                          {isSelected && <Check className="size-4 text-primary shrink-0" />}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                          {n.tradeoffs.map((t, i) => (
                            <span key={i} className="rounded-md bg-secondary/80 px-2 py-0.5">
                              {t}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 6 Names Suggestions */}
            <div className="space-y-3 pt-4 border-t border-border/60">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Chọn tên dự án (đổi được sau)
                </label>
                <span className="text-[11px] text-muted-foreground">
                  Nhắc nhỏ: Kiểm tra trên Google / Facebook trước khi dùng chính thức
                </span>
              </div>

              {loadingNames ? (
                <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-border">
                  <Loader2 className="animate-spin size-5 text-primary" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {names.map((nm) => {
                    const isSelected = (selectedName === nm.name && !customName);
                    return (
                      <button
                        key={nm.name}
                        type="button"
                        onClick={() => {
                          setSelectedName(nm.name);
                          setCustomName("");
                        }}
                        className={`rounded-xl border px-3.5 py-2 text-xs transition-colors flex items-center gap-2 ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground font-semibold"
                            : "border-border bg-card hover:bg-secondary text-foreground"
                        }`}
                      >
                        <span>{nm.name}</span>
                        <span className={`text-[10px] opacity-75 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`}>
                          · {nm.style}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Custom Name Input */}
              <div className="pt-2">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => {
                    setCustomName(e.target.value);
                    if (e.target.value) setSelectedName("");
                  }}
                  placeholder="Hoặc tự đặt tên của bạn..."
                  className="w-full max-w-sm rounded-xl border border-input bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-6 border-t border-border/80">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <ArrowLeft className="size-3.5" /> Quay lại Bước 2
              </button>

              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={!selectedNiche || (!selectedName && !customName)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shadow-sm"
              >
                Hoàn tất Thẻ dự án →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: BẮT ĐẦU VIẾT */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold font-serif tracking-tight text-foreground">
                Thẻ dự án đã hoàn thành!
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Thẻ dự án này sẽ là nguồn sự thật duy nhất cho mọi prompt viết bài và đối chiếu của bộ chấm.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-start justify-between border-b border-border/60 pb-4">
                <div>
                  <h3 className="font-serif font-bold text-xl text-foreground">{cardName}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{cardDomain} · EXE101 · Checkpoint 2</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Sửa thẻ
                </button>
              </div>

              <div className="grid gap-3 text-xs">
                <div>
                  <span className="font-semibold text-muted-foreground">Ý tưởng: </span>
                  <span className="text-foreground leading-relaxed">{cardOneLiner}</span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Ngách phục vụ: </span>
                  <span className="text-foreground font-medium">{cardNiche}</span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Giả định lớn nhất: </span>
                  <span className="text-foreground">{cardAssumption}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleCompleteProject("chatgpt")}
                  disabled={savingProject}
                  className="w-full sm:w-auto flex-1 rounded-xl bg-primary px-5 py-3 text-center text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shadow"
                >
                  {savingProject ? <Loader2 className="animate-spin size-4 mx-auto" /> : "Bắt đầu viết trong ChatGPT →"}
                </button>

                <button
                  type="button"
                  onClick={() => handleCompleteProject("web")}
                  disabled={savingProject}
                  className="w-full sm:w-auto rounded-xl border border-border bg-background px-4 py-3 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  Viết trên web (không cài extension)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: LIVE PROJECT CARD (THẺ DỰ ÁN) */}
      <aside className="space-y-4">
        <div className="sticky top-6 rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-serif">
              THẺ DỰ ÁN
            </span>
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="size-3" /> Tự điền khi trả lời
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tên dự án</p>
              <h3 className="font-serif font-bold text-base text-foreground mt-0.5">
                {cardName}
              </h3>
              <p className="text-[11px] text-muted-foreground">{cardDomain} · Checkpoint 2</p>
            </div>

            <div className="border-t border-border/60 pt-2.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Vấn đề bạn đã thấy</p>
              <p className="mt-0.5 text-foreground/90 italic leading-relaxed text-[11.5px]">
                &ldquo;{cardProblem}&rdquo;
              </p>
            </div>

            <div className="border-t border-border/60 pt-2.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Ý tưởng</p>
              <p className="mt-0.5 text-foreground leading-relaxed">
                {cardOneLiner}
              </p>
            </div>

            <div className="border-t border-border/60 pt-2.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Ngách đầu tiên</p>
              <p className="mt-0.5 font-medium text-foreground">
                {cardNiche}
              </p>
            </div>

            <div className="border-t border-border/60 pt-2.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Giả định cần kiểm chứng</p>
              <p className="mt-0.5 text-[11.5px] text-amber-800 dark:text-amber-300 font-medium">
                {cardAssumption}
              </p>
            </div>
          </div>

          {step < 4 && (
            <div className="pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={!selectedDirection}
                className="w-full rounded-xl bg-secondary/80 py-2.5 text-center text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-40"
              >
                Đủ để bắt đầu →
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
