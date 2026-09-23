export async function startAgent() {
  await new Promise(r => setTimeout(r, 800));
  return { runId: "mock-run-123", status: "started" };
}

export async function getAgentStatus() {
  await new Promise(r => setTimeout(r, 500));
  return {
    status: "searching",
    logs: ["Agent is searching for jobs...", "Found 12 leads"],
    leads: [{ company: "MockCorp", role: "Frontend Developer", url: "#" }],
  };
}