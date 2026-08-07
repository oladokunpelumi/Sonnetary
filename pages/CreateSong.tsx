import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Currency, MIN_SPECIAL_MESSAGE_CHARS, OCCASION_ACCENTS, PaymentProvider, getDiscountedPriceByCurrency } from '../constants';
import { fetchCheckoutConfig } from '../services/checkoutProvider';

const RECIPIENTS = [
  'Parents',
  'Partner',
  'Friends & Loved Ones',
  'Yourself',
  'Husband',
  'Wife',
  'Boyfriend',
  'Girlfriend',
  'Children',
  'Father',
  'Mother',
  'Sibling',
  'Friend',
  'Other',
];

const RECIPIENT_QUERY_MAP: Record<string, string> = {
  parents: 'Parents',
  partner: 'Partner',
  'friends-loved-ones': 'Friends & Loved Ones',
  yourself: 'Yourself',
};

const OCCASIONS = [
  { value: 'birthday', label: 'Birthday' },
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'valentine', label: 'Valentine' },
  { value: 'appreciation', label: 'Appreciation' },
  { value: 'apology', label: 'Apology' },
  { value: 'memorial', label: 'Memorial' },
  { value: 'graduation', label: 'Graduation' },
  { value: 'welcome_baby', label: 'Welcome Baby' },
  { value: 'just_because', label: 'Just Because' },
  { value: 'other', label: 'Other' },
] as const;

const NEW_GENRES = [
  { name: 'Afro-Beats', desc: 'Vibrant and rhythmic' },
  { name: 'Afro-R&B', desc: 'Romantic and groovy' },
  { name: 'Afro-House', desc: 'Energetic and electric' },
  { name: 'Afro-Reggae', desc: 'Island warmth' },
  { name: 'Gospel', desc: 'Uplifting and spiritual' },
  { name: 'R&B', desc: 'Smooth and soulful' },
  { name: 'Hip-Hop', desc: 'Bold and rhythmic' },
  { name: 'Pop', desc: 'Catchy and bright' },
  { name: 'Soul', desc: 'Deep and emotive' },
  { name: 'Highlife', desc: 'Joyful and cultural' },
];

const VOICES = ['Female Voice', 'Male Voice', 'No Preference'];

const FORM_STEPS = [
  {
    id: 1,
    title: 'Basics',
    heading: 'Start with the person',
    desc: 'Who the song is for, the occasion, and who it is from.',
  },
  {
    id: 2,
    title: 'Style',
    heading: 'Choose the sound',
    desc: 'Pick the genre and preferred voice direction.',
  },
  {
    id: 3,
    title: 'Story',
    heading: 'The Heart of the Story',
    desc: 'Share the qualities, memories, and the words behind the song.',
  },
  {
    id: 4,
    title: 'Review',
    heading: 'Review and complete',
    desc: 'Confirm your brief, delivery speed, price, and email.',
  },
];

const fieldClass =
  'w-full rounded-lg border border-line-control bg-ivory px-4 py-3.5 font-body text-base text-ink placeholder:text-ink-muted transition-colors focus:border-terracotta focus:bg-cream focus:outline-none focus:ring-4 focus:ring-terracotta/10';

const BRIEF_STORAGE_KEY = 'yourgbedu_brief';
const DRAFT_STORAGE_KEY = 'yourgbedu_brief_draft';
const MIN_STEP = 1;
const MAX_STEP = FORM_STEPS.length;

interface CreateSongDraft {
  recipientType: string;
  recipientName: string;
  occasion: string;
  occasionDetail: string;
  senderName: string;
  genre: string;
  voiceGender: string;
  specialQualities: string;
  favoriteMemories: string;
  specialMessage: string;
  customerEmail: string;
  fastDelivery: boolean;
}

function normalizeDraft(value: unknown): CreateSongDraft | null {
  if (!value || typeof value !== 'object') return null;
  const parsed = value as Partial<CreateSongDraft>;
  return {
    recipientType: parsed.recipientType || '',
    recipientName: parsed.recipientName || '',
    occasion: parsed.occasion || '',
    occasionDetail: parsed.occasionDetail || '',
    senderName: parsed.senderName || '',
    genre: parsed.genre || '',
    voiceGender: parsed.voiceGender || '',
    specialQualities: parsed.specialQualities || '',
    favoriteMemories: parsed.favoriteMemories || '',
    specialMessage: parsed.specialMessage || '',
    customerEmail: parsed.customerEmail || '',
    fastDelivery: Boolean(parsed.fastDelivery),
  };
}

function readCreateSongDraft(): CreateSongDraft | null {
  try {
    const rawDraft = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (rawDraft) return normalizeDraft(JSON.parse(rawDraft));

    const rawBrief = sessionStorage.getItem(BRIEF_STORAGE_KEY);
    if (rawBrief) return normalizeDraft(JSON.parse(rawBrief));
  } catch {
    return null;
  }
  return null;
}

function hasDraftContent(draft: CreateSongDraft) {
  return Boolean(
    draft.recipientType ||
      draft.recipientName ||
      draft.occasion ||
      draft.occasionDetail ||
      draft.senderName ||
      draft.genre ||
      draft.voiceGender ||
      draft.specialQualities ||
      draft.favoriteMemories ||
      draft.specialMessage ||
      draft.customerEmail ||
      draft.fastDelivery
  );
}

function parseStepParam(value: string | null) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return MIN_STEP;
  return Math.min(Math.max(parsed, MIN_STEP), MAX_STEP);
}

const CreateSong: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [initialDraft] = useState(() => readCreateSongDraft());
  const [step, setStep] = useState(1);

  const [recipientType, setRecipientType] = useState(initialDraft?.recipientType || '');
  const [recipientName, setRecipientName] = useState(initialDraft?.recipientName || '');
  const [occasion, setOccasion] = useState(initialDraft?.occasion || '');
  const [occasionDetail, setOccasionDetail] = useState(initialDraft?.occasionDetail || '');
  const [senderName, setSenderName] = useState(initialDraft?.senderName || '');
  const [genre, setGenre] = useState(initialDraft?.genre || '');
  const [voiceGender, setVoiceGender] = useState(initialDraft?.voiceGender || '');
  const [specialQualities, setSpecialQualities] = useState(initialDraft?.specialQualities || '');
  const [favoriteMemories, setFavoriteMemories] = useState(initialDraft?.favoriteMemories || '');
  const [specialMessage, setSpecialMessage] = useState(initialDraft?.specialMessage || '');
  const [customerEmail, setCustomerEmail] = useState(initialDraft?.customerEmail || '');
  const [isFastDelivery, setIsFastDelivery] = useState(Boolean(initialDraft?.fastDelivery));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);
  const recipientGroupRef = useRef<HTMLFieldSetElement | null>(null);
  const recipientNameRef = useRef<HTMLInputElement | null>(null);
  const occasionGroupRef = useRef<HTMLFieldSetElement | null>(null);
  const senderNameRef = useRef<HTMLInputElement | null>(null);
  const genreGroupRef = useRef<HTMLFieldSetElement | null>(null);
  const voiceGroupRef = useRef<HTMLFieldSetElement | null>(null);
  const specialQualitiesRef = useRef<HTMLTextAreaElement | null>(null);
  const favoriteMemoriesRef = useRef<HTMLTextAreaElement | null>(null);
  const specialMessageRef = useRef<HTMLTextAreaElement | null>(null);
  const customerEmailRef = useRef<HTMLInputElement | null>(null);
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider | null>(null);
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const selectedPersona =
    RECIPIENT_QUERY_MAP[(searchParams.get('recipient') || '').toLowerCase()] || '';

  const reportError = useCallback((message: string, target: { current: HTMLElement | null }) => {
    setError(message);
    window.setTimeout(() => target.current?.focus(), 0);
  }, []);
  const draftData = useMemo<CreateSongDraft>(() => ({
    recipientType,
    recipientName,
    occasion,
    occasionDetail,
    senderName,
    genre,
    voiceGender,
    specialQualities,
    favoriteMemories,
    specialMessage,
    customerEmail,
    fastDelivery: isFastDelivery,
  }), [
    recipientType,
    recipientName,
    occasion,
    occasionDetail,
    senderName,
    genre,
    voiceGender,
    specialQualities,
    favoriteMemories,
    specialMessage,
    customerEmail,
    isFastDelivery,
  ]);
  const isStepOneComplete = useCallback(() => {
    return Boolean(
      recipientType &&
        occasion &&
        senderName.trim() &&
        (recipientType === 'Yourself' || recipientName.trim())
    );
  }, [occasion, recipientName, recipientType, senderName]);
  const isStepTwoComplete = useCallback(() => Boolean(genre && voiceGender), [genre, voiceGender]);
  const isStepThreeComplete = useCallback(() => {
    return (
      specialQualities.trim().length >= 5 &&
      favoriteMemories.trim().length >= 5 &&
      specialMessage.trim().length >= MIN_SPECIAL_MESSAGE_CHARS
    );
  }, [favoriteMemories, specialMessage, specialQualities]);
  const furthestAllowedStep = useMemo(() => {
    if (!isStepOneComplete()) return 1;
    if (!isStepTwoComplete()) return 2;
    if (!isStepThreeComplete()) return 3;
    return 4;
  }, [isStepOneComplete, isStepThreeComplete, isStepTwoComplete]);
  const navigateToStep = useCallback(
    (targetStep: number, replace = false) => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('step', String(Math.min(Math.max(targetStep, MIN_STEP), MAX_STEP)));
      navigate(`/create?${nextParams.toString()}`, { replace });
    },
    [navigate, searchParams]
  );

  useEffect(() => {
    const checkoutError = sessionStorage.getItem('yourgbedu_checkout_error');
    if (!checkoutError) return;
    setError(checkoutError);
    sessionStorage.removeItem('yourgbedu_checkout_error');
  }, []);

  useEffect(() => {
    if (!selectedPersona) return;
    if (initialDraft) return;
    setRecipientType(selectedPersona);
  }, [initialDraft, selectedPersona]);

  useEffect(() => {
    try {
      if (hasDraftContent(draftData)) {
        sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
      } else {
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    } catch {
      // sessionStorage may be unavailable; the form still works in memory.
    }
  }, [draftData]);

  useEffect(() => {
    const requestedStep = parseStepParam(searchParams.get('step'));
    const clampedStep = Math.min(requestedStep, furthestAllowedStep);
    if (searchParams.get('step') !== String(clampedStep)) {
      navigateToStep(clampedStep, true);
      return;
    }
    setStep(clampedStep);
  }, [furthestAllowedStep, navigateToStep, searchParams]);

  useEffect(() => {
    if (step !== FORM_STEPS.length || paymentProvider !== null) return;
    let cancelled = false;

    const detectProvider = async () => {
      setIsDetectingLocation(true);
      try {
        const config = await fetchCheckoutConfig();
        if (!cancelled) {
          setPaymentProvider(config.provider);
          setCurrency(config.currency);
        }
      } finally {
        if (!cancelled) setIsDetectingLocation(false);
      }
    };

    void detectProvider();

    return () => {
      cancelled = true;
    };
  }, [step, paymentProvider]);

  const nextStep = () => {
    setError(null);
    if (step === 1 && !recipientType) {
      reportError('Select who the song is for.', recipientGroupRef);
      return;
    }
    if (step === 1 && recipientType && recipientType !== 'Yourself' && !recipientName.trim()) {
      reportError("Add the recipient's name so we can write the song for them.", recipientNameRef);
      return;
    }
    if (step === 1 && !occasion) {
      reportError('Choose the occasion for this song.', occasionGroupRef);
      return;
    }
    if (step === 1 && !senderName.trim()) {
      reportError('Enter your name so we know who the song is from.', senderNameRef);
      return;
    }
    if (step === 2 && !genre) {
      reportError('Select a genre for the song.', genreGroupRef);
      return;
    }
    if (step === 2 && !voiceGender) {
      reportError('Select a voice preference.', voiceGroupRef);
      return;
    }
    if (step === 3 && specialQualities.trim().length < 5) {
      reportError('Add a few details about what makes them special.', specialQualitiesRef);
      return;
    }
    if (step === 3 && favoriteMemories.trim().length < 5) {
      reportError('Add at least one favorite memory.', favoriteMemoriesRef);
      return;
    }
    if (step === 3 && specialMessage.trim().length < MIN_SPECIAL_MESSAGE_CHARS) {
      reportError('Add at least a short sentence — this is what your chorus is built around.', specialMessageRef);
      return;
    }
    navigateToStep(step + 1);
  };

  const prevStep = () => {
    setError(null);
    navigate(-1);
  };

  const handleCompleteBrief = () => {
    if (step !== FORM_STEPS.length) return;
    if (!customerEmail || !customerEmail.includes('@')) {
      reportError('Enter a valid email address to receive your song.', customerEmailRef);
      return;
    }
    if (!paymentProvider || !currency) {
      setError('We are still preparing your checkout options. Please wait a moment.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const briefData = {
      recipientType,
      recipientName: recipientType && recipientType !== 'Yourself' ? recipientName.trim() : '',
      occasion,
      occasionDetail,
      senderName,
      genre,
      voiceGender,
      specialQualities,
      favoriteMemories,
      specialMessage,
      customerEmail,
      fastDelivery: isFastDelivery,
      paymentProvider,
      currency,
    };
    sessionStorage.setItem('yourgbedu_brief', JSON.stringify(briefData));
    sessionStorage.removeItem('yourgbedu_checkout_error');
    const promo = searchParams.get('promo');
    navigate(promo ? `/checkout?promo=${encodeURIComponent(promo)}` : '/checkout');
  };

  const currentStep = FORM_STEPS[step - 1];
  const nextStepMeta = FORM_STEPS[step] || null;
  const price = getDiscountedPriceByCurrency(currency, isFastDelivery);
  const fastPrice = getDiscountedPriceByCurrency(currency, true);
  const providerLabel = paymentProvider === 'stripe' ? 'Stripe' : 'Paystack';
  const occasionLabel = OCCASIONS.find((item) => item.value === occasion)?.label || occasion;
  const activeOccasion = useMemo(() => {
    return OCCASION_ACCENTS[(occasion || 'other') as keyof typeof OCCASION_ACCENTS];
  }, [occasion]);

  return (
    <div className="bg-ivory px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden self-start rounded-lg border border-line bg-cream p-6 lg:block" aria-label="Song brief steps">
          <p className="editorial-kicker">YourGbedu brief</p>
          <p className="mt-4 font-headline text-4xl font-medium leading-none text-ink">
            Create your <em className="text-terracotta">song</em>
          </p>
          <p className="mt-4 text-sm leading-6 text-ink-soft">
            Each step feeds the production team a clearer emotional map.
          </p>

          <ol className="mt-9 space-y-3">
            {FORM_STEPS.map((item) => {
              const isActive = item.id === step;
              const isComplete = item.id < step;
              return (
                <li
                  key={item.id}
                  className={`flex gap-3 rounded-lg border p-3 ${
                    isActive
                      ? 'border-terracotta bg-terracotta-pale'
                      : isComplete
                        ? 'border-sage-soft bg-sage-pale'
                        : 'border-transparent bg-transparent'
                  }`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      isActive
                        ? 'bg-terracotta text-cream'
                        : isComplete
                          ? 'bg-sage text-cream'
                          : 'border border-line bg-ivory text-ink-muted'
                    }`}
                  >
                    {isComplete ? (
                      <span className="material-symbols-outlined text-base" aria-hidden="true">
                        check
                      </span>
                    ) : (
                      item.id
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-label text-sm font-bold text-ink">{item.title}</span>
                    <span className="mt-1 block text-xs leading-snug text-ink-muted">{item.desc}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </aside>

        <section className="border-y border-line bg-cream p-5 sm:p-8 lg:p-10">
          <div className="mb-8 border-b border-line pb-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-label text-xs font-bold uppercase tracking-[0.16em] text-terracotta">
                  Step {step} of {FORM_STEPS.length}
                </p>
                <h1 className="mt-3 font-headline text-5xl font-medium leading-none text-ink sm:text-6xl">
                  {currentStep.heading}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-ink-soft">{currentStep.desc}</p>
              </div>
              {nextStepMeta && (
                <div className="rounded-lg border border-line bg-ivory p-4 sm:max-w-[240px] lg:hidden">
                  <p className="font-label text-xs font-bold uppercase tracking-[0.16em] text-ink-muted">
                    Next
                  </p>
                  <p className="mt-1 font-label text-sm font-bold text-ink">{nextStepMeta.title}</p>
                  <p className="mt-1 text-xs leading-5 text-ink-soft">{nextStepMeta.desc}</p>
                </div>
              )}
            </div>
            <div className="mt-7 h-2 overflow-hidden rounded-full bg-ivory" aria-hidden="true">
              <div
                className="h-full rounded-full bg-terracotta transition-[width] duration-300"
                style={{ width: `${(step / FORM_STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="mx-auto max-w-3xl">
            {step === 1 && (
              <div className="space-y-8">
                {selectedPersona && (
                  <div className="rounded-lg border border-terracotta/30 bg-terracotta-pale p-4 text-terracotta-dark">
                    <p className="font-label text-xs font-bold uppercase tracking-[0.16em]">
                      Selected path
                    </p>
                    <p className="mt-1 text-sm leading-6">
                      You started with <span className="font-bold">{selectedPersona}</span>. You
                      can change this below.
                    </p>
                  </div>
                )}

                <fieldset
                  ref={recipientGroupRef}
                  tabIndex={-1}
                  aria-invalid={Boolean(error && !recipientType)}
                  aria-describedby={error ? 'create-step-error' : undefined}
                >
                  <legend className="mb-3 font-body text-xl font-bold text-ink">
                    Who is this for? <span className="font-body text-sm font-semibold text-terracotta">Required</span>
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {RECIPIENTS.map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => {
                          setRecipientType(r);
                          if (r === 'Yourself') setRecipientName('');
                        }}
                        aria-pressed={recipientType === r}
                        className={`rounded-full border px-4 py-2.5 font-label text-sm font-bold transition-colors ${
                          recipientType === r
                            ? 'border-terracotta bg-terracotta text-cream'
                            : 'border-line-control bg-ivory text-ink-soft hover:border-terracotta hover:text-terracotta'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  {recipientType && recipientType !== 'Yourself' && (
                    <div className="mt-5">
                      <label htmlFor="recipient-name" className="mb-2 block font-label text-sm font-bold text-ink">
                        What is their name? <span className="text-sm text-terracotta">Required</span>
                      </label>
                      <input
                        id="recipient-name"
                        ref={recipientNameRef}
                        type="text"
                        required
                        aria-invalid={Boolean(error && !recipientName.trim())}
                        aria-describedby={`recipient-name-help${error ? ' create-step-error' : ''}`}
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder={`Their first name`}
                        className={fieldClass}
                      />
                      <p id="recipient-name-help" className="mt-2 text-sm leading-6 text-ink-muted">
                        We will weave this into the lyrics so the song feels written for them.
                      </p>
                    </div>
                  )}
                </fieldset>

                <fieldset
                  ref={occasionGroupRef}
                  tabIndex={-1}
                  aria-invalid={Boolean(error && !occasion)}
                  aria-describedby={error ? 'create-step-error' : undefined}
                >
                  <legend className="mb-2 font-body text-xl font-bold text-ink">
                    What is the occasion? <span className="font-body text-sm font-semibold text-terracotta">Required</span>
                  </legend>
                  {occasion && (
                    <p className="mb-3 font-label text-xs font-bold uppercase tracking-[0.12em]" style={{ color: activeOccasion.text }}>
                      {activeOccasion.tone}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {OCCASIONS.map((item) => {
                      const accent = OCCASION_ACCENTS[item.value];
                      const selected = occasion === item.value;
                      return (
                        <button
                          type="button"
                          key={item.value}
                          onClick={() => {
                            setOccasion(item.value);
                            if (item.value !== 'other') setOccasionDetail('');
                          }}
                          aria-pressed={selected}
                          className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                            selected
                              ? 'border-ink bg-ink text-cream'
                              : 'border-line-control bg-ivory text-ink hover:border-terracotta'
                          }`}
                        >
                          <span className="flex items-center gap-2 font-label text-sm font-bold">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: accent.accent }}
                              aria-hidden="true"
                            />
                            {item.label}
                          </span>
                          <span className="mt-1 block text-xs opacity-75">{accent.tone}</span>
                        </button>
                      );
                    })}
                  </div>
                  {occasion === 'other' && (
                    <div className="mt-4">
                      <label htmlFor="occasion-detail" className="mb-2 block font-label text-sm font-bold text-ink">
                        Tell us the occasion <span className="text-sm font-normal text-ink-muted">Optional</span>
                      </label>
                      <input
                        id="occasion-detail"
                        type="text"
                        value={occasionDetail}
                        onChange={(e) => setOccasionDetail(e.target.value)}
                        placeholder="Naming ceremony, retirement party, private apology..."
                        className={fieldClass}
                      />
                    </div>
                  )}
                </fieldset>

                <div>
                  <label htmlFor="sender-name" className="mb-2 block font-body text-xl font-bold text-ink">
                    What is your name? <span className="font-body text-sm font-semibold text-terracotta">Required</span>
                  </label>
                  <input
                    id="sender-name"
                    ref={senderNameRef}
                    type="text"
                    required
                    aria-invalid={Boolean(error && !senderName.trim())}
                    aria-describedby={error ? 'create-step-error' : undefined}
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Enter your name"
                    className={fieldClass}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-9">
                <fieldset
                  ref={genreGroupRef}
                  tabIndex={-1}
                  aria-invalid={Boolean(error && !genre)}
                  aria-describedby={error ? 'create-step-error' : undefined}
                >
                  <legend className="mb-3 font-body text-xl font-bold text-ink">
                    Choose a genre <span className="font-body text-sm font-semibold text-terracotta">Required</span>
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {NEW_GENRES.map((g) => (
                      <button
                        type="button"
                        key={g.name}
                        onClick={() => setGenre(g.name)}
                        aria-pressed={genre === g.name}
                        className={`rounded-lg border p-4 text-left transition-colors ${
                          genre === g.name
                            ? 'border-terracotta bg-terracotta text-cream'
                            : 'border-line-control bg-ivory text-ink hover:border-terracotta'
                        }`}
                      >
                        <span className="block font-body text-lg font-bold leading-tight">{g.name}</span>
                        <span className={`mt-2 block font-label text-xs font-bold uppercase tracking-[0.14em] ${genre === g.name ? 'text-cream/85' : 'text-ink-muted'}`}>
                          {g.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset
                  ref={voiceGroupRef}
                  tabIndex={-1}
                  aria-invalid={Boolean(error && !voiceGender)}
                  aria-describedby={error ? 'create-step-error' : undefined}
                >
                  <legend className="mb-3 font-body text-xl font-bold text-ink">
                    Preferred voice <span className="font-body text-sm font-semibold text-terracotta">Required</span>
                  </legend>
                  <div className="flex flex-wrap gap-3">
                    {VOICES.map((v) => (
                      <button
                        type="button"
                        key={v}
                        onClick={() => setVoiceGender(v)}
                        aria-pressed={voiceGender === v}
                        className={`rounded-full border px-5 py-3 font-label text-sm font-bold transition-colors ${
                          voiceGender === v
                            ? 'border-ink bg-ink text-cream'
                            : 'border-line-control bg-ivory text-ink-soft hover:border-terracotta hover:text-terracotta'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-7">
                <div>
                  <label htmlFor="special-qualities" className="mb-2 block font-body text-xl font-bold text-ink">
                    What makes them special? <span className="font-body text-sm font-semibold text-terracotta">Required</span>
                  </label>
                  <p className="mb-3 text-sm leading-6 text-ink-muted">
                    Describe their character and the qualities you love most.
                  </p>
                  <textarea
                    id="special-qualities"
                    ref={specialQualitiesRef}
                    aria-invalid={Boolean(error && specialQualities.trim().length < 5)}
                    aria-describedby={error ? 'create-step-error' : undefined}
                    className={`${fieldClass} min-h-[170px] resize-y leading-7`}
                    placeholder="They are calm when everything is falling apart..."
                    value={specialQualities}
                    onChange={(e) => setSpecialQualities(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="favorite-memories" className="mb-2 block font-body text-xl font-bold text-ink">
                    Share your favorite memories <span className="font-body text-sm font-semibold text-terracotta">Required</span>
                  </label>
                  <p className="mb-3 text-sm leading-6 text-ink-muted">
                    What moments with them do you treasure most?
                  </p>
                  <textarea
                    id="favorite-memories"
                    ref={favoriteMemoriesRef}
                    aria-invalid={Boolean(error && favoriteMemories.trim().length < 5)}
                    aria-describedby={error ? 'create-step-error' : undefined}
                    className={`${fieldClass} min-h-[170px] resize-y leading-7`}
                    placeholder="Our first date, the long calls, the day everything changed..."
                    value={favoriteMemories}
                    onChange={(e) => setFavoriteMemories(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="special-message" className="mb-2 block font-body text-xl font-bold text-ink">
                    What should the song say? <span className="font-body text-sm font-semibold text-terracotta">Required</span>
                  </label>
                  <p className="mb-4 text-sm leading-6 text-ink-muted">
                    Add the words you want included, even if they are rough. Emotion matters more than polish.
                  </p>
                  <textarea
                    id="special-message"
                    ref={specialMessageRef}
                    aria-invalid={Boolean(error && specialMessage.trim().length < MIN_SPECIAL_MESSAGE_CHARS)}
                    aria-describedby={`special-message-help${error ? ' create-step-error' : ''}`}
                    className={`${fieldClass} min-h-[320px] resize-y text-lg leading-8`}
                    placeholder="I do not say it enough, but you are the reason I am still standing..."
                    value={specialMessage}
                    onChange={(e) => setSpecialMessage(e.target.value)}
                  />
                  <p id="special-message-help" className="mt-2 text-sm leading-6 text-ink-muted">
                    A sentence or two works best — this is what your chorus is built around.
                  </p>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-7">
                <div className="rounded-lg border border-line bg-ivory p-5 sm:p-7">
                  <h3 className="font-headline text-4xl font-semibold leading-none text-ink">
                    Your song brief
                  </h3>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        label: 'To',
                        value: recipientName && recipientType !== 'Yourself'
                          ? `${recipientName} (${recipientType})`
                          : recipientType,
                      },
                      {
                        label: 'Occasion',
                        value: `${occasionLabel}${occasion === 'other' && occasionDetail ? ` - ${occasionDetail}` : ''}`,
                      },
                      { label: 'From', value: senderName },
                      { label: 'Style', value: genre },
                      { label: 'Voice', value: voiceGender },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg border border-line bg-cream p-4">
                        <p className="font-label text-xs font-bold uppercase tracking-[0.16em] text-ink-muted">
                          {item.label}
                        </p>
                        <p className="mt-1 truncate font-body text-lg font-bold text-ink">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="mt-6 flex w-full items-center justify-between gap-5 rounded-lg border border-line-control bg-cream p-5 text-left transition-colors hover:border-terracotta"
                    onClick={() => setIsFastDelivery(!isFastDelivery)}
                    aria-pressed={isFastDelivery}
                  >
                    <span>
                      <span className="block font-label text-sm font-bold text-ink">
                        24-hour fast delivery
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-ink-soft">
                        Skip the queue and get your song in exactly 24 hours.
                      </span>
                      <span className="mt-1 block font-body text-sm font-bold text-ink">
                        {'upgrade' in fastPrice ? fastPrice.upgrade : ''}
                      </span>
                    </span>
                    <span
                      className={`relative h-8 w-14 shrink-0 rounded-full border transition-colors ${
                        isFastDelivery ? 'border-terracotta bg-terracotta' : 'border-line-control bg-ivory'
                      }`}
                    >
                      <span
                        className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-cream shadow-sm transition-transform ${
                          isFastDelivery ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </span>
                  </button>

                  <div className="mt-6">
                    <label htmlFor="customer-email" className="mb-2 block font-label text-sm font-bold text-ink">
                      Where should we send your completed song? <span className="text-terracotta">Required</span>
                    </label>
                    <input
                      id="customer-email"
                      ref={customerEmailRef}
                      type="email"
                      autoComplete="email"
                      aria-invalid={Boolean(error && (!customerEmail || !customerEmail.includes('@')))}
                      aria-describedby="customer-email-help"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="you@email.com"
                      required
                      className={fieldClass}
                    />
                    <p id="customer-email-help" className="mt-2 text-sm leading-6 text-ink-muted">Use an address you can access for delivery and secure order tracking.</p>
                  </div>
                </div>

                <div className="rounded-lg bg-ink p-6 text-cream">
                  {isDetectingLocation ? (
                    <div role="status" className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg text-mustard animate-spin" aria-hidden="true">
                        progress_activity
                      </span>
                      <span className="text-sm">Detecting your location...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-3xl font-bold text-mustard-soft">
                          {price.current}
                        </span>
                        <span className="text-sm text-cream/55 line-through">{price.original}</span>
                        <span className="rounded-full bg-mustard px-3 py-1 font-label text-xs font-bold uppercase tracking-[0.12em] text-ink">
                          Discounted
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-cream/65">
                        {isFastDelivery
                          ? `We build and deliver your song in 24 hours. ${
                              currency === 'ngn'
                                ? 'Pay Securely with Stripe (Card) or Paystack (Bank Transfer).'
                                : `Secure payment via ${providerLabel}.`
                            }`
                          : `We build and deliver your song in 48 hours. ${
                              currency === 'ngn'
                                ? 'Pay Securely with Stripe (Card) or Paystack (Bank Transfer).'
                                : `Secure payment via ${providerLabel}.`
                            }`}
                      </p>
                      <p className="mt-3 border-t border-cream/10 pt-3 text-sm leading-6 text-cream/60">
                        Your brief is saved in this browser until payment starts, so you can return
                        and edit it before checkout.
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div id="create-step-error" ref={errorRef} tabIndex={-1} role="alert" className="mt-7 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {error}
              </div>
            )}
          </div>

          <div className="mx-auto mt-9 flex w-full max-w-3xl items-center justify-between border-t border-line pt-6">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1 || isSubmitting}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-label text-sm font-bold text-ink-soft transition-colors hover:bg-ivory hover:text-ink ${
                step === 1 ? 'pointer-events-none opacity-0' : ''
              }`}
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">
                arrow_back
              </span>
              Back
            </button>

            {step < FORM_STEPS.length ? (
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-7 py-3 font-label text-sm font-bold uppercase tracking-[0.12em] text-cream transition-colors hover:bg-terracotta"
              >
                Continue
                <span className="material-symbols-outlined text-lg" aria-hidden="true">
                  arrow_forward
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCompleteBrief}
                disabled={isSubmitting || !customerEmail || isDetectingLocation || !paymentProvider}
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-terracotta px-7 py-3 font-label text-sm font-bold uppercase tracking-[0.12em] text-cream transition-colors hover:bg-terracotta-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-lg animate-spin" aria-hidden="true">
                      progress_activity
                    </span>
                    Processing
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">
                      lock
                    </span>
                    Continue to checkout
                  </>
                )}
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CreateSong;
