import type { DiffLine, DiffInsights } from '../types/diff';

export type ExportFormat = 'pdf' | 'html' | 'markdown' | 'json' | 'text';

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  includeInsights?: boolean;
  includeLineNumbers?: boolean;
  theme?: 'light' | 'dark';
  title?: string;
  description?: string;
  timestamp?: boolean;
  highlightSyntax?: boolean;
  language?: string;
}

export interface ExportData {
  lines: DiffLine[];
  insights?: DiffInsights;
  metadata?: {
    title?: string;
    description?: string;
    leftFile?: string;
    rightFile?: string;
    createdAt?: string;
  };
}

export class ExportService {
  /**
   * Export diff data in the specified format
   */
  static async export(data: ExportData, options: ExportOptions): Promise<Blob> {
    switch (options.format) {
      case 'html':
        return this.exportAsHTML(data, options);
      case 'markdown':
        return this.exportAsMarkdown(data, options);
      case 'json':
        return this.exportAsJSON(data, options);
      case 'text':
        return this.exportAsText(data, options);
      case 'pdf':
        return this.exportAsPDF(data, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Export as HTML with styling
   */
  private static async exportAsHTML(data: ExportData, options: ExportOptions): Promise<Blob> {
    const isDark = options.theme === 'dark';
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title || 'Diff Export'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: ${isDark ? '#e4e4e7' : '#18181b'};
      background: ${isDark ? '#09090b' : '#ffffff'};
      padding: 2rem;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .header {
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid ${isDark ? '#27272a' : '#e4e4e7'};
    }
    
    .title {
      font-size: 1.875rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    
    .description {
      color: ${isDark ? '#a1a1aa' : '#71717a'};
    }
    
    .metadata {
      display: flex;
      gap: 2rem;
      margin-top: 1rem;
      font-size: 0.875rem;
      color: ${isDark ? '#a1a1aa' : '#71717a'};
    }
    
    .insights {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
      padding: 1rem;
      background: ${isDark ? '#18181b' : '#f4f4f5'};
      border-radius: 0.5rem;
    }
    
    .insight-card {
      padding: 1rem;
      background: ${isDark ? '#09090b' : '#ffffff'};
      border-radius: 0.375rem;
      border: 1px solid ${isDark ? '#27272a' : '#e4e4e7'};
    }
    
    .insight-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: ${isDark ? '#71717a' : '#a1a1aa'};
      margin-bottom: 0.25rem;
    }
    
    .insight-value {
      font-size: 1.5rem;
      font-weight: bold;
    }
    
    .diff-container {
      background: ${isDark ? '#18181b' : '#fafafa'};
      border: 1px solid ${isDark ? '#27272a' : '#e4e4e7'};
      border-radius: 0.5rem;
      overflow: hidden;
    }
    
    .diff-header {
      padding: 0.75rem 1rem;
      background: ${isDark ? '#09090b' : '#ffffff'};
      border-bottom: 1px solid ${isDark ? '#27272a' : '#e4e4e7'};
      font-size: 0.875rem;
      color: ${isDark ? '#a1a1aa' : '#71717a'};
    }
    
    .diff-content {
      font-family: 'SF Mono', Monaco, 'Courier New', monospace;
      font-size: 0.875rem;
      line-height: 1.5;
    }
    
    .diff-line {
      display: flex;
      min-height: 1.5rem;
    }
    
    .line-number {
      width: 4rem;
      padding: 0 0.5rem;
      text-align: right;
      color: ${isDark ? '#52525b' : '#a1a1aa'};
      background: ${isDark ? '#09090b' : '#ffffff'};
      border-right: 1px solid ${isDark ? '#27272a' : '#e4e4e7'};
      user-select: none;
      flex-shrink: 0;
    }
    
    .line-content {
      flex: 1;
      padding: 0 1rem;
      white-space: pre-wrap;
      word-break: break-all;
    }
    
    .line-added {
      background: ${isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.1)'};
    }
    
    .line-added .line-content {
      color: ${isDark ? '#4ade80' : '#16a34a'};
    }
    
    .line-removed {
      background: ${isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
    }
    
    .line-removed .line-content {
      color: ${isDark ? '#f87171' : '#dc2626'};
    }
    
    .line-modified {
      background: ${isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.1)'};
    }
    
    .line-modified .line-content {
      color: ${isDark ? '#fbbf24' : '#d97706'};
    }
    
    .footer {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid ${isDark ? '#27272a' : '#e4e4e7'};
      text-align: center;
      font-size: 0.875rem;
      color: ${isDark ? '#71717a' : '#a1a1aa'};
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .diff-container {
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    ${this.generateHTMLHeader(data, options)}
    ${options.includeInsights && data.insights ? this.generateHTMLInsights(data.insights) : ''}
    ${this.generateHTMLDiff(data.lines, options)}
    ${this.generateHTMLFooter(options)}
  </div>
</body>
</html>`;

    return new Blob([html], { type: 'text/html;charset=utf-8' });
  }

  /**
   * Generate HTML header section
   */
  private static generateHTMLHeader(data: ExportData, options: ExportOptions): string {
    if (!options.includeMetadata || !data.metadata) return '';

    return `
    <div class="header">
      <h1 class="title">${data.metadata.title || 'Diff Comparison'}</h1>
      ${data.metadata.description ? `<p class="description">${data.metadata.description}</p>` : ''}
      <div class="metadata">
        ${data.metadata.leftFile ? `<div><strong>Left:</strong> ${data.metadata.leftFile}</div>` : ''}
        ${data.metadata.rightFile ? `<div><strong>Right:</strong> ${data.metadata.rightFile}</div>` : ''}
        ${options.timestamp ? `<div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>` : ''}
      </div>
    </div>`;
  }

  /**
   * Generate HTML insights section
   */
  private static generateHTMLInsights(insights: DiffInsights): string {
    return `
    <div class="insights">
      <div class="insight-card">
        <div class="insight-label">Total Changes</div>
        <div class="insight-value">${insights.totalChanges}</div>
      </div>
      <div class="insight-card">
        <div class="insight-label">Additions</div>
        <div class="insight-value" style="color: #16a34a">+${insights.additions}</div>
      </div>
      <div class="insight-card">
        <div class="insight-label">Deletions</div>
        <div class="insight-value" style="color: #dc2626">-${insights.deletions}</div>
      </div>
      <div class="insight-card">
        <div class="insight-label">Similarity</div>
        <div class="insight-value">${insights.similarity}%</div>
      </div>
    </div>`;
  }

  /**
   * Generate HTML diff content
   */
  private static generateHTMLDiff(lines: DiffLine[], options: ExportOptions): string {
    const diffLines = lines.map((line, index) => {
      const lineClass = `diff-line line-${line.type}`;
      const lineNumbers = options.includeLineNumbers ? 
        `<span class="line-number">${line.lineNumber?.old || ''}</span>
         <span class="line-number">${line.lineNumber?.new || ''}</span>` : '';
      
      return `
      <div class="${lineClass}">
        ${lineNumbers}
        <span class="line-content">${this.escapeHtml(line.content)}</span>
      </div>`;
    }).join('');

    return `
    <div class="diff-container">
      <div class="diff-header">
        ${lines.length} lines
      </div>
      <div class="diff-content">
        ${diffLines}
      </div>
    </div>`;
  }

  /**
   * Generate HTML footer
   */
  private static generateHTMLFooter(options: ExportOptions): string {
    return `
    <div class="footer">
      Generated by Diffit.tools${options.timestamp ? ` on ${new Date().toLocaleString()}` : ''}
    </div>`;
  }

  /**
   * Export as Markdown
   */
  private static async exportAsMarkdown(data: ExportData, options: ExportOptions): Promise<Blob> {
    const lines: string[] = [];

    // Header
    if (options.includeMetadata && data.metadata) {
      if (data.metadata.title) {
        lines.push(`# ${data.metadata.title}`, '');
      }
      if (data.metadata.description) {
        lines.push(`> ${data.metadata.description}`, '');
      }
      if (data.metadata.leftFile || data.metadata.rightFile) {
        lines.push('## Files', '');
        if (data.metadata.leftFile) lines.push(`- **Left:** \`${data.metadata.leftFile}\``);
        if (data.metadata.rightFile) lines.push(`- **Right:** \`${data.metadata.rightFile}\``);
        lines.push('');
      }
    }

    // Insights
    if (options.includeInsights && data.insights) {
      lines.push('## Statistics', '');
      lines.push('| Metric | Value |');
      lines.push('|--------|-------|');
      lines.push(`| Total Changes | ${data.insights.totalChanges} |`);
      lines.push(`| Additions | +${data.insights.additions} |`);
      lines.push(`| Deletions | -${data.insights.deletions} |`);
      lines.push(`| Modifications | ~${data.insights.modifications} |`);
      lines.push(`| Similarity | ${data.insights.similarity}% |`);
      lines.push('');
    }

    // Diff content
    lines.push('## Diff', '');
    lines.push('```diff');
    
    for (const line of data.lines) {
      const prefix = line.type === 'added' ? '+' : 
                     line.type === 'removed' ? '-' :
                     line.type === 'modified' ? '!' : ' ';
      lines.push(`${prefix} ${line.content}`);
    }
    
    lines.push('```', '');

    // Footer
    if (options.timestamp) {
      lines.push('---');
      lines.push(`*Generated by [Diffit.tools](https://diffit.tools) on ${new Date().toLocaleString()}*`);
    }

    return new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  }

  /**
   * Export as JSON
   */
  private static async exportAsJSON(data: ExportData, options: ExportOptions): Promise<Blob> {
    const exportData = {
      ...data,
      exportedAt: options.timestamp ? new Date().toISOString() : undefined,
      exportOptions: options,
    };

    return new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json;charset=utf-8' 
    });
  }

  /**
   * Export as plain text
   */
  private static async exportAsText(data: ExportData, options: ExportOptions): Promise<Blob> {
    const lines: string[] = [];

    // Header
    if (options.includeMetadata && data.metadata) {
      if (data.metadata.title) {
        lines.push(data.metadata.title);
        lines.push('='.repeat(data.metadata.title.length));
        lines.push('');
      }
      if (data.metadata.description) {
        lines.push(data.metadata.description, '');
      }
      if (data.metadata.leftFile) {
        lines.push(`Left file: ${data.metadata.leftFile}`);
      }
      if (data.metadata.rightFile) {
        lines.push(`Right file: ${data.metadata.rightFile}`);
      }
      lines.push('');
    }

    // Insights
    if (options.includeInsights && data.insights) {
      lines.push('Statistics:');
      lines.push(`  Total changes: ${data.insights.totalChanges}`);
      lines.push(`  Additions: +${data.insights.additions}`);
      lines.push(`  Deletions: -${data.insights.deletions}`);
      lines.push(`  Modifications: ~${data.insights.modifications}`);
      lines.push(`  Similarity: ${data.insights.similarity}%`);
      lines.push('');
    }

    // Diff content
    lines.push('Diff:');
    lines.push('-'.repeat(80));
    
    for (const line of data.lines) {
      const prefix = line.type === 'added' ? '+ ' : 
                     line.type === 'removed' ? '- ' :
                     line.type === 'modified' ? '! ' : '  ';
      
      if (options.includeLineNumbers) {
        const oldNum = line.lineNumber?.old?.toString().padStart(4, ' ') || '    ';
        const newNum = line.lineNumber?.new?.toString().padStart(4, ' ') || '    ';
        lines.push(`${oldNum} ${newNum} ${prefix}${line.content}`);
      } else {
        lines.push(`${prefix}${line.content}`);
      }
    }

    // Footer
    if (options.timestamp) {
      lines.push('');
      lines.push('-'.repeat(80));
      lines.push(`Generated by Diffit.tools on ${new Date().toLocaleString()}`);
    }

    return new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  }

  /**
   * Export as PDF using browser print
   */
  private static async exportAsPDF(data: ExportData, options: ExportOptions): Promise<Blob> {
    // For PDF, we'll generate HTML and trigger print
    // In a real implementation, you might use a library like jsPDF or puppeteer
    const htmlBlob = await this.exportAsHTML(data, options);
    const htmlText = await htmlBlob.text();
    
    // Open in new window and trigger print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlText);
      printWindow.document.close();
      
      // Add print styles
      const style = printWindow.document.createElement('style');
      style.textContent = `
        @media print {
          @page {
            margin: 1cm;
            size: A4;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `;
      printWindow.document.head.appendChild(style);
      
      // Trigger print after a short delay
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }

    // Return HTML blob as fallback
    return htmlBlob;
  }

  /**
   * Escape HTML special characters
   */
  private static escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Download exported file
   */
  static download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Get file extension for format
   */
  static getFileExtension(format: ExportFormat): string {
    const extensions: Record<ExportFormat, string> = {
      html: 'html',
      markdown: 'md',
      json: 'json',
      text: 'txt',
      pdf: 'pdf',
    };
    return extensions[format] || 'txt';
  }

  /**
   * Get MIME type for format
   */
  static getMimeType(format: ExportFormat): string {
    const mimeTypes: Record<ExportFormat, string> = {
      html: 'text/html',
      markdown: 'text/markdown',
      json: 'application/json',
      text: 'text/plain',
      pdf: 'application/pdf',
    };
    return mimeTypes[format] || 'text/plain';
  }
}