import { createFileRoute } from "@tanstack/react-router";
import { TodaySpread } from "@/components/home/TodaySpread";
import { DeadlinesStack } from "@/components/home/DeadlinesStack";
import { DailyFive } from "@/components/home/DailyFive";
import { Glimpses } from "@/components/home/Glimpses";
import { Label } from "@/components/paper/Paper";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Product Place — A planner for future PMs" },
      {
        name: "description",
        content:
          "A personal workspace for students pursuing product management: today's to-do, internship deadlines, and a daily five-minute product lesson.",
      },
      {
        property: "og:title",
        content: "The Product Place — A planner for future PMs",
      },
      {
        property: "og:description",
        content:
          "Apply, network, learn, create and practice — kept in one interactive paper notebook.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <main className="relative">
      <TodaySpread />
      <DeadlinesStack />
      <DailyFive />
      <Glimpses />

      <footer className="border-t border-border px-4 py-14 sm:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-baseline justify-between gap-4">
          <p className="font-display text-[1.3rem]">The Product Place</p>
          <p className="hand text-[1.2rem] text-ink-faint">
            close the notebook. come back tomorrow.
          </p>
          <Label>Visual prototype · v0.1</Label>
        </div>
      </footer>
    </main>
  );
}
