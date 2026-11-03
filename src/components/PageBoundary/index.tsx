import { Suspense, type ReactNode } from "react";
import Loading from "@/pages/Loading";

export interface PageBoundaryProps {
  children: ReactNode;
}

export default function PageBoundary({ children }: PageBoundaryProps) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
}
