import type { JobSourceAdapter, JobSourceType } from "@/lib/ingestion/types";
import { Vansh2027GitHubAdapter } from "@/lib/ingestion/adapters/vansh2027Adapter";
import {
  SimplifyNewGradAdapter,
  SimplifySummer2027Adapter,
} from "@/lib/ingestion/adapters/simplifyJobsAdapters";
import { GreenhouseBoardAdapter } from "@/lib/ingestion/adapters/greenhouseAdapter";
import { LeverBoardAdapter } from "@/lib/ingestion/adapters/leverAdapter";
import { AshbyBoardAdapter } from "@/lib/ingestion/adapters/ashbyAdapter";
import { enabledAtsBoards, type AtsBoardConfig } from "@/lib/ingestion/config/atsBoards";

export type RegistryEntry = {
  id: string;
  enabled: boolean;
  sourceType: JobSourceType;
  /** Human label for reports */
  label: string;
  createAdapter: () => JobSourceAdapter;
};

function atsEntry(board: AtsBoardConfig): RegistryEntry {
  return {
    id: board.id,
    enabled: board.enabled,
    sourceType: "ATS_API",
    label: `${board.ats} · ${board.companyName}`,
    createAdapter: () => {
      if (board.ats === "greenhouse") {
        return new GreenhouseBoardAdapter({
          companyName: board.companyName,
          boardToken: board.boardId,
        });
      }
      if (board.ats === "lever") {
        return new LeverBoardAdapter({
          companyName: board.companyName,
          site: board.boardId,
        });
      }
      return new AshbyBoardAdapter({
        companyName: board.companyName,
        boardName: board.boardId,
      });
    },
  };
}

/** Central registry — add trackers/boards here, not inside parsers. */
export const SOURCE_REGISTRY: RegistryEntry[] = [
  {
    id: "tracker-vansh2027",
    enabled: true,
    sourceType: "GITHUB_TRACKER",
    label: "Vansh Summer2027",
    createAdapter: () => new Vansh2027GitHubAdapter(),
  },
  {
    id: "tracker-simplify-summer2027",
    enabled: true,
    sourceType: "GITHUB_TRACKER",
    label: "SimplifyJobs Summer2027 Product",
    createAdapter: () => new SimplifySummer2027Adapter(),
  },
  {
    id: "tracker-simplify-newgrad",
    enabled: true,
    sourceType: "GITHUB_TRACKER",
    label: "SimplifyJobs New-Grad Product",
    createAdapter: () => new SimplifyNewGradAdapter(),
  },
  ...enabledAtsBoards().map(atsEntry),
];

export function listRegistry(options?: {
  enabledOnly?: boolean;
  sourceType?: JobSourceType;
  ids?: string[];
}): RegistryEntry[] {
  const enabledOnly = options?.enabledOnly ?? true;
  return SOURCE_REGISTRY.filter((e) => {
    if (enabledOnly && !e.enabled) return false;
    if (options?.sourceType && e.sourceType !== options.sourceType) return false;
    if (options?.ids && !options.ids.includes(e.id)) return false;
    return true;
  });
}

export function buildAdapters(options?: {
  enabledOnly?: boolean;
  sourceType?: JobSourceType;
  ids?: string[];
}): JobSourceAdapter[] {
  return listRegistry(options).map((e) => e.createAdapter());
}
