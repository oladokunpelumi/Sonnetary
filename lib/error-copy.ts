export const CHECKOUT_RECOVERY = {
  preparation:
    'Checkout could not be prepared. Your song brief is still saved and no payment was taken. Try again or contact hello@yourgbedu.com.',
  verification:
    'We could not confirm the payment yet. Do not pay again. Your brief is safe; retry verification or contact hello@yourgbedu.com with your payment reference.',
  provider:
    'The payment provider did not complete this attempt. No new charge has been confirmed. Try again or contact hello@yourgbedu.com.',
} as const;
