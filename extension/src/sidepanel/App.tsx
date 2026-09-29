import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "../lib/api";
import { clearStoredSession, getStoredToken } from "../lib/auth";
import { pingTab, SiteId } from "../lib/messages";
import { track } from "../lib/tracking";
import { FixAction, GradeResult, Pack, Project, Section, UserSession } from "../lib/types";
import { UnsupportedSiteNotice } from "./components/ManualFallback";
import { CompareModal } from "./screens/CompareModal";
import { FixModal } from "./screens/FixModal";
import { GradeResultScreen } from "./screens/GradeResultScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { OutOfCreditsScreen } from "./screens/OutOfCreditsScreen";
import { ProjectSetupScreen } from "./screens/ProjectSetupScreen";
import { SectionDetailScreen } from "./screens/SectionDetailScreen";
import { SectionListScreen, SectionStatus } from "./screens/SectionListScreen";

type Screen =
  | "LOGIN"
  | "PROJECT_SETUP"
  | "SECTION_LIST"
  | "SECTION_DETAIL"
  | "GRADE_RESULT"
  | "FIX_MODAL"
  | "COMPARE_MODAL"
  | "OUT_OF_CREDITS";

export function App() {
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>("LOGIN");
  const [sessionUser, setSessionUser] = useState<UserSession | null>(null);
  const [siteId, setSiteId] = useState<SiteId | null>(null);

  const [packs, setPacks] = useState<Pack[]>([]);
  const [currentPack, setCurrentPack] = useState<Pack | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [currentGradeResult, setCurrentGradeResult] = useState<GradeResult | null>(null);
  const [selectedFixAction, setSelectedFixAction] = useState<FixAction | null>(null);
  const [sectionStatuses, setSectionStatuses] = useState<Record<string, SectionStatus>>({});

  // 1. Check active tab (ChatGPT or Gemini)
  useEffect(() => {
    async function checkSite() {
      const ping = await pingTab();
      setSiteId(ping.site);
    }
    checkSite();

    // Re-check on tab switch
    if (chrome?.tabs?.onActivated) {
      chrome.tabs.onActivated.addListener(checkSite);
    }
    if (chrome?.tabs?.onUpdated) {
      chrome.tabs.onUpdated.addListener(checkSite);
    }
  }, []);

  // 2. Load auth session and listen to changes
  const initSession = async () => {
    const token = await getStoredToken();
    if (!token) {
      setLoading(false);
      setScreen("LOGIN");
      return;
    }

    try {
      const user = await api.getMe();
      setSessionUser(user);

      // Fetch packs and projects
      const [loadedPacks, loadedProjects] = await Promise.all([
        api.getPacks(),
        api.getProjects(),
      ]);

      setPacks(loadedPacks);
      setProjects(loadedProjects);

      const pack = loadedPacks[0] ?? null;
      setCurrentPack(pack);

      if (loadedProjects.length > 0) {
        setActiveProject(loadedProjects[0]);
        setScreen("SECTION_LIST");
      } else {
        setScreen("PROJECT_SETUP");
      }
    } catch (err: any) {
      console.warn("Init session error:", err);
      if (err?.code === "UNAUTHENTICATED" || err?.status === 401) {
        await clearStoredSession();
      }
      setScreen("LOGIN");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initSession();

    // Listen to chrome.storage.onChanged to automatically detect login
    const storageListener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes.ra_session_token?.newValue) {
        initSession();
      }
    };

    if (chrome?.storage?.onChanged) {
      chrome.storage.onChanged.addListener(storageListener);
    }

    return () => {
      if (chrome?.storage?.onChanged) {
        chrome.storage.onChanged.removeListener(storageListener);
      }
    };
  }, []);

  // Update section status when a grade is received
  const handleGradeReceived = (result: GradeResult) => {
    setCurrentGradeResult(result);

    // Update section status
    const hasChuaDat = result.criteria.some((c) => c.level === "CHUA_DAT");
    setSectionStatuses((prev) => ({
      ...prev,
      [result.section_id]: hasChuaDat ? "DANG_SUA" : "DAT",
    }));

    if (sessionUser) {
      setSessionUser({
        ...sessionUser,
        credits: result.credits_left,
      });
    }

    setScreen("GRADE_RESULT");
  };

  const handleRegradeReceived = (newResult: GradeResult) => {
    setCurrentGradeResult(newResult);

    const hasChuaDat = newResult.criteria.some((c) => c.level === "CHUA_DAT");
    setSectionStatuses((prev) => ({
      ...prev,
      [newResult.section_id]: hasChuaDat ? "DANG_SUA" : "DAT",
    }));

    if (sessionUser) {
      setSessionUser({
        ...sessionUser,
        credits: newResult.credits_left,
      });
    }

    setScreen("COMPARE_MODAL");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#090d16]">
        <Loader2 className="animate-spin text-blue-500 size-6" />
      </div>
    );
  }

  // Not logged in (S1)
  if (screen === "LOGIN" || !sessionUser) {
    return <LoginScreen onLoginSuccess={initSession} />;
  }

  // S2: Project Setup (Can be done from any tab)
  if (screen === "PROJECT_SETUP") {
    return (
      <ProjectSetupScreen
        packs={packs}
        onCancel={projects.length > 0 ? () => setScreen("SECTION_LIST") : undefined}
        onProjectCreated={(newProj) => {
          setProjects((prev) => [newProj, ...prev]);
          setActiveProject(newProj);
          track("project_created", {
            pack_id: newProj.packId,
            has_data: Boolean(newProj.availableData && Object.keys(newProj.availableData).length > 0),
          });
          setScreen("SECTION_LIST");
        }}
      />
    );
  }

  // Check if current tab is ChatGPT or Gemini for sections and grading
  if (!siteId) {
    return <UnsupportedSiteNotice />;
  }

  // S4: Section Detail (Prompt viewer & insert)
  if (screen === "SECTION_DETAIL" && activeSection && activeProject && currentPack) {
    return (
      <SectionDetailScreen
        section={activeSection}
        project={activeProject}
        pack={currentPack}
        siteId={siteId}
        creditsLeft={sessionUser.credits}
        onBack={() => setScreen("SECTION_LIST")}
        onGradeComplete={(res) => handleGradeReceived(res)}
        onOutOfCredits={() => setScreen("OUT_OF_CREDITS")}
      />
    );
  }

  // S5: Grade Result
  if (screen === "GRADE_RESULT" && currentGradeResult && activeSection && activeProject && currentPack) {
    return (
      <GradeResultScreen
        result={currentGradeResult}
        section={activeSection}
        project={activeProject}
        pack={currentPack}
        siteId={siteId}
        creditsLeft={sessionUser.credits}
        onBack={() => setScreen("SECTION_LIST")}
        onSelectFixAction={(action) => {
          setSelectedFixAction(action);
          setScreen("FIX_MODAL");
        }}
        onRegradeComplete={(res) => handleRegradeReceived(res)}
        onOutOfCredits={() => setScreen("OUT_OF_CREDITS")}
      />
    );
  }

  // S6: Fix Action Modal
  if (screen === "FIX_MODAL" && selectedFixAction && currentGradeResult) {
    return (
      <FixModal
        action={selectedFixAction}
        gradeResult={currentGradeResult}
        siteId={siteId}
        onClose={() => setScreen("GRADE_RESULT")}
        onSuccess={() => setScreen("GRADE_RESULT")}
      />
    );
  }

  // S7: Compare Modal
  if (screen === "COMPARE_MODAL" && currentGradeResult && activeSection) {
    return (
      <CompareModal
        newResult={currentGradeResult}
        section={activeSection}
        onContinue={() => setScreen("GRADE_RESULT")}
      />
    );
  }

  // S8: Out of credits
  if (screen === "OUT_OF_CREDITS") {
    return <OutOfCreditsScreen onBack={() => setScreen("SECTION_LIST")} />;
  }

  // S3: Section List (Default view for logged in user with active project)
  if (activeProject && currentPack) {
    return (
      <SectionListScreen
        project={activeProject}
        pack={currentPack}
        sectionStatuses={sectionStatuses}
        onSelectSection={(sec) => {
          setActiveSection(sec);
          setScreen("SECTION_DETAIL");
        }}
        onChangeProject={() => {
          const nextIndex = (projects.indexOf(activeProject) + 1) % projects.length;
          setActiveProject(projects[nextIndex]);
        }}
        onNewProject={() => setScreen("PROJECT_SETUP")}
      />
    );
  }

  return (
    <div className="flex h-screen items-center justify-center p-4 text-center">
      <button
        onClick={() => setScreen("PROJECT_SETUP")}
        className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
      >
        Tạo dự án đầu tiên
      </button>
    </div>
  );
}
