import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, PlusCircle } from 'lucide-react'

export interface TeamEntry {
  id: string
  name: string
  players: string
}

interface RowProps {
  entry: TeamEntry
  index: number
  onChange: (id: string, field: 'name' | 'players', value: string) => void
  onRemove: (id: string) => void
  showSeed: boolean
}

function SortableRow({ entry, index, onChange, onRemove, showSeed }: RowProps) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
      {showSeed && (
        <button {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-500 dark:text-gray-600">
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      <span className="w-5 text-xs text-gray-400">{index + 1}</span>
      <input
        value={entry.name}
        onChange={e => onChange(entry.id, 'name', e.target.value)}
        placeholder={t('create.teamName')}
        className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      />
      <input
        value={entry.players}
        onChange={e => onChange(entry.id, 'players', e.target.value)}
        placeholder={t('create.players')}
        className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      />
      <button onClick={() => onRemove(entry.id)} className="text-red-400 hover:text-red-600">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

interface Props {
  teams: TeamEntry[]
  onChange: (teams: TeamEntry[]) => void
  showSeed: boolean
}

export function TeamInput({ teams, onChange, showSeed }: Props) {
  const { t } = useTranslation()
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const ids = useMemo(() => teams.map(t => t.id), [teams])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = teams.findIndex(t => t.id === active.id)
    const newIdx = teams.findIndex(t => t.id === over.id)
    const next = [...teams]
    const [item] = next.splice(oldIdx, 1)
    next.splice(newIdx, 0, item)
    onChange(next)
  }

  const handleChange = (id: string, field: 'name' | 'players', value: string) => {
    onChange(teams.map(t => (t.id === id ? { ...t, [field]: value } : t)))
  }

  const handleRemove = (id: string) => onChange(teams.filter(t => t.id !== id))

  const addTeam = () =>
    onChange([...teams, { id: crypto.randomUUID(), name: '', players: '' }])

  return (
    <div className="space-y-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {teams.map((entry, i) => (
            <SortableRow
              key={entry.id}
              entry={entry}
              index={i}
              onChange={handleChange}
              onRemove={handleRemove}
              showSeed={showSeed}
            />
          ))}
        </SortableContext>
      </DndContext>
      <button
        type="button"
        onClick={addTeam}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-brand-400 hover:text-brand-500 dark:border-gray-600 dark:text-gray-400"
      >
        <PlusCircle className="h-4 w-4" />
        {t('create.addTeam')}
      </button>
    </div>
  )
}
