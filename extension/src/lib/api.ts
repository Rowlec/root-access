import { getStoredToken } from "./auth";
import { GradeResult, Pack, Project, UserSession } from "./types";

export const API_BASE_URL =
  process.env.VITE_API_URL || "https://root-access.site";

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    throw { code: "UNAUTHENTICATED", message: "Phiên đăng nhập đã hết hạn" };
  }

  if (response.status === 402) {
    throw { code: "NO_CREDIT", message: "Hết credit" };
  }

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // not json
    }
    throw {
      code: errorData.code || "REQUEST_FAILED",
      message: errorData.message || `Lỗi yêu cầu (${response.status})`,
      status: response.status,
      result: errorData.result,
    };
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export const api = {
  async getMe(): Promise<UserSession> {
    return request<UserSession>("/api/me");
  },

  async getPacks(): Promise<Pack[]> {
    return request<Pack[]>("/api/packs");
  },

  async getPack(id: string): Promise<Pack> {
    return request<Pack>(`/api/packs/${id}`);
  },

  async getProjects(): Promise<Project[]> {
    return request<Project[]>("/api/projects");
  },

  async createProject(data: {
    name: string;
    idea: string;
    target_customer: string;
    available_data?: Record<string, unknown>;
    pack_id?: string;
  }): Promise<Project> {
    return request<Project>("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async validateProject(data: {
    idea?: string;
    target_customer?: string;
    available_data?: Record<string, unknown>;
  }): Promise<{ ok: boolean; issues: Array<{ field: string; message: string; severity: string }> }> {
    return request("/api/projects/validate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async buildPrompt(
    projectId: string,
    sectionId: string,
    site: string,
  ): Promise<{ prompt_text: string; insertion_id: string }> {
    return request("/api/prompts/build", {
      method: "POST",
      body: JSON.stringify({
        project_id: projectId,
        section_id: sectionId,
        site,
      }),
    });
  },

  async gradeAnswer(data: {
    project_id: string;
    section_id: string;
    output_text: string;
    insertion_id?: string | null;
    parent_grade_id?: string | null;
    site: string;
  }): Promise<GradeResult> {
    return request<GradeResult>("/api/grade", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async fixPrompt(data: {
    grade_id: string;
    action_id: string;
    user_input?: Record<string, unknown> | string | null;
  }): Promise<{ prompt_text: string; insertion_id: string }> {
    return request("/api/fix-prompt", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async sendEvents(
    events: Array<{ name: string; props?: Record<string, unknown> }>,
  ): Promise<void> {
    return request("/api/events", {
      method: "POST",
      body: JSON.stringify(events),
    });
  },

  async getSelectors(): Promise<any> {
    return request("/api/selectors");
  },

  async getIntake(projectId: string, sectionId: string): Promise<any> {
    return request(`/api/projects/${projectId}/sections/${sectionId}/intake`);
  },

  async saveIntake(projectId: string, sectionId: string, answers: Record<string, any>): Promise<any> {
    return request(`/api/projects/${projectId}/sections/${sectionId}/intake`, {
      method: "PUT",
      body: JSON.stringify({ answers }),
    });
  },

  async saveSection(
    projectId: string,
    sectionId: string,
    data: { savedText: string; gradeId?: string; status?: string; chatUrl?: string },
  ): Promise<any> {
    return request(`/api/projects/${projectId}/sections/${sectionId}/save`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getProjectOverview(projectId: string): Promise<any> {
    return request(`/api/projects/${projectId}/overview`);
  },
};
