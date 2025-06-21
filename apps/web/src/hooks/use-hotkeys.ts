import { useEffect, useCallback } from "react";

type KeyHandler = (event: KeyboardEvent) => void;
type HotkeyDefinition = [string, KeyHandler];

export function useHotkeys(hotkeys: HotkeyDefinition[] | string, handler?: KeyHandler) {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      // Handle array format: [['cmd+k', handler1], ['cmd+e', handler2], ...]
      if (Array.isArray(hotkeys)) {
        for (const [keys, hotkeyHandler] of hotkeys) {
          if (typeof keys === 'string') {
            const keyArray = keys.split("+").map((key) => key.trim().toLowerCase());
            
            const modifiers = {
              ctrl: event.ctrlKey,
              cmd: event.metaKey,
              alt: event.altKey,
              shift: event.shiftKey,
            };

            const isModifierCorrect = keyArray.every((key) => {
              if (key in modifiers) {
                return modifiers[key as keyof typeof modifiers];
              }
              return key === event.key.toLowerCase();
            });

            if (isModifierCorrect) {
              event.preventDefault();
              hotkeyHandler(event);
              return;
            }
          }
        }
      } 
      // Handle single string format: 'cmd+k'
      else if (typeof hotkeys === 'string' && handler) {
        const keyArray = hotkeys.split("+").map((key) => key.trim().toLowerCase());
        
        const modifiers = {
          ctrl: event.ctrlKey,
          cmd: event.metaKey,
          alt: event.altKey,
          shift: event.shiftKey,
        };

        const isModifierCorrect = keyArray.every((key) => {
          if (key in modifiers) {
            return modifiers[key as keyof typeof modifiers];
          }
          return key === event.key.toLowerCase();
        });

        if (isModifierCorrect) {
          event.preventDefault();
          handler(event);
        }
      }
    },
    [hotkeys, handler]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);
}