import { Sheet } from "@/components/paper/Paper";
import type { NetworkContact } from "@/types/network";

export function ContactSaturation({
  companyName,
  contacts,
}: {
  companyName: string;
  contacts: NetworkContact[];
}) {
  const contacted = contacts.filter((c) =>
    [
      "Contacted",
      "Replied",
      "Meeting scheduled",
      "Met",
      "Follow-up needed",
      "Referral secured",
    ].includes(c.relationshipStatus),
  );
  const recruiters = contacted.filter((c) => c.isRecruiter).length;
  const pms = contacted.filter((c) => c.contactType === "PRODUCT MANAGER").length;
  const alums = contacted.filter(
    (c) => c.contactType === "ALUM" || !!c.schoolRelationship?.toLowerCase().includes("alum"),
  ).length;

  return (
    <Sheet tone="yellow" soft shadow="hard-sm" className="px-4 py-4">
      <p className="font-display text-[1.05rem] font-black uppercase leading-none">
        {companyName} outreach
      </p>
      <p className="mt-2 text-[0.95rem] text-ink">
        <span className="font-display text-[1.6rem] font-black">{contacted.length}</span> people
        contacted
      </p>
      <p className="tag mt-2 text-ink-soft">
        {recruiters} recruiter · {pms} PM · {alums} alum
      </p>
      {contacted.length >= 3 && (
        <p className="mt-3 border-2 border-ink bg-paper px-3 py-2 text-[0.92rem] text-ink-soft">
          You already have active conversations here. Pause before adding more outreach.
        </p>
      )}
    </Sheet>
  );
}
