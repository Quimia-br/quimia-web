import { cn } from "cn";

interface MainTitleProps {
  title: string;
  description?: string;
  className?: string;
};

function MainTitle({ title, description, className }: MainTitleProps) {
  return (
    <hgroup className={cn("text-xl", className)}>
      <h1 className="font-medium text-display text-text-primary">{title}</h1>
      {description && (
        <p className="font-normal text-subtitle text-text-secondary">
          {description}
        </p>
      )}
    </hgroup>
  );
}

export default MainTitle;
