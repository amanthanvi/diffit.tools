import React from 'react';
import type { Preview } from '@storybook/react';
import { ThemeProvider } from '../src/hooks/use-theme';
import '../src/styles/globals.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="light">
        <div className="min-h-screen bg-background text-foreground p-8">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

export default preview;