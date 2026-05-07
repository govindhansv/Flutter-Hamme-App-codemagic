import { useEffect, useState } from 'react';

const players = ['S', 'K', 'R', 'N', 'A'];
const profileImage = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80';
const playerColors = ['#ff4f97', '#35d678', '#42b6ff', '#ffd230', '#ff5c5c'];

function App() {
  const [isSent, setIsSent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const isExpired = secondsLeft === 0;

  useEffect(() => {
    if (!isSent || secondsLeft === 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setSecondsLeft((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isSent, secondsLeft]);

  const handleAnswer = () => {
    setIsSent(true);
    setSecondsLeft(60);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#9b63f7_0%,#8f48fa_48%,#7c35ff_100%)] text-white">
      <section className={`mx-auto flex min-h-screen w-full max-w-[360px] flex-col items-center px-4 pb-8 text-center ${isSent ? 'pt-[82px]' : 'pt-[132px]'}`}>
        {isSent ? (
          <RevealScreen secondsLeft={secondsLeft} isExpired={isExpired} />
        ) : (
          <QuestionScreen onAnswer={handleAnswer} />
        )}

        <FriendsPlaying className={isSent ? 'mt-[29px]' : 'mt-[45px]'} />

        <footer className="mt-auto flex flex-col items-center">
          <h1 className="brand-text text-[28px] font-black leading-none tracking-[-0.06em]">Hamme</h1>
          <p className="mt-2 text-[12px] font-extrabold">play games &amp; meet people</p>
          <div className="mt-[28px] flex gap-4 text-[12px] font-bold text-white/45">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
          </div>
        </footer>
      </section>
    </main>
  );
}

function QuestionScreen({ onAnswer }) {
  return (
    <>
      <div className="w-full px-6">
        <div className="relative z-10 h-[98px] w-[98px] overflow-hidden rounded-full border-[5px] border-white bg-[#d8b09f] shadow-[0_7px_14px_rgba(0,0,0,0.22)]">
          <img
            src={profileImage}
            alt="Profile"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="-mt-[6px] flex h-[37px] w-full items-center justify-center rounded-xl bg-white px-4 text-[19px] font-black tracking-[0.01em] text-black shadow-[0_7px_0_rgba(0,0,0,0.18)]">
          What do you think of me?
        </div>

        <p className="mt-4 text-[14px] font-medium text-white/95">🙈 send anonymously</p>

        <div className="mt-[10px] flex w-full flex-col gap-[10px]">
          <button onClick={onAnswer} className="h-[48px] rounded-2xl bg-[linear-gradient(90deg,#16c9e9,#0569f9)] text-[17px] font-extrabold shadow-[0_7px_0_rgba(0,0,0,0.18)] transition active:translate-y-1 active:shadow-[0_3px_0_rgba(0,0,0,0.18)]">
            🤝 Friend
          </button>
          <button onClick={onAnswer} className="h-[48px] rounded-2xl bg-[linear-gradient(90deg,#d14ce6,#ff3c98)] text-[17px] font-extrabold shadow-[0_7px_0_rgba(0,0,0,0.18)] transition active:translate-y-1 active:shadow-[0_3px_0_rgba(0,0,0,0.18)]">
            😍 Crush
          </button>
          <button onClick={onAnswer} className="h-[48px] rounded-2xl bg-[linear-gradient(90deg,#b7a7ee,#58598f)] text-[17px] font-extrabold shadow-[0_7px_0_rgba(0,0,0,0.18)] transition active:translate-y-1 active:shadow-[0_3px_0_rgba(0,0,0,0.18)]">
            😈 Frenemy
          </button>
        </div>
      </div>
    </>
  );
}

function RevealScreen({ secondsLeft, isExpired }) {
  return (
    <div className="w-full">
      <div className="mx-auto flex h-[25px] w-[96px] items-center justify-center rounded-full border border-white/80 bg-white/10 text-[18px] font-extrabold">
        <span className="mr-[7px] flex h-[19px] w-[19px] items-center justify-center rounded-full bg-white text-[12px] text-[#9b55f7]">✓</span>
        Sent!
      </div>

      <div className="mt-[85px] text-[15px] font-medium text-white/70">Now the question is -</div>
      <h1 className="mx-auto mt-2 max-w-[285px] text-[31px] font-black leading-[1.38] tracking-[-0.02em]">
        What does
        <span className="mx-[8px] inline-flex h-[38px] w-[38px] translate-y-[7px] overflow-hidden rounded-full border-2 border-white bg-[#d8b09f] align-baseline">
          <img src={profileImage} alt="Sofia" className="h-full w-full object-cover" />
        </span>
        Sofia
        <br />
        think of you?
      </h1>

      <div className="mt-[51px] px-4">
        <div className="mb-[6px] flex items-center justify-between text-[11px] font-black text-white/65">
          <span>{isExpired ? 'LINK EXPIRED' : 'LINK EXPIRES IN'}</span>
          <span className={secondsLeft <= 20 ? 'text-[#ff4545]' : 'text-white'}>{String(secondsLeft).padStart(2, '0')}s</span>
        </div>
        <div className="h-[3px] overflow-hidden rounded-full bg-white/35">
          <div
            className={`h-full rounded-full ${secondsLeft <= 20 ? 'bg-[#ff4545]' : 'bg-white'}`}
            style={{ width: `${(secondsLeft / 60) * 100}%` }}
          />
        </div>
      </div>

      <button
        disabled={isExpired}
        className={`mt-[12px] flex h-[61px] w-full items-center justify-center rounded-[27px] px-8 text-[20px] font-black shadow-[0_7px_0_rgba(0,0,0,0.10)] transition ${isExpired ? 'bg-white/35 text-[#9647df]' : 'bg-white text-[#c000df] active:translate-y-1'}`}
      >
        <span className="flex-1">👀 Reveal</span>
        <span className="text-[27px] font-light">→</span>
      </button>
    </div>
  );
}

function FriendsPlaying({ className }) {
  return (
    <>
        <div className={`${className} flex items-center`}>
          <span className="mr-2 h-[10px] w-[10px] rounded-full bg-[#22ff00]" />
          <div className="flex">
            {players.map((player, index) => (
              <span
                key={player}
                className="flex h-[22px] w-[22px] items-center justify-center rounded-full border border-white/25 text-[12px] font-black text-white"
                style={{
                  marginLeft: index === 0 ? 0 : -4,
                  backgroundColor: playerColors[index],
                }}
              >
                {player}
              </span>
            ))}
          </div>
        </div>

        <p className="mt-[8px] text-[17px] font-extrabold tracking-[0.01em]">☝️ 6 friends playing now ☝️</p>
    </>
  );
}

export default App;
