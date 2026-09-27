
export function PrivateContribution({ amount, setAmount, handleSubmit, step }: { amount: string, setAmount: (val: string) => void, handleSubmit: (e: React.FormEvent) => void, step: string }) {
  return (
    <div className="panel" style={{marginBottom: '20px'}}>
      <h3 className="panel-title">Private Contribution</h3>
      <p className="panel-subtitle" style={{marginBottom: '15px'}}>Contribute using shielded ZK commitment.</p>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input 
            type="number" 
            placeholder="Amount to contribute" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={step !== 'idle' && step !== 'confirmed'}
            className="text-input"
          />
        </div>
        
        <button type="submit" disabled={!amount || (step !== 'idle' && step !== 'confirmed')} className="primary-button">
          {step === 'idle' ? 'Submit ZK Proof' : step}
        </button>
      </form>
    </div>
  );
}
