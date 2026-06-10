import type { DuplicateInfo } from "../hooks/useCodeplug";

interface Props {
  duplicates: DuplicateInfo | null;
}

export default function DuplicateWarning({ duplicates }: Props) {
  if (!duplicates) return null;
  const hasFreq = duplicates.frequency.length > 0;
  const hasName = duplicates.name.length > 0;
  if (!hasFreq && !hasName) return null;

  return (
    <div className="duplicate-warning">
      {hasFreq && (
        <div>
          <strong>Duplicate frequencies:</strong>
          <ul>
            {duplicates.frequency.map((d, i) => (
              <li key={i}>
                {(d.freq / 1_000_000).toFixed(4)} MHz — {d.channels.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}
      {hasName && (
        <div>
          <strong>Duplicate names:</strong>
          <ul>
            {duplicates.name.map((d, i) => (
              <li key={i}>{d.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
