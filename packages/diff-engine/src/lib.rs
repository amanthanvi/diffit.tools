use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct DiffEngine {
    left: String,
    right: String,
}

#[wasm_bindgen]
impl DiffEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            left: String::new(),
            right: String::new(),
        }
    }

    pub fn set_left(&mut self, text: &str) {
        self.left = text.to_string();
    }

    pub fn set_right(&mut self, text: &str) {
        self.right = text.to_string();
    }

    pub fn compute_diff(&self) -> String {
        // Simple line-by-line diff
        let left_lines: Vec<&str> = self.left.lines().collect();
        let right_lines: Vec<&str> = self.right.lines().collect();
        
        let mut result = String::new();
        let max_len = left_lines.len().max(right_lines.len());
        
        for i in 0..max_len {
            if i < left_lines.len() && i < right_lines.len() {
                if left_lines[i] == right_lines[i] {
                    result.push_str(&format!("  {}\n", left_lines[i]));
                } else {
                    result.push_str(&format!("- {}\n", left_lines[i]));
                    result.push_str(&format!("+ {}\n", right_lines[i]));
                }
            } else if i < left_lines.len() {
                result.push_str(&format!("- {}\n", left_lines[i]));
            } else {
                result.push_str(&format!("+ {}\n", right_lines[i]));
            }
        }
        
        result
    }
}

#[wasm_bindgen]
pub fn init() {
    // Initialize
}