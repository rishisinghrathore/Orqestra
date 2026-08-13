import { useState } from "react"

import { IntegrationDialog } from "@/components/integration-dialog"
import { Badge } from "@/components/ui/badge"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import {
  availableIntegrations,
  connectedIntegrations,
  type Integration,
} from "@/lib/integrations"

const IntegrationSection = ({
  title,
  description,
  emptyMessage,
  items,
  onSelect,
}: {
  title: string
  description: string
  emptyMessage: string
  items: Integration[]
  onSelect: (integration: Integration) => void
}) => {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <ItemGroup className="grid gap-3 sm:grid-cols-2">
          {items.map((integration) => (
            <Item
              key={integration.id}
              variant="outline"
              size="default"
              className="cursor-pointer hover:bg-muted/40"
              onClick={() => onSelect(integration)}
            >
              <ItemMedia variant="image">
                <img
                  src={integration.logo}
                  alt={`${integration.title} logo`}
                />
              </ItemMedia>
              <ItemContent>
                <div className="flex items-center gap-2">
                  <ItemTitle>{integration.title}</ItemTitle>
                  {integration.connected ? (
                    <Badge
                      variant="secondary"
                      className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    >
                      Connected
                    </Badge>
                  ) : null}
                </div>
                <ItemDescription className="text-wrap">
                  {integration.shortDescription}
                </ItemDescription>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      )}
    </section>
  )
}

const IntegrationsPage = () => {
  const [selectedIntegration, setSelectedIntegration] =
    useState<Integration | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const openIntegration = (integration: Integration) => {
    setSelectedIntegration(integration)
    setDialogOpen(true)
  }

  return (
    <>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-12">
        <div className="flex w-full max-w-5xl flex-col gap-10">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Integrations
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Connect tools to sync data and automate workflows across PlaceOps.
            </p>
          </div>

          <IntegrationSection
            title="Connected apps"
            description="Apps currently connected to your workspace."
            emptyMessage="No apps connected yet. Browse available integrations below."
            items={connectedIntegrations}
            onSelect={openIntegration}
          />

          <IntegrationSection
            title="Add connection"
            description="Browse integrations and connect new apps to your workspace."
            emptyMessage="All available integrations are already connected."
            items={availableIntegrations}
            onSelect={openIntegration}
          />
        </div>
      </div>

      <IntegrationDialog
        key={selectedIntegration?.id}
        integration={selectedIntegration}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  )
}

export default IntegrationsPage
