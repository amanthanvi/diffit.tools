#![cfg_attr(feature = "wee_alloc", feature(global_allocator))]

use wasm_bindgen::prelude::*;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

pub mod diff;
pub mod myers;
pub mod semantic;
pub mod streaming;
pub mod syntax;
pub mod utils;
pub mod virtual_scroll;

use diff::{DiffOptions, DiffResult};
use streaming::StreamingDiff;

// Set panic hook for better error messages in wasm
#[wasm_bindgen(start)]
pub fn main() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

/// Main entry point for computing diffs
#[wasm_bindgen]
pub struct DiffEngine {
    options: DiffOptions,
}

#[wasm_bindgen]
impl DiffEngine {
    /// Create a new DiffEngine instance
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            options: DiffOptions::default(),
        }
    }

    /// Configure diff options
    #[wasm_bindgen(js_name = setOptions)]
    pub fn set_options(&mut self, options: JsValue) -> Result<(), JsValue> {
        let options: DiffOptions = serde_wasm_bindgen::from_value(options)?;
        self.options = options;
        Ok(())
    }

    /// Compute diff between two texts
    #[wasm_bindgen(js_name = computeDiff)]
    pub fn compute_diff(&self, old_text: &str, new_text: &str) -> Result<JsValue, JsValue> {
        let result = diff::compute_diff(old_text, new_text, &self.options)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        
        serde_wasm_bindgen::to_value(&result).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Create a streaming diff processor for large files
    #[wasm_bindgen(js_name = createStreamingDiff)]
    pub fn create_streaming_diff(&self) -> StreamingDiffProcessor {
        StreamingDiffProcessor::new(self.options.clone())
    }

    /// Get supported languages for syntax highlighting
    #[wasm_bindgen(js_name = getSupportedLanguages)]
    pub fn get_supported_languages(&self) -> Result<JsValue, JsValue> {
        let languages = syntax::get_supported_languages();
        serde_wasm_bindgen::to_value(&languages).map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

/// Streaming diff processor for handling large files
#[wasm_bindgen]
pub struct StreamingDiffProcessor {
    processor: StreamingDiff,
}

#[wasm_bindgen]
impl StreamingDiffProcessor {
    fn new(options: DiffOptions) -> Self {
        Self {
            processor: StreamingDiff::new(options),
        }
    }

    /// Process a chunk of the old file
    #[wasm_bindgen(js_name = addOldChunk)]
    pub fn add_old_chunk(&mut self, chunk: &str) -> Result<(), JsValue> {
        self.processor
            .add_old_chunk(chunk)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Process a chunk of the new file
    #[wasm_bindgen(js_name = addNewChunk)]
    pub fn add_new_chunk(&mut self, chunk: &str) -> Result<(), JsValue> {
        self.processor
            .add_new_chunk(chunk)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Finalize and get the diff result
    #[wasm_bindgen(js_name = finalize)]
    pub fn finalize(&mut self) -> Result<JsValue, JsValue> {
        let result = self.processor
            .finalize()
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        
        serde_wasm_bindgen::to_value(&result).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Get intermediate results for progressive rendering
    #[wasm_bindgen(js_name = getIntermediateResult)]
    pub fn get_intermediate_result(&self) -> Result<JsValue, JsValue> {
        let result = self.processor.get_intermediate_result();
        serde_wasm_bindgen::to_value(&result).map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

/// Virtual scroll manager for large diffs
#[wasm_bindgen]
pub struct VirtualScrollManager {
    manager: virtual_scroll::VirtualScroll,
}

#[wasm_bindgen]
impl VirtualScrollManager {
    /// Create a new virtual scroll manager
    #[wasm_bindgen(constructor)]
    pub fn new(total_lines: usize, viewport_height: usize) -> Self {
        Self {
            manager: virtual_scroll::VirtualScroll::new(total_lines, viewport_height),
        }
    }

    /// Update viewport position
    #[wasm_bindgen(js_name = updateViewport)]
    pub fn update_viewport(&mut self, scroll_top: f64, viewport_height: usize) -> Result<JsValue, JsValue> {
        let visible_range = self.manager.update_viewport(scroll_top, viewport_height);
        serde_wasm_bindgen::to_value(&visible_range).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Get visible line range
    #[wasm_bindgen(js_name = getVisibleRange)]
    pub fn get_visible_range(&self) -> Result<JsValue, JsValue> {
        let range = self.manager.get_visible_range();
        serde_wasm_bindgen::to_value(&range).map_err(|e| JsValue::from_str(&e.to_string()))
    }
}