# @diffit/ui

A comprehensive UI component library for diffit.tools v2.0, built with React, TypeScript, Radix UI, and Tailwind CSS.

## Features

- 🎨 **Modern Design System** - Beautiful, accessible components with dark mode support
- ♿ **WCAG AA Compliant** - Full keyboard navigation and screen reader support
- 🎭 **Themeable** - CSS variables for easy customization
- 📱 **Responsive** - Mobile-first design approach
- ⚡ **Performance Optimized** - Tree-shakeable with lazy loading support
- 🔧 **Developer Experience** - TypeScript support with comprehensive types
- 📚 **Storybook Documentation** - Interactive component playground

## Installation

```bash
npm install @diffit/ui
```

## Setup

### 1. Import Styles

Add the following to your main CSS file or app entry point:

```css
@import '@diffit/ui/styles.css';
```

### 2. Configure Tailwind

Extend your `tailwind.config.js` to include the UI library:

```js
module.exports = {
  content: [
    // ... your content paths
    './node_modules/@diffit/ui/dist/**/*.{js,ts,jsx,tsx}',
  ],
  // ... rest of your config
};
```

### 3. Add Theme Provider

Wrap your app with the ThemeProvider:

```tsx
import { ThemeProvider } from '@diffit/ui';

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      {/* Your app content */}
    </ThemeProvider>
  );
}
```

## Core Components

### Button

A versatile button component with multiple variants and sizes.

```tsx
import { Button } from '@diffit/ui';

<Button variant="default">Click me</Button>
<Button variant="outline" size="sm">Small Button</Button>
<Button variant="ghost" size="icon">
  <IconComponent />
</Button>
```

### Card

A flexible container component for grouping related content.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@diffit/ui';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>
```

### Dialog

An accessible modal dialog component.

```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@diffit/ui';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    {/* Dialog content */}
  </DialogContent>
</Dialog>
```

### Toast

A notification system for displaying temporary messages.

```tsx
import { useToast, Toaster } from '@diffit/ui';

function MyComponent() {
  const { toast } = useToast();

  return (
    <>
      <Button
        onClick={() => {
          toast({
            title: "Success!",
            description: "Your action was completed.",
          });
        }}
      >
        Show Toast
      </Button>
      <Toaster />
    </>
  );
}
```

## Advanced Components

### DiffViewer

A powerful diff viewer with multiple view modes.

```tsx
import { DiffViewer } from '@diffit/ui';

<DiffViewer
  lines={diffLines}
  mode="unified" // or "split" | "inline"
  showLineNumbers
  onModeChange={(mode) => console.log(mode)}
/>
```

### FileBrowser

A file explorer component with search and lazy loading.

```tsx
import { FileBrowser } from '@diffit/ui';

<FileBrowser
  files={fileTree}
  selectedPath={selectedFile?.path}
  onSelect={handleFileSelect}
  onOpen={handleFileOpen}
  searchable
/>
```

### CommandPalette

A command palette component for keyboard-driven navigation.

```tsx
import { CommandDialog, CommandInput, CommandList, CommandItem } from '@diffit/ui';

<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Type a command..." />
  <CommandList>
    <CommandItem onSelect={() => handleAction()}>
      Action Name
    </CommandItem>
  </CommandList>
</CommandDialog>
```

### CodeEditor

A Monaco-based code editor with syntax highlighting.

```tsx
import { CodeEditor } from '@diffit/ui';

<CodeEditor
  value={code}
  language="javascript"
  theme="auto" // Follows app theme
  onChange={handleCodeChange}
  options={{
    minimap: { enabled: false },
    lineNumbers: 'on',
  }}
/>
```

### ThemeCustomizer

A theme customization component for runtime theming.

```tsx
import { ThemeCustomizer } from '@diffit/ui';

<ThemeCustomizer />
```

## Hooks

### useTheme

Access and control the current theme.

```tsx
import { useTheme } from '@diffit/ui';

function MyComponent() {
  const { theme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme('dark')}>
      Current theme: {theme}
    </button>
  );
}
```

### useToast

Display toast notifications.

```tsx
import { useToast } from '@diffit/ui';

function MyComponent() {
  const { toast } = useToast();

  const showToast = () => {
    toast({
      title: "Hello",
      description: "This is a toast message",
    });
  };
}
```

## Animations

Pre-built animation variants using Framer Motion.

```tsx
import { motion } from 'framer-motion';
import { fadeIn, slideUp, modalVariants } from '@diffit/ui';

<motion.div
  initial="initial"
  animate="animate"
  exit="exit"
  variants={fadeIn}
>
  Animated content
</motion.div>
```

## Accessibility

All components are built with accessibility in mind:

- ✅ Keyboard navigation support
- ✅ ARIA labels and descriptions
- ✅ Focus management
- ✅ Screen reader announcements
- ✅ Reduced motion support
- ✅ High contrast mode support

## Theming

Customize the look and feel using CSS variables:

```css
:root {
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --radius: 0.5rem;
  /* ... other variables */
}
```

## Development

### Running Storybook

```bash
npm run storybook
```

### Building the Library

```bash
npm run build
```

### Running Tests

```bash
npm run test
```

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

## License

MIT