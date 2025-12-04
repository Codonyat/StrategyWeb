import './StatusChip.css';

export function StatusChip({ label, value, type = 'default', tooltip }) {
  return (
    <div
      className={`status-chip status-chip-${type} ${tooltip ? 'has-tooltip' : ''}`}
      tabIndex={tooltip ? 0 : undefined}
    >
      <span className="status-chip-label">{label}</span>
      <span className="status-chip-value">{value}</span>
      {tooltip && <span className="status-chip-tooltip">{tooltip}</span>}
    </div>
  );
}
