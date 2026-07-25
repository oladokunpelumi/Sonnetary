export interface RouteMeta {
  title: string;
}

const ROUTE_META: Record<string, RouteMeta> = {
  '/': { title: 'Personal songs, made from your story' },
  '/library': { title: 'Song catalogue' },
  '/create': { title: 'Create your song' },
  '/track': { title: 'Track your order' },
  '/checkout': { title: 'Secure checkout' },
  '/checkout/return': { title: 'Confirming your payment' },
  '/payment-success': { title: 'Payment confirmed' },
  '/payment-cancel': { title: 'Payment cancelled' },
  '/verify': { title: 'Verify your sign-in' },
  '/admin': { title: 'Admin workbench' },
  '/privacy': { title: 'Privacy and cookies' },
};

export function getRouteMeta(pathname: string): RouteMeta {
  return ROUTE_META[pathname] || { title: 'Page not found' };
}
