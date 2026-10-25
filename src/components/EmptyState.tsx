interface EmptyStateProps {
  eyebrow: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ eyebrow, title, description, actionLabel, onAction }: EmptyStateProps) {
  return <section className="empty-page surface-card"><span className="empty-page-mark" aria-hidden="true">✦</span><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="muted">{description}</p>{actionLabel && onAction && <button type="button" className="button button-primary" onClick={onAction}>{actionLabel} <span aria-hidden="true">→</span></button>}</section>;
}
