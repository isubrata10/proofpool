export function PrivacyExplanation() {
  return (
    <div className="info-section">
      <h3 className="info-title">How ProofPool Works</h3>
      <div className="info-grid">
        <div className="info-card">
          <h4>Privacy Model</h4>
          <ul>
            <li><strong>Public:</strong> Total contributor count, Funding Target, Eligibility Threshold.</li>
            <li><strong>Private:</strong> Your exact contribution amount and secret.</li>
            <li><strong>Proof:</strong> Threshold eligibility linked to your cryptographic commitment.</li>
          </ul>
        </div>
        <div className="info-card">
          <h4>Identity & Storage Limitation</h4>
          <ul>
            <li><strong>Identity:</strong> Contributor IDs are public commitments, but are NOT cryptographically verified by the wallet in this MVP.</li>
            <li><strong>Storage:</strong> Your browser local storage retains the witness for convenience, but privacy relies on ZK math, not browser security.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
