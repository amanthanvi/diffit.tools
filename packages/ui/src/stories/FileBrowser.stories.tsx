import type { Meta, StoryObj } from '@storybook/react';
import { FileBrowser, type FileItem } from '../components/file-browser';
import { useState } from 'react';
import { Card } from '../components/card';

const sampleFiles: FileItem[] = [
  {
    id: '1',
    name: 'src',
    type: 'folder',
    path: '/src',
    children: [
      {
        id: '2',
        name: 'components',
        type: 'folder',
        path: '/src/components',
        children: [
          {
            id: '3',
            name: 'Button.tsx',
            type: 'file',
            path: '/src/components/Button.tsx',
            size: 2048,
            modified: new Date('2024-01-15'),
          },
          {
            id: '4',
            name: 'Card.tsx',
            type: 'file',
            path: '/src/components/Card.tsx',
            size: 1536,
            modified: new Date('2024-01-14'),
          },
          {
            id: '5',
            name: 'Dialog.tsx',
            type: 'file',
            path: '/src/components/Dialog.tsx',
            size: 3072,
            modified: new Date('2024-01-13'),
          },
        ],
      },
      {
        id: '6',
        name: 'hooks',
        type: 'folder',
        path: '/src/hooks',
        children: [
          {
            id: '7',
            name: 'useTheme.ts',
            type: 'file',
            path: '/src/hooks/useTheme.ts',
            size: 512,
            modified: new Date('2024-01-12'),
          },
          {
            id: '8',
            name: 'useToast.ts',
            type: 'file',
            path: '/src/hooks/useToast.ts',
            size: 768,
            modified: new Date('2024-01-11'),
          },
        ],
      },
      {
        id: '9',
        name: 'index.ts',
        type: 'file',
        path: '/src/index.ts',
        size: 256,
        modified: new Date('2024-01-10'),
      },
    ],
  },
  {
    id: '10',
    name: 'package.json',
    type: 'file',
    path: '/package.json',
    size: 1024,
    modified: new Date('2024-01-09'),
  },
  {
    id: '11',
    name: 'README.md',
    type: 'file',
    path: '/README.md',
    size: 4096,
    modified: new Date('2024-01-08'),
  },
];

const meta = {
  title: 'Components/FileBrowser',
  component: FileBrowser,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    searchable: {
      control: 'boolean',
    },
    loading: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof FileBrowser>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

    return (
      <div className="grid grid-cols-2 gap-4">
        <Card className="h-[400px]">
          <FileBrowser
            files={sampleFiles}
            selectedPath={selectedFile?.path}
            onSelect={setSelectedFile}
            onOpen={(file) => alert(`Opening ${file.name}`)}
          />
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Selected File</h3>
          {selectedFile ? (
            <div className="space-y-1 text-sm">
              <p>Name: {selectedFile.name}</p>
              <p>Type: {selectedFile.type}</p>
              <p>Path: {selectedFile.path}</p>
              {selectedFile.size && <p>Size: {selectedFile.size} bytes</p>}
            </div>
          ) : (
            <p className="text-muted-foreground">No file selected</p>
          )}
        </Card>
      </div>
    );
  },
};

export const WithSearch: Story = {
  args: {
    files: sampleFiles,
    searchable: true,
  },
};

export const Loading: Story = {
  args: {
    files: [],
    loading: true,
  },
};

export const EmptyState: Story = {
  args: {
    files: [],
    loading: false,
  },
};