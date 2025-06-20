use diffit_diff_engine::*;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
fn test_diff_engine_creation() {
    let engine = DiffEngine::new();
    assert!(!engine.is_undefined());
}

#[wasm_bindgen_test]
fn test_basic_diff() {
    let engine = DiffEngine::new();
    let old_text = "line1\nline2\nline3";
    let new_text = "line1\nmodified\nline3";
    
    let result = engine.compute_diff(old_text, new_text);
    assert!(result.is_ok());
    
    let diff_result = result.unwrap();
    assert!(!diff_result.is_undefined());
}

#[wasm_bindgen_test]
fn test_streaming_diff() {
    let engine = DiffEngine::new();
    let mut processor = engine.create_streaming_diff();
    
    processor.add_old_chunk("chunk1\n").unwrap();
    processor.add_old_chunk("chunk2\n").unwrap();
    processor.add_new_chunk("chunk1\n").unwrap();
    processor.add_new_chunk("modified\n").unwrap();
    
    let result = processor.finalize();
    assert!(result.is_ok());
}

#[wasm_bindgen_test]
fn test_virtual_scroll_manager() {
    let mut manager = VirtualScrollManager::new(1000, 20);
    let range = manager.update_viewport(100.0, 25);
    
    assert!(range.is_ok());
    let visible_range = range.unwrap();
    assert!(!visible_range.is_undefined());
}

#[wasm_bindgen_test]
fn test_supported_languages() {
    let engine = DiffEngine::new();
    let languages = engine.get_supported_languages();
    
    assert!(languages.is_ok());
    let lang_list = languages.unwrap();
    assert!(!lang_list.is_undefined());
}

#[cfg(test)]
mod native_tests {
    use super::*;
    use diffit_diff_engine::diff::*;
    use diffit_diff_engine::myers::*;
    use diffit_diff_engine::streaming::*;
    use diffit_diff_engine::virtual_scroll::*;

    #[test]
    fn test_myers_algorithm() {
        let old_lines = vec!["a", "b", "c"];
        let new_lines = vec!["a", "x", "c"];
        
        let myers = MyersDiff::new(&old_lines, &new_lines);
        let changes = myers.compute_diff();
        
        assert!(!changes.is_empty());
        assert!(changes.iter().any(|(t, _, _)| *t == ChangeType::Modified || *t == ChangeType::Removed || *t == ChangeType::Added));
    }

    #[test]
    fn test_diff_options() {
        let options = DiffOptions {
            algorithm: DiffAlgorithm::Myers,
            context_lines: 5,
            ignore_whitespace: true,
            ignore_case: false,
            semantic_diff: true,
            syntax_highlight: false,
            language: Some("rust".to_string()),
            word_diff: false,
            line_numbers: true,
            max_file_size: 1024 * 1024,
        };
        
        let old_text = "  Hello World  ";
        let new_text = "  hello world  ";
        
        let result = compute_diff(old_text, new_text, &options);
        assert!(result.is_ok());
        
        let diff_result = result.unwrap();
        assert!(!diff_result.hunks.is_empty());
    }

    #[test]
    fn test_streaming_diff_processor() {
        let options = DiffOptions::default();
        let mut processor = StreamingDiff::new(options);
        
        processor.add_old_chunk("old content\n").unwrap();
        processor.start_new_file().unwrap();
        processor.add_new_chunk("new content\n").unwrap();
        
        let result = processor.finalize();
        assert!(result.is_ok());
        
        let diff_result = result.unwrap();
        assert!(!diff_result.hunks.is_empty());
    }

    #[test]
    fn test_virtual_scroll() {
        let mut scroll = VirtualScroll::new(1000, 20);
        
        let range = scroll.update_viewport(0.0, 20);
        assert_eq!(range.start_index, 0);
        assert!(range.end_index > 0);
        
        let range = scroll.update_viewport(200.0, 20);
        assert!(range.start_index > 0);
    }

    #[test]
    fn test_large_diff() {
        let old_lines: Vec<String> = (0..10000).map(|i| format!("line {}", i)).collect();
        let mut new_lines = old_lines.clone();
        new_lines[5000] = "modified line 5000".to_string();
        
        let old_text = old_lines.join("\n");
        let new_text = new_lines.join("\n");
        
        let options = DiffOptions::default();
        let result = compute_diff(&old_text, &new_text, &options);
        
        assert!(result.is_ok());
        let diff_result = result.unwrap();
        assert!(!diff_result.hunks.is_empty());
        assert!(diff_result.stats.total_lines > 9000);
    }

    #[test]
    fn test_binary_detection() {
        let binary_data = vec![0u8, 1, 2, 3, 255, 254];
        let text_data = b"Hello, world!";
        
        assert!(crate::diff::is_binary(&String::from_utf8_lossy(&binary_data)));
        assert!(!crate::diff::is_binary(&String::from_utf8_lossy(text_data)));
    }

    #[test]
    fn test_syntax_highlighting() {
        use diffit_diff_engine::syntax::*;
        
        let highlighter = SyntaxHighlighter::new("rust");
        assert!(highlighter.is_ok());
        
        let highlighter = highlighter.unwrap();
        let tokens = highlighter.highlight("fn main() { println!(\"Hello\"); }");
        
        assert!(!tokens.is_empty());
        assert!(tokens.iter().any(|t| t.token_type == "keyword"));
    }

    #[test]
    fn test_semantic_analysis() {
        use diffit_diff_engine::semantic::*;
        
        let analyzer = SemanticAnalyzer::new(Some("rust"));
        let info = analyzer.extract_semantic_info("pub fn test() {", &[]);
        
        assert!(info.is_some());
        let info = info.unwrap();
        assert_eq!(info.entity_type, "function");
        assert_eq!(info.entity_name, Some("test".to_string()));
    }

    #[test]
    fn test_performance() {
        use std::time::Instant;
        
        let old_text = "a\n".repeat(1000);
        let new_text = "b\n".repeat(1000);
        
        let start = Instant::now();
        let options = DiffOptions::default();
        let result = compute_diff(&old_text, &new_text, &options);
        let duration = start.elapsed();
        
        assert!(result.is_ok());
        assert!(duration.as_millis() < 1000); // Should complete in under 1 second
    }

    #[test]
    fn test_memory_usage() {
        use diffit_diff_engine::utils::*;
        
        let text = "Hello, world!";
        let usage = TextUtils::estimate_memory_usage(text);
        
        assert!(usage > text.len());
        assert!(usage < text.len() * 10); // Reasonable overhead
    }
}