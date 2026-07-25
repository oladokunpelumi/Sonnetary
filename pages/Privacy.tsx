import React from 'react';

const Privacy: React.FC = () => (
  <div className="bg-ivory px-5 py-14 sm:px-8 sm:py-20">
    <article className="mx-auto max-w-3xl">
      <p className="font-label text-sm font-bold uppercase tracking-[0.14em] text-terracotta">Privacy</p>
      <h1 className="mt-4 font-headline text-5xl font-medium leading-none text-ink sm:text-7xl">
        Your story stays personal.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft">
        This page explains the data the current YourGbedu product uses to create, deliver, and support a custom song.
      </p>

      <div className="mt-12 space-y-10 border-t border-line pt-10 text-base leading-7 text-ink-soft">
        <section aria-labelledby="privacy-orders">
          <h2 id="privacy-orders" className="font-headline text-3xl font-semibold text-ink">Song orders</h2>
          <p className="mt-3">
            We collect the contact details, recipient information, story, preferences, and delivery details you submit so we can produce and deliver your song, provide order tracking, and handle support. This information is available to authorised administrators involved in fulfilment.
          </p>
        </section>

        <section aria-labelledby="privacy-payments">
          <h2 id="privacy-payments" className="font-headline text-3xl font-semibold text-ink">Payments</h2>
          <p className="mt-3">
            Payments are processed by Stripe or Paystack. YourGbedu receives payment status and transaction references needed to confirm an order, but does not store card details in this application.
          </p>
        </section>

        <section aria-labelledby="privacy-marketing">
          <h2 id="privacy-marketing" className="font-headline text-3xl font-semibold text-ink">Email offers</h2>
          <p className="mt-3">
            If you submit your email through a promotional offer, it is stored with the signup source and sent to Klaviyo for the mailing list and related subscription event. You can ignore the offer and continue using the site.
          </p>
        </section>

        <section aria-labelledby="privacy-analytics">
          <h2 id="privacy-analytics" className="font-headline text-3xl font-semibold text-ink">Analytics cookies</h2>
          <p className="mt-3">
            Google Analytics and Meta Pixel load only after you accept analytics cookies. They receive route and limited commerce events. Your personal song text, recipient details, and story are not included in marketing analytics events sent by this application. You can change your choice from the footer at any time.
          </p>
        </section>

        <section aria-labelledby="privacy-retention">
          <h2 id="privacy-retention" className="font-headline text-3xl font-semibold text-ink">Retention and questions</h2>
          <p className="mt-3">
            The product retains order and subscriber records needed for fulfilment, tracking, support, and administration. A fixed deletion schedule is not currently specified in the application configuration. For access, correction, deletion, or privacy questions, email{' '}
            <a className="font-semibold text-terracotta underline" href="mailto:hello@yourgbedu.com">hello@yourgbedu.com</a>.
          </p>
        </section>
      </div>

      <p className="mt-12 border-t border-line pt-6 text-sm font-medium text-ink-muted">
        Draft product notice: this copy reflects the current implementation and requires legal review before production publication.
      </p>
    </article>
  </div>
);

export default Privacy;
