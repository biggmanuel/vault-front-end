

import React, { useEffect, useState, useMemo } from 'react';
import { useConnection, useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { IDL } from './idl';
import { PROGRAM_ID, MINT_ADDRESS, VAULT_SEED, USER_SEED } from './utils/constants';

// Declare global Buffer to avoid explicit import conflicts
declare const Buffer: any;

// --- UI Components ---

const Card = ({ children, title, className = "" }: { children?: React.ReactNode, title?: string, className?: string }) => (
  <div className={`bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl ${className}`}>
    {title && <h3 className="text-xl font-bold text-white mb-4 border-b border-slate-700 pb-2">{title}</h3>}
    {children}
  </div>
);

const Button = ({ onClick, disabled, children, variant = 'primary', loading = false }: any) => {
  const baseStyle = "w-full py-3 px-4 rounded-lg font-bold transition-all duration-200 flex justify-center items-center gap-2";
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-slate-700 disabled:text-slate-400",
    secondary: "bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-50",
    danger: "bg-red-500 hover:bg-red-400 text-white disabled:opacity-50",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-slate-700 disabled:text-slate-400",
    warning: "bg-amber-600 hover:bg-amber-500 text-white disabled:bg-slate-700 disabled:text-slate-400"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {loading && (
        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

const Input = ({ value, onChange, placeholder, label, type = "text" }: any) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder-slate-600"
    />
  </div>
);

// --- Main App Component ---

const App: React.FC = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet();

  const [isLoading, setIsLoading] = useState(false);
  const [transactionLog, setTransactionLog] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'deposit' | 'collateral' | 'borrow' | 'repay'>('deposit');
  const [amount, setAmount] = useState('');
  
  // State for PDAs/Account Data
  const [vaultBalance, setVaultBalance] = useState<number | null>(null);
  const [userWalletBalance, setUserWalletBalance] = useState<number | null>(null);
  const [userCollateralBalance, setUserCollateralBalance] = useState<number | null>(null);
  const [userBorrowedBalance, setUserBorrowedBalance] = useState<number | null>(null);
  const [borrowingPower, setBorrowingPower] = useState<number>(0);

  // Computed Program Instance
  const program = useMemo(() => {
    if (anchorWallet) {
      const provider = new AnchorProvider(connection, anchorWallet, {
        preflightCommitment: 'processed',
      });
      return new Program(IDL as any, PROGRAM_ID, provider);
    }
    return null;
  }, [connection, anchorWallet]);

  // --- Web3 Actions ---

  const addLog = (msg: string) => setTransactionLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const getVaultPDA = () => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from(VAULT_SEED)], 
      PROGRAM_ID
    );
    return pda;
  };

  const getUserStatsPDA = (userPubkey: PublicKey) => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from(USER_SEED), userPubkey.toBuffer()],
      PROGRAM_ID
    );
    return pda;
  };

  const fetchVaultBalance = async () => {
    try {
      const vaultAccount = getVaultPDA();
      const vaultTokenAccount = getAssociatedTokenAddressSync(
        MINT_ADDRESS,
        vaultAccount,
        true
      );
      const balance = await connection.getTokenAccountBalance(vaultTokenAccount);
      setVaultBalance(balance.value.uiAmount);
    } catch (e) {
      setVaultBalance(null);
    }
  };

  const fetchUserWalletBalance = async () => {
    if (!wallet.publicKey) {
      setUserWalletBalance(null);
      return;
    }
    try {
      const userTokenAccount = getAssociatedTokenAddressSync(
        MINT_ADDRESS,
        wallet.publicKey
      );
      const balance = await connection.getTokenAccountBalance(userTokenAccount);
      setUserWalletBalance(balance.value.uiAmount);
    } catch (e) {
      setUserWalletBalance(0);
    }
  };

  const fetchUserAccountData = async () => {
    if (!program || !wallet.publicKey) {
      setUserCollateralBalance(null);
      setUserBorrowedBalance(null);
      setBorrowingPower(0);
      return;
    }
    try {
      const userStatsPDA = getUserStatsPDA(wallet.publicKey);
      // Attempt to fetch the user account data as defined in IDL
      // Note: 'userAccount' property comes from the "accounts" array in IDL
      const acct: any = await program.account.userAccount.fetch(userStatsPDA);
      
      const deposited = new BN(acct.depositedAmount).toNumber() / 1_000_000;
      const borrowed = new BN(acct.borrowedAmount).toNumber() / 1_000_000;
      
      setUserCollateralBalance(deposited);
      setUserBorrowedBalance(borrowed);
      
      // Assume 75% LTV (Loan To Value) for borrowing power display
      setBorrowingPower(Math.max(0, deposited * 0.75 - borrowed));
      
    } catch (e) {
      // console.log("User vault account not found (user hasn't interacted yet)");
      setUserCollateralBalance(0);
      setUserBorrowedBalance(0);
      setBorrowingPower(0);
    }
  };

  useEffect(() => {
    fetchVaultBalance();
    if (wallet.connected) {
      fetchUserWalletBalance();
      fetchUserAccountData();
    }
    const interval = setInterval(() => {
      fetchVaultBalance();
      if (wallet.connected) {
        fetchUserWalletBalance();
        fetchUserAccountData();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [connection, wallet.publicKey, wallet.connected, program]);

  const handleInitialize = async () => {
    if (!program || !wallet.publicKey) return;

    try {
      setIsLoading(true);
      addLog("Initializing Vault...");

      const vaultAccount = getVaultPDA();
      const vaultTokenAccount = getAssociatedTokenAddressSync(
        MINT_ADDRESS,
        vaultAccount,
        true
      );

      const tx = await program.methods
        .initialize()
        .accounts({
          vaultAccount: vaultAccount,
          vaultTokenAccount: vaultTokenAccount,
          mint: MINT_ADDRESS,
          user: wallet.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      addLog(`Vault Initialized! Sig: ${tx.slice(0, 8)}...`);
      await fetchVaultBalance();
    } catch (error: any) {
      console.error(error);
      addLog(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!program || !wallet.publicKey || !amount) return;
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
        addLog("Invalid amount entered");
        return;
    }

    try {
      setIsLoading(true);
      const amountBN = new BN(val * 1_000_000); 
      addLog(activeTab === 'collateral' ? `Depositing Collateral: ${amount}...` : `Depositing ${amount} tokens...`);

      const vaultAccount = getVaultPDA();
      const userAccount = getUserStatsPDA(wallet.publicKey);
      
      const userTokenAccount = getAssociatedTokenAddressSync(MINT_ADDRESS, wallet.publicKey);
      const vaultTokenAccount = getAssociatedTokenAddressSync(MINT_ADDRESS, vaultAccount, true);

      const tx = await program.methods
        .deposit(amountBN)
        .accounts({
          vaultAccount: vaultAccount,
          userAccount: userAccount,
          userTokenAccount: userTokenAccount,
          vaultTokenAccount: vaultTokenAccount,
          user: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      addLog(`Deposit Successful! Sig: ${tx.slice(0, 8)}...`);
      setAmount('');
      await fetchVaultBalance();
      await fetchUserWalletBalance();
      await fetchUserAccountData();
    } catch (error: any) {
      console.error(error);
      addLog(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (!program || !wallet.publicKey || !amount) return;
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
        addLog("Invalid amount entered");
        return;
    }

    try {
      setIsLoading(true);
      const amountBN = new BN(val * 1_000_000); 
      addLog(`Borrowing ${amount} tokens...`);

      const vaultAccount = getVaultPDA();
      const userAccount = getUserStatsPDA(wallet.publicKey);
      const userTokenAccount = getAssociatedTokenAddressSync(MINT_ADDRESS, wallet.publicKey);
      const vaultTokenAccount = getAssociatedTokenAddressSync(MINT_ADDRESS, vaultAccount, true);

      const tx = await program.methods
        .borrow(amountBN)
        .accounts({
          vaultAccount: vaultAccount,
          userAccount: userAccount,
          vaultTokenAccount: vaultTokenAccount,
          userTokenAccount: userTokenAccount,
          user: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      addLog(`Borrow Successful! Sig: ${tx.slice(0, 8)}...`);
      setAmount('');
      await fetchVaultBalance();
      await fetchUserWalletBalance();
      await fetchUserAccountData();
    } catch (error: any) {
      console.error(error);
      addLog(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepay = async () => {
    if (!program || !wallet.publicKey || !amount) return;
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
        addLog("Invalid amount entered");
        return;
    }

    try {
      setIsLoading(true);
      const amountBN = new BN(val * 1_000_000); 
      addLog(`Repaying ${amount} tokens...`);

      const vaultAccount = getVaultPDA();
      const userAccount = getUserStatsPDA(wallet.publicKey);
      const userTokenAccount = getAssociatedTokenAddressSync(MINT_ADDRESS, wallet.publicKey);
      const vaultTokenAccount = getAssociatedTokenAddressSync(MINT_ADDRESS, vaultAccount, true);

      // Assumes repay logic mirrors borrow but transfers User -> Vault
      const tx = await program.methods
        .repay(amountBN)
        .accounts({
          vaultAccount: vaultAccount,
          userAccount: userAccount,
          vaultTokenAccount: vaultTokenAccount,
          userTokenAccount: userTokenAccount,
          user: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      addLog(`Repayment Successful! Sig: ${tx.slice(0, 8)}...`);
      setAmount('');
      await fetchVaultBalance();
      await fetchUserWalletBalance();
      await fetchUserAccountData();
    } catch (error: any) {
      console.error(error);
      addLog(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render ---

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-5xl mx-auto">
      {/* Header */}
      <header className="w-full flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">SafeVault</h1>
        </div>
        <WalletMultiButton />
      </header>

      {/* Main Content Grid */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Interaction */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Action Card */}
          <Card title="Manage Assets">
            <div className="flex gap-2 mb-6 p-1 bg-slate-900/50 rounded-lg overflow-x-auto">
              {['deposit', 'collateral', 'borrow', 'repay'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 py-2 px-3 min-w-[80px] rounded-md font-medium text-sm transition-all capitalize whitespace-nowrap ${
                    activeTab === tab 
                      ? 'bg-indigo-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <Input 
                label={`Amount to ${activeTab === 'collateral' ? 'Deposit as Collateral' : activeTab}`}
                placeholder="0.00"
                type="number"
                value={amount}
                onChange={(e: any) => setAmount(e.target.value)}
              />
              
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 mb-4 space-y-2">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Wallet Balance</span>
                  <span className="font-mono text-white">{userWalletBalance !== null ? userWalletBalance.toLocaleString() : '--'}</span>
                </div>
                
                {activeTab === 'collateral' && (
                  <>
                     <div className="w-full h-px bg-slate-800 my-2"></div>
                     <div className="flex justify-between text-sm text-slate-400">
                        <span>Current Collateral</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {userCollateralBalance !== null ? userCollateralBalance.toLocaleString() : '0.00'}
                        </span>
                     </div>
                     <div className="flex justify-between text-sm text-slate-400">
                        <span>Available to Borrow</span>
                        <span className="font-mono text-blue-400">
                           {borrowingPower > 0 ? borrowingPower.toLocaleString() : '0.00'}
                        </span>
                     </div>
                  </>
                )}

                {activeTab === 'borrow' && (
                   <>
                   <div className="w-full h-px bg-slate-800 my-2"></div>
                   <div className="flex justify-between text-sm text-slate-400">
                     <span>Vault Liquidity</span>
                     <span className="font-mono text-white">{vaultBalance !== null ? vaultBalance.toLocaleString() : '--'}</span>
                   </div>
                   <div className="flex justify-between text-sm text-slate-400">
                      <span>Available to Borrow</span>
                      <span className="font-mono text-blue-400">
                          {borrowingPower > 0 ? borrowingPower.toLocaleString() : '0.00'}
                      </span>
                   </div>
                   </>
                )}

                {activeTab === 'repay' && (
                   <>
                   <div className="w-full h-px bg-slate-800 my-2"></div>
                   <div className="flex justify-between text-sm text-slate-400">
                      <span>Currently Borrowed</span>
                      <span className="font-mono text-amber-400 font-bold">
                          {userBorrowedBalance !== null ? userBorrowedBalance.toLocaleString() : '0.00'}
                      </span>
                   </div>
                   </>
                )}
              </div>

              {activeTab === 'deposit' && (
                <Button onClick={handleDeposit} loading={isLoading} disabled={!wallet.connected}>
                  Deposit Assets
                </Button>
              )}

              {activeTab === 'collateral' && (
                <Button onClick={handleDeposit} loading={isLoading} disabled={!wallet.connected} variant="success">
                  Deposit Collateral
                </Button>
              )}

              {activeTab === 'borrow' && (
                <Button onClick={handleBorrow} loading={isLoading} disabled={!wallet.connected} variant="secondary">
                  Borrow Assets
                </Button>
              )}

              {activeTab === 'repay' && (
                <Button onClick={handleRepay} loading={isLoading} disabled={!wallet.connected} variant="warning">
                  Repay Loan
                </Button>
              )}
            </div>
          </Card>

          {/* Transaction Log */}
          <Card title="Transaction History" className="max-h-64 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 text-sm font-mono scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
              {transactionLog.length === 0 ? (
                <p className="text-slate-500 italic">No transactions yet.</p>
              ) : (
                transactionLog.map((log, idx) => (
                  <div key={idx} className="border-l-2 border-indigo-500 pl-2 py-1 text-slate-300">
                    {log}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Info & Admin */}
        <div className="space-y-6">
          <Card title="Vault Statistics">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Value Locked</label>
                <p className="text-2xl font-bold text-white font-mono">
                   {vaultBalance !== null ? `$${(vaultBalance * 1).toLocaleString()}` : '$0.00'}
                </p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">APY</label>
                <p className="text-2xl font-bold text-green-400 font-mono">5.4%</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Liquidity</label>
                <p className="text-xl font-medium text-slate-300 font-mono">
                  {vaultBalance !== null ? `${vaultBalance.toLocaleString()} Tokens` : 'Not Initialized'}
                </p>
              </div>
            </div>
          </Card>

          <Card title="Your Position">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                 <span className="text-slate-400 text-sm">Collateral</span>
                 <span className="font-mono font-medium text-white">
                   {userCollateralBalance !== null ? userCollateralBalance.toLocaleString() : '0.00'}
                 </span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-slate-400 text-sm">Borrowed</span>
                 <span className="font-mono font-medium text-amber-400">
                   {userBorrowedBalance !== null ? userBorrowedBalance.toLocaleString() : '0.00'}
                 </span>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full mt-2 relative">
                 <div 
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: userCollateralBalance && userCollateralBalance > 0 ? '100%' : '0%' }}
                 ></div>
                 {/* Visualizing borrowed against collateral */}
                 <div 
                    className="absolute top-0 left-0 bg-amber-500 h-2 rounded-full transition-all duration-500 opacity-70"
                    style={{ width: (userCollateralBalance && userBorrowedBalance && userCollateralBalance > 0) ? `${Math.min((userBorrowedBalance / userCollateralBalance) * 100, 100)}%` : '0%' }}
                 ></div>
              </div>
              <p className="text-xs text-slate-500 text-right mt-1">Health Factor: Safe</p>
            </div>
          </Card>

          <Card title="Admin Zone">
            <p className="text-xs text-slate-400 mb-4">
              Use this to initialize the PDA accounts on Devnet for the configured Mint address.
            </p>
            <div className="space-y-2">
              <Button variant="secondary" onClick={handleInitialize} loading={isLoading} disabled={!wallet.connected}>
                Initialize Vault
              </Button>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-500 break-all">
                <span className="font-bold">Program ID:</span> {PROGRAM_ID.toString()}
              </p>
              <p className="text-xs text-slate-500 break-all mt-1">
                <span className="font-bold">Mint:</span> {MINT_ADDRESS.toString().slice(0,8)}...
              </p>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="mt-12 text-slate-600 text-sm">
        SafeVault DApp v0.1.2 &bull; Devnet
      </footer>
    </div>
  );
};

export default App;