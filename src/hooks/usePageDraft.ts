import {
  clearPageDraft,
  readPageDraft,
  writePageDraft,
} from "@/lib/navigation/pageSession";
import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";

export function usePageDraft<T>(
  draftKey: string,
  initial: T,
): [T, Dispatch<SetStateAction<T>>, () => void] {
  const [value, setValue] = useState<T>(() => readPageDraft<T>(draftKey) ?? initial);

  useEffect(() => {
    writePageDraft(draftKey, value);
  }, [draftKey, value]);

  const clear = useCallback(() => {
    clearPageDraft(draftKey);
  }, [draftKey]);

  return [value, setValue, clear];
}
