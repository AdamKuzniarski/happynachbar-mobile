import type { Activity } from "@/lib/api/types";
import { ActivityCard } from "./ActivityCard";
import { CreateActivityCard } from "./CreateActivityCard";

type ActivityGridProps = {
  activities: Activity[];
  creating: boolean;
  onCreate: () => void;
};

export function ActivityGrid(props: ActivityGridProps) {
  const { activities, creating, onCreate } = props;
  return (
    <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
      {activities.map((a) => (
        <ActivityCard key={a.id} activity={a} />
      ))}
      <CreateActivityCard creating={creating} onCreate={onCreate} />
    </div>
  );
}
