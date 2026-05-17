// src/services/trainingProgramService.js

const API_BASE_URL = "http://10.0.2.2:3000";

async function apiRequest(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json.message || "Bir hata oluştu");
  }

  return json;
}

const TrainingProgramService = {
  async getProgram(token) {
    return apiRequest("/api/program/user", { method: "GET", token });
  },

  async generateProgram({ token, level, daysPerWeek, user }) {
    return apiRequest("/api/program/generate", {
      method: "POST",
      token,
      body: {
        difficulty: level,
        daysPerWeek,
        userProfile: {
          height: user.height,
          weight: user.weight,
          age: user.age,
          goal: user.goal,
          illnesses: user.illnesses,
        }
      }
    });
  },
};

export default TrainingProgramService;
