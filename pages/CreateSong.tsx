import React, { useState } from 'react';

const RECIPIENTS = ['Husband', 'Wife', 'Boyfriend', 'Girlfriend', 'Children', 'Father', 'Mother', 'Sibling', 'Friend', 'Myself', 'Other'];

const NEW_GENRES = [
  { name: 'Afro-Beats', icon: 'music_note', desc: 'Vibrant & rhythmic' },
  { name: 'Afro-Jazz', icon: 'nightlife', desc: 'Smooth & soulful' },
  { name: 'Afro-R&B', icon: 'favorite', desc: 'Romantic & groovy' },
  { name: 'Afro-Reggae', icon: 'queue_music', desc: 'Island vibes' },
  { name: 'Afro-House', icon: 'speaker', desc: 'Energetic & driving' },
  { name: 'Gospel', icon: 'volunteer_activism', desc: 'Uplifting & spiritual' },
];

const VOICES = ['Female Voice', 'Male Voice', 'No Preference'];

const CreateSong: React.FC = () => {
  const [step, setStep] = useState(1);

  // Step 1: Basics
  const [recipientType, setRecipientType] = useState('');
  const [senderName, setSenderName] = useState('');

  // Step 2: Musical Style
  const [genre, setGenre] = useState('');
  const [voiceGender, setVoiceGender] = useState('');

  // Step 3: Character & Memories
  const [specialQualities, setSpecialQualities] = useState('');
  const [favoriteMemories, setFavoriteMemories] = useState('');

  // Step 4: Message
  const [specialMessage, setSpecialMessage] = useState('');

  // Step 5: Email & Payment
  const [customerEmail, setCustomerEmail] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextStep = () => {
    setError(null);
    if (step === 1 && (!recipientType || !senderName.trim())) {
      setError('Please select who this is for and enter your name.');
      return;
    }
    if (step === 2 && (!genre || !voiceGender)) {
      setError('Please select both a genre and voice preference.');
      return;
    }
    if (step === 3 && (specialQualities.trim().length < 5 || favoriteMemories.trim().length < 5)) {
      setError('Please provide a few details for both questions to help us write the best song.');
      return;
    }
    if (step === 4 && specialMessage.trim().length < 5) {
      setError('Please write a special message from your heart.');
      return;
    }
    setStep(s => Math.min(s + 1, 5));
  };

  const prevStep = () => {
    setError(null);
    setStep(s => Math.max(s - 1, 1));
  };

  const handleCompleteBrief = async () => {
    if (step !== 5) return;
    if (!customerEmail || !customerEmail.includes('@')) {
      setError('Please enter a valid email address to receive your song.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const briefData = {
      recipientType,
      senderName,
      genre,
      voiceGender,
      specialQualities,
      favoriteMemories,
      specialMessage,
      customerEmail
    };
    sessionStorage.setItem('sonnetary_brief', JSON.stringify(briefData));

    try {
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customerEmail,
          amount: 3000000, // 30,000 NGN in Kobo
          metadata: briefData
        }),
      });

      const data = await response.json();

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        setError('Could not initialize checkout session. Please try again.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Something went wrong. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col min-h-[calc(100vh-64px)] justify-center">
      <div className="flex-1 flex flex-col justify-center py-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Progress header */}
        <div className="text-center mb-10 w-full max-w-xl mx-auto">
          <p className="text-primary font-bold tracking-widest uppercase text-xs mb-3 font-display">Step {step} of 5</p>
          <div className="flex justify-between gap-2 mb-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-1.5 flex-1 rounded-full overflow-hidden bg-white/10">
                <div className={`h-full bg-primary transition-all duration-500 ${step >= i ? 'w-full' : 'w-0'}`} />
              </div>
            ))}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4 font-display">
            {step === 1 && "Let's start with the basics"}
            {step === 2 && "Musical Style"}
            {step === 3 && "The Heart of the Story"}
            {step === 4 && "A message from your heart"}
            {step === 5 && "Review & Complete"}
          </h1>
          <p className="text-slate-400 font-body text-lg">
            {step === 1 && "Who is this customized song for?"}
            {step === 2 && "Choose the foundational vibe and voice."}
            {step === 3 && "Tell us what makes them unique and your favorite moments together."}
            {step === 4 && "What is the one thing you want them to know?"}
            {step === 5 && "Review your choices and enter your email for delivery."}
          </p>
        </div>

        {/* Dynamic Form Area */}
        <div className="w-full max-w-3xl mx-auto">

          {/* Step 1: Basics */}
          {step === 1 && (
            <div className="flex flex-col gap-8">
              <div>
                <label className="block text-white font-bold mb-4 font-display text-xl text-center">Who's this for?</label>
                <div className="flex flex-wrap justify-center gap-3">
                  {RECIPIENTS.map(r => (
                    <button
                      key={r}
                      onClick={() => setRecipientType(r)}
                      className={`px-5 py-3 rounded-full border-2 font-bold transition-all text-sm font-display uppercase tracking-wide
                        ${recipientType === r
                          ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105'
                          : 'bg-background-surface border-white/10 text-slate-300 hover:border-primary/50 hover:text-white'
                        }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="max-w-md w-full mx-auto mt-4">
                <label className="block text-white font-bold mb-3 font-display text-xl text-center">What's your name?</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-background-surface border-2 border-background-border rounded-xl px-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body text-lg text-center"
                />
              </div>
            </div>
          )}

          {/* Step 2: Musical Style */}
          {step === 2 && (
            <div className="flex flex-col gap-10">
              <div>
                <label className="block text-white font-bold mb-4 font-display text-xl text-center uppercase tracking-wide">Choose A Genre</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {NEW_GENRES.map(g => (
                    <button
                      key={g.name}
                      onClick={() => setGenre(g.name)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${genre === g.name ? 'bg-primary/10 border-primary ring-2 ring-primary/20' : 'bg-background-surface border-white/5 hover:border-white/20 hover:bg-white/5'}`}
                    >
                      <span className={`material-symbols-outlined text-3xl mb-2 ${genre === g.name ? 'text-primary' : 'text-slate-400'}`}>{g.icon}</span>
                      <span className={`font-bold font-display ${genre === g.name ? 'text-white' : 'text-slate-300'}`}>{g.name}</span>
                      <span className="text-xs text-slate-500 mt-1">{g.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-white font-bold mb-4 font-display text-xl text-center uppercase tracking-wide">Preferred Voice Gender</label>
                <div className="flex flex-wrap justify-center gap-4">
                  {VOICES.map(v => (
                    <button
                      key={v}
                      onClick={() => setVoiceGender(v)}
                      className={`px-6 py-4 rounded-xl border-2 font-bold transition-all font-display tracking-wide
                        ${voiceGender === v
                          ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105'
                          : 'bg-background-surface border-white/10 text-slate-300 hover:border-primary/50 hover:text-white'
                        }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Character & Memories */}
          {step === 3 && (
            <div className="flex flex-col gap-8 w-full mx-auto">
              <div className="relative group">
                <label className="block text-white font-bold mb-2 font-display text-2xl">What makes them special?</label>
                <p className="text-slate-400 mb-4 font-body">Describe their character and the qualities you love most.</p>
                <textarea
                  className="w-full bg-background-surface border-2 border-background-border rounded-2xl p-6 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none transition-all text-lg leading-relaxed h-[180px] font-body"
                  placeholder="They always put others first and have a laugh that lights up the room..."
                  value={specialQualities}
                  onChange={(e) => setSpecialQualities(e.target.value)}
                />
              </div>
              <div className="relative group">
                <label className="block text-white font-bold mb-2 font-display text-2xl">Share your favorite memories</label>
                <p className="text-slate-400 mb-4 font-body">What moments with them do you treasure most?</p>
                <textarea
                  className="w-full bg-background-surface border-2 border-background-border rounded-2xl p-6 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none transition-all text-lg leading-relaxed h-[180px] font-body"
                  placeholder="That summer road trip to the coast, or simply lazy Sunday mornings drinking coffee..."
                  value={favoriteMemories}
                  onChange={(e) => setFavoriteMemories(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 4: Message */}
          {step === 4 && (
            <div className="flex flex-col gap-6 w-full mx-auto shadow-2xl">
              <div className="relative group">
                <p className="text-slate-300 mb-6 font-body text-lg text-center px-4">
                  Write anything else that you feel would be relevant to include in your song, and we'll do our best to include it! What do you want them to know, that you've never said enough? What is that one thing from your heart you want to say?
                </p>
                <textarea
                  className="w-full bg-background-surface border-2 border-background-border rounded-2xl p-8 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none transition-all text-xl leading-relaxed h-[350px] font-body"
                  placeholder="I've never told you this enough, but you are the rock of my life. Thank you for always believing in me."
                  value={specialMessage}
                  onChange={(e) => setSpecialMessage(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 5: Summary & Email */}
          {step === 5 && (
            <div className="w-full max-w-2xl mx-auto flex flex-col gap-8">
              <div className="bg-background-surface border border-background-border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <h3 className="text-2xl font-bold text-white mb-6 font-display flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">receipt_long</span>
                  Your Song Brief
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 relative">
                  <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-display mb-1">To</p>
                    <p className="text-lg font-bold text-white">{recipientType}</p>
                  </div>
                  <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-display mb-1">From</p>
                    <p className="text-lg font-bold text-white max-w-[200px] truncate">{senderName}</p>
                  </div>
                  <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-display mb-1">Style</p>
                    <p className="text-lg font-bold text-white">{genre}</p>
                  </div>
                  <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-display mb-1">Voice</p>
                    <p className="text-lg font-bold text-white">{voiceGender}</p>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/10 relative z-10">
                  <label className="text-sm font-medium text-white block mb-3 font-display">
                    Where should we send your completed song? <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">alternate_email</span>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="you@email.com"
                      required
                      className="w-full bg-black/40 border-2 border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-xl font-bold text-white font-display mb-1">Total Due: ₦30,000</h4>
                  <p className="text-sm text-slate-400 font-body">Delivery in 3 Days • Secure Payment via Paystack</p>
                </div>
                <div className="flex gap-2 text-3xl opacity-50">
                  <i className="pf pf-mastercard" />
                  <i className="pf pf-visa" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-8 mx-auto max-w-2xl bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm flex items-center justify-center gap-2 font-medium">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="max-w-3xl w-full mx-auto flex items-center justify-between pt-8 mt-4 border-t border-background-border/50">
          <button
            onClick={prevStep}
            disabled={step === 1 || isSubmitting}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
            Back
          </button>

          {step < 5 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-10 py-4 rounded-xl bg-white text-background font-bold shadow-xl shadow-white/10 hover:shadow-white/20 transition-all transform hover:scale-105 active:scale-95 text-lg font-display tracking-wide"
            >
              Continue
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          ) : (
            <button
              onClick={handleCompleteBrief}
              disabled={isSubmitting || !customerEmail}
              className="flex items-center gap-3 px-10 py-4 rounded-xl bg-primary text-white font-bold shadow-xl shadow-primary/30 hover:bg-red-600 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg font-display tracking-wider uppercase"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
                  Processing...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">lock</span>
                  Pay ₦30,000
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateSong;
