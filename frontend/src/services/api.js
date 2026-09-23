const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function startAgent(payload) {
  return fetch(`${API_BASE}/api/agent/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(r => r.json());
}

export async function getAgentStatus(runId) {
  return fetch(`${API_BASE}/api/agent/run/${runId}`).then(r => r.json());
}