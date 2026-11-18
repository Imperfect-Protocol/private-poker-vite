/**
 * Splash-flavoured loading screen for routes that are waiting on chain data.
 * Just the splash background, breathing gently, with no age check or lockup.
 */
export default function LoadingSplash() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="fixed inset-0 z-[200] overflow-hidden bg-slate-950"
    >
      <div className="absolute inset-0 animate-[splash-breathe_2400ms_ease-in-out_infinite]">
        <img
          src="/splash.jpg"
          alt=""
          aria-hidden
          className="h-full w-full object-cover opacity-55 filter-[grayscale(0.35)_sepia(0.4)_hue-rotate(300deg)_saturate(1.4)_brightness(0.64)]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,5,6,0.28),#090506_95%),radial-gradient(circle,rgba(225,29,72,0.2),transparent_34rem)]" />
      </div>
    </div>
  );
}
