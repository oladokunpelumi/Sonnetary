import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type OverlayLayer = 'consent' | 'task-dialog' | 'menu' | 'marketing';

interface OverlayContextValue {
  layers: Record<OverlayLayer, boolean>;
  setLayerOpen: (layer: OverlayLayer, isOpen: boolean) => void;
  canOpen: (layer: OverlayLayer) => boolean;
}

const initialLayers: Record<OverlayLayer, boolean> = {
  consent: false,
  'task-dialog': false,
  menu: false,
  marketing: false,
};

// Fixed z-index order: page/header < player (100) < consent (120) < menu (190)
// < task/marketing dialogs (200). Gates keep marketing from coexisting with
// consent, menus, or task dialogs; task overlays may displace marketing. The
// player is unmounted while consent is visible, so dynamic offsets are unused.

const OverlayContext = createContext<OverlayContextValue | null>(null);

export const OverlayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [layers, setLayers] = useState(initialLayers);

  const setLayerOpen = useCallback((layer: OverlayLayer, isOpen: boolean) => {
    setLayers((current) => (current[layer] === isOpen ? current : { ...current, [layer]: isOpen }));
  }, []);

  const canOpen = useCallback(
    (layer: OverlayLayer) => {
      if (layer === 'marketing') {
        return !layers.consent && !layers['task-dialog'] && !layers.menu && !layers.marketing;
      }
      if (layer === 'task-dialog') return !layers['task-dialog'] && !layers.menu;
      if (layer === 'menu') return !layers['task-dialog'] && !layers.menu;
      return true;
    },
    [layers]
  );

  const value = useMemo(() => ({ layers, setLayerOpen, canOpen }), [canOpen, layers, setLayerOpen]);
  return <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export function useOverlay() {
  const context = useContext(OverlayContext);
  if (!context) throw new Error('useOverlay must be used within OverlayProvider');
  return context;
}
