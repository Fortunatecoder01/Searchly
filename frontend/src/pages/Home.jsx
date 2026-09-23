import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">AI Job Agent</h1>
      <Button onClick={() => navigate("/search")} className="mt-4">
        Start Searching
      </Button>
    </div>
  );
}