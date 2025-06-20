# @diffit/diff-engine

A high-performance WebAssembly diff engine for diffit.tools v2.0, featuring Myers algorithm implementation, semantic diff awareness, virtual scrolling support, and syntax highlighting.

## Features

- **High Performance**: WebAssembly implementation for maximum speed
- **Myers Algorithm**: Industry-standard diff algorithm with optimizations
- **Semantic Awareness**: Understanding of code structure and meaning
- **Virtual Scrolling**: Efficient handling of files with millions of lines
- **Syntax Highlighting**: Support for 20+ programming languages
- **Streaming Processing**: Handle large files without memory issues
- **Web Worker Support**: Non-blocking diff computation
- **TypeScript**: Full type safety and excellent developer experience

## Installation

```bash
npm install @diffit/diff-engine
```

## Quick Start

```typescript
import { DiffEngineWrapper } from '@diffit/diff-engine';

const engine = new DiffEngineWrapper();

try {
  const result = await engine.computeDiff(oldText, newText, {
    algorithm: 'myers',
    syntaxHighlight: true,
    language: 'javascript',
    semanticDiff: true,
  });
  
  console.log(`Found ${result.hunks.length} hunks`);
  console.log(`Similarity: ${result.stats.similarity * 100}%`);
} finally {
  engine.destroy();
}
```

## API Reference

### DiffOptions

```typescript
interface DiffOptions {
  algorithm?: 'myers' | 'patience' | 'histogram';
  contextLines?: number;
  ignoreWhitespace?: boolean;
  ignoreCase?: boolean;
  semanticDiff?: boolean;
  syntaxHighlight?: boolean;
  language?: string;
  wordDiff?: boolean;
  lineNumbers?: boolean;
  maxFileSize?: number;
}
```

### DiffResult

```typescript
interface DiffResult {
  hunks: DiffHunk[];
  stats: DiffStats;
  fileLanguage?: string;
  isBinary: boolean;
  isLargeFile: boolean;
}
```

## Advanced Usage

### Web Worker Support

```typescript
import { DiffWorker } from '@diffit/diff-engine';

const worker = new DiffWorker();

try {
  const result = await worker.computeDiff(oldText, newText, options);
  // Processing happens in background thread
} finally {
  worker.destroy();
}
```

### Streaming for Large Files

```typescript
import { StreamingDiffWrapper } from '@diffit/diff-engine';

const streaming = new StreamingDiffWrapper();

try {
  await streaming.init(options);
  
  // Process old file in chunks
  for (const chunk of oldFileChunks) {
    await streaming.addOldChunk(chunk);
  }
  
  // Process new file in chunks
  for (const chunk of newFileChunks) {
    await streaming.addNewChunk(chunk);
  }
  
  const result = await streaming.finalize();
} finally {
  streaming.destroy();
}
```

### Virtual Scrolling

```typescript
import { VirtualScrollWrapper } from '@diffit/diff-engine';

const virtualScroll = new VirtualScrollWrapper();

try {
  await virtualScroll.init(totalLines, viewportHeight);
  
  const visibleRange = virtualScroll.updateViewport(scrollTop, viewportHeight);
  
  // Render only visible lines for performance
  renderLines(visibleRange.startIndex, visibleRange.endIndex);
} finally {
  virtualScroll.destroy();
}
```

### Progressive Loading

```typescript
import { ProgressiveDiffLoader } from '@diffit/diff-engine';

const loader = new ProgressiveDiffLoader({
  chunkSize: 1000,
  onProgress: (progress) => console.log(`${progress * 100}% complete`),
  onChunk: (chunk) => renderChunk(chunk),
});

const result = await loader.loadDiff(oldText, newText, options);
```

## Performance

The diff engine is optimized for performance:

- **WebAssembly**: Near-native speed for diff computation
- **Memory Efficient**: Streaming processing for large files
- **Virtual Scrolling**: Handle millions of lines without UI lag
- **Web Workers**: Non-blocking computation
- **Caching**: Intelligent caching of diff results

### Benchmarks

| Operation | File Size | Time | Memory |
|-----------|-----------|------|--------|
| Myers Diff | 1K lines | ~1ms | <1MB |
| Myers Diff | 10K lines | ~15ms | <10MB |
| Myers Diff | 100K lines | ~200ms | <50MB |
| Syntax Highlighting | 1K lines | ~5ms | <2MB |
| Virtual Scroll Update | 1M lines | ~0.1ms | <1MB |

## Supported Languages

The engine supports syntax highlighting for:

- JavaScript/TypeScript
- Python
- Rust
- Java
- C/C++
- Go
- PHP
- Ruby
- C#
- Swift
- Kotlin
- Scala
- And more...

## Browser Support

- Chrome 57+
- Firefox 52+
- Safari 11+
- Edge 16+

Requires WebAssembly support.

## Building from Source

### Prerequisites

- Rust 1.70+
- Node.js 16+
- wasm-pack

### Build Steps

```bash
# Clone the repository
git clone https://github.com/diffit-tools/diffit-v2
cd packages/diff-engine

# Build WebAssembly module
npm run build:wasm

# Build TypeScript bindings
npm run build:ts

# Run tests
npm test

# Run benchmarks
npm run bench
```

### Development

```bash
# Watch mode for development
npm run build:dev

# Run specific tests
npm run test:rust
npm run test:wasm
npm run test:ts

# Lint and format
npm run lint
npm run format

# Check bundle size
npm run size-check

# Optimize WASM bundle
npm run optimize
```

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   TypeScript    │    │   WebAssembly    │    │   Web Worker    │
│    Bindings     │───▶│   Diff Engine    │───▶│   Background    │
│                 │    │                  │    │   Processing    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Virtual Scroll │    │ Myers Algorithm  │    │   Streaming     │
│    Manager      │    │   + Semantic     │    │   Processor     │
│                 │    │   + Syntax       │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Changelog

### 2.0.0

- Initial release
- Myers algorithm implementation
- Semantic diff awareness
- Virtual scrolling support
- Syntax highlighting for 20+ languages
- Web Worker support
- Streaming processing
- TypeScript bindings
- Comprehensive test suite
- Performance benchmarks