import { createContext, useContext } from "react";

export type DataDisplay = "table" | "grid";

type DataDisplayProviderState = {
  dataDisplay: DataDisplay;
  setDataDisplay: (dataDisplay: DataDisplay) => void;
};

export const DataDisplayProviderContext =
  createContext<DataDisplayProviderState | null>(null);

const useDataDisplay = () => {
  const context = useContext(DataDisplayProviderContext);

  if (context === null)
    throw new Error("useDataDisplay must be used within a DataDisplayProvider");

  return context;
};

export default useDataDisplay;
