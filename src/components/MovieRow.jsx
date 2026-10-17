import MovieCard from './MovieCard';
import ScrollRow from './ScrollRow';

export default function MovieRow({
  title,
  subtitle,
  items = [],
  type,
  seeAllTo,
  action,
}) {
  if (!items.length) return null;
  return (
    <ScrollRow
      title={title}
      subtitle={subtitle}
      seeAllTo={seeAllTo}
      action={action}
    >
      {items.map((it) => (
        <MovieCard key={`${it.type || type}-${it.id}`} item={it} type={type} />
      ))}
    </ScrollRow>
  );
}
