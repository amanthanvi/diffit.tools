use serde::{Deserialize, Serialize};

/// Virtual scrolling manager for handling large diffs efficiently
pub struct VirtualScroll {
    total_lines: usize,
    viewport_height: usize,
    line_height: f64,
    buffer_size: usize,
    visible_range: VisibleRange,
}

/// Range of visible lines
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VisibleRange {
    pub start_index: usize,
    pub end_index: usize,
    pub offset_y: f64,
    pub total_height: f64,
}

/// Virtual scroll item for rendering
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VirtualItem {
    pub index: usize,
    pub offset_y: f64,
    pub height: f64,
}

impl VirtualScroll {
    /// Create a new virtual scroll manager
    pub fn new(total_lines: usize, viewport_height: usize) -> Self {
        Self {
            total_lines,
            viewport_height,
            line_height: 20.0, // Default line height in pixels
            buffer_size: 10,   // Number of extra lines to render for smooth scrolling
            visible_range: VisibleRange {
                start_index: 0,
                end_index: viewport_height.min(total_lines),
                offset_y: 0.0,
                total_height: total_lines as f64 * 20.0,
            },
        }
    }

    /// Update viewport position and return new visible range
    pub fn update_viewport(&mut self, scroll_top: f64, viewport_height: usize) -> VisibleRange {
        self.viewport_height = viewport_height;
        
        // Calculate visible line range
        let start_line = (scroll_top / self.line_height).floor() as usize;
        let visible_lines = (viewport_height as f64 / self.line_height).ceil() as usize;
        
        // Apply buffer for smooth scrolling
        let buffered_start = start_line.saturating_sub(self.buffer_size);
        let buffered_end = (start_line + visible_lines + self.buffer_size).min(self.total_lines);
        
        self.visible_range = VisibleRange {
            start_index: buffered_start,
            end_index: buffered_end,
            offset_y: buffered_start as f64 * self.line_height,
            total_height: self.total_lines as f64 * self.line_height,
        };

        self.visible_range.clone()
    }

    /// Get current visible range
    pub fn get_visible_range(&self) -> VisibleRange {
        self.visible_range.clone()
    }

    /// Set line height for accurate calculations
    pub fn set_line_height(&mut self, height: f64) {
        self.line_height = height;
        self.visible_range.total_height = self.total_lines as f64 * height;
    }

    /// Update total number of lines
    pub fn set_total_lines(&mut self, total_lines: usize) {
        self.total_lines = total_lines;
        self.visible_range.total_height = total_lines as f64 * self.line_height;
        
        // Adjust end index if necessary
        if self.visible_range.end_index > total_lines {
            self.visible_range.end_index = total_lines;
        }
    }

    /// Get virtual items for rendering
    pub fn get_virtual_items(&self) -> Vec<VirtualItem> {
        let mut items = Vec::new();
        
        for i in self.visible_range.start_index..self.visible_range.end_index {
            items.push(VirtualItem {
                index: i,
                offset_y: i as f64 * self.line_height,
                height: self.line_height,
            });
        }
        
        items
    }

    /// Calculate scroll position for a specific line
    pub fn scroll_to_line(&self, line_index: usize) -> f64 {
        if line_index >= self.total_lines {
            return self.visible_range.total_height;
        }
        
        line_index as f64 * self.line_height
    }

    /// Find line index at a specific scroll position
    pub fn line_at_position(&self, scroll_top: f64) -> usize {
        let line = (scroll_top / self.line_height).floor() as usize;
        line.min(self.total_lines.saturating_sub(1))
    }

    /// Calculate visible percentage of total content
    pub fn get_visible_percentage(&self) -> f32 {
        if self.total_lines == 0 {
            return 1.0;
        }
        
        let visible_lines = self.visible_range.end_index - self.visible_range.start_index;
        (visible_lines as f32 / self.total_lines as f32).min(1.0)
    }
}

/// Advanced virtual scroll with dynamic line heights
pub struct DynamicVirtualScroll {
    line_heights: Vec<f64>,
    viewport_height: usize,
    buffer_size: usize,
    cached_positions: Vec<f64>,
    visible_range: VisibleRange,
}

impl DynamicVirtualScroll {
    /// Create a new dynamic virtual scroll manager
    pub fn new(line_heights: Vec<f64>, viewport_height: usize) -> Self {
        let mut cached_positions = Vec::with_capacity(line_heights.len() + 1);
        cached_positions.push(0.0);
        
        // Pre-calculate cumulative positions
        let mut position = 0.0;
        for &height in &line_heights {
            position += height;
            cached_positions.push(position);
        }
        
        let total_height = cached_positions.last().copied().unwrap_or(0.0);
        
        Self {
            line_heights,
            viewport_height,
            buffer_size: 10,
            cached_positions,
            visible_range: VisibleRange {
                start_index: 0,
                end_index: viewport_height.min(line_heights.len()),
                offset_y: 0.0,
                total_height,
            },
        }
    }

    /// Update viewport and return visible range
    pub fn update_viewport(&mut self, scroll_top: f64, viewport_height: usize) -> VisibleRange {
        self.viewport_height = viewport_height;
        
        // Binary search to find start line
        let start_line = self.find_line_at_position(scroll_top);
        
        // Find end line by accumulating heights
        let mut end_line = start_line;
        let mut accumulated_height = 0.0;
        
        while end_line < self.line_heights.len() && accumulated_height < viewport_height as f64 {
            accumulated_height += self.line_heights[end_line];
            end_line += 1;
        }
        
        // Apply buffer
        let buffered_start = start_line.saturating_sub(self.buffer_size);
        let buffered_end = (end_line + self.buffer_size).min(self.line_heights.len());
        
        self.visible_range = VisibleRange {
            start_index: buffered_start,
            end_index: buffered_end,
            offset_y: self.cached_positions[buffered_start],
            total_height: self.visible_range.total_height,
        };

        self.visible_range.clone()
    }

    /// Find line index at a specific position using binary search
    fn find_line_at_position(&self, position: f64) -> usize {
        if self.cached_positions.is_empty() {
            return 0;
        }
        
        match self.cached_positions.binary_search_by(|&p| p.partial_cmp(&position).unwrap()) {
            Ok(index) => index,
            Err(index) => index.saturating_sub(1),
        }
    }

    /// Get virtual items with dynamic heights
    pub fn get_virtual_items(&self) -> Vec<VirtualItem> {
        let mut items = Vec::new();
        
        for i in self.visible_range.start_index..self.visible_range.end_index {
            if i < self.line_heights.len() {
                items.push(VirtualItem {
                    index: i,
                    offset_y: self.cached_positions[i],
                    height: self.line_heights[i],
                });
            }
        }
        
        items
    }

    /// Update line height for a specific line
    pub fn update_line_height(&mut self, line_index: usize, new_height: f64) {
        if line_index >= self.line_heights.len() {
            return;
        }
        
        let old_height = self.line_heights[line_index];
        let height_diff = new_height - old_height;
        
        // Update line height
        self.line_heights[line_index] = new_height;
        
        // Update cached positions for lines after this one
        for i in (line_index + 1)..self.cached_positions.len() {
            self.cached_positions[i] += height_diff;
        }
        
        // Update total height
        self.visible_range.total_height += height_diff;
    }
}

/// Chunked virtual scroll for extremely large datasets
pub struct ChunkedVirtualScroll {
    total_lines: usize,
    chunk_size: usize,
    line_height: f64,
    loaded_chunks: std::collections::HashMap<usize, Vec<f64>>,
    viewport_height: usize,
    visible_range: VisibleRange,
}

impl ChunkedVirtualScroll {
    /// Create a new chunked virtual scroll manager
    pub fn new(total_lines: usize, chunk_size: usize, viewport_height: usize) -> Self {
        Self {
            total_lines,
            chunk_size,
            line_height: 20.0,
            loaded_chunks: std::collections::HashMap::new(),
            viewport_height,
            visible_range: VisibleRange {
                start_index: 0,
                end_index: viewport_height.min(total_lines),
                offset_y: 0.0,
                total_height: total_lines as f64 * 20.0,
            },
        }
    }

    /// Load a chunk of line heights
    pub fn load_chunk(&mut self, chunk_index: usize, line_heights: Vec<f64>) {
        self.loaded_chunks.insert(chunk_index, line_heights);
    }

    /// Get chunk index for a line
    fn get_chunk_index(&self, line_index: usize) -> usize {
        line_index / self.chunk_size
    }

    /// Check if a chunk is loaded
    pub fn is_chunk_loaded(&self, chunk_index: usize) -> bool {
        self.loaded_chunks.contains_key(&chunk_index)
    }

    /// Get required chunks for a range
    pub fn get_required_chunks(&self, start_line: usize, end_line: usize) -> Vec<usize> {
        let start_chunk = self.get_chunk_index(start_line);
        let end_chunk = self.get_chunk_index(end_line);
        
        (start_chunk..=end_chunk).collect()
    }

    /// Update viewport for chunked scrolling
    pub fn update_viewport(&mut self, scroll_top: f64, viewport_height: usize) -> (VisibleRange, Vec<usize>) {
        self.viewport_height = viewport_height;
        
        let start_line = (scroll_top / self.line_height).floor() as usize;
        let visible_lines = (viewport_height as f64 / self.line_height).ceil() as usize;
        let end_line = (start_line + visible_lines).min(self.total_lines);
        
        self.visible_range = VisibleRange {
            start_index: start_line,
            end_index: end_line,
            offset_y: start_line as f64 * self.line_height,
            total_height: self.total_lines as f64 * self.line_height,
        };

        let required_chunks = self.get_required_chunks(start_line, end_line);
        let missing_chunks: Vec<usize> = required_chunks
            .iter()
            .filter(|&&chunk| !self.is_chunk_loaded(chunk))
            .copied()
            .collect();

        (self.visible_range.clone(), missing_chunks)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_virtual_scroll_basic() {
        let mut scroll = VirtualScroll::new(1000, 20);
        
        let range = scroll.update_viewport(100.0, 20);
        assert!(range.start_index <= 5); // 100/20 = 5
        assert!(range.end_index > range.start_index);
    }

    #[test]
    fn test_virtual_scroll_bounds() {
        let mut scroll = VirtualScroll::new(10, 20);
        
        // Scroll past end
        let range = scroll.update_viewport(1000.0, 20);
        assert!(range.end_index <= 10);
    }

    #[test]
    fn test_dynamic_virtual_scroll() {
        let heights = vec![20.0, 30.0, 25.0, 20.0, 40.0];
        let mut scroll = DynamicVirtualScroll::new(heights, 100);
        
        let items = scroll.get_virtual_items();
        assert_eq!(items.len(), 5);
        assert_eq!(items[0].height, 20.0);
        assert_eq!(items[1].height, 30.0);
    }

    #[test]
    fn test_chunked_virtual_scroll() {
        let scroll = ChunkedVirtualScroll::new(10000, 100, 20);
        
        let chunks = scroll.get_required_chunks(150, 250);
        assert_eq!(chunks, vec![1, 2]);
    }
}