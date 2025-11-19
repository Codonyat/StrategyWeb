import { theme } from '../config/contract';
import './StatusChip.css';

export function StatusChip({ label, value, type = 'default' }) {
  return (
    <div className={`status-chip status-chip-${type}`}>
      <span className="status-chip-label">{label}</span>
      <span className="status-chip-value">{value}</span>
    </div>
  );
}
