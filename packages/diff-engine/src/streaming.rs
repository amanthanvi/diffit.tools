use crate::diff::{DiffOptions, DiffResult, DiffHunk, DiffChange, ChangeType, DiffStats};
use std::collections::VecDeque;
use std::error::Error;
use std::fmt;

/// Error type for streaming operations
#[derive(Debug)]
pub enum StreamingError {
    InvalidState(String),
    BufferOverflow,
    EncodingError,
}

impl fmt::Display for StreamingError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            StreamingError::InvalidState(msg) => write!(f, "Invalid streaming state: {}", msg),
            StreamingError::BufferOverflow => write!(f, "Buffer overflow - file too large"),
            StreamingError::EncodingError => write!(f, "Invalid text encoding in stream"),
        }
    }
}

impl Error for StreamingError {}

/// Streaming diff processor for handling large files
pub struct StreamingDiff {
    options: DiffOptions,
    old_buffer: LineBuffer,
    new_buffer: LineBuffer,
    processed_old_lines: usize,
    processed_new_lines: usize,
    current_hunks: Vec<DiffHunk>,
    state: StreamingState,
}

#[derive(Debug, PartialEq)]
enum StreamingState {
    ReceivingOld,
    ReceivingNew,
    Processing,
    Finalized,
}

/// Buffer for storing lines with efficient memory usage
struct LineBuffer {
    lines: VecDeque<String>,
    total_size: usize,
    max_size: usize,
}

impl LineBuffer {
    fn new(max_size: usize) -> Self {
        Self {
            lines: VecDeque::with_capacity(1024),
            total_size: 0,
            max_size,
        }
    }

    fn add_chunk(&mut self, chunk: &str) -> Result<(), StreamingError> {
        let chunk_size = chunk.len();
        if self.total_size + chunk_size > self.max_size {
            return Err(StreamingError::BufferOverflow);
        }

        // Split chunk into lines
        let mut lines = chunk.lines().peekable();
        
        // Handle continuation of previous line
        if !self.lines.is_empty() && !chunk.starts_with('\n') {
            if let Some(last_line) = self.lines.back_mut() {
                if let Some(first_new_line) = lines.next() {
                    last_line.push_str(first_new_line);
                }
            }
        }

        // Add remaining lines
        for line in lines {
            self.lines.push_back(line.to_string());
        }

        // Handle incomplete line at end
        if !chunk.ends_with('\n') && chunk.contains('\n') {
            // The last line is incomplete, keep it for next chunk
        } else if chunk.ends_with('\n') && !self.lines.is_empty() {
            // Complete line, add empty line if needed
            self.lines.push_back(String::new());
        }

        self.total_size += chunk_size;
        Ok(())
    }

    fn get_lines(&self, start: usize, count: usize) -> Vec<&str> {
        self.lines
            .iter()
            .skip(start)
            .take(count)
            .map(|s| s.as_str())
            .collect()
    }

    fn len(&self) -> usize {
        self.lines.len()
    }

    fn clear(&mut self) {
        self.lines.clear();
        self.total_size = 0;
    }
}

impl StreamingDiff {
    /// Create a new streaming diff processor
    pub fn new(options: DiffOptions) -> Self {
        let max_buffer_size = options.max_file_size / 2; // Split buffer between old and new
        
        Self {
            options,
            old_buffer: LineBuffer::new(max_buffer_size),
            new_buffer: LineBuffer::new(max_buffer_size),
            processed_old_lines: 0,
            processed_new_lines: 0,
            current_hunks: Vec::new(),
            state: StreamingState::ReceivingOld,
        }
    }

    /// Add a chunk of the old file
    pub fn add_old_chunk(&mut self, chunk: &str) -> Result<(), StreamingError> {
        if self.state != StreamingState::ReceivingOld {
            return Err(StreamingError::InvalidState(
                "Not in old file receiving state".to_string()
            ));
        }

        self.old_buffer.add_chunk(chunk)?;
        Ok(())
    }

    /// Signal end of old file and start receiving new file
    pub fn start_new_file(&mut self) -> Result<(), StreamingError> {
        if self.state != StreamingState::ReceivingOld {
            return Err(StreamingError::InvalidState(
                "Can only transition from old file state".to_string()
            ));
        }

        self.state = StreamingState::ReceivingNew;
        Ok(())
    }

    /// Add a chunk of the new file
    pub fn add_new_chunk(&mut self, chunk: &str) -> Result<(), StreamingError> {
        if self.state != StreamingState::ReceivingNew {
            return Err(StreamingError::InvalidState(
                "Not in new file receiving state".to_string()
            ));
        }

        self.new_buffer.add_chunk(chunk)?;
        
        // Process chunks if we have enough data
        if self.should_process_chunk() {
            self.process_available_chunks()?;
        }

        Ok(())
    }

    /// Check if we should process available chunks
    fn should_process_chunk(&self) -> bool {
        // Process when we have at least 1000 lines or buffer is getting full
        self.old_buffer.len() > 1000 || self.new_buffer.len() > 1000 ||
        self.old_buffer.total_size > self.old_buffer.max_size / 2 ||
        self.new_buffer.total_size > self.new_buffer.max_size / 2
    }

    /// Process available chunks
    fn process_available_chunks(&mut self) -> Result<(), StreamingError> {
        let chunk_size = 1000; // Process 1000 lines at a time
        
        let old_lines = self.old_buffer.get_lines(0, chunk_size.min(self.old_buffer.len()));
        let new_lines = self.new_buffer.get_lines(0, chunk_size.min(self.new_buffer.len()));

        // Run diff on this chunk
        let chunk_result = crate::diff::compute_diff(
            &old_lines.join("\n"),
            &new_lines.join("\n"),
            &self.options,
        ).map_err(|e| StreamingError::InvalidState(e.to_string()))?;

        // Adjust line numbers and add to current hunks
        for mut hunk in chunk_result.hunks {
            hunk.old_start += self.processed_old_lines;
            hunk.new_start += self.processed_new_lines;
            
            for change in &mut hunk.changes {
                if let Some(old_line) = change.old_line_number.as_mut() {
                    *old_line += self.processed_old_lines;
                }
                if let Some(new_line) = change.new_line_number.as_mut() {
                    *new_line += self.processed_new_lines;
                }
            }
            
            self.current_hunks.push(hunk);
        }

        // Update processed counts
        self.processed_old_lines += old_lines.len();
        self.processed_new_lines += new_lines.len();

        // Clear processed lines from buffers
        // Note: In a real implementation, we'd keep some overlap for context
        self.old_buffer.lines.drain(0..old_lines.len().min(self.old_buffer.len()));
        self.new_buffer.lines.drain(0..new_lines.len().min(self.new_buffer.len()));

        Ok(())
    }

    /// Finalize the diff computation
    pub fn finalize(&mut self) -> Result<DiffResult, StreamingError> {
        if self.state == StreamingState::Finalized {
            return Err(StreamingError::InvalidState(
                "Already finalized".to_string()
            ));
        }

        // Process any remaining chunks
        if !self.old_buffer.lines.is_empty() || !self.new_buffer.lines.is_empty() {
            self.process_available_chunks()?;
        }

        self.state = StreamingState::Finalized;

        // Calculate final statistics
        let stats = self.calculate_stats();

        Ok(DiffResult {
            hunks: std::mem::take(&mut self.current_hunks),
            stats,
            file_language: self.options.language.clone(),
            is_binary: false,
            is_large_file: true, // Since we're using streaming
        })
    }

    /// Get intermediate results for progressive rendering
    pub fn get_intermediate_result(&self) -> DiffResult {
        DiffResult {
            hunks: self.current_hunks.clone(),
            stats: self.calculate_stats(),
            file_language: self.options.language.clone(),
            is_binary: false,
            is_large_file: true,
        }
    }

    /// Calculate statistics from current hunks
    fn calculate_stats(&self) -> DiffStats {
        let mut added_lines = 0;
        let mut removed_lines = 0;
        let mut modified_lines = 0;

        for hunk in &self.current_hunks {
            for change in &hunk.changes {
                match change.change_type {
                    ChangeType::Added => added_lines += 1,
                    ChangeType::Removed => removed_lines += 1,
                    ChangeType::Modified => modified_lines += 1,
                    ChangeType::Unchanged => {}
                }
            }
        }

        let total_lines = self.processed_old_lines.max(self.processed_new_lines);
        let total_changes = added_lines + removed_lines + modified_lines;
        let similarity = if total_lines > 0 {
            1.0 - (total_changes as f32 / total_lines as f32)
        } else {
            1.0
        };

        DiffStats {
            total_lines,
            added_lines,
            removed_lines,
            modified_lines,
            unchanged_lines: total_lines.saturating_sub(total_changes),
            similarity: similarity.max(0.0).min(1.0),
        }
    }
}

/// Async chunk processor for web workers
pub struct AsyncChunkProcessor {
    chunk_size: usize,
    pending_chunks: VecDeque<String>,
}

impl AsyncChunkProcessor {
    pub fn new(chunk_size: usize) -> Self {
        Self {
            chunk_size,
            pending_chunks: VecDeque::new(),
        }
    }

    pub fn add_chunk(&mut self, data: String) {
        self.pending_chunks.push_back(data);
    }

    pub fn get_next_chunk(&mut self) -> Option<String> {
        self.pending_chunks.pop_front()
    }

    pub fn has_chunks(&self) -> bool {
        !self.pending_chunks.is_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_line_buffer() {
        let mut buffer = LineBuffer::new(1024);
        
        buffer.add_chunk("line1\nline2\n").unwrap();
        assert_eq!(buffer.len(), 3); // Including empty line after last \n
        
        buffer.add_chunk("line3").unwrap();
        assert_eq!(buffer.len(), 3);
        
        buffer.add_chunk("\nline4\n").unwrap();
        assert_eq!(buffer.len(), 5);
    }

    #[test]
    fn test_streaming_diff_state() {
        let mut diff = StreamingDiff::new(DiffOptions::default());
        
        assert_eq!(diff.state, StreamingState::ReceivingOld);
        
        diff.add_old_chunk("old content\n").unwrap();
        diff.start_new_file().unwrap();
        
        assert_eq!(diff.state, StreamingState::ReceivingNew);
        
        diff.add_new_chunk("new content\n").unwrap();
        diff.finalize().unwrap();
        
        assert_eq!(diff.state, StreamingState::Finalized);
    }
}