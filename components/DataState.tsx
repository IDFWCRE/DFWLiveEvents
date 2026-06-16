interface DataStateProps {
  title: string;
  message: string;
}

export function DataState({ title, message }: DataStateProps) {
  return (
    <section className="empty-state">
      <h2 className="section-title">{title}</h2>
      <p className="muted">{message}</p>
    </section>
  );
}
