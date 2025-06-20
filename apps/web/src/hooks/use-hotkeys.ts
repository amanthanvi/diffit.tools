import { useEffect, useCallback } from "react";

type KeyHandler = (event: KeyboardEvent) => void;

export function useHotkeys(keys: string, handler: KeyHandler) {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
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
        handler(event);
      }
    },
    [keys, handler]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);
}