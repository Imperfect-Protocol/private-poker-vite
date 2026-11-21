export default function Background() {
  return (
    <div className="absolute inset-0 rounded-[100px] border-4 border-slate-200/28 shadow-[0_0_29px_rgba(255,75,104,0.3),0_0_68px_rgba(225,29,72,0.18),inset_0_0_24px_rgba(255,225,231,0.14)] overflow-hidden">
      <img
        src="/table.jpg"
        alt="Poker Table"
        className="w-full h-full object-cover filter-[grayscale(0.18)_sepia(0.55)_hue-rotate(304deg)_saturate(1.45)_brightness(0.72)]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/20 to-slate-950/90" />
    </div>
  );
}
