import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Accessibility, ChevronRight, Eye, X } from "lucide-react";
import { useAccessibility } from "@/hooks/use-accessibility";
import { loadVLibras, setVLibrasVisible, showVLibras } from "@/lib/vlibras";
import { Button } from "@/components/ui/button";
import AnimatedToggle from "@/components/smoothui/animated-toggle";
import LibrasIcon from "./LibrasIcon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const GazeNavigation = lazy(() => import("./GazeNavigation"));

export default function AccessibilityTools() {
  const { vlibrasEnabled, setVlibrasEnabled, gazeEnabled, setGazeEnabled } = useAccessibility();
  const [open, setOpen] = useState(false);
  const [libras, setLibras] = useState<{ loading: boolean; error: string | null }>({
    loading: false,
    error: null,
  });
  const stopGaze = useCallback(() => setGazeEnabled(false), [setGazeEnabled]);

  useEffect(() => {
    let cancelled = false;
    if (vlibrasEnabled) {
      setVLibrasVisible(true);
      void loadVLibras()
        .then(() => {
          if (!cancelled) setVLibrasVisible(true);
        })
        .catch((error: Error) => {
          if (!cancelled) setLibras({ loading: false, error: error.message });
        });
    } else setVLibrasVisible(false);
    return () => {
      cancelled = true;
      setVLibrasVisible(false);
    };
  }, [vlibrasEnabled]);

  async function openLibras() {
    setVlibrasEnabled(true);
    setLibras({ loading: true, error: null });
    try {
      // Release the dialog's focus trap before opening the official translation window.
      setOpen(false);
      await showVLibras();
      setLibras({ loading: false, error: null });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setLibras({ loading: false, error: null });
        return;
      }
      setLibras({
        loading: false,
        error: error instanceof Error ? error.message : "Não foi possível abrir o VLibras.",
      });
      setOpen(true);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={<Button size="icon-sm" className="assistive-launcher" hidden={gazeEnabled} />}
          aria-label="Abrir recursos de acessibilidade"
          title="Acessibilidade"
        >
          <Accessibility aria-hidden="true" />
        </DialogTrigger>
        <DialogContent showCloseButton={false} className="assistive-menu assistive-tools-menu">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-xl">Acessibilidade</DialogTitle>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Fechar acessibilidade"
              onClick={() => setOpen(false)}
            >
              <X aria-hidden="true" />
            </Button>
          </div>
          <DialogDescription className="sr-only">
            Ative Libras ou a navegação pelo olhar.
          </DialogDescription>
          <div className="assistive-tool-row">
            <Button
              variant="ghost"
              className="assistive-tool-action"
              aria-label="Abrir VLibras"
              disabled={libras.loading}
              onClick={() => void openLibras()}
            >
              <LibrasIcon className="assistive-tool-symbol" />
              <span>{libras.loading ? "Carregando…" : "Libras"}</span>
            </Button>
            <AnimatedToggle
              label="Ativar VLibras"
              checked={vlibrasEnabled}
              disabled={libras.loading}
              onChange={(enabled) => {
                if (enabled) void openLibras();
                else setVlibrasEnabled(false);
              }}
            />
          </div>
          <Button
            variant="ghost"
            className="assistive-tool-row assistive-tool-action"
            aria-label={
              gazeEnabled ? "Encerrar navegação pelo olhar" : "Configurar navegação pelo olhar"
            }
            onClick={() => {
              setOpen(false);
              setGazeEnabled(!gazeEnabled);
            }}
          >
            <span className="assistive-tool-symbol flex shrink-0 items-center justify-center">
              <Eye aria-hidden="true" />
            </span>
            <span>{gazeEnabled ? "Encerrar olhar" : "Navegação pelo olhar"}</span>
            <ChevronRight aria-hidden="true" className="ml-auto" />
          </Button>
          {libras.error && <p role="alert">{libras.error}</p>}
        </DialogContent>
      </Dialog>
      {gazeEnabled && (
        <Suspense
          fallback={
            <p className="assistive-notice" role="status">
              Carregando navegação pelo olhar…
            </p>
          }
        >
          <GazeNavigation onClose={stopGaze} />
        </Suspense>
      )}
    </>
  );
}
