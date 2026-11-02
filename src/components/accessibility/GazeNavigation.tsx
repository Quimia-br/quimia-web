import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDown, ArrowUp, Eye, Pause, Play, RotateCcw, X } from "lucide-react";
import BasicButton from "@/components/BasicButton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Dwell } from "@/lib/gaze/dwell";
import {
  calibrate,
  estimate,
  type CalibrationSample,
  type Mapping,
  type Point,
} from "@/lib/gaze/estimation";
import { startTracking } from "@/lib/gaze/tracking";
import { activateTarget, scrollContent, targetAt } from "@/lib/gaze/targets";
import { useGazePortal } from "@/hooks/use-gaze-portal";

type Stage = "intro" | "loading" | "calibrating" | "ready" | "active" | "paused" | "error";
const points: Point[] = [
  { x: 0.5, y: 0.5 },
  { x: 0.1, y: 0.1 },
  { x: 0.5, y: 0.1 },
  { x: 0.9, y: 0.1 },
  { x: 0.9, y: 0.5 },
  { x: 0.9, y: 0.9 },
  { x: 0.5, y: 0.9 },
  { x: 0.1, y: 0.9 },
  { x: 0.1, y: 0.5 },
];
interface Actions {
  pause: () => void;
  resume: () => void;
  calibrate: () => void;
}

export default function GazeNavigation({ onClose }: { onClose: () => void }) {
  const [started, setStarted] = useState(false);
  const [stage, setStage] = useState<Stage>("intro");
  const [message, setMessage] = useState("");
  const [calibrationIndex, setCalibrationIndex] = useState(0);
  const [faceVisible, setFaceVisible] = useState(false);
  const [cursor, setCursor] = useState<{ point: Point; progress: number } | null>(null);
  const actions = useRef<Actions | null>(null);
  const toolbarContainer = useGazePortal();

  useEffect(() => {
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [onClose]);

  useEffect(() => {
    if (!started) return;
    const abort = new AbortController();
    let mode: Stage = "loading";
    let mapping: Mapping | null = null;
    let index = 0;
    let since = 0;
    let samples: CalibrationSample[] = [];
    let currentSamples: CalibrationSample[] = [];
    let smooth: Point | null = null;
    let highlighted: HTMLElement | null = null;
    let session: Awaited<ReturnType<typeof startTracking>> | undefined;
    const dwell = new Dwell<HTMLElement>(1500);

    function clearTarget() {
      highlighted?.removeAttribute("data-gaze-target");
      highlighted = null;
      dwell.reset();
    }
    function change(next: Stage) {
      mode = next;
      setStage(next);
      highlighted?.removeAttribute("data-gaze-target");
      highlighted = null;
      // Preserve the consumed fixation when Pause becomes Resume on the same DOM button.
      // Dwell resets when the person actually looks away or tracking is lost.
    }
    function fail(text: string) {
      if (abort.signal.aborted) return;
      session?.stop();
      abort.abort();
      setCursor(null);
      setFaceVisible(false);
      clearTarget();
      setMessage(text);
      setStage("error");
    }
    actions.current = {
      pause() {
        change("paused");
      },
      resume() {
        if (mapping) {
          change("active");
          smooth = null;
        }
      },
      calibrate() {
        clearTarget();
        samples = [];
        currentSamples = [];
        index = 0;
        since = 0;
        mapping = null;
        smooth = null;
        setCursor(null);
        setCalibrationIndex(0);
        change("calibrating");
      },
    };
    function receive(features: number[] | null) {
      if (abort.signal.aborted) return;
      setFaceVisible(features !== null);
      if (!features) {
        since = 0;
        currentSamples = [];
        smooth = null;
        clearTarget();
        setCursor(null);
        return;
      }
      const now = performance.now();
      if (mode === "calibrating") {
        if (!since) since = now;
        // Settle on the new point before collecting; require actual detected samples.
        if (now - since >= 800) currentSamples.push({ features, point: points[index] });
        if (now - since < 2000 || currentSamples.length < 12) return;
        samples.push(...currentSamples);
        currentSamples = [];
        since = 0;
        if (index < points.length - 1) {
          index++;
          setCalibrationIndex(index);
          return;
        }
        mapping = calibrate(samples);
        if (!mapping) {
          fail(
            "Não foi possível calibrar com precisão suficiente. Ajuste a iluminação, mantenha a cabeça estável e tente novamente.",
          );
          return;
        }
        change("ready");
        return;
      }
      if (!mapping || !["ready", "active", "paused"].includes(mode)) return;
      const raw = estimate(mapping, features);
      smooth = smooth
        ? { x: smooth.x + 0.25 * (raw.x - smooth.x), y: smooth.y + 0.25 * (raw.y - smooth.y) }
        : raw;
      const point = { x: smooth.x * innerWidth, y: smooth.y * innerHeight };
      let target = targetAt(point.x, point.y);
      // While paused or previewing, only the dedicated session controls can be selected.
      if (mode !== "active" && !target?.closest("[data-gaze-toolbar]")) target = null;
      if (target !== highlighted) {
        highlighted?.removeAttribute("data-gaze-target");
        highlighted = target;
      }
      highlighted?.setAttribute("data-gaze-target", "true");
      const result = dwell.update(target, now);
      setCursor({ point, progress: result.progress });
      if (target && result.activate) activateTarget(target);
    }
    void startTracking(abort.signal, receive, fail)
      .then((value) => {
        if (abort.signal.aborted) {
          value.stop();
          return;
        }
        session = value;
        change("calibrating");
      })
      .catch((error) => {
        if (!abort.signal.aborted)
          fail(
            error instanceof DOMException && error.name === "NotAllowedError"
              ? "O acesso à câmera foi negado. Permita a câmera nas configurações do navegador e tente novamente."
              : error instanceof Error
                ? error.message
                : "Não foi possível iniciar a câmera.",
          );
      });
    function hidden() {
      if (document.hidden)
        fail(
          "A sessão foi encerrada e a câmera desligada ao sair desta aba. Inicie novamente para recalibrar.",
        );
    }
    function resize() {
      fail("O tamanho da tela mudou. Inicie novamente para calibrar na nova posição.");
    }
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("resize", resize);
    return () => {
      abort.abort();
      session?.stop();
      clearTarget();
      actions.current = null;
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("resize", resize);
    };
  }, [started]);

  const modal = ["intro", "loading", "calibrating", "ready", "error"].includes(stage);
  function restart() {
    setStarted(false);
    setStage("intro");
    setMessage("");
    setCursor(null);
  }
  return (
    <>
      <Dialog
        open={modal}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent
          showCloseButton={false}
          className={stage === "calibrating" ? "gaze-calibration" : "assistive-menu"}
        >
          <div className="flex items-center justify-between gap-3">
            <DialogTitle>
              {stage === "calibrating"
                ? `Calibrar olhar · ${calibrationIndex + 1} de ${points.length}`
                : "Navegação pelo olhar"}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Fechar configuração do olhar"
              onClick={onClose}
            >
              <X aria-hidden="true" />
            </Button>
          </div>
          <DialogDescription>
            {stage === "calibrating"
              ? "Olhe para o ponto até ele mudar de lugar. Mantenha a cabeça estável."
              : "Controle experimental do Quimia pelos olhos, com a tecnologia MediaPipe do Google."}
          </DialogDescription>
          {stage === "intro" && (
            <>
              <p>
                Você vai olhar para nove pontos para ajustar o cursor. Use boa iluminação e mantenha
                a câmera na altura dos olhos.
              </p>
              <p>
                Após calibrar, mantenha o olhar em um botão ou link por 1,5 segundo para
                selecioná-lo. Use os controles para rolar, pausar ou recalibrar. Escape encerra a
                sessão.
              </p>
              <p>
                O vídeo é processado no dispositivo e não é gravado nem enviado. A câmera será
                desligada ao encerrar ou sair desta aba. A precisão varia com a câmera, a posição e
                a iluminação.
              </p>
              <BasicButton
                icon={<Eye />}
                onClick={() => {
                  setStage("loading");
                  setStarted(true);
                }}
              >
                Permitir câmera e calibrar
              </BasicButton>
            </>
          )}
          {stage === "loading" && (
            <p role="status">Preparando o reconhecimento e solicitando acesso à câmera…</p>
          )}
          {stage === "calibrating" && (
            <>
              <p role="status">
                {faceVisible
                  ? "Acompanhe o ponto com os olhos."
                  : "Posicione o rosto à frente da câmera e mantenha os olhos abertos."}
              </p>
              <div
                aria-hidden="true"
                className="gaze-calibration-point"
                style={{
                  left: `${points[calibrationIndex].x * 100}%`,
                  top: `${points[calibrationIndex].y * 100}%`,
                }}
              />
            </>
          )}
          {stage === "ready" && (
            <div data-gaze-toolbar className="flex flex-col gap-3">
              <p>
                Confira se o cursor acompanha seu olhar. A seleção na página começa quando você
                escolher “Começar navegação”.
              </p>
              <BasicButton onClick={() => actions.current?.resume()}>Começar navegação</BasicButton>
              <BasicButton variant="secondary" onClick={() => actions.current?.calibrate()}>
                Calibrar novamente
              </BasicButton>
            </div>
          )}
          {stage === "error" && (
            <>
              <p role="alert">{message}</p>
              <BasicButton onClick={restart}>Tentar novamente</BasicButton>
            </>
          )}
          {stage !== "calibrating" && (
            <BasicButton variant="secondary" onClick={onClose}>
              Encerrar navegação pelo olhar
            </BasicButton>
          )}
        </DialogContent>
      </Dialog>
      {(stage === "active" || stage === "paused") &&
        createPortal(
          <section
            className="gaze-toolbar"
            data-gaze-toolbar
            aria-label="Controles da navegação pelo olhar"
          >
            <p role="status" className="gaze-status">
              {stage === "paused"
                ? "Olhar pausado · câmera ligada"
                : faceVisible
                  ? "Olhar ativo · câmera ligada"
                  : "Olhos não detectados · seleção suspensa"}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                size="icon-sm"
                variant="secondary"
                aria-label="Rolar para cima"
                title="Rolar para cima"
                disabled={stage === "paused"}
                onClick={() => scrollContent(-1)}
              >
                <ArrowUp aria-hidden="true" />
              </Button>
              <Button
                size="icon-sm"
                variant="secondary"
                aria-label="Rolar para baixo"
                title="Rolar para baixo"
                disabled={stage === "paused"}
                onClick={() => scrollContent(1)}
              >
                <ArrowDown aria-hidden="true" />
              </Button>
              <Button
                size="icon-sm"
                aria-label={
                  stage === "paused"
                    ? "Retomar navegação pelo olhar"
                    : "Pausar navegação pelo olhar"
                }
                title={stage === "paused" ? "Retomar" : "Pausar"}
                onClick={() =>
                  stage === "paused" ? actions.current?.resume() : actions.current?.pause()
                }
              >
                {stage === "paused" ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
              </Button>
              <Button
                size="icon-sm"
                variant="secondary"
                aria-label="Recalibrar olhar"
                title="Recalibrar"
                onClick={() => {
                  setCursor(null);
                  actions.current?.calibrate();
                }}
              >
                <RotateCcw aria-hidden="true" />
              </Button>
              <Button
                size="icon-sm"
                variant="secondary"
                aria-label="Encerrar navegação pelo olhar"
                title="Encerrar · Escape"
                onClick={onClose}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          </section>,
          toolbarContainer,
        )}
      {cursor &&
        createPortal(
          <div
            aria-hidden="true"
            className="gaze-cursor"
            style={{ left: cursor.point.x, top: cursor.point.y }}
          >
            <svg viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="17" className="gaze-cursor-track" />
              <circle
                cx="20"
                cy="20"
                r="17"
                pathLength="1"
                strokeDasharray={`${cursor.progress} 1`}
                className="gaze-cursor-progress"
              />
              <circle cx="20" cy="20" r="4" className="gaze-cursor-dot" />
            </svg>
          </div>,
          document.body,
        )}
    </>
  );
}
