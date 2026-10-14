import { cn } from "cn";
import CardHeader from "./CardHeader";

interface CardProps extends Omit<React.ComponentProps<typeof CardHeader>, "title"> {
  children?: React.ReactNode;
  title?: string;
}

function Card({ children, className, title, ...headerProps }: CardProps) {
  return (
    <div className={cn("flex flex-col gap-5 p-8 rounded-[42px] bg-background", className)}>
      {title && <CardHeader title={title} {...headerProps} />}
      {children}
    </div>
  );
}

export default Card;
