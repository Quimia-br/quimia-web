type MainTitleProps = {
  title: string;
  description?: string;
  className?: string;
};

function MainTitle({ title, description, className }: MainTitleProps) {
  return (
    <hgroup className={className}>
      <h1 className="text-display font-medium text-text-primary">{title}</h1>
      {description && (
        <p className="text-subtitle font-normal text-text-secondary">
          {description}
        </p>
      )}
    </hgroup>
  );
}

export default MainTitle;
