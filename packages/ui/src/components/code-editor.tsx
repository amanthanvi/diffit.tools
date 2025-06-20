"use client";

import * as React from 'react';
import Editor, { OnMount, BeforeMount } from '@monaco-editor/react';
import { cn } from '../lib/utils';
import { Skeleton } from './skeleton';
import { useTheme } from '../hooks/use-theme';

export interface CodeEditorProps {
  value?: string;
  defaultValue?: string;
  language?: string;
  theme?: 'vs-dark' | 'light' | 'auto';
  onChange?: (value: string | undefined) => void;
  onMount?: OnMount;
  beforeMount?: BeforeMount;
  options?: Record<string, any>;
  height?: string | number;
  className?: string;
  readOnly?: boolean;
  minimap?: boolean;
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval';
  wordWrap?: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
}

const CodeEditor = React.forwardRef<HTMLDivElement, CodeEditorProps>(
  (
    {
      value,
      defaultValue,
      language = 'javascript',
      theme = 'auto',
      onChange,
      onMount,
      beforeMount,
      options = {},
      height = 400,
      className,
      readOnly = false,
      minimap = true,
      lineNumbers = 'on',
      wordWrap = 'off',
    },
    ref
  ) => {
    const { theme: appTheme } = useTheme();
    const [isLoading, setIsLoading] = React.useState(true);

    const handleEditorDidMount: OnMount = (editor, monaco) => {
      setIsLoading(false);
      onMount?.(editor, monaco);
    };

    const handleBeforeMount: BeforeMount = (monaco) => {
      // Define custom themes
      monaco.editor.defineTheme('diffit-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#0a0a0a',
          'editor.foreground': '#e4e4e7',
          'editorLineNumber.foreground': '#71717a',
          'editorCursor.foreground': '#e4e4e7',
          'editor.selectionBackground': '#3f3f46',
          'editor.inactiveSelectionBackground': '#27272a',
        },
      });

      monaco.editor.defineTheme('diffit-light', {
        base: 'vs',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#ffffff',
          'editor.foreground': '#18181b',
          'editorLineNumber.foreground': '#a1a1aa',
          'editorCursor.foreground': '#18181b',
          'editor.selectionBackground': '#e4e4e7',
          'editor.inactiveSelectionBackground': '#f4f4f5',
        },
      });

      beforeMount?.(monaco);
    };

    const editorTheme = React.useMemo(() => {
      if (theme === 'auto') {
        return appTheme === 'dark' ? 'diffit-dark' : 'diffit-light';
      }
      return theme === 'vs-dark' ? 'diffit-dark' : 'diffit-light';
    }, [theme, appTheme]);

    const mergedOptions = React.useMemo(
      () => ({
        readOnly,
        minimap: { enabled: minimap },
        lineNumbers,
        wordWrap,
        fontSize: 14,
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        ...options,
      }),
      [readOnly, minimap, lineNumbers, wordWrap, options]
    );

    return (
      <div ref={ref} className={cn('relative rounded-md overflow-hidden border', className)}>
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
            <div className="space-y-2 w-full p-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        )}
        <Editor
          height={height}
          defaultLanguage={language}
          language={language}
          value={value}
          defaultValue={defaultValue}
          theme={editorTheme}
          onChange={onChange}
          onMount={handleEditorDidMount}
          beforeMount={handleBeforeMount}
          options={mergedOptions}
          loading={null}
        />
      </div>
    );
  }
);

CodeEditor.displayName = 'CodeEditor';

export { CodeEditor };