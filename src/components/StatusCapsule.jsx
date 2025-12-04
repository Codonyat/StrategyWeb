import './StatusCapsule.css';

export function StatusCapsule({
  leftLabel,
  leftValue,
  leftTooltip,
  rightLabel,
  rightValue,
  rightTooltip,
  rightDisabled = false,
  fixedWidth = false
}) {
  return (
    <div className={`status-capsule ${fixedWidth ? 'fixed-width' : ''}`}>
      {/* Left segment */}
      <div
        className={`capsule-segment capsule-left ${leftTooltip ? 'has-tooltip' : ''}`}
        tabIndex={leftTooltip ? 0 : undefined}
      >
        <span className="segment-label">{leftLabel}</span>
        <span className="segment-value">{leftValue}</span>
        {leftTooltip && <span className="segment-tooltip">{leftTooltip}</span>}
      </div>

      <div className="capsule-divider" />

      {/* Right segment */}
      <div
        className={`capsule-segment capsule-right ${rightDisabled ? 'disabled' : ''} ${rightTooltip ? 'has-tooltip' : ''}`}
        tabIndex={rightTooltip ? 0 : undefined}
      >
        <span className="segment-label">{rightLabel}</span>
        <span className="segment-value">{rightValue}</span>
        {rightTooltip && <span className="segment-tooltip">{rightTooltip}</span>}
      </div>
    </div>
  );
}
