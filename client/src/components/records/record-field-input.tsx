import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { DataObjectField } from "@/api/data-model"

type RecordFieldInputProps = {
  field: DataObjectField
  value: string | number | boolean | null | undefined
  onChange: (next: string | number | boolean | null) => void
}

export const RecordFieldInput = ({
  field,
  value,
  onChange,
}: RecordFieldInputProps) => {
  const fieldId = `record-field-${field.id}`

  if (field.type === "BOOLEAN") {
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          id={fieldId}
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange(Boolean(checked))}
        />
        <Label htmlFor={fieldId} className="font-normal">
          {field.name}
        </Label>
      </div>
    )
  }

  if (field.type === "SELECT" && field.options?.length) {
    return (
      <div className="space-y-2">
        <Label htmlFor={fieldId}>{field.name}</Label>
        <Select
          value={value != null ? String(value) : ""}
          onValueChange={(next) => onChange(next || null)}
        >
          <SelectTrigger id={fieldId} className="h-10 w-full">
            <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent align="start" alignItemWithTrigger={false}>
            {field.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  const inputType =
    field.type === "NUMBER"
      ? "number"
      : field.type === "DATE"
        ? "date"
        : field.type === "DATETIME"
          ? "datetime-local"
          : "text"

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>{field.name}</Label>
      <Input
        id={fieldId}
        type={inputType}
        value={value != null ? String(value) : ""}
        onChange={(event) => {
          const raw = event.target.value
          if (field.type === "NUMBER") {
            onChange(raw === "" ? null : Number(raw))
            return
          }
          onChange(raw)
        }}
        placeholder={`Enter ${field.name.toLowerCase()}`}
      />
    </div>
  )
}

export const editableObjectFields = (fields: DataObjectField[]) =>
  fields.filter((field) => !field.isSystem)
