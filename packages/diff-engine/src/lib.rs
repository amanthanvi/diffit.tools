use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json;

mod diff;
mod myers;
mod semantic;
mod syntax;
mod utils;
mod streaming;
mod virtual_scroll;

use diff::{DiffOptions, DiffResult, DiffStats, DiffHunk, DiffChange, ChangeType, compute_diff as compute_diff_internal};

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ComputeDiffRequest {
    pub left: String,
    pub right: String,
    pub options: Option<DiffOptions>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ComputeDiffResponse {
    pub hunks: Vec<DiffHunk>,
    pub insights: DiffInsights,
    pub error: Option<String>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiffInsights {
    pub additions: usize,
    pub deletions: usize,
    pub modifications: usize,
    pub similarity: f32,
    pub hunks: usize,
    pub change_intensity: Vec<f32>,
    pub semantic: Option<SemanticInsights>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SemanticInsights {
    pub functions_added: Vec<String>,
    pub functions_removed: Vec<String>,
    pub imports_changed: usize,
}

#[wasm_bindgen]
pub fn init() {
    console_error_panic_hook::set_once();
    console_log!("WASM Diff Engine initialized");
}

#[wasm_bindgen]
pub fn compute_diff(request_json: &str) -> String {
    let request: ComputeDiffRequest = match serde_json::from_str(request_json) {
        Ok(req) => req,
        Err(e) => {
            return serde_json::to_string(&ComputeDiffResponse {
                hunks: vec![],
                insights: DiffInsights {
                    additions: 0,
                    deletions: 0,
                    modifications: 0,
                    similarity: 0.0,
                    hunks: 0,
                    change_intensity: vec![],
                    semantic: None,
                },
                error: Some(format!("Failed to parse request: {}", e)),
            }).unwrap_or_else(|_| r#"{"error":"Failed to serialize error response"}"#.to_string());
        }
    };

    let options = request.options.unwrap_or_default();
    
    match compute_diff_internal(&request.left, &request.right, &options) {
        Ok(result) => {
            let insights = calculate_insights(&result);
            let response = ComputeDiffResponse {
                hunks: result.hunks,
                insights,
                error: None,
            };
            serde_json::to_string(&response)
                .unwrap_or_else(|e| format!(r#"{{"error":"Failed to serialize response: {}"}}"#, e))
        }
        Err(e) => {
            serde_json::to_string(&ComputeDiffResponse {
                hunks: vec![],
                insights: DiffInsights {
                    additions: 0,
                    deletions: 0,
                    modifications: 0,
                    similarity: 0.0,
                    hunks: 0,
                    change_intensity: vec![],
                    semantic: None,
                },
                error: Some(format!("Diff computation failed: {}", e)),
            }).unwrap_or_else(|_| r#"{"error":"Failed to serialize error response"}"#.to_string())
        }
    }
}

fn calculate_insights(result: &DiffResult) -> DiffInsights {
    let mut additions = 0;
    let mut deletions = 0;
    let mut modifications = 0;
    let mut change_intensity = Vec::new();

    for hunk in &result.hunks {
        let mut hunk_adds = 0;
        let mut hunk_dels = 0;
        
        for change in &hunk.changes {
            match change.change_type {
                ChangeType::Added => {
                    additions += 1;
                    hunk_adds += 1;
                }
                ChangeType::Removed => {
                    deletions += 1;
                    hunk_dels += 1;
                }
                ChangeType::Modified => {
                    modifications += 1;
                    hunk_adds += 1;
                    hunk_dels += 1;
                }
                ChangeType::Unchanged => {}
            }
        }
        
        let total_changes = hunk_adds + hunk_dels;
        let total_lines = hunk.changes.len() as f32;
        if total_lines > 0.0 {
            change_intensity.push(total_changes as f32 / total_lines);
        }
    }

    DiffInsights {
        additions,
        deletions,
        modifications,
        similarity: result.stats.similarity,
        hunks: result.hunks.len(),
        change_intensity,
        semantic: None, // TODO: Implement semantic insights extraction
    }
}

// Simple diff computation for fallback (when the main engine fails)
#[wasm_bindgen]
pub fn simple_diff(left: &str, right: &str) -> String {
    let left_lines: Vec<&str> = left.lines().collect();
    let right_lines: Vec<&str> = right.lines().collect();
    
    let mut hunks = Vec::new();
    let mut changes = Vec::new();
    let mut in_hunk = false;
    let mut hunk_start_old = 0;
    let mut hunk_start_new = 0;
    
    let max_len = left_lines.len().max(right_lines.len());
    
    for i in 0..max_len {
        let change = if i < left_lines.len() && i < right_lines.len() {
            if left_lines[i] == right_lines[i] {
                DiffChange {
                    change_type: ChangeType::Unchanged,
                    old_line_number: Some(i + 1),
                    new_line_number: Some(i + 1),
                    content: left_lines[i].to_string(),
                    tokens: None,
                    semantic_info: None,
                }
            } else {
                if !in_hunk {
                    in_hunk = true;
                    hunk_start_old = i;
                    hunk_start_new = i;
                }
                DiffChange {
                    change_type: ChangeType::Modified,
                    old_line_number: Some(i + 1),
                    new_line_number: Some(i + 1),
                    content: format!("-{}\n+{}", left_lines[i], right_lines[i]),
                    tokens: None,
                    semantic_info: None,
                }
            }
        } else if i < left_lines.len() {
            if !in_hunk {
                in_hunk = true;
                hunk_start_old = i;
                hunk_start_new = right_lines.len();
            }
            DiffChange {
                change_type: ChangeType::Removed,
                old_line_number: Some(i + 1),
                new_line_number: None,
                content: left_lines[i].to_string(),
                tokens: None,
                semantic_info: None,
            }
        } else {
            if !in_hunk {
                in_hunk = true;
                hunk_start_old = left_lines.len();
                hunk_start_new = i;
            }
            DiffChange {
                change_type: ChangeType::Added,
                old_line_number: None,
                new_line_number: Some(i + 1),
                content: right_lines[i].to_string(),
                tokens: None,
                semantic_info: None,
            }
        };
        
        changes.push(change);
        
        // Close hunk if we hit unchanged line or end
        if in_hunk && (i + 1 >= max_len || (i < left_lines.len() && i < right_lines.len() && left_lines[i] == right_lines[i])) {
            hunks.push(DiffHunk {
                old_start: hunk_start_old + 1,
                old_lines: i - hunk_start_old + 1,
                new_start: hunk_start_new + 1,
                new_lines: i - hunk_start_new + 1,
                changes: changes.clone(),
                header: format!("@@ -{},{} +{},{} @@", 
                    hunk_start_old + 1, i - hunk_start_old + 1,
                    hunk_start_new + 1, i - hunk_start_new + 1),
            });
            changes.clear();
            in_hunk = false;
        }
    }
    
    let response = ComputeDiffResponse {
        hunks,
        insights: DiffInsights {
            additions: 0,
            deletions: 0,
            modifications: 0,
            similarity: 0.0,
            hunks: hunks.len(),
            change_intensity: vec![],
            semantic: None,
        },
        error: None,
    };
    
    serde_json::to_string(&response)
        .unwrap_or_else(|_| r#"{"error":"Failed to serialize response"}"#.to_string())
}