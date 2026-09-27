export function PoolOverview({ fundingTarget, publicTotal }: { fundingTarget: string, publicTotal: string }) {
  return (
    <div className="panel">
      <h3 className="panel-title">Public Pool State</h3>
      <div className="stats-grid">
        <div className="stat-box">
          <p className="panel-subtitle">Funding Target (Goal)</p>
          <p className="panel-value" style={{fontSize: '1.8rem', color: '#fff'}}>{fundingTarget}</p>
        </div>
        <div className="stat-box">
          <p className="panel-subtitle">Total Contributors</p>
          <p className="panel-value" style={{fontSize: '1.8rem', color: '#fff'}}>{publicTotal}</p>
        </div>
      </div>
      <p className="panel-subtitle" style={{marginTop: '15px'}}>Verified on Midnight Network</p>
    </div>
  );
}
