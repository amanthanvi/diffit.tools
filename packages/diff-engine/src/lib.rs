use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use wasm_bindgen::JsValue;

mod diff;
mod myers;
mod semantic;
mod streaming;
mod syntax;
mod utils;
mod virtual_scroll;

use myers::MyersDiff;
use diff::ChangeType;

#[wasm_bindgen]
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum Algorithm {
    Myers,
    Patience,
    Histogram,
}

#[wasm_bindgen]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffOptions {
    pub algorithm: Algorithm,
    pub ignore_whitespace: bool,
    pub ignore_case: bool,
    pub context_lines: usize,
    pub detect_moves: bool,
}

#[wasm_bindgen]
impl DiffOptions {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            algorithm: Algorithm::Myers,
            ignore_whitespace: false,
            ignore_case: false,
            context_lines: 3,
            detect_moves: false,
        }
    }
}

#[wasm_bindgen]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffHunk {
    pub old_start: usize,
    pub old_lines: usize,
    pub new_start: usize,
    pub new_lines: usize,
}

#[wasm_bindgen]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffLine {
    pub change_type: String,
    pub content: String,
    pub old_line_number: Option<usize>,
    pub new_line_number: Option<usize>,
}

#[wasm_bindgen]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffResult {
    pub hunks: Vec<DiffHunk>,
    pub lines: Vec<DiffLine>,
    pub additions: usize,
    pub deletions: usize,
    pub modifications: usize,
    pub similarity: f32,
}

#[wasm_bindgen]
pub struct DiffEngine {
    options: DiffOptions,
}

#[wasm_bindgen]
impl DiffEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            options: DiffOptions::new(),
        }
    }

    pub fn set_options(&mut self, options: JsValue) {
        if let Ok(opts) = options.into_serde::<DiffOptions>() {
            self.options = opts;
        }
    }

    pub fn compute_diff(&self, left: &str, right: &str) -> JsValue {
        let processed_left = self.preprocess_text(left);
        let processed_right = self.preprocess_text(right);
        
        let left_lines: Vec<&str> = processed_left.lines().collect();
        let right_lines: Vec<&str> = processed_right.lines().collect();
        
        // Use selected algorithm
        let changes = match self.options.algorithm {
            Algorithm::Myers => {
                let diff = MyersDiff::new(&left_lines, &right_lines);
                diff.compute_diff()
            },
            Algorithm::Patience => {
                // Fallback to Myers for now, Patience to be implemented
                let diff = MyersDiff::new(&left_lines, &right_lines);
                diff.compute_diff()
            },
            Algorithm::Histogram => {
                // Fallback to Myers for now, Histogram to be implemented
                let diff = MyersDiff::new(&left_lines, &right_lines);
                diff.compute_diff()
            },
        };
        
        // Convert to DiffResult
        let result = self.build_diff_result(&left_lines, &right_lines, changes);
        
        JsValue::from_serde(&result).unwrap_or(JsValue::NULL)
    }
    
    fn preprocess_text(&self, text: &str) -> String {
        let mut result = text.to_string();
        
        if self.options.ignore_whitespace {
            result = result.lines()
                .map(|line| line.trim())
                .collect::<Vec<_>>()
                .join("\n");
        }
        
        if self.options.ignore_case {
            result = result.to_lowercase();
        }
        
        result
    }
    
    fn build_diff_result(
        &self,
        left_lines: &[&str],
        right_lines: &[&str],
        changes: Vec<(ChangeType, usize, usize)>
    ) -> DiffResult {
        let mut lines = Vec::new();
        let mut additions = 0;
        let mut deletions = 0;
        let mut modifications = 0;
        
        for (change_type, old_idx, new_idx) in changes {
            let (change_str, old_line, new_line, content) = match change_type {
                ChangeType::Added => {
                    additions += 1;
                    ("added", None, Some(new_idx + 1), right_lines.get(new_idx).unwrap_or(&"").to_string())
                },
                ChangeType::Removed => {
                    deletions += 1;
                    ("removed", Some(old_idx + 1), None, left_lines.get(old_idx).unwrap_or(&"").to_string())
                },
                ChangeType::Modified => {
                    modifications += 1;
                    ("modified", Some(old_idx + 1), Some(new_idx + 1), 
                     format!("{} -> {}", 
                        left_lines.get(old_idx).unwrap_or(&""),
                        right_lines.get(new_idx).unwrap_or(&"")))
                },
                ChangeType::Unchanged => {
                    ("unchanged", Some(old_idx + 1), Some(new_idx + 1),
                     left_lines.get(old_idx).unwrap_or(&"").to_string())
                },
            };
            
            lines.push(DiffLine {
                change_type: change_str.to_string(),
                content,
                old_line_number: old_line,
                new_line_number: new_line,
            });
        }
        
        let total_lines = left_lines.len().max(right_lines.len()) as f32;
        let changed_lines = (additions + deletions + modifications) as f32;
        let similarity = if total_lines > 0.0 {
            ((total_lines - changed_lines) / total_lines * 100.0).max(0.0)
        } else {
            100.0
        };
        
        DiffResult {
            hunks: vec![], // Hunks to be computed separately
            lines,
            additions,
            deletions,
            modifications,
            similarity,
        }
    }
}

#[wasm_bindgen]
pub fn init() {
    // Set panic hook for better error messages
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}