use std::time::{Duration, Instant};
use wasm_bindgen::prelude::*;

/// Performance timer for measuring diff operations
pub struct PerformanceTimer {
    start: Instant,
    checkpoints: Vec<(String, Instant)>,
}

impl PerformanceTimer {
    /// Create a new performance timer
    pub fn new() -> Self {
        Self {
            start: Instant::now(),
            checkpoints: Vec::new(),
        }
    }

    /// Add a checkpoint with a label
    pub fn checkpoint(&mut self, label: &str) {
        self.checkpoints.push((label.to_string(), Instant::now()));
    }

    /// Get elapsed time since start
    pub fn elapsed(&self) -> Duration {
        self.start.elapsed()
    }

    /// Get duration between checkpoints
    pub fn checkpoint_duration(&self, from: &str, to: &str) -> Option<Duration> {
        let from_time = self.checkpoints.iter().find(|(label, _)| label == from)?.1;
        let to_time = self.checkpoints.iter().find(|(label, _)| label == to)?.1;
        Some(to_time.duration_since(from_time))
    }

    /// Get timing report
    pub fn report(&self) -> String {
        let mut report = format!("Total time: {:?}\n", self.elapsed());
        
        for (i, (label, time)) in self.checkpoints.iter().enumerate() {
            let duration = if i == 0 {
                time.duration_since(self.start)
            } else {
                time.duration_since(self.checkpoints[i - 1].1)
            };
            report.push_str(&format!("{}: {:?}\n", label, duration));
        }
        
        report
    }
}

/// Memory usage tracker
pub struct MemoryTracker {
    initial_usage: usize,
    peak_usage: usize,
    current_usage: usize,
}

impl MemoryTracker {
    /// Create a new memory tracker
    pub fn new() -> Self {
        Self {
            initial_usage: 0,
            peak_usage: 0,
            current_usage: 0,
        }
    }

    /// Update memory usage
    pub fn update(&mut self, usage: usize) {
        if self.initial_usage == 0 {
            self.initial_usage = usage;
        }
        self.current_usage = usage;
        if usage > self.peak_usage {
            self.peak_usage = usage;
        }
    }

    /// Get memory usage delta
    pub fn delta(&self) -> i64 {
        self.current_usage as i64 - self.initial_usage as i64
    }

    /// Get peak memory usage
    pub fn peak(&self) -> usize {
        self.peak_usage
    }
}

/// Text processing utilities
pub struct TextUtils;

impl TextUtils {
    /// Count lines in text efficiently
    pub fn count_lines(text: &str) -> usize {
        if text.is_empty() {
            return 0;
        }
        
        let mut count = 1;
        for byte in text.bytes() {
            if byte == b'\n' {
                count += 1;
            }
        }
        
        // Don't count final newline as an extra line
        if text.ends_with('\n') {
            count -= 1;
        }
        
        count
    }

    /// Split text into lines efficiently
    pub fn split_lines(text: &str) -> Vec<&str> {
        if text.is_empty() {
            return vec![];
        }
        
        text.lines().collect()
    }

    /// Normalize line endings
    pub fn normalize_line_endings(text: &str) -> String {
        text.replace("\r\n", "\n").replace('\r', "\n")
    }

    /// Check if text is likely binary
    pub fn is_binary(text: &[u8]) -> bool {
        // Check for null bytes or high percentage of non-printable characters
        let null_count = text.iter().filter(|&&b| b == 0).count();
        if null_count > 0 {
            return true;
        }

        let non_printable_count = text.iter()
            .filter(|&&b| b < 32 && b != 9 && b != 10 && b != 13) // Tab, LF, CR are OK
            .count();

        let threshold = text.len() / 20; // 5% threshold
        non_printable_count > threshold
    }

    /// Estimate memory usage for text
    pub fn estimate_memory_usage(text: &str) -> usize {
        // Base string size plus some overhead for metadata
        text.len() * 2 + 64
    }

    /// Check if two texts are similar (for optimization)
    pub fn are_similar(text1: &str, text2: &str, threshold: f32) -> bool {
        if text1 == text2 {
            return true;
        }

        let len1 = text1.len();
        let len2 = text2.len();
        
        if len1 == 0 || len2 == 0 {
            return false;
        }

        // Quick check based on length difference
        let length_ratio = (len1.min(len2) as f32) / (len1.max(len2) as f32);
        if length_ratio < threshold {
            return false;
        }

        // Sample-based similarity check for large texts
        if len1 > 10000 || len2 > 10000 {
            return Self::sample_similarity(text1, text2, threshold);
        }

        // Full comparison for smaller texts
        let distance = levenshtein_distance(text1, text2);
        let max_len = len1.max(len2);
        let similarity = 1.0 - (distance as f32 / max_len as f32);
        
        similarity >= threshold
    }

    /// Sample-based similarity check for large texts
    fn sample_similarity(text1: &str, text2: &str, threshold: f32) -> bool {
        let sample_size = 1000;
        let samples1 = Self::get_samples(text1, sample_size);
        let samples2 = Self::get_samples(text2, sample_size);
        
        let mut matches = 0;
        let total_samples = samples1.len().min(samples2.len());
        
        for (s1, s2) in samples1.iter().zip(samples2.iter()) {
            if s1 == s2 {
                matches += 1;
            }
        }
        
        if total_samples == 0 {
            return false;
        }
        
        let similarity = matches as f32 / total_samples as f32;
        similarity >= threshold
    }

    /// Get representative samples from text
    fn get_samples(text: &str, count: usize) -> Vec<&str> {
        let lines: Vec<&str> = text.lines().collect();
        if lines.len() <= count {
            return lines;
        }
        
        let step = lines.len() / count;
        lines.iter().step_by(step).copied().collect()
    }
}

/// Simple Levenshtein distance calculation
fn levenshtein_distance(s1: &str, s2: &str) -> usize {
    let len1 = s1.chars().count();
    let len2 = s2.chars().count();

    if len1 == 0 {
        return len2;
    }
    if len2 == 0 {
        return len1;
    }

    let mut prev_row: Vec<usize> = (0..=len2).collect();
    let mut curr_row = vec![0; len2 + 1];

    for (i, c1) in s1.chars().enumerate() {
        curr_row[0] = i + 1;
        for (j, c2) in s2.chars().enumerate() {
            let cost = if c1 == c2 { 0 } else { 1 };
            curr_row[j + 1] = (prev_row[j + 1] + 1)
                .min(curr_row[j] + 1)
                .min(prev_row[j] + cost);
        }
        std::mem::swap(&mut prev_row, &mut curr_row);
    }

    prev_row[len2]
}

/// WASM-specific utilities
#[wasm_bindgen]
pub struct WasmUtils;

#[wasm_bindgen]
impl WasmUtils {
    /// Log a message to the browser console
    #[wasm_bindgen(js_name = log)]
    pub fn log(message: &str) {
        web_sys::console::log_1(&message.into());
    }

    /// Log an error to the browser console
    #[wasm_bindgen(js_name = logError)]
    pub fn log_error(message: &str) {
        web_sys::console::error_1(&message.into());
    }

    /// Get current timestamp
    #[wasm_bindgen(js_name = now)]
    pub fn now() -> f64 {
        js_sys::Date::now()
    }

    /// Format bytes as human-readable string
    #[wasm_bindgen(js_name = formatBytes)]
    pub fn format_bytes(bytes: usize) -> String {
        const UNITS: &[&str] = &["B", "KB", "MB", "GB"];
        let mut size = bytes as f64;
        let mut unit_index = 0;

        while size >= 1024.0 && unit_index < UNITS.len() - 1 {
            size /= 1024.0;
            unit_index += 1;
        }

        if unit_index == 0 {
            format!("{} {}", size as usize, UNITS[unit_index])
        } else {
            format!("{:.1} {}", size, UNITS[unit_index])
        }
    }

    /// Calculate hash of a string
    #[wasm_bindgen(js_name = hash)]
    pub fn hash(text: &str) -> u32 {
        // Simple FNV-1a hash
        let mut hash: u32 = 2166136261;
        for byte in text.bytes() {
            hash ^= byte as u32;
            hash = hash.wrapping_mul(16777619);
        }
        hash
    }
}

/// Batch processor for handling operations in chunks
pub struct BatchProcessor<T> {
    items: Vec<T>,
    batch_size: usize,
    current_batch: usize,
}

impl<T> BatchProcessor<T> {
    /// Create a new batch processor
    pub fn new(items: Vec<T>, batch_size: usize) -> Self {
        Self {
            items,
            batch_size,
            current_batch: 0,
        }
    }

    /// Get next batch
    pub fn next_batch(&mut self) -> Option<&[T]> {
        let start = self.current_batch * self.batch_size;
        if start >= self.items.len() {
            return None;
        }

        let end = (start + self.batch_size).min(self.items.len());
        self.current_batch += 1;
        Some(&self.items[start..end])
    }

    /// Check if there are more batches
    pub fn has_more(&self) -> bool {
        self.current_batch * self.batch_size < self.items.len()
    }

    /// Get progress (0.0 to 1.0)
    pub fn progress(&self) -> f32 {
        if self.items.is_empty() {
            return 1.0;
        }
        
        let processed = (self.current_batch * self.batch_size).min(self.items.len());
        processed as f32 / self.items.len() as f32
    }
}

/// LRU Cache for caching diff results
pub struct LruCache<K, V> {
    capacity: usize,
    items: std::collections::HashMap<K, (V, usize)>,
    access_order: usize,
}

impl<K: std::hash::Hash + Eq + Clone, V> LruCache<K, V> {
    /// Create a new LRU cache
    pub fn new(capacity: usize) -> Self {
        Self {
            capacity,
            items: std::collections::HashMap::new(),
            access_order: 0,
        }
    }

    /// Get an item from the cache
    pub fn get(&mut self, key: &K) -> Option<&V> {
        if let Some((value, order)) = self.items.get_mut(key) {
            self.access_order += 1;
            *order = self.access_order;
            Some(value)
        } else {
            None
        }
    }

    /// Insert an item into the cache
    pub fn insert(&mut self, key: K, value: V) {
        if self.items.len() >= self.capacity {
            self.evict_lru();
        }

        self.access_order += 1;
        self.items.insert(key, (value, self.access_order));
    }

    /// Evict least recently used item
    fn evict_lru(&mut self) {
        if let Some((lru_key, _)) = self.items
            .iter()
            .min_by_key(|(_, (_, order))| *order)
            .map(|(k, _)| k.clone())
        {
            self.items.remove(&lru_key);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_performance_timer() {
        let mut timer = PerformanceTimer::new();
        timer.checkpoint("start");
        std::thread::sleep(std::time::Duration::from_millis(10));
        timer.checkpoint("middle");
        std::thread::sleep(std::time::Duration::from_millis(10));
        timer.checkpoint("end");

        assert!(timer.elapsed() >= std::time::Duration::from_millis(20));
        let report = timer.report();
        assert!(report.contains("start"));
        assert!(report.contains("middle"));
        assert!(report.contains("end"));
    }

    #[test]
    fn test_text_utils() {
        assert_eq!(TextUtils::count_lines("hello\nworld"), 2);
        assert_eq!(TextUtils::count_lines("hello\nworld\n"), 2);
        assert_eq!(TextUtils::count_lines("single line"), 1);
        assert_eq!(TextUtils::count_lines(""), 0);

        let normalized = TextUtils::normalize_line_endings("hello\r\nworld\rtest");
        assert_eq!(normalized, "hello\nworld\ntest");

        assert!(TextUtils::is_binary(&[0, 1, 2, 3]));
        assert!(!TextUtils::is_binary(b"hello world"));
    }

    #[test]
    fn test_batch_processor() {
        let items = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        let mut processor = BatchProcessor::new(items, 3);

        assert!(processor.has_more());
        assert_eq!(processor.progress(), 0.0);

        let batch1 = processor.next_batch().unwrap();
        assert_eq!(batch1, &[1, 2, 3]);

        let batch2 = processor.next_batch().unwrap();
        assert_eq!(batch2, &[4, 5, 6]);

        assert!(processor.progress() > 0.0 && processor.progress() < 1.0);
    }

    #[test]
    fn test_lru_cache() {
        let mut cache = LruCache::new(2);
        
        cache.insert("a", 1);
        cache.insert("b", 2);
        
        assert_eq!(cache.get(&"a"), Some(&1));
        assert_eq!(cache.get(&"b"), Some(&2));
        
        // This should evict "a" since "b" was accessed more recently
        cache.insert("c", 3);
        
        assert_eq!(cache.get(&"a"), None);
        assert_eq!(cache.get(&"b"), Some(&2));
        assert_eq!(cache.get(&"c"), Some(&3));
    }
}