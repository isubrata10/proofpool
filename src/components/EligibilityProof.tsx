export function EligibilityProof({ verifyAmount, setVerifyAmount, verifyThreshold, handleVerify, verifyStep }: { verifyAmount: string, setVerifyAmount: (v: string) => void, verifyThreshold: string, setVerifyThreshold: (v: string) => void, handleVerify: (e: React.FormEvent) => void, verifyStep: string }) {
  return (
    <div className="panel">
      <h3 className="panel-title">Eligibility Proof</h3>
      <p className="panel-subtitle" style={{marginBottom: '15px'}}>Prove you meet the threshold against your stored commitment.</p>
      
      <div style={{marginBottom: '15px', color: '#ccc'}}>
        <strong>Eligibility threshold:</strong> {verifyThreshold}
      </div>

      <form onSubmit={handleVerify}>
        <div className="input-group" style={{marginBottom: '10px'}}>
          <input 
            type="number" 
            placeholder="Your Actual Contribution" 
            value={verifyAmount}
            onChange={(e) => setVerifyAmount(e.target.value)}
            disabled={verifyStep === 'proving'}
            className="text-input"
          />
        </div>
        <button type="submit" disabled={!verifyAmount || verifyStep === 'proving'} className="primary-button" style={{backgroundColor: '#2b2b2b'}}>
           {verifyStep === 'idle' ? 'Generate Eligibility Proof' : verifyStep}
        </button>
      </form>
    </div>
  );
}
