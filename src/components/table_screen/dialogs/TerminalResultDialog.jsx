import { Coins } from 'lucide-react';
import TableDialogOverlay from '@/components/dialog/TableDialogOverlay';

export default function TerminalResultDialog({ result, onCloseTab }) {
  const won = result?.type === 'win';
  const cheated = result?.type === 'cheated';
  const tableComplete = result?.tableComplete === true;
  const waitingForCirculation = tableComplete && result?.circulationComplete !== true;
  const title = cheated ? result?.title : tableComplete ? 'Table Ended' : won ? 'You Won' : 'You Lose';
  const titleClass = cheated
    ? result?.cheat?.isViewerCheater ? 'text-red-300' : 'text-purple-300'
    : tableComplete ? 'text-teal-300' : won ? 'text-emerald-300' : 'text-red-300';

  return (
    <TableDialogOverlay>
      <div className="bg-slate-950/50 p-6 border-b border-teal-500/20 text-center">
        <p className="text-teal-500 font-mono text-xs tracking-[0.3em] uppercase mb-1">
          Private Poker
        </p>
        <h1 className={`text-4xl font-black tracking-widest uppercase italic ${titleClass}`}>
          {title}
        </h1>
        {cheated && result?.subtitle && (
          <p className={`mt-3 font-mono text-sm font-black uppercase tracking-[0.22em] ${titleClass}`}>
            {result.subtitle}
          </p>
        )}
        {tableComplete && (
          <p className={`mt-3 font-mono text-sm font-black uppercase tracking-[0.22em] ${won ? 'text-emerald-300' : 'text-red-300'}`}>
            {won ? 'You Won' : 'You Lose'}
          </p>
        )}
      </div>

      <div className="p-6 flex flex-col gap-5">
        {won && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-yellow-300/30 bg-slate-950 px-4 py-5 text-white">
            <Coins size={24} className="text-yellow-200 drop-shadow-[0_0_10px_rgba(250,204,21,0.35)]" />
            <span className="font-mono text-2xl font-black">{result?.chips ?? 0}</span>
          </div>
        )}

        {waitingForCirculation && (
          <p className="text-center font-mono text-xs uppercase tracking-[0.22em] text-teal-200">
            Waiting for other players
          </p>
        )}

        <button
          type="button"
          onClick={onCloseTab}
          disabled={waitingForCirculation}
          className={`w-full py-3 rounded-lg font-black transition-colors uppercase text-xs tracking-widest shadow-[0_0_20px_rgba(255,165,0,0.3)] ${waitingForCirculation
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
            : 'bg-ember-500 text-slate-950 hover:bg-ember-400 cursor-pointer'}`}
        >
          {tableComplete ? 'Close' : 'OK'}
        </button>
      </div>
    </TableDialogOverlay>
  );
}
