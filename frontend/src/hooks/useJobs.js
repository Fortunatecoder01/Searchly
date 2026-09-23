import { useJobStore } from "../store/jobStore";

export default function useJobs() {
  const { jobs, setJobs } = useJobStore();
  return { jobs, setJobs };
}