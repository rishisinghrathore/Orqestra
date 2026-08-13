export type ObjectApp = "custom" | "standard"

export type DataObjectField = {
  id: string
  name: string
  app: ObjectApp
  dataType: string
}

export type DataObjectRelation = {
  id: string
  name: string
  app: ObjectApp
  type: string
}

export type DataObject = {
  id: string
  singularName: string
  pluralName: string
  description: string
  app: ObjectApp
  records: number
  fields: DataObjectField[]
  relations: DataObjectRelation[]
}

const DEFAULT_FIELDS: Omit<DataObjectField, "id">[] = [
  { name: "Created by", app: "custom", dataType: "Actor" },
  { name: "Creation date", app: "custom", dataType: "Date and Time" },
  { name: "Deleted at", app: "custom", dataType: "Date and Time" },
  { name: "Last update", app: "custom", dataType: "Date and Time" },
  { name: "Name", app: "custom", dataType: "Text" },
  { name: "Updated by", app: "custom", dataType: "Actor" },
]

const seedObjects = (): DataObject[] => [
  {
    id: "apps",
    singularName: "App",
    pluralName: "Apps",
    description: "",
    app: "custom",
    records: 0,
    fields: DEFAULT_FIELDS.map((field, index) => ({
      ...field,
      id: `apps-field-${index}`,
    })),
    relations: [],
  },
  {
    id: "coins",
    singularName: "Coin",
    pluralName: "Coins",
    description: "",
    app: "custom",
    records: 0,
    fields: DEFAULT_FIELDS.map((field, index) => ({
      ...field,
      id: `coins-field-${index}`,
    })),
    relations: [],
  },
  {
    id: "companies",
    singularName: "Company",
    pluralName: "Companies",
    description: "",
    app: "standard",
    records: 0,
    fields: DEFAULT_FIELDS.map((field, index) => ({
      ...field,
      id: `companies-field-${index}`,
    })),
    relations: [],
  },
  {
    id: "dashboards",
    singularName: "Dashboard",
    pluralName: "Dashboards",
    description: "",
    app: "standard",
    records: 0,
    fields: DEFAULT_FIELDS.map((field, index) => ({
      ...field,
      id: `dashboards-field-${index}`,
    })),
    relations: [],
  },
  {
    id: "notes",
    singularName: "Note",
    pluralName: "Notes",
    description: "",
    app: "standard",
    records: 0,
    fields: DEFAULT_FIELDS.map((field, index) => ({
      ...field,
      id: `notes-field-${index}`,
    })),
    relations: [],
  },
  {
    id: "opportunities",
    singularName: "Opportunity",
    pluralName: "Opportunities",
    description: "",
    app: "standard",
    records: 0,
    fields: DEFAULT_FIELDS.map((field, index) => ({
      ...field,
      id: `opportunities-field-${index}`,
    })),
    relations: [],
  },
  {
    id: "people",
    singularName: "Person",
    pluralName: "People",
    description: "",
    app: "standard",
    records: 0,
    fields: DEFAULT_FIELDS.map((field, index) => ({
      ...field,
      id: `people-field-${index}`,
    })),
    relations: [],
  },
  {
    id: "tasks",
    singularName: "Task",
    pluralName: "Tasks",
    description: "",
    app: "standard",
    records: 0,
    fields: DEFAULT_FIELDS.map((field, index) => ({
      ...field,
      id: `tasks-field-${index}`,
    })),
    relations: [],
  },
  {
    id: "workflows",
    singularName: "Workflow",
    pluralName: "Workflows",
    description: "",
    app: "standard",
    records: 0,
    fields: DEFAULT_FIELDS.map((field, index) => ({
      ...field,
      id: `workflows-field-${index}`,
    })),
    relations: [],
  },
]

let objects = seedObjects()
const listeners = new Set<() => void>()

const notify = () => {
  for (const listener of listeners) listener()
}

export const subscribeDataObjects = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const getDataObjects = () => objects

export const getDataObject = (id: string) =>
  objects.find((object) => object.id === id) ?? null

export const createDataObject = (input: {
  singularName: string
  pluralName: string
  description: string
}) => {
  const id = `object-${crypto.randomUUID()}`
  const next: DataObject = {
    id,
    singularName: input.singularName,
    pluralName: input.pluralName,
    description: input.description,
    app: "custom",
    records: 0,
    fields: DEFAULT_FIELDS.map((field, index) => ({
      ...field,
      id: `${id}-field-${index}`,
    })),
    relations: [],
  }

  objects = [next, ...objects]
  notify()
  return next
}

export const updateDataObject = (
  id: string,
  patch: Partial<
    Pick<DataObject, "singularName" | "pluralName" | "description">
  >
) => {
  objects = objects.map((object) =>
    object.id === id ? { ...object, ...patch } : object
  )
  notify()
  return getDataObject(id)
}
