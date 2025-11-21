import './StatusCapsule.css';

export function StatusCapsule({
  leftLabel,
  leftValue,
  leftTooltip,
  rightLabel,
  rightValue,
  rightTooltip,
  rightDisabled = false
}) {
  return (
    <div className="status-capsule">
      {/* Left segment - Backing */}
      <div className={`capsule-segment capsule-left ${leftTooltip ? 'has-tooltip' : ''}`}>
        <span className="segment-label">{leftLabel}</span>
        <span className="segment-value">{leftValue}</span>
        {leftTooltip && <div className="segment-tooltip">{leftTooltip}</div>}
      </div>

      {/* Divider */}
      <div className="capsule-divider" />

      {/* Right segment - Exchange */}
      <div className={`capsule-segment capsule-right ${rightDisabled ? 'disabled' : ''} ${rightTooltip ? 'has-tooltip' : ''}`}>
        <span className="segment-label">{rightLabel}</span>
        <span className="segment-value">{rightValue}</span>
        {rightTooltip && <div className="segment-tooltip">{rightTooltip}</div>}
      </div>
    </div>
  );
}
