use serde::{Deserialize, Serialize};
use std::error::Error;
use std::fmt;

use crate::myers::MyersDiff;
use crate::semantic::SemanticAnalyzer;
use crate::syntax::SyntaxHighlighter;

/// Type of diff algorithm to use
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum DiffAlgorithm {
    Myers,
    Patience,
    Histogram,
}

/// Options for computing diffs
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiffOptions {
    pub algorithm: DiffAlgorithm,
    pub context_lines: usize,
    pub ignore_whitespace: bool,
    pub ignore_case: bool,
    pub semantic_diff: bool,
    pub syntax_highlight: bool,
    pub language: Option<String>,
    pub word_diff: bool,
    pub line_numbers: bool,
    pub max_file_size: usize,
}

impl Default for DiffOptions {
    fn default() -> Self {
        Self {
            algorithm: DiffAlgorithm::Myers,
            context_lines: 3,
            ignore_whitespace: false,
            ignore_case: false,
            semantic_diff: true,
            syntax_highlight: true,
            language: None,
            word_diff: false,
            line_numbers: true,
            max_file_size: 10 * 1024 * 1024, // 10MB
        }
    }
}

/// Type of change in a diff
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ChangeType {
    Added,
    Removed,
    Modified,
    Unchanged,
}

/// A single change in the diff
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiffChange {
    pub change_type: ChangeType,
    pub old_line_number: Option<usize>,
    pub new_line_number: Option<usize>,
    pub content: String,
    pub tokens: Option<Vec<SyntaxToken>>,
    pub semantic_info: Option<SemanticInfo>,
}

/// Syntax highlighting token
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyntaxToken {
    pub start: usize,
    pub end: usize,
    pub token_type: String,
    pub class_name: String,
}

/// Semantic information about a change
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SemanticInfo {
    pub entity_type: String,
    pub entity_name: Option<String>,
    pub scope: Option<String>,
    pub importance: f32,
}

/// A hunk in the diff
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiffHunk {
    pub old_start: usize,
    pub old_lines: usize,
    pub new_start: usize,
    pub new_lines: usize,
    pub changes: Vec<DiffChange>,
    pub header: String,
}

/// Result of a diff computation
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiffResult {
    pub hunks: Vec<DiffHunk>,
    pub stats: DiffStats,
    pub file_language: Option<String>,
    pub is_binary: bool,
    pub is_large_file: bool,
}

/// Statistics about the diff
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiffStats {
    pub total_lines: usize,
    pub added_lines: usize,
    pub removed_lines: usize,
    pub modified_lines: usize,
    pub unchanged_lines: usize,
    pub similarity: f32,
}

/// Custom error type for diff operations
#[derive(Debug)]
pub enum DiffError {
    FileTooLarge,
    InvalidEncoding,
    AlgorithmError(String),
    SyntaxError(String),
}

impl fmt::Display for DiffError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DiffError::FileTooLarge => write!(f, "File is too large to process"),
            DiffError::InvalidEncoding => write!(f, "Invalid text encoding"),
            DiffError::AlgorithmError(msg) => write!(f, "Diff algorithm error: {}", msg),
            DiffError::SyntaxError(msg) => write!(f, "Syntax highlighting error: {}", msg),
        }
    }
}

impl Error for DiffError {}

/// Compute diff between two texts
pub fn compute_diff(
    old_text: &str,
    new_text: &str,
    options: &DiffOptions,
) -> Result<DiffResult, DiffError> {
    // Check file size limits
    if old_text.len() > options.max_file_size || new_text.len() > options.max_file_size {
        return Err(DiffError::FileTooLarge);
    }

    // Preprocess text based on options
    let (processed_old, processed_new) = preprocess_text(old_text, new_text, options);

    // Split into lines
    let old_lines: Vec<&str> = processed_old.lines().collect();
    let new_lines: Vec<&str> = processed_new.lines().collect();

    // Compute raw diff using selected algorithm
    let raw_changes = match options.algorithm {
        DiffAlgorithm::Myers => {
            let myers = MyersDiff::new(&old_lines, &new_lines);
            myers.compute_diff()
        }
        DiffAlgorithm::Patience => {
            // For now, fallback to Myers
            let myers = MyersDiff::new(&old_lines, &new_lines);
            myers.compute_diff()
        }
        DiffAlgorithm::Histogram => {
            // For now, fallback to Myers
            let myers = MyersDiff::new(&old_lines, &new_lines);
            myers.compute_diff()
        }
    };

    // Apply semantic analysis if enabled
    let changes = if options.semantic_diff {
        let analyzer = SemanticAnalyzer::new(options.language.as_deref());
        analyzer.analyze_changes(raw_changes, &old_lines, &new_lines)
    } else {
        raw_changes
    };

    // Group changes into hunks
    let hunks = create_hunks(changes, &old_lines, &new_lines, options)?;

    // Apply syntax highlighting if enabled
    let highlighted_hunks = if options.syntax_highlight {
        apply_syntax_highlighting(hunks, options.language.as_deref())?
    } else {
        hunks
    };

    // Calculate statistics
    let stats = calculate_stats(&highlighted_hunks, old_lines.len(), new_lines.len());

    Ok(DiffResult {
        hunks: highlighted_hunks,
        stats,
        file_language: detect_language(old_text, new_text, options.language.as_deref()),
        is_binary: is_binary(old_text) || is_binary(new_text),
        is_large_file: old_text.len() > 1024 * 1024 || new_text.len() > 1024 * 1024,
    })
}

/// Preprocess text based on diff options
fn preprocess_text(old_text: &str, new_text: &str, options: &DiffOptions) -> (String, String) {
    let mut old = old_text.to_string();
    let mut new = new_text.to_string();

    if options.ignore_whitespace {
        old = normalize_whitespace(&old);
        new = normalize_whitespace(&new);
    }

    if options.ignore_case {
        old = old.to_lowercase();
        new = new.to_lowercase();
    }

    (old, new)
}

/// Normalize whitespace in text
fn normalize_whitespace(text: &str) -> String {
    text.lines()
        .map(|line| line.trim())
        .filter(|line| !line.is_empty())
        .collect::<Vec<_>>()
        .join("\n")
}

/// Create hunks from raw changes
fn create_hunks(
    changes: Vec<(ChangeType, usize, usize)>,
    old_lines: &[&str],
    new_lines: &[&str],
    options: &DiffOptions,
) -> Result<Vec<DiffHunk>, DiffError> {
    let mut hunks = Vec::new();
    let mut current_hunk: Option<DiffHunk> = None;
    let mut last_change_idx = 0;

    for (i, &(change_type, old_idx, new_idx)) in changes.iter().enumerate() {
        let should_start_new_hunk = current_hunk.is_none()
            || (change_type == ChangeType::Unchanged
                && i - last_change_idx > options.context_lines * 2);

        if should_start_new_hunk && current_hunk.is_some() {
            hunks.push(current_hunk.take().unwrap());
        }

        if change_type != ChangeType::Unchanged {
            last_change_idx = i;

            if current_hunk.is_none() {
                current_hunk = Some(create_new_hunk(old_idx, new_idx, options.context_lines));
            }

            let hunk = current_hunk.as_mut().unwrap();
            let content = match change_type {
                ChangeType::Removed => old_lines.get(old_idx).copied().unwrap_or(""),
                ChangeType::Added => new_lines.get(new_idx).copied().unwrap_or(""),
                _ => "",
            };

            hunk.changes.push(DiffChange {
                change_type,
                old_line_number: if change_type != ChangeType::Added {
                    Some(old_idx + 1)
                } else {
                    None
                },
                new_line_number: if change_type != ChangeType::Removed {
                    Some(new_idx + 1)
                } else {
                    None
                },
                content: content.to_string(),
                tokens: None,
                semantic_info: None,
            });
        }
    }

    if let Some(hunk) = current_hunk {
        hunks.push(hunk);
    }

    Ok(hunks)
}

/// Create a new hunk
fn create_new_hunk(old_start: usize, new_start: usize, context_lines: usize) -> DiffHunk {
    let start = old_start.saturating_sub(context_lines);
    DiffHunk {
        old_start: start + 1,
        old_lines: 0,
        new_start: new_start.saturating_sub(context_lines) + 1,
        new_lines: 0,
        changes: Vec::new(),
        header: format!("@@ -{},{} +{},{} @@", start + 1, 0, new_start + 1, 0),
    }
}

/// Apply syntax highlighting to hunks
fn apply_syntax_highlighting(
    mut hunks: Vec<DiffHunk>,
    language: Option<&str>,
) -> Result<Vec<DiffHunk>, DiffError> {
    if let Some(lang) = language {
        let highlighter = SyntaxHighlighter::new(lang)
            .map_err(|e| DiffError::SyntaxError(e.to_string()))?;

        for hunk in &mut hunks {
            for change in &mut hunk.changes {
                if !change.content.is_empty() {
                    change.tokens = Some(highlighter.highlight(&change.content));
                }
            }
        }
    }

    Ok(hunks)
}

/// Calculate diff statistics
fn calculate_stats(hunks: &[DiffHunk], old_total: usize, new_total: usize) -> DiffStats {
    let mut added_lines = 0;
    let mut removed_lines = 0;
    let mut modified_lines = 0;

    for hunk in hunks {
        for change in &hunk.changes {
            match change.change_type {
                ChangeType::Added => added_lines += 1,
                ChangeType::Removed => removed_lines += 1,
                ChangeType::Modified => modified_lines += 1,
                ChangeType::Unchanged => {}
            }
        }
    }

    let total_changes = added_lines + removed_lines + modified_lines;
    let total_lines = old_total.max(new_total);
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

/// Detect language from file content
fn detect_language(old_text: &str, new_text: &str, hint: Option<&str>) -> Option<String> {
    if let Some(lang) = hint {
        return Some(lang.to_string());
    }

    // Simple language detection based on content patterns
    let content = if !new_text.is_empty() { new_text } else { old_text };

    if content.contains("fn ") && content.contains("let ") {
        Some("rust".to_string())
    } else if content.contains("function") || content.contains("const ") {
        Some("javascript".to_string())
    } else if content.contains("def ") && content.contains("import ") {
        Some("python".to_string())
    } else {
        None
    }
}

/// Check if content is binary
fn is_binary(text: &str) -> bool {
    text.bytes().any(|b| b == 0)
}