import React, { useState, useEffect } from 'react';

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

  const [recipientType, setRecipientType] = useState('');
  const [senderName, setSenderName] = useState('');
  const [genre, setGenre] = useState('');
  const [voiceGender, setVoiceGender] = useState('');
  const [specialQualities, setSpecialQualities] = useState('');
  const [favoriteMemories, setFavoriteMemories] = useState('');
  const [specialMessage, setSpecialMessage] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentProvider, setPaymentProvider] = useState<'paystack' | 'stripe' | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  useEffect(() => {
    if (step !== 5 || paymentProvider !== null) return;
    setIsDetectingLocation(true);
    fetch('/api/geo/country')
      .then(r => r.json())
      .then(data => setPaymentProvider(data.isNigeria ? 'paystack' : 'stripe'))
      .catch(() => setPaymentProvider('paystack'))
      .finally(() => setIsDetectingLocation(false));
  }, [step, paymentProvider]);

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

    const briefData = { recipientType, senderName, genre, voiceGender, specialQualities, favoriteMemories, specialMessage, customerEmail };
    sessionStorage.setItem('sonnetary_brief', JSON.stringify(briefData));

    try {
      if (paymentProvider === 'stripe') {
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(briefData),
        });
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          setError('Could not initialize checkout session. Please try again.');
        }
      } else {
        const response = await fetch('/api/paystack/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: customerEmail, amount: 3000000, metadata: briefData }),
        });
        const data = await response.json();
        if (data.authorization_url) {
          window.location.href = data.authorization_url;
        } else {
          setError('Could not initialize checkout session. Please try again.');
        }
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
              <div key={i} className="h-1.5 flex-1 rounded-full overflow-hidden bg-background-border">
                <div className={`h-full bg-primary transition-all duration-500 ${step >= i ? 'w-full' : 'w-0'}`} />
              </div>
            ))}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#1C1008] tracking-tight mb-4 font-display">
            {step === 1 && "Let's start with the basics"}
            {step === 2 && "Musical Style"}
            {step === 3 && "The Heart of the Story"}
            {step === 4 && "A message from your heart"}
            {step === 5 && "Review & Complete"}
          </h1>
          <p className="text-[#78614A] font-body text-lg">
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
                <label className="block text-[#1C1008] font-bold mb-4 font-display text-xl text-center">Who's this for?</label>
                <div className="flex flex-wrap justify-center gap-3">
                  {RECIPIENTS.map(r => (
                    <button
                      key={r}
                      onClick={() => setRecipientType(r)}
                      className={`px-5 py-3 rounded-full border-2 font-bold transition-all text-sm font-display uppercase tracking-wide
                        ${recipientType === r
                          ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105'
                          : 'bg-background-surface border-background-border text-[#78614A] hover:border-primary/50 hover:text-[#1C1008]'
                        }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="max-w-md w-full mx-auto mt-4">
                <label className="block text-[#1C1008] font-bold mb-3 font-display text-xl text-center">What's your name?</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-background-surface border-2 border-background-border rounded-xl px-4 py-4 text-[#1C1008] placeholder-[#A08B74] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body text-lg text-center"
                />
              </div>
            </div>
          )}

          {/* Step 2: Musical Style */}
          {step === 2 && (
            <div className="flex flex-col gap-10">
              <div>
                <label className="block text-[#1C1008] font-bold mb-4 font-display text-xl text-center uppercase tracking-wide">Choose A Genre</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {NEW_GENRES.map(g => (
                    <button
                      key={g.name}
                      onClick={() => setGenre(g.name)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${genre === g.name ? 'bg-primary/10 border-primary ring-2 ring-primary/20' : 'bg-background-surface border-background-border hover:border-primary/40 hover:bg-primary/5'}`}
                    >
                      <span className={`material-symbols-outlined text-3xl mb-2 ${genre === g.name ? 'text-primary' : 'text-[#A08B74]'}`}>{g.icon}</span>
                      <span className={`font-bold font-display ${genre === g.name ? 'text-[#1C1008]' : 'text-[#78614A]'}`}>{g.name}</span>
                      <span className="text-xs text-[#A08B74] mt-1">{g.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[#1C1008] font-bold mb-4 font-display text-xl text-center uppercase tracking-wide">Preferred Voice Gender</label>
                <div className="flex flex-wrap justify-center gap-4">
                  {VOICES.map(v => (
                    <button
                      key={v}
                      onClick={() => setVoiceGender(v)}
                      className={`px-6 py-4 rounded-xl border-2 font-bold transition-all font-display tracking-wide
                        ${voiceGender === v
                          ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105'
                          : 'bg-background-surface border-background-border text-[#78614A] hover:border-primary/50 hover:text-[#1C1008]'
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
                <label className="block text-[#1C1008] font-bold mb-2 font-display text-2xl">What makes them special?</label>
                <p className="text-[#78614A] mb-4 font-body">Describe their character and the qualities you love most.</p>
                <textarea
                  className="w-full bg-background-surface border-2 border-background-border rounded-2xl p-6 text-[#1C1008] placeholder:text-[#A08B74] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none transition-all text-lg leading-relaxed h-[180px] font-body"
                  placeholder="They always put others first and have a laugh that lights up the room..."
                  value={specialQualities}
                  onChange={(e) => setSpecialQualities(e.target.value)}
                />
              </div>
              <div className="relative group">
                <label className="block text-[#1C1008] font-bold mb-2 font-display text-2xl">Share your favorite memories</label>
                <p className="text-[#78614A] mb-4 font-body">What moments with them do you treasure most?</p>
                <textarea
                  className="w-full bg-background-surface border-2 border-background-border rounded-2xl p-6 text-[#1C1008] placeholder:text-[#A08B74] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none transition-all text-lg leading-relaxed h-[180px] font-body"
                  placeholder="That summer road trip to the coast, or simply lazy Sunday mornings drinking coffee..."
                  value={favoriteMemories}
                  onChange={(e) => setFavoriteMemories(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 4: Message */}
          {step === 4 && (
            <div className="flex flex-col gap-6 w-full mx-auto shadow-sm">
              <div className="relative group">
                <p className="text-[#78614A] mb-6 font-body text-lg text-center px-4">
                  Write anything else that you feel would be relevant to include in your song, and we'll do our best to include it! What do you want them to know, that you've never said enough?
                </p>
                <textarea
                  className="w-full bg-background-surface border-2 border-background-border rounded-2xl p-8 text-[#1C1008] placeholder:text-[#A08B74] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none transition-all text-xl leading-relaxed h-[350px] font-body"
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
              <div className="bg-background-surface border border-background-border rounded-3xl p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <h3 className="text-2xl font-bold text-[#1C1008] mb-6 font-display flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">receipt_long</span>
                  Your Song Brief
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 relative">
                  {[
                    { label: 'To', value: recipientType },
                    { label: 'From', value: senderName },
                    { label: 'Style', value: genre },
                    { label: 'Voice', value: voiceGender },
                  ].map(item => (
                    <div key={item.label} className="bg-background rounded-2xl p-4 border border-background-border">
                      <p className="text-xs text-[#A08B74] uppercase tracking-widest font-display mb-1">{item.label}</p>
                      <p className="text-lg font-bold text-[#1C1008] truncate">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-8 border-t border-background-border relative z-10">
                  <label className="text-sm font-medium text-[#1C1008] block mb-3 font-display">
                    Where should we send your completed song? <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#A08B74]">alternate_email</span>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="you@email.com"
                      required
                      className="w-full bg-background border-2 border-background-border rounded-xl py-4 pl-12 pr-4 text-[#1C1008] placeholder:text-[#A08B74] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  {isDetectingLocation ? (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg text-primary animate-spin">progress_activity</span>
                      <span className="text-[#78614A] font-body text-sm">Detecting your location...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-2xl font-bold text-[#1C1008] font-display">
                          {paymentProvider === 'stripe' ? '$25' : '₦30,000'}
                        </span>
                        <span className="text-sm text-[#A08B74] line-through font-display">
                          {paymentProvider === 'stripe' ? '$50' : '₦60,000'}
                        </span>
                        <span className="px-2.5 py-1 bg-primary text-white text-xs font-bold rounded-full font-display tracking-wide">
                          50% OFF
                        </span>
                      </div>
                      <p className="text-sm text-[#78614A] font-body">
                        Delivery in 3 Days • Secure Payment via {paymentProvider === 'stripe' ? 'Stripe' : 'Paystack'}
                      </p>
                    </>
                  )}
                </div>
                <div className="flex gap-2 text-3xl opacity-40">
                  <i className="pf pf-mastercard" />
                  <i className="pf pf-visa" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-8 mx-auto max-w-2xl bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm flex items-center justify-center gap-2 font-medium">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="max-w-3xl w-full mx-auto flex items-center justify-between pt-8 mt-4 border-t border-background-border">
          <button
            onClick={prevStep}
            disabled={step === 1 || isSubmitting}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-[#78614A] hover:text-[#1C1008] hover:bg-[#1C1008]/5'}`}
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
            Back
          </button>

          {step < 5 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-10 py-4 rounded-xl bg-[#1C1008] text-white font-bold shadow-xl shadow-[#1C1008]/10 hover:shadow-[#1C1008]/20 transition-all transform hover:scale-105 active:scale-95 text-lg font-display tracking-wide"
            >
              Continue
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          ) : (
            <button
              onClick={handleCompleteBrief}
              disabled={isSubmitting || !customerEmail || isDetectingLocation || !paymentProvider}
              className="flex items-center gap-3 px-10 py-4 rounded-xl bg-primary text-white font-bold shadow-xl shadow-primary/25 hover:bg-primary-dark transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg font-display tracking-wider uppercase"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
                  Processing...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">lock</span>
                  Pay {paymentProvider === 'stripe' ? '$25' : '₦30,000'}
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
