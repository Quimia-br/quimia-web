import { cn } from "cn";

interface CardHeaderProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}

function CardHeader({ icon, title, description, className }: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between [&_svg]:shrink-0 [&_svg]:size-6 gap-5",
        className,
      )}
    >
      {icon}
      <hgroup className="flex flex-col flex-1 gap-1.5">
        <h2 className="text-2xl font-medium text-foreground">{title}</h2>
        {description && (
          <p className="text-lg text-muted-foreground">{description}</p>
        )}
      </hgroup>
    </div>
  );
}

export default CardHeader;
