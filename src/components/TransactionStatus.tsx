
export function TransactionStatus({ txHash }: { txHash: string | null }) {
  if (!txHash) return null;
  return (
    <div className="tx-hash" style={{marginTop: '15px', padding: '15px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px'}}>
      <strong>Transaction Hash:</strong><br/>
      <span style={{wordBreak: 'break-all', fontSize: '0.85rem', color: '#a0a0a0'}}>{txHash}</span>
    </div>
  );
}
