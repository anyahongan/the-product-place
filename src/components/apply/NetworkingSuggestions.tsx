import { Sheet, Tape } from "@/components/paper/Paper";
import type { ContactSuggestion } from "@/types/apply";

export function NetworkingSuggestions({ contacts }: { contacts: ContactSuggestion[] }) {
  return (
    <Sheet tone="pink" soft shadow="hard-sm" className="relative mt-6 px-5 py-5">
      <Tape className="-top-3 right-8" color="pink" angle={6} width={90} height={24} />
      <p className="font-display text-[1.25rem] font-black uppercase leading-[0.95]">
        Haven&apos;t heard back?
      </p>
      <p className="tag mt-2 text-ink-soft">People worth reaching out to →</p>
      <ul className="mt-4 space-y-3">
        {contacts.map((c) => (
          <li key={c.id} className="border-2 border-ink bg-paper px-3 py-3">
            <p className="font-display text-[1rem] font-black uppercase leading-tight">{c.label}</p>
            <p className="tag mt-1 text-ink-faint">{c.detail}</p>
            <p className="tag mt-2 text-ink-faint">Placeholder — no LinkedIn search</p>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
