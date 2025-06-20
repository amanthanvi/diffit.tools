use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
use diffit_diff_engine::diff::*;
use diffit_diff_engine::myers::*;
use diffit_diff_engine::streaming::*;
use std::fs;
use std::path::Path;

// Generate test data
fn generate_text_data(lines: usize, chars_per_line: usize) -> String {
    (0..lines)
        .map(|i| format!("Line {} with {} characters", i, "x".repeat(chars_per_line - 20)))
        .collect::<Vec<_>>()
        .join("\n")
}

fn generate_modified_text(original: &str, change_ratio: f32) -> String {
    let lines: Vec<&str> = original.lines().collect();
    let changes_count = (lines.len() as f32 * change_ratio) as usize;
    let mut modified_lines = lines.clone();
    
    for i in (0..changes_count).map(|x| x * lines.len() / changes_count) {
        if i < modified_lines.len() {
            modified_lines[i] = "MODIFIED LINE CONTENT";
        }
    }
    
    modified_lines.join("\n")
}

// Load real-world test files if available
fn load_test_file(name: &str) -> Option<String> {
    let path = Path::new("benches/testdata").join(name);
    fs::read_to_string(path).ok()
}

fn bench_myers_algorithm(c: &mut Criterion) {
    let mut group = c.benchmark_group("myers_algorithm");
    
    for size in [100, 500, 1000, 2000].iter() {
        let old_text = generate_text_data(*size, 50);
        let new_text = generate_modified_text(&old_text, 0.1); // 10% changes
        
        let old_lines: Vec<&str> = old_text.lines().collect();
        let new_lines: Vec<&str> = new_text.lines().collect();
        
        group.bench_with_input(
            BenchmarkId::new("myers_diff", size),
            size,
            |b, _| {
                b.iter(|| {
                    let myers = MyersDiff::new(black_box(&old_lines), black_box(&new_lines));
                    black_box(myers.compute_diff())
                })
            },
        );
    }
    
    group.finish();
}

fn bench_diff_computation(c: &mut Criterion) {
    let mut group = c.benchmark_group("diff_computation");
    
    let options = DiffOptions::default();
    
    for size in [100, 500, 1000, 2000].iter() {
        let old_text = generate_text_data(*size, 80);
        let new_text = generate_modified_text(&old_text, 0.15); // 15% changes
        
        group.bench_with_input(
            BenchmarkId::new("full_diff", size),
            size,
            |b, _| {
                b.iter(|| {
                    black_box(compute_diff(
                        black_box(&old_text),
                        black_box(&new_text),
                        black_box(&options),
                    ))
                })
            },
        );
    }
    
    group.finish();
}

fn bench_streaming_diff(c: &mut Criterion) {
    let mut group = c.benchmark_group("streaming_diff");
    
    let options = DiffOptions::default();
    
    for size in [1000, 5000, 10000].iter() {
        let old_text = generate_text_data(*size, 60);
        let new_text = generate_modified_text(&old_text, 0.2); // 20% changes
        
        group.bench_with_input(
            BenchmarkId::new("streaming", size),
            size,
            |b, _| {
                b.iter(|| {
                    let mut processor = StreamingDiff::new(options.clone());
                    
                    // Simulate chunked processing
                    let chunk_size = 100;
                    let old_lines: Vec<&str> = old_text.lines().collect();
                    let new_lines: Vec<&str> = new_text.lines().collect();
                    
                    // Add old chunks
                    for chunk in old_lines.chunks(chunk_size) {
                        let chunk_text = chunk.join("\n");
                        processor.add_old_chunk(&chunk_text).unwrap();
                    }
                    
                    processor.start_new_file().unwrap();
                    
                    // Add new chunks
                    for chunk in new_lines.chunks(chunk_size) {
                        let chunk_text = chunk.join("\n");
                        processor.add_new_chunk(&chunk_text).unwrap();
                    }
                    
                    black_box(processor.finalize())
                })
            },
        );
    }
    
    group.finish();
}

fn bench_syntax_highlighting(c: &mut Criterion) {
    use diffit_diff_engine::syntax::*;
    
    let mut group = c.benchmark_group("syntax_highlighting");
    
    let rust_code = r#"
    use std::collections::HashMap;
    
    #[derive(Debug, Clone)]
    pub struct MyStruct {
        field1: String,
        field2: i32,
    }
    
    impl MyStruct {
        pub fn new(field1: String, field2: i32) -> Self {
            Self { field1, field2 }
        }
        
        pub async fn process(&mut self) -> Result<(), Error> {
            println!("Processing: {}", self.field1);
            Ok(())
        }
    }
    "#;
    
    let highlighter = SyntaxHighlighter::new("rust").unwrap();
    
    group.bench_function("rust_highlighting", |b| {
        b.iter(|| {
            for line in rust_code.lines() {
                black_box(highlighter.highlight(black_box(line)));
            }
        })
    });
    
    group.finish();
}

fn bench_semantic_analysis(c: &mut Criterion) {
    use diffit_diff_engine::semantic::*;
    
    let mut group = c.benchmark_group("semantic_analysis");
    
    let code_lines = vec![
        "class DatabaseManager:",
        "    def __init__(self, connection_string):",
        "        self.connection = connect(connection_string)",
        "    def execute_query(self, query):",
        "        return self.connection.execute(query)",
        "    async def process_data(self, data):",
        "        results = []",
        "        for item in data:",
        "            result = await self.process_item(item)",
        "            results.append(result)",
        "        return results",
    ];
    
    let analyzer = SemanticAnalyzer::new(Some("python"));
    
    group.bench_function("python_semantic", |b| {
        b.iter(|| {
            for line in &code_lines {
                black_box(analyzer.extract_semantic_info(black_box(line), &code_lines));
            }
        })
    });
    
    group.finish();
}

fn bench_virtual_scrolling(c: &mut Criterion) {
    use diffit_diff_engine::virtual_scroll::*;
    
    let mut group = c.benchmark_group("virtual_scrolling");
    
    for total_lines in [10000, 50000, 100000].iter() {
        let mut scroll = VirtualScroll::new(*total_lines, 50);
        
        group.bench_with_input(
            BenchmarkId::new("viewport_update", total_lines),
            total_lines,
            |b, _| {
                b.iter(|| {
                    let scroll_top = (rand::random::<f64>() * (*total_lines as f64 * 20.0)).max(0.0);
                    black_box(scroll.update_viewport(black_box(scroll_top), 50))
                })
            },
        );
    }
    
    group.finish();
}

fn bench_memory_usage(c: &mut Criterion) {
    let mut group = c.benchmark_group("memory_usage");
    
    // Test memory efficiency with large texts
    for size in [10000, 25000, 50000].iter() {
        let text = generate_text_data(*size, 100);
        
        group.bench_with_input(
            BenchmarkId::new("large_text_processing", size),
            size,
            |b, _| {
                b.iter(|| {
                    let old_text = black_box(&text);
                    let new_text = black_box(&generate_modified_text(&text, 0.05));
                    let options = black_box(&DiffOptions::default());
                    
                    black_box(compute_diff(old_text, new_text, options))
                })
            },
        );
    }
    
    group.finish();
}

fn bench_real_world_files(c: &mut Criterion) {
    let mut group = c.benchmark_group("real_world_files");
    
    // Try to load real test files
    if let (Some(old_js), Some(new_js)) = (
        load_test_file("old_file.js"),
        load_test_file("new_file.js"),
    ) {
        let options = DiffOptions {
            language: Some("javascript".to_string()),
            syntax_highlight: true,
            semantic_diff: true,
            ..Default::default()
        };
        
        group.bench_function("javascript_file", |b| {
            b.iter(|| {
                black_box(compute_diff(
                    black_box(&old_js),
                    black_box(&new_js),
                    black_box(&options),
                ))
            })
        });
    }
    
    if let (Some(old_py), Some(new_py)) = (
        load_test_file("old_file.py"),
        load_test_file("new_file.py"),
    ) {
        let options = DiffOptions {
            language: Some("python".to_string()),
            syntax_highlight: true,
            semantic_diff: true,
            ..Default::default()
        };
        
        group.bench_function("python_file", |b| {
            b.iter(|| {
                black_box(compute_diff(
                    black_box(&old_py),
                    black_box(&new_py),
                    black_box(&options),
                ))
            })
        });
    }
    
    group.finish();
}

fn bench_worst_case_scenarios(c: &mut Criterion) {
    let mut group = c.benchmark_group("worst_case");
    
    // All lines different
    let old_text = generate_text_data(1000, 50);
    let new_text = (0..1000)
        .map(|i| format!("Completely different line {}", i))
        .collect::<Vec<_>>()
        .join("\n");
    
    let options = DiffOptions::default();
    
    group.bench_function("all_lines_different", |b| {
        b.iter(|| {
            black_box(compute_diff(
                black_box(&old_text),
                black_box(&new_text),
                black_box(&options),
            ))
        })
    });
    
    // Very long lines
    let long_line_old = "x".repeat(10000);
    let long_line_new = "y".repeat(10000);
    
    group.bench_function("very_long_lines", |b| {
        b.iter(|| {
            black_box(compute_diff(
                black_box(&long_line_old),
                black_box(&long_line_new),
                black_box(&options),
            ))
        })
    });
    
    group.finish();
}

criterion_group!(
    benches,
    bench_myers_algorithm,
    bench_diff_computation,
    bench_streaming_diff,
    bench_syntax_highlighting,
    bench_semantic_analysis,
    bench_virtual_scrolling,
    bench_memory_usage,
    bench_real_world_files,
    bench_worst_case_scenarios,
);

criterion_main!(benches);