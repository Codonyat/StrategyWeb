import './StatusChip.css';

export function StatusChip({ label, value, type = 'default', tooltip }) {
  return (
    <div className={`status-chip status-chip-${type} ${tooltip ? 'has-tooltip' : ''}`}>
      <span className="status-chip-label">{label}</span>
      <span className="status-chip-value">{value}</span>
      {tooltip && <div className="status-chip-tooltip">{tooltip}</div>}
    </div>
  );
}
