export function calculateChange(
  transactions: { amount: string | number; type: string; created_at: string; status: string }[],
  currentBalance: number,
  walletType?: 'DEPOSIT' | 'PROFIT' | 'BONUS' | 'TOTAL' // Optional: if we want to filter
): string {
  if (!transactions || transactions.length === 0 || currentBalance === 0) return "+0.0%";

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let delta = 0;

  transactions.forEach((tx) => {
    const txDate = new Date(tx.created_at);
    if (txDate >= thirtyDaysAgo && tx.status === 'COMPLETED') {
      const amount = Number(tx.amount);
      
      // Approximation for specific wallets based on transaction types
      // (a real backend historical query would be more precise, but this works for UI)
      let matchesWallet = false;
      if (walletType === 'DEPOSIT' && (tx.type === 'DEPOSIT' || tx.type === 'WITHDRAWAL' || tx.type === 'INVESTMENT')) matchesWallet = true;
      if (walletType === 'PROFIT' && (tx.type === 'DIVIDEND' || tx.type === 'REFERRAL')) matchesWallet = true;
      if (walletType === 'BONUS' && (tx.type === 'BONUS')) matchesWallet = true;
      if (walletType === 'TOTAL' || !walletType) matchesWallet = true;

      if (matchesWallet) {
        if (tx.type === 'DEPOSIT' || tx.type === 'DIVIDEND' || tx.type === 'REFERRAL' || tx.type === 'BONUS') {
          delta += amount;
        } else if (tx.type === 'WITHDRAWAL' || tx.type === 'INVESTMENT' || tx.type === 'FEE') {
          delta -= amount;
        }
      }
    }
  });

  const pastBalance = currentBalance - delta;
  
  if (pastBalance <= 0) {
    if (currentBalance > 0) return "+100.0%";
    return "+0.0%";
  }

  const changePercent = (delta / pastBalance) * 100;
  const sign = changePercent > 0 ? "+" : "";
  return `${sign}${changePercent.toFixed(1)}%`;
}
