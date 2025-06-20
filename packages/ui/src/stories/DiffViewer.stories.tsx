import type { Meta, StoryObj } from '@storybook/react';
import { DiffViewer, type DiffLine } from '../components/diff-viewer';

const sampleDiffLines: DiffLine[] = [
  { type: 'header', content: '--- a/src/utils.ts' },
  { type: 'header', content: '+++ b/src/utils.ts' },
  { type: 'unchanged', content: 'export function formatDate(date: Date) {', lineNumber: { old: 1, new: 1 } },
  { type: 'removed', content: '  return date.toLocaleDateString();', lineNumber: { old: 2 } },
  { type: 'added', content: '  return date.toLocaleDateString("en-US", {', lineNumber: { new: 2 } },
  { type: 'added', content: '    year: "numeric",', lineNumber: { new: 3 } },
  { type: 'added', content: '    month: "long",', lineNumber: { new: 4 } },
  { type: 'added', content: '    day: "numeric"', lineNumber: { new: 5 } },
  { type: 'added', content: '  });', lineNumber: { new: 6 } },
  { type: 'unchanged', content: '}', lineNumber: { old: 3, new: 7 } },
  { type: 'unchanged', content: '', lineNumber: { old: 4, new: 8 } },
  { type: 'unchanged', content: 'export function parseQuery(query: string) {', lineNumber: { old: 5, new: 9 } },
  { type: 'unchanged', content: '  return new URLSearchParams(query);', lineNumber: { old: 6, new: 10 } },
  { type: 'unchanged', content: '}', lineNumber: { old: 7, new: 11 } },
];

const meta = {
  title: 'Components/DiffViewer',
  component: DiffViewer,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'select',
      options: ['unified', 'split', 'inline'],
    },
    showLineNumbers: {
      control: 'boolean',
    },
    highlightSyntax: {
      control: 'boolean',
    },
    language: {
      control: 'text',
    },
  },
} satisfies Meta<typeof DiffViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    lines: sampleDiffLines,
    mode: 'unified',
    showLineNumbers: true,
  },
};

export const UnifiedView: Story = {
  args: {
    lines: sampleDiffLines,
    mode: 'unified',
    showLineNumbers: true,
  },
};

export const SplitView: Story = {
  args: {
    lines: sampleDiffLines,
    mode: 'split',
    showLineNumbers: true,
  },
};

export const InlineView: Story = {
  args: {
    lines: sampleDiffLines,
    mode: 'inline',
    showLineNumbers: true,
  },
};

export const WithoutLineNumbers: Story = {
  args: {
    lines: sampleDiffLines,
    mode: 'unified',
    showLineNumbers: false,
  },
};

export const LargeDiff: Story = {
  args: {
    lines: [
      ...sampleDiffLines,
      ...Array.from({ length: 50 }, (_, i) => ({
        type: 'unchanged' as const,
        content: `  // Some unchanged line of code ${i + 1}`,
        lineNumber: { old: i + 12, new: i + 12 },
      })),
    ],
    mode: 'unified',
    showLineNumbers: true,
  },
};