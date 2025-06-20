/**
 * Basic usage examples for the diffit diff engine
 */

import {
  DiffEngineWrapper,
  DiffWorker,
  StreamingDiffWrapper,
  VirtualScrollWrapper,
  ProgressiveDiffLoader,
  DiffFactory,
  DiffUtils,
  type DiffOptions,
  type DiffResult,
} from '../ts/index';

// Example 1: Basic diff computation
async function basicDiffExample() {
  console.log('=== Basic Diff Example ===');
  
  const oldText = `function hello() {
  console.log("Hello");
  return true;
}`;

  const newText = `function hello(name) {
  console.log("Hello " + name);
  return true;
}`;

  const engine = new DiffEngineWrapper();
  
  try {
    const options: DiffOptions = {
      algorithm: 'myers',
      syntaxHighlight: true,
      language: 'javascript',
      semanticDiff: true,
      contextLines: 3,
    };

    const result = await engine.computeDiff(oldText, newText, options);
    
    console.log(`Found ${result.hunks.length} hunks`);
    console.log(`Similarity: ${(result.stats.similarity * 100).toFixed(1)}%`);
    console.log(`Added lines: ${result.stats.addedLines}`);
    console.log(`Removed lines: ${result.stats.removedLines}`);
    
    // Print each hunk
    result.hunks.forEach((hunk, index) => {
      console.log(`\nHunk ${index + 1}: ${hunk.header}`);
      hunk.changes.forEach(change => {
        const prefix = change.changeType === 'added' ? '+' : 
                      change.changeType === 'removed' ? '-' : ' ';
        console.log(`${prefix} ${change.content}`);
      });
    });
    
  } finally {
    engine.destroy();
  }
}

// Example 2: Web Worker usage for non-blocking computation
async function workerExample() {
  console.log('\n=== Worker Example ===');
  
  const worker = new DiffWorker();
  
  try {
    const oldText = Array.from({ length: 1000 }, (_, i) => `Line ${i}`).join('\n');
    const newText = Array.from({ length: 1000 }, (_, i) => 
      i % 10 === 0 ? `Modified Line ${i}` : `Line ${i}`
    ).join('\n');

    console.log('Computing diff in worker thread...');
    const start = Date.now();
    
    const result = await worker.computeDiff(oldText, newText, {
      algorithm: 'myers',
      ignoreWhitespace: true,
    });
    
    const duration = Date.now() - start;
    console.log(`Computed diff in ${duration}ms`);
    console.log(`Modified ${result.stats.modifiedLines} lines`);
    
  } finally {
    worker.destroy();
  }
}

// Example 3: Streaming for large files
async function streamingExample() {
  console.log('\n=== Streaming Example ===');
  
  const streaming = new StreamingDiffWrapper();
  
  try {
    await streaming.init({
      algorithm: 'myers',
      contextLines: 5,
    });

    // Simulate processing a large file in chunks
    const chunkSize = 100;
    const totalLines = 10000;
    
    console.log('Processing old file chunks...');
    for (let i = 0; i < totalLines; i += chunkSize) {
      const chunk = Array.from({ length: chunkSize }, (_, j) => 
        `Old line ${i + j}`
      ).join('\n');
      
      await streaming.addOldChunk(chunk);
      
      if (i % 1000 === 0) {
        console.log(`Processed ${i} lines...`);
      }
    }

    console.log('Processing new file chunks...');
    for (let i = 0; i < totalLines; i += chunkSize) {
      const chunk = Array.from({ length: chunkSize }, (_, j) => {
        const lineNum = i + j;
        return lineNum % 100 === 0 ? `Modified line ${lineNum}` : `Old line ${lineNum}`;
      }).join('\n');
      
      await streaming.addNewChunk(chunk);
      
      if (i % 1000 === 0) {
        console.log(`Processed ${i} lines...`);
        
        // Show intermediate results
        const intermediate = streaming.getIntermediateResult();
        console.log(`  Current hunks: ${intermediate.hunks.length}`);
      }
    }

    console.log('Finalizing diff...');
    const result = await streaming.finalize();
    
    console.log(`Final result: ${result.hunks.length} hunks`);
    console.log(`Total changes: ${result.stats.addedLines + result.stats.removedLines + result.stats.modifiedLines}`);
    
  } finally {
    streaming.destroy();
  }
}

// Example 4: Virtual scrolling for large diffs
async function virtualScrollExample() {
  console.log('\n=== Virtual Scroll Example ===');
  
  const virtualScroll = new VirtualScrollWrapper();
  
  try {
    const totalLines = 100000;
    const viewportHeight = 500; // pixels
    const lineHeight = 20; // pixels per line
    
    await virtualScroll.init(totalLines, Math.floor(viewportHeight / lineHeight));
    
    // Simulate scrolling through the document
    for (let scrollTop = 0; scrollTop < totalLines * lineHeight; scrollTop += viewportHeight) {
      const visibleRange = virtualScroll.updateViewport(scrollTop, Math.floor(viewportHeight / lineHeight));
      
      if (scrollTop % (viewportHeight * 10) === 0) {
        console.log(`Scroll position: ${scrollTop}px`);
        console.log(`  Visible lines: ${visibleRange.startIndex} - ${visibleRange.endIndex}`);
        console.log(`  Virtual offset: ${visibleRange.offsetY}px`);
      }
    }
    
  } finally {
    virtualScroll.destroy();
  }
}

// Example 5: Progressive loading with progress callbacks
async function progressiveLoadingExample() {
  console.log('\n=== Progressive Loading Example ===');
  
  let progressUpdates = 0;
  let chunkUpdates = 0;
  
  const loader = new ProgressiveDiffLoader({
    chunkSize: 500,
    onProgress: (progress) => {
      progressUpdates++;
      if (progressUpdates % 5 === 0) {
        console.log(`Progress: ${(progress * 100).toFixed(1)}%`);
      }
    },
    onChunk: (chunk) => {
      chunkUpdates++;
      console.log(`Received chunk ${chunkUpdates} with ${chunk.hunks.length} hunks`);
    },
  });

  const oldText = Array.from({ length: 5000 }, (_, i) => 
    `Line ${i}: This is some content for testing progressive loading`
  ).join('\n');
  
  const newText = Array.from({ length: 5000 }, (_, i) => {
    if (i % 20 === 0) {
      return `Modified Line ${i}: This content has been changed`;
    }
    return `Line ${i}: This is some content for testing progressive loading`;
  }).join('\n');

  const start = Date.now();
  const result = await loader.loadDiff(oldText, newText, {
    algorithm: 'myers',
    syntaxHighlight: false, // Disable for performance
  });
  
  const duration = Date.now() - start;
  console.log(`Progressive loading completed in ${duration}ms`);
  console.log(`Total progress updates: ${progressUpdates}`);
  console.log(`Total chunk updates: ${chunkUpdates}`);
  console.log(`Final result: ${result.hunks.length} hunks`);
}

// Example 6: Factory pattern and resource management
async function factoryExample() {
  console.log('\n=== Factory Example ===');
  
  // Create multiple engines efficiently
  const engines = await Promise.all([
    DiffFactory.createEngine(true), // Use worker
    DiffFactory.createEngine(true), // Use worker
    DiffFactory.createEngine(false), // Main thread
  ]);

  const texts = [
    { old: 'test1\nold', new: 'test1\nnew' },
    { old: 'test2\nold', new: 'test2\nnew' },
    { old: 'test3\nold', new: 'test3\nnew' },
  ];

  try {
    // Process diffs in parallel
    const results = await Promise.all(
      engines.map((engine, i) => 
        engine.computeDiff(texts[i].old, texts[i].new, { algorithm: 'myers' })
      )
    );

    results.forEach((result, i) => {
      console.log(`Diff ${i + 1}: ${result.hunks.length} hunks, similarity: ${(result.stats.similarity * 100).toFixed(1)}%`);
    });

  } finally {
    // Clean up resources
    engines.forEach(engine => DiffFactory.releaseEngine(engine));
  }
}

// Example 7: Utility functions
function utilityExample() {
  console.log('\n=== Utility Example ===');
  
  // Format file sizes
  console.log(`1024 bytes = ${DiffUtils.formatBytes(1024)}`);
  console.log(`1048576 bytes = ${DiffUtils.formatBytes(1048576)}`);
  
  // Hash text for caching
  const text1 = 'Hello world';
  const text2 = 'Hello world';
  const text3 = 'Hello universe';
  
  console.log(`Hash of "${text1}": ${DiffUtils.hash(text1)}`);
  console.log(`Hash of "${text2}": ${DiffUtils.hash(text2)}`);
  console.log(`Hash of "${text3}": ${DiffUtils.hash(text3)}`);
  console.log(`Same hash for same text: ${DiffUtils.hash(text1) === DiffUtils.hash(text2)}`);
  
  // Performance timing
  const startTime = DiffUtils.now();
  // ... some operation ...
  const endTime = DiffUtils.now();
  console.log(`Operation took: ${endTime - startTime}ms`);
}

// Example 8: Error handling
async function errorHandlingExample() {
  console.log('\n=== Error Handling Example ===');
  
  const engine = new DiffEngineWrapper();
  
  try {
    // Try to process very large text that exceeds limits
    const hugeTex = 'x'.repeat(100 * 1024 * 1024); // 100MB
    
    try {
      await engine.computeDiff(hugeTex, hugeTex, { maxFileSize: 1024 * 1024 }); // 1MB limit
    } catch (error) {
      console.log('Expected error for large file:', error.message);
    }
    
    // Try invalid options
    try {
      await engine.computeDiff('test', 'test', { algorithm: 'invalid' as any });
    } catch (error) {
      console.log('Expected error for invalid algorithm:', error.message);
    }
    
  } finally {
    engine.destroy();
  }
}

// Run all examples
async function runAllExamples() {
  console.log('Running diffit diff engine examples...\n');
  
  try {
    await basicDiffExample();
    await workerExample();
    await streamingExample();
    await virtualScrollExample();
    await progressiveLoadingExample();
    await factoryExample();
    utilityExample();
    await errorHandlingExample();
    
    console.log('\n✅ All examples completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Example failed:', error);
  } finally {
    // Clean up any remaining resources
    DiffFactory.destroyAllWorkers();
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}

export {
  basicDiffExample,
  workerExample,
  streamingExample,
  virtualScrollExample,
  progressiveLoadingExample,
  factoryExample,
  utilityExample,
  errorHandlingExample,
  runAllExamples,
};