import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/home/Hero";
import { TodaySpread } from "@/components/home/TodaySpread";
import { DeadlinesStack } from "@/components/home/DeadlinesStack";
import { DailyFive } from "@/components/home/DailyFive";
import { Glimpses } from "@/components/home/Glimpses";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Product Place — A workspace for future PMs" },
      {
        name: "description",
        content:
          "A bold personal workspace for students pursuing product management: today's list, internship deadlines, and a daily five-minute product lesson.",
      },
      {
        property: "og:title",
        content: "The Product Place — A workspace for future PMs",
      },
      {
        property: "og:description",
        content:
          "Apply, network, learn, create and practice — five things, ten minutes, every day.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <main className="relative">
      <Hero />
      <TodaySpread />
      <DeadlinesStack />
      <DailyFive />
      <Glimpses />

      <footer className="border-t-2 border-ink bg-ink px-5 py-14 text-paper sm:px-8">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-baseline justify-between gap-4">
          <p className="font-display text-[clamp(1.6rem,5vw,2.6rem)] font-black uppercase leading-none">
            The Product Place
          </p>
          <p className="tag text-yellow">Close the notebook. Come back tomorrow.</p>
        </div>
      </footer>
    </main>
  );
}
