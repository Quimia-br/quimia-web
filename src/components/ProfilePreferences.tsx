import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Monitor, Moon, Sun } from "lucide-react";
import { useAccessibility } from "@/hooks/use-accessibility";
import useTheme, { type Theme } from "@/hooks/use-theme";
import type { TextScale } from "@/lib/accessibility";
import BasicButton from "./BasicButton";
import Card from "./Card";
import { Slider } from "./ui/slider";
import AnimatedToggle from "./smoothui/animated-toggle";

const themes = [
  { value: "light", label: "Claro", Icon: Sun },
  { value: "dark", label: "Escuro", Icon: Moon },
  { value: "system", label: "Sistema", Icon: Monitor },
] as const;

function ProfilePreferences() {
  const {
    textScale,
    dyslexicFont,
    setTextScale,
    setDyslexicFont,
    vlibrasEnabled,
    setVlibrasEnabled,
    gazeEnabled,
    setGazeEnabled,
    reset,
  } = useAccessibility();
  const { theme, setTheme } = useTheme();
  return (
    <section
      aria-label="Preferências de acessibilidade"
      className="profile-preferences grid min-w-0 content-start gap-3.5"
    >
      <Card title="Tamanho do texto" className="profile-text-size min-w-0">
        <div className="flex min-w-0 items-center gap-5">
          <span aria-hidden="true" className="text-3xl font-medium">
            Aa
          </span>
          <Slider
            thumbLabel="Tamanho do texto"
            thumbAlignment="center"
            min={100}
            max={200}
            step={25}
            value={[textScale]}
            onValueChange={(value) =>
              setTextScale((Array.isArray(value) ? value[0] : value) as TextScale)
            }
            className="min-w-0 flex-1 py-2 [&_[data-slot=slider-thumb]]:size-7"
          />
        </div>
      </Card>
      <Card title="Dislexic Font" className="profile-font-setting min-w-0">
        <AnimatedToggle label="Dislexic Font" checked={dyslexicFont} onChange={setDyslexicFont} />
      </Card>
      <Card title="Tema" className="profile-theme min-w-0">
        <RadioGroup
          aria-label="Tema"
          value={theme}
          onValueChange={(value) => setTheme(value as Theme)}
          className="flex flex-wrap justify-between"
        >
          {themes.map(({ value, label, Icon }) => (
            <Radio.Root
              key={value}
              value={value}
              aria-label={label}
              title={label}
              className="flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface-base text-foreground-primary outline-none focus-visible:ring-3 focus-visible:ring-ring data-checked:bg-primary-primary"
            >
              <Icon aria-hidden="true" className="size-6" />
            </Radio.Root>
          ))}
        </RadioGroup>
      </Card>
      <Card title="Libras" className="profile-libras-setting min-w-0">
        <AnimatedToggle
          label="Ativar VLibras"
          checked={vlibrasEnabled}
          onChange={setVlibrasEnabled}
        />
      </Card>
      <Card title="Navegação pelo olhar" className="profile-gaze-setting min-w-0">
        <BasicButton
          size="compact"
          aria-label={
            gazeEnabled ? "Encerrar navegação pelo olhar" : "Configurar navegação pelo olhar"
          }
          onClick={() => setGazeEnabled(!gazeEnabled)}
        >
          {gazeEnabled ? "Encerrar" : "Configurar"}
        </BasicButton>
      </Card>
      <BasicButton
        variant="secondary"
        className="profile-reset-setting self-start"
        onClick={() => {
          reset();
          setTheme("system");
        }}
      >
        Resetar configurações
      </BasicButton>
    </section>
  );
}
export default ProfilePreferences;
