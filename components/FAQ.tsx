import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const QA = [
  {
    q: 'What makes these songs special?',
    a: 'Each YourGbedu custom song is custom-written from your story. It is a one-of-a-kind gift rooted in care, genuine emotion, and high-quality production.',
  },
  {
    q: 'How long does it take to receive the song?',
    a: 'Your finished custom song is delivered in 3 days. Optionally, if you need your song faster, we can deliver in 24 hours for an extra fee—simply select the priority delivery upgrade after you purchase your song.',
  },
  {
    q: 'Can I get my custom song faster in 24 hours?',
    a: "Yes! While standard delivery takes a few days, we offer priority 24 hour delivery for an additional fee. Simply select the priority delivery upgrade after you purchase your song, and we'll have your masterpiece ready in just 24 hours.",
  },
  {
    q: 'What themes can I write about?',
    a: 'Anything that honors your loved one: birthdays, anniversaries, weddings, grief, encouragement, testimonies, or prayers for strength and healing.',
  },
  {
    q: 'What is your process?',
    a: 'Every YourGbedu song is created to the same standard as the songs you hear on the radio, and goes through several quality checks for both lyrics and production before completion.\n\nOur lyricists pour their hearts into making each lyric personal and meaningful, then our producers use the help of the latest music production technology, including modern artificial intelligence assisted music production tools, to bring your heartfelt lyrics to life at an affordable price. In fact, we often refine and reproduce the song multiple times until we find the best version, so the final version you receive has the best melody, lyrics, and production.',
  },
  {
    q: 'How will I receive the finished song?',
    a: 'You will receive a secure link via email to play your YourGbedu song on any device and to easily share it with family and friends.',
  },
  {
    q: 'Can I use the song in a church or event?',
    a: 'Yes, you may share and play your song at private events and gatherings.',
  },
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleOpen = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-24 bg-surface-container-low">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 font-display text-[#241a00] editorial-headline">
          Frequently Asked
          <br />
          Questions
        </h2>
        <p className="text-center text-[#78614A] font-body mb-16 max-w-lg mx-auto">
          Everything you need to know about creating your custom song.
        </p>

        <div className="flex flex-col gap-[1.7rem]">
          {QA.map((item, idx) => (
            <div
              key={idx}
              className={`rounded-md p-6 transition-colors cursor-pointer ${openIndex === idx ? 'bg-surface-container-lowest shadow-ambient' : 'bg-surface-bright hover:bg-surface-container-lowest'}`}
              onClick={() => toggleOpen(idx)}
            >
              <button className="w-full flex items-center justify-between text-left focus:outline-none group">
                <h3 className="text-lg md:text-xl font-display font-medium text-[#241a00]">
                  {item.q}
                </h3>
                <div className="text-[#78614A] group-hover:text-[#241a00] transition-colors shrink-0 ml-4">
                  {openIndex === idx ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === idx ? 'max-h-[800px] mt-4 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <div className="text-base text-[#78614A] leading-relaxed font-body whitespace-pre-wrap">
                  {item.a}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center flex flex-col items-center">
          <h4 className="text-xl font-bold mb-2 font-display text-[#241a00]">
            Got More Questions?
          </h4>
          <p className="text-base text-[#78614A] font-body">
            Reach out to us at{' '}
            <a
              href="mailto:hello@yourgbedu.com"
              className="text-secondary hover:text-secondary-dark transition-colors font-medium"
            >
              hello@yourgbedu.com
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
