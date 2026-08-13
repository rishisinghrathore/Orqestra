type PagePlaceholderProps = {
  title: string
  description: string
}

const PagePlaceholder = ({ title, description }: PagePlaceholderProps) => {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-12">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export default PagePlaceholder
