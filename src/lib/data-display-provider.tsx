import { DataDisplayProviderContext, type DataDisplay } from "@/hooks/use-data-display";
import { usePersistedPreference } from "@/hooks/use-persisted-preference";

type DataDisplayProviderProps = {
  children: React.ReactNode
  defaultDataDisplay?: DataDisplay
  storageKey?: string
}

const isDataDisplay = (value: string): value is DataDisplay =>
  value === "table" || value === "grid";

export function DataDisplayProvider({
  children,
  defaultDataDisplay = "table",
  storageKey = "quimia:data-display",
}: DataDisplayProviderProps) {
  const [dataDisplay, setDataDisplay] = usePersistedPreference(
    storageKey, defaultDataDisplay, isDataDisplay,
  );

  const value = { dataDisplay, setDataDisplay };

  return (
    <DataDisplayProviderContext.Provider value={value}>
      {children}
    </DataDisplayProviderContext.Provider>
  )
}
