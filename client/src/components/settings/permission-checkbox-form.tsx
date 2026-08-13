import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  permissionGroups,
  statement,
  type PermissionMap,
} from "@/lib/permissions"

type PermissionCheckboxFormProps = {
  value: PermissionMap
  onChange: (next: PermissionMap) => void
  disabled?: boolean
}

export const PermissionCheckboxForm = ({
  value,
  onChange,
  disabled = false,
}: PermissionCheckboxFormProps) => {
  const toggleAction = (resource: string, action: string, checked: boolean) => {
    const current = value[resource] ?? []
    const nextActions = checked
      ? [...new Set([...current, action])]
      : current.filter((item) => item !== action)

    onChange({
      ...value,
      [resource]: nextActions,
    })
  }

  const toggleResource = (resource: string, actions: readonly string[], checked: boolean) => {
    onChange({
      ...value,
      [resource]: checked ? [...actions] : [],
    })
  }

  return (
    <div className="space-y-8">
      {permissionGroups.map((group) => (
        <section key={group.title} className="space-y-4">
          <div>
            <h3 className="text-base font-medium">{group.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose which {group.title.toLowerCase()} actions this role can perform.
            </p>
          </div>

          <div className="space-y-4">
            {group.resources.map((resource) => {
              const actions = statement[resource.key]
              const selected = value[resource.key] ?? []
              const allSelected =
                actions.length > 0 && actions.every((action) => selected.includes(action))

              return (
                <div
                  key={resource.key}
                  className="rounded-xl border border-border bg-card px-4 py-4 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{resource.label}</p>
                      <p className="text-xs text-muted-foreground">{resource.key}</p>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Checkbox
                        checked={allSelected}
                        disabled={disabled}
                        onCheckedChange={(checked) =>
                          toggleResource(resource.key, actions, checked === true)
                        }
                      />
                      Select all
                    </label>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {actions.map((action) => {
                      const id = `${resource.key}-${action}`
                      const checked = selected.includes(action)

                      return (
                        <div key={id} className="flex items-center gap-2">
                          <Checkbox
                            id={id}
                            checked={checked}
                            disabled={disabled}
                            onCheckedChange={(next) =>
                              toggleAction(resource.key, action, next === true)
                            }
                          />
                          <Label htmlFor={id} className="font-normal capitalize">
                            {action}
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
