import { useState, useEffect } from 'react';
import { useMidnight } from '../hooks/useMidnight';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { Contract } from '../../managed/proofpool/contract/index.js';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { pipe } from 'effect';
import { PoolOverview } from './PoolOverview';
import { PrivateContribution } from './PrivateContribution';
import { EligibilityProof } from './EligibilityProof';
import { TransactionStatus } from './TransactionStatus';

function toBytes32(str: string): Uint8Array {
  const buf = new Uint8Array(32);
  const enc = new TextEncoder();
  const encoded = enc.encode(str);
  buf.set(encoded.slice(0, 32));
  return buf;
}

export function ProofPoolInterface({ connectedAPI }: { connectedAPI: any }) {
  const { providers, api } = useMidnight();
  const [totalContributors, setTotalContributors] = useState<string>('Loading...');
  const [fundingTarget, setFundingTarget] = useState<string>('Loading...');
  const [eligibilityThreshold, setEligibilityThreshold] = useState<string>('Loading...');
  
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'idle' | 'preparing' | 'proving' | 'approving' | 'submitting' | 'submitted' | 'waiting for indexer' | 'confirmed'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);

  const [verifyStep, setVerifyStep] = useState<'idle' | 'proving' | 'verified' | 'failed'>('idle');
  const [verifyAmount, setVerifyAmount] = useState('');

  const CONTRACT_ADDRESS = import.meta.env.VITE_PROOFPOOL_CONTRACT_ADDRESS;

  useEffect(() => {
    if (providers && providers.publicDataProvider) {
      const fetchState = async () => {
        try {
          const state = await providers.publicDataProvider.queryContractState(CONTRACT_ADDRESS);
          if (state && state.data && state.data.total_contributors !== undefined) {
            setTotalContributors(state.data.total_contributors.toString());
            setFundingTarget(state.data.funding_target?.toString() || 'Unknown');
            setEligibilityThreshold(state.data.eligibility_threshold?.toString() || 'Unknown');
          } else {
            setTotalContributors('State not found (Verify deployment)');
          }
        } catch (e) {
          console.error("Indexer query failed:", e);
          setTotalContributors('Error connecting to indexer');
        }
      };
      fetchState();
      const interval = setInterval(fetchState, 15000);
      return () => clearInterval(interval);
    }
  }, [providers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!api || !providers) return;
    
    setStep('preparing');
    try {
      setStep('proving');
      const contract = await findDeployedContract(providers, {
        contractAddress: CONTRACT_ADDRESS,
        compiledContract: pipe(CompiledContract.make('proofpool', Contract as any), CompiledContract.withVacantWitnesses) as any
      });
      
      const cidStr = Math.random().toString(36).substring(2, 15);
      const secretStr = Math.random().toString(36).substring(2, 15);
      
      localStorage.setItem('proofpool_cid', cidStr);
      localStorage.setItem('proofpool_secret', secretStr);
      localStorage.setItem('proofpool_amount', amount);
      
      setStep('approving');
      const result = await contract.callTx.contribute(toBytes32(cidStr), BigInt(amount), toBytes32(secretStr));
      
      setStep('submitted');
      setTxHash(result.public.txHash);
      
      setStep('waiting for indexer');
      let state;
      for (let i = 0; i < 12; i++) {
        await new Promise(r => setTimeout(r, 5000));
        state = await providers.publicDataProvider.queryContractState(CONTRACT_ADDRESS);
        if (state && state.data && state.data.total_contributors !== undefined && state.data.total_contributors.toString() !== totalContributors) {
           break;
        }
      }
      
      if (state && state.data && state.data.total_contributors !== undefined) {
         setTotalContributors(state.data.total_contributors.toString());
      }
      setStep('confirmed');
    } catch (e: any) {
      console.error(e);
      setStep('idle');
      alert("Transaction failed: " + e.message);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!api || !providers) return;
    
    const savedCid = localStorage.getItem('proofpool_cid');
    const savedSecret = localStorage.getItem('proofpool_secret');
    
    if (!savedCid || !savedSecret) {
      alert("No local contribution commitment found to prove against.");
      return;
    }
    
    setVerifyStep('proving');
    try {
      const contract = await findDeployedContract(providers, {
        contractAddress: CONTRACT_ADDRESS,
        compiledContract: pipe(CompiledContract.make('proofpool', Contract as any), CompiledContract.withVacantWitnesses) as any
      });
      
      await contract.callTx.verify_eligibility(toBytes32(savedCid), BigInt(verifyAmount), toBytes32(savedSecret));
      setVerifyStep('verified');
    } catch (e: any) {
      console.error(e);
      setVerifyStep('failed');
      alert("Verification failed: " + e.message);
    }
  };

  if (!connectedAPI) return null;

  if (!CONTRACT_ADDRESS) {
    return (
      <div className="layout-grid">
        <div className="panel">
          <p>ProofPool contract is not configured for Preprod. Please set VITE_PROOFPOOL_CONTRACT_ADDRESS.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-grid">
      <PoolOverview fundingTarget={fundingTarget} publicTotal={totalContributors} />
      
      <div>
        <PrivateContribution 
          amount={amount} 
          setAmount={setAmount} 
          handleSubmit={handleSubmit} 
          step={step} 
        />
        <TransactionStatus txHash={txHash} />
        
        <EligibilityProof 
          verifyAmount={verifyAmount} 
          setVerifyAmount={setVerifyAmount} 
          verifyThreshold={eligibilityThreshold}
          setVerifyThreshold={() => {}} 
          handleVerify={handleVerify} 
          verifyStep={verifyStep} 
        />
      </div>
    </div>
  );
}
