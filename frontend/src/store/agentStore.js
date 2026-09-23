import { create } from "zustand";

export const useAgentStore = create(set => ({
  runId: null,
  status: "idle",
  logs: [],
  leads: [],

  setRunId: id => set({ runId: id }),
  setStatus: status => set({ status }),
  addLog: log => set(state => ({ logs: [...state.logs, log] })),
  setLeads: leads => set({ leads }),
}));