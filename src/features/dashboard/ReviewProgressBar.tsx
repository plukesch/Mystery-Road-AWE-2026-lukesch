interface ReviewProgressBarProps {
  percent: number;
}

export function ReviewProgressBar({ percent }: ReviewProgressBarProps) {
  return (
    <div className="dashboard-panel">
      <h3>Review progress</h3>
      <div className="progress-bar-outer">
        <div className="progress-bar-inner" style={{ width: `${percent}%` }} />
      </div>
      <p>{percent}% of evidence reviewed</p>
    </div>
  );
}
