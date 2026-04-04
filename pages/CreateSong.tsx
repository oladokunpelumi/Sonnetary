import React, { useState, useEffect } from 'react';

const RECIPIENTS = [
  'Husband',
  'Wife',
  'Boyfriend',
  'Girlfriend',
  'Children',
  'Father',
  'Mother',
  'Sibling',
  'Friend',
  'Myself',
  'Other',
];

const NEW_GENRES = [
  { name: 'Afro-Beats',  icon: 'music_note',              desc: 'Vibrant & rhythmic' },
  { name: 'Afro-R&B',   icon: 'favorite',                desc: 'Romantic & groovy' },
  { name: 'Afro-House',  icon: 'speaker',                 desc: 'Energetic & electric' },
  { name: 'Afro-Reggae', icon: 'queue_music',             desc: 'Island vibes' },
  { name: 'Gospel',      icon: 'volunteer_activism',      desc: 'Uplifting & spiritual' },
  { name: 'R&B',         icon: 'radio',                   desc: 'Smooth & soulful' },
  { name: 'Hip-Hop',     icon: 'mic',                     desc: 'Bold & rhythmic' },
  { name: 'Pop',         icon: 'album',                   desc: 'Catchy & bright' },
  { name: 'Soul',        icon: 'sentiment_very_satisfied', desc: 'Deep & emotive' },
  { name: 'Highlife',    icon: 'celebration',             desc: 'Joyful & cultural' },
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
  const [isFastDelivery, setIsFastDelivery] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentProvider, setPaymentProvider] = useState<'paystack' | 'stripe' | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  useEffect(() => {
    if (step !== 5 || paymentProvider !== null) return;
    setIsDetectingLocation(true);
    fetch('/api/geo/country')
      .then((r) => r.json())
      .then((data) => setPaymentProvider(data.isNigeria ? 'paystack' : 'stripe'))
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
    setStep((s) => Math.min(s + 1, 5));
  };

  const prevStep = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
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
      customerEmail,
      fastDelivery: isFastDelivery,
    };
    sessionStorage.setItem('yourgbedu_brief', JSON.stringify(briefData));

    try {
      if (paymentProvider === 'stripe') {
        const amountInCents = isFastDelivery ? 4000 : 2500;
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...briefData, amount: amountInCents }),
        });
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          setError('Could not initialize checkout session. Please try again.');
        }
      } else {
        const amountInKobo = isFastDelivery ? 5000000 : 3000000;
        const response = await fetch('/api/paystack/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: customerEmail, amount: amountInKobo, metadata: briefData }),
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
    <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col min-h-[calc(100vh-64px)] justify-center bg-[#FFFDF5] rounded-3xl my-6 shadow-sm border border-[#E8D5A3]/30">
      <div className="flex-1 flex flex-col justify-center py-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Progress header */}
        <div className="text-center mb-10 w-full max-w-xl mx-auto">
          <p className="text-[#8a7124] font-bold tracking-widest uppercase text-xs mb-3 font-display">
            Step {step} of 5
          </p>
          <div className="flex justify-between gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-1.5 flex-1 rounded-full overflow-hidden bg-[#E8D5A3]/50">
                <div
                  className={`h-full bg-[#D4AF37] transition-all duration-500 ${step >= i ? 'w-full' : 'w-0'}`}
                />
              </div>
            ))}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#241a00] tracking-tight mb-4 font-serif italic">
            {step === 1 && "Let's start with the basics"}
            {step === 2 && 'Musical Style'}
            {step === 3 && 'The Heart of the Story'}
            {step === 4 && 'A message from your heart'}
            {step === 5 && 'Review & Complete'}
          </h1>
          <p className="text-[#5C4A2F] font-body text-lg">
            {step === 1 && 'Who is this customized song for?'}
            {step === 2 && 'Choose the foundational vibe and voice.'}
            {step === 3 && 'Tell us what makes them unique and your favorite moments together.'}
            {step === 4 && 'What is the one thing you want them to know?'}
            {step === 5 && 'Review your choices and enter your email for delivery.'}
          </p>
        </div>

        {/* Dynamic Form Area */}
        <div className="w-full max-w-3xl mx-auto">
          {/* Step 1: Basics */}
          {step === 1 && (
            <div className="flex flex-col gap-8">
              <div>
                <label className="block text-[#241a00] font-bold mb-4 font-display text-xl text-center">
                  Who's this for?
                </label>
                <div className="flex flex-wrap justify-center gap-3">
                  {RECIPIENTS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRecipientType(r)}
                      className={`px-5 py-3 rounded-full border-2 font-bold transition-all text-sm font-display uppercase tracking-wide
                        ${
                          recipientType === r
                            ? 'bg-[#241a00] border-[#241a00] text-[#D4AF37] shadow-lg shadow-[#241a00]/20 scale-105'
                            : 'bg-white border-[#E8D5A3] text-[#5C4A2F] hover:border-[#D4AF37] hover:text-[#241a00]'
                        }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="max-w-md w-full mx-auto mt-4">
                <label className="block text-[#241a00] font-bold mb-3 font-display text-xl text-center">
                  What's your name?
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-white border-2 border-[#E8D5A3] rounded-xl px-4 py-4 text-[#241a00] placeholder-[#A08B74] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 transition-all font-body text-lg text-center"
                />
              </div>
            </div>
          )}

          {/* Step 2: Musical Style */}
          {step === 2 && (
            <div className="flex flex-col gap-10">
              <div>
                <label className="block text-[#241a00] font-bold mb-4 font-display text-xl text-center uppercase tracking-wide">
                  Choose A Genre
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {NEW_GENRES.map((g) => (
                    <button
                      key={g.name}
                      onClick={() => setGenre(g.name)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${genre === g.name ? 'bg-white border-[#D4AF37] ring-2 ring-[#D4AF37]/20 shadow-md' : 'bg-white border-[#E8D5A3] hover:border-[#D4AF37] hover:shadow-sm'}`}
                    >
                      <span
                        className={`material-symbols-outlined text-3xl mb-2 ${genre === g.name ? 'text-[#D4AF37]' : 'text-[#8a7124]'}`}
                      >
                        {g.icon}
                      </span>
                      <span
                        className={`font-bold font-display ${genre === g.name ? 'text-[#241a00]' : 'text-[#5C4A2F]'}`}
                      >
                        {g.name}
                      </span>
                      <span className="text-xs text-[#8a7124] mt-1">{g.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[#241a00] font-bold mb-4 font-display text-xl text-center uppercase tracking-wide">
                  Preferred Voice Gender
                </label>
                <div className="flex flex-wrap justify-center gap-4">
                  {VOICES.map((v) => (
                    <button
                      key={v}
                      onClick={() => setVoiceGender(v)}
                      className={`px-6 py-4 rounded-xl border-2 font-bold transition-all font-display tracking-wide
                        ${
                          voiceGender === v
                            ? 'bg-[#241a00] border-[#241a00] text-[#D4AF37] shadow-lg shadow-[#241a00]/20 scale-105'
                            : 'bg-white border-[#E8D5A3] text-[#5C4A2F] hover:border-[#D4AF37] hover:text-[#241a00]'
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
                <label className="block text-[#241a00] font-bold mb-2 font-serif italic text-2xl">
                  What makes them special?
                </label>
                <p className="text-[#5C4A2F] mb-4 font-body">
                  Describe their character and the qualities you love most.
                </p>
                <textarea
                  className="w-full bg-white border-2 border-[#E8D5A3] rounded-2xl p-6 text-[#241a00] placeholder:text-[#A08B74] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 resize-none transition-all text-lg leading-relaxed h-[180px] font-body"
                  placeholder="They always put others first and have a laugh that lights up the room..."
                  value={specialQualities}
                  onChange={(e) => setSpecialQualities(e.target.value)}
                />
              </div>
              <div className="relative group">
                <label className="block text-[#241a00] font-bold mb-2 font-serif italic text-2xl">
                  Share your favorite memories
                </label>
                <p className="text-[#5C4A2F] mb-4 font-body">
                  What moments with them do you treasure most?
                </p>
                <textarea
                  className="w-full bg-white border-2 border-[#E8D5A3] rounded-2xl p-6 text-[#241a00] placeholder:text-[#A08B74] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 resize-none transition-all text-lg leading-relaxed h-[180px] font-body"
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
                <p className="text-[#5C4A2F] mb-6 font-body text-lg text-center px-4">
                  Write anything else that you feel would be relevant to include in your song, and
                  we'll do our best to include it! What do you want them to know, that you've never
                  said enough?
                </p>
                <textarea
                  className="w-full bg-white border-2 border-[#E8D5A3] rounded-2xl p-8 text-[#241a00] placeholder:text-[#A08B74] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 resize-none transition-all text-xl leading-relaxed h-[350px] font-body"
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
              <div className="bg-white border border-[#E8D5A3] rounded-3xl p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <h3 className="text-2xl font-bold text-[#241a00] mb-6 font-serif italic flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#D4AF37]">receipt_long</span>
                  Your Song Brief
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 relative">
                  {[
                    { label: 'To', value: recipientType },
                    { label: 'From', value: senderName },
                    { label: 'Style', value: genre },
                    { label: 'Voice', value: voiceGender },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-[#FFFDF5] rounded-2xl p-4 border border-[#E8D5A3]"
                    >
                      <p className="text-xs text-[#8a7124] uppercase tracking-widest font-display mb-1">
                        {item.label}
                      </p>
                      <p className="text-lg font-bold text-[#241a00] truncate">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-8 border-t border-[#E8D5A3] relative z-10">
                  <div
                    className="flex items-center justify-between p-5 bg-[#FFFDF5] border-2 border-[#E8D5A3] rounded-2xl mb-8 cursor-pointer transition-all hover:border-[#D4AF37]"
                    onClick={() => setIsFastDelivery(!isFastDelivery)}
                  >
                    <div className="flex flex-col gap-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#D4AF37]">bolt</span>
                        <span className="text-lg font-bold text-[#241a00] font-display">
                          24-Hour Fast Delivery
                        </span>
                        <span className="px-2 py-0.5 bg-[#D4AF37]/10 text-[#8a7124] text-xs font-bold rounded-full uppercase tracking-wider">
                          Priority
                        </span>
                      </div>
                      <p className="text-[#5C4A2F] text-sm font-body">
                        Skip the queue and get your song in exactly 24 hours.
                      </p>
                      <p className="text-[#241a00] font-bold text-sm mt-1">
                        {paymentProvider === 'stripe' ? '+$15.00' : '+₦20,000'}
                      </p>
                    </div>
                    <div
                      className={`relative w-14 h-8 transition-colors duration-300 rounded-full flex-shrink-0 border-2 ${isFastDelivery ? 'bg-[#D4AF37] border-[#D4AF37]' : 'bg-[#E8D5A3]/30 border-[#E8D5A3]'}`}
                    >
                      <div
                        className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transition-transform duration-300 ${isFastDelivery ? 'translate-x-6' : 'translate-x-0'}`}
                      />
                    </div>
                  </div>

                  <label className="text-sm font-medium text-[#241a00] block mb-3 font-display">
                    Where should we send your completed song?{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#8a7124]">
                      alternate_email
                    </span>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="you@email.com"
                      required
                      className="w-full bg-[#FFFDF5] border-2 border-[#E8D5A3] rounded-xl py-4 pl-12 pr-4 text-[#241a00] placeholder:text-[#A08B74] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 transition-all font-body"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#241a00] border border-[#241a00] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  {isDetectingLocation ? (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg text-[#D4AF37] animate-spin">
                        progress_activity
                      </span>
                      <span className="text-[#e2c15a] font-body text-sm">
                        Detecting your location...
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-2xl font-bold text-[#D4AF37] font-display">
                          {paymentProvider === 'stripe'
                            ? isFastDelivery
                              ? '$40'
                              : '$25'
                            : isFastDelivery
                              ? '₦50,000'
                              : '₦30,000'}
                        </span>
                        {!isFastDelivery && (
                          <span className="text-sm text-[#8a7124] line-through font-display">
                            {paymentProvider === 'stripe' ? '$50' : '₦60,000'}
                          </span>
                        )}
                        {!isFastDelivery && (
                          <span className="px-2.5 py-1 bg-[#D4AF37] text-[#241a00] text-xs font-bold rounded-full font-display tracking-wide">
                            50% OFF
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#e2c15a] font-body">
                        Delivery in {isFastDelivery ? '24 Hours' : '3 Days'} • Secure Payment via{' '}
                        {paymentProvider === 'stripe' ? 'Stripe' : 'Paystack'}
                      </p>
                    </>
                  )}
                </div>
                <div className="flex gap-2 text-3xl text-[#D4AF37]/40">
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
        <div className="max-w-3xl w-full mx-auto flex items-center justify-between pt-8 mt-4 border-t border-[#E8D5A3]/50">
          <button
            onClick={prevStep}
            disabled={step === 1 || isSubmitting}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-[#5C4A2F] hover:text-[#241a00] hover:bg-[#241a00]/5'}`}
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
            Back
          </button>

          {step < 5 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-10 py-4 rounded-xl bg-[#241a00] text-[#FFFDF5] font-bold shadow-xl shadow-[#241a00]/10 hover:shadow-[#241a00]/20 transition-all transform hover:scale-105 active:scale-95 text-lg font-display tracking-wide"
            >
              Continue
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          ) : (
            <button
              onClick={handleCompleteBrief}
              disabled={isSubmitting || !customerEmail || isDetectingLocation || !paymentProvider}
              className="flex items-center gap-3 px-10 py-4 rounded-xl bg-[#D4AF37] text-[#241a00] font-bold shadow-xl shadow-[#D4AF37]/25 hover:bg-[#e2c15a] transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg font-display tracking-wider uppercase"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-xl animate-spin">
                    progress_activity
                  </span>
                  Processing...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">lock</span>
                  Pay{' '}
                  {paymentProvider === 'stripe'
                    ? isFastDelivery
                      ? '$40'
                      : '$25'
                    : isFastDelivery
                      ? '₦50,000'
                      : '₦30,000'}
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
