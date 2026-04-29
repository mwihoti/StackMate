'use client';

interface Props {
  txId: string | null;
  status: 'idle' | 'pending' | 'success' | 'failed';
}

export function TxStatus({ txId, status }: Props) {
  if (status === 'idle' || !txId) return null;

  const config = {
    pending: { label: 'Transaction pending...', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    success: { label: 'Transaction confirmed', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
    failed: { label: 'Transaction failed', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  }[status];

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${config.bg} mt-3`}>
      {status === 'pending' && (
        <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      )}
      <div>
        <p className={`text-sm font-medium ${config.color}`}>{config.label}</p>
        <a
          href={`https://explorer.hiro.so/txid/${txId}?chain=mainnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          View on explorer
        </a>
      </div>
    </div>
  );
}
