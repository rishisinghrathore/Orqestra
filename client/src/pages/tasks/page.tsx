import { EmptyWorkspacePage } from "@/components/empty-workspace-page"
import { Add01Icon, Task01Icon } from "@hugeicons/core-free-icons"

const TasksPage = () => {
  return (
    <EmptyWorkspacePage
      icon={Task01Icon}
      title="No tasks yet"
      description="Stay on top of follow-ups, reminders, and next steps once work starts flowing in."
      primaryAction={{ label: "Create task", icon: Add01Icon }}
    />
  )
}

export default TasksPage
