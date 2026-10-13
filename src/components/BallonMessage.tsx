import { Bubble, BubbleContent, BubbleTime } from "./ui/bubble";
import { cn } from "cn";

interface BallonMessageProps extends Omit<React.ComponentProps<typeof Bubble>, 'children'> {
  message: string;
  time?: string;
}

function BallonMessage({ message, time, align = "start", variant, className, ...props }: BallonMessageProps) {
  const resolvedVariant = variant ?? (align === "end" ? "default" : "secondary");
  return (
    <Bubble {...props} align={align} variant={resolvedVariant}
      className={cn(
        "rounded-t-[40px] data-[align=start]:rounded-bl-lg data-[align=start]:rounded-br-[40px] data-[align=end]:rounded-bl-[40px] data-[align=end]:rounded-br-lg",
        align === "end" && "ms-auto gap-0",
        className,
      )}>
      <BubbleContent className="w-full border-0 text-left leading-[normal] whitespace-pre-wrap [overflow-wrap:anywhere] group-data-[align=end]/bubble:self-stretch">{message}</BubbleContent>
      {time && <BubbleTime className={align === "end" ? "self-end" : "self-start"}>{time}</BubbleTime>}
    </Bubble>
  )
}

export default BallonMessage
