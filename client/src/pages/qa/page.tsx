import { EmptyWorkspacePage } from "@/components/empty-workspace-page"
import { Add01Icon, ChatQuestionIcon } from "@hugeicons/core-free-icons"

const QaPage = () => {
  return (
    <EmptyWorkspacePage
      icon={ChatQuestionIcon}
      title="No questions yet"
      description="Answer public questions and seed FAQs for your locations once listings are connected."
      primaryAction={{ label: "Add FAQ", icon: Add01Icon }}
    />
  )
}

export default QaPage
