use once_cell::sync::Lazy;
use regex::Regex;
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct SyntaxRule {
    pub regex: Regex,
    pub token_type: String,
    pub class_name: String,
    pub priority: u8,
}

#[derive(Debug, Clone)]
pub struct SyntaxHighlighter {
    rules: Vec<SyntaxRule>,
}

// Simplified language definitions
static LANGUAGE_DEFINITIONS: Lazy<HashMap<String, Vec<SyntaxRule>>> = Lazy::new(|| {
    let mut languages = HashMap::new();

    // JavaScript
    languages.insert(
        "javascript".to_string(),
        vec![
            SyntaxRule {
                regex: Regex::new(r"//.*").unwrap(),
                token_type: "comment".to_string(),
                class_name: "comment".to_string(),
                priority: 90,
            },
            SyntaxRule {
                regex: Regex::new(r#""[^"]*""#).unwrap(),
                token_type: "string".to_string(),
                class_name: "string".to_string(),
                priority: 80,
            },
            SyntaxRule {
                regex: Regex::new(r"\b(?:const|let|var|function|class|if|else|for|while|return|async|await)\b").unwrap(),
                token_type: "keyword".to_string(),
                class_name: "keyword".to_string(),
                priority: 70,
            },
            SyntaxRule {
                regex: Regex::new(r"\b\d+\b").unwrap(),
                token_type: "number".to_string(),
                class_name: "number".to_string(),
                priority: 60,
            },
        ],
    );

    // Python
    languages.insert(
        "python".to_string(),
        vec![
            SyntaxRule {
                regex: Regex::new(r"#.*").unwrap(),
                token_type: "comment".to_string(),
                class_name: "comment".to_string(),
                priority: 90,
            },
            SyntaxRule {
                regex: Regex::new(r#""[^"]*""#).unwrap(),
                token_type: "string".to_string(),
                class_name: "string".to_string(),
                priority: 80,
            },
            SyntaxRule {
                regex: Regex::new(r"\b(?:def|class|if|else|elif|for|while|return|import|from|as|async|await)\b").unwrap(),
                token_type: "keyword".to_string(),
                class_name: "keyword".to_string(),
                priority: 70,
            },
            SyntaxRule {
                regex: Regex::new(r"\b\d+\b").unwrap(),
                token_type: "number".to_string(),
                class_name: "number".to_string(),
                priority: 60,
            },
        ],
    );

    // Rust (simplified)
    languages.insert(
        "rust".to_string(),
        vec![
            SyntaxRule {
                regex: Regex::new(r"//.*").unwrap(),
                token_type: "comment".to_string(),
                class_name: "comment".to_string(),
                priority: 90,
            },
            SyntaxRule {
                regex: Regex::new(r#""[^"]*""#).unwrap(),
                token_type: "string".to_string(),
                class_name: "string".to_string(),
                priority: 80,
            },
            SyntaxRule {
                regex: Regex::new(r"\b(?:fn|let|mut|const|if|else|for|while|loop|match|impl|trait|struct|enum|use|pub|mod)\b").unwrap(),
                token_type: "keyword".to_string(),
                class_name: "keyword".to_string(),
                priority: 70,
            },
            SyntaxRule {
                regex: Regex::new(r"\b\d+\b").unwrap(),
                token_type: "number".to_string(),
                class_name: "number".to_string(),
                priority: 60,
            },
        ],
    );

    languages
});

impl SyntaxHighlighter {
    pub fn new(language: &str) -> Self {
        let rules = LANGUAGE_DEFINITIONS
            .get(language)
            .or_else(|| LANGUAGE_DEFINITIONS.get("text"))
            .cloned()
            .unwrap_or_default();

        Self { rules }
    }

    pub fn highlight(&self, text: &str) -> Vec<(String, String, usize, usize)> {
        let mut tokens = Vec::new();
        let mut char_indices: Vec<usize> = text.char_indices().map(|(i, _)| i).collect();
        char_indices.push(text.len());

        for (line_num, line) in text.lines().enumerate() {
            let line_start = if line_num == 0 {
                0
            } else {
                text.lines()
                    .take(line_num)
                    .map(|l| l.len() + 1)
                    .sum::<usize>()
            };

            let mut position = 0;
            while position < line.len() {
                let mut found = false;
                let remaining = &line[position..];

                for rule in &self.rules {
                    if let Some(mat) = rule.regex.find(remaining) {
                        if mat.start() == 0 {
                            let start = line_start + position;
                            let end = start + mat.len();
                            tokens.push((
                                rule.token_type.clone(),
                                rule.class_name.clone(),
                                start,
                                end,
                            ));
                            position += mat.len();
                            found = true;
                            break;
                        }
                    }
                }

                if !found {
                    position += 1;
                }
            }
        }

        tokens
    }
}

pub fn get_supported_languages() -> Vec<String> {
    LANGUAGE_DEFINITIONS.keys().cloned().collect()
}

pub fn detect_language(filename: &str, content: &str) -> String {
    let extension = filename
        .rsplit('.')
        .next()
        .unwrap_or("")
        .to_lowercase();

    match extension.as_str() {
        "js" | "jsx" | "mjs" => "javascript",
        "ts" | "tsx" => "typescript",
        "py" => "python",
        "rs" => "rust",
        "java" => "java",
        "cpp" | "cc" | "cxx" => "cpp",
        "c" | "h" => "c",
        "cs" => "csharp",
        "go" => "go",
        "php" => "php",
        "rb" => "ruby",
        "swift" => "swift",
        "kt" | "kts" => "kotlin",
        "scala" => "scala",
        "r" => "r",
        "sql" => "sql",
        "sh" | "bash" => "bash",
        "yaml" | "yml" => "yaml",
        "json" => "json",
        "xml" => "xml",
        "html" | "htm" => "html",
        "css" => "css",
        "scss" | "sass" => "scss",
        "md" | "markdown" => "markdown",
        _ => detect_from_content(content),
    }
    .to_string()
}

fn detect_from_content(content: &str) -> &'static str {
    if content.contains("#!/usr/bin/env python") || content.contains("#!/usr/bin/python") {
        return "python";
    }
    if content.contains("#!/usr/bin/env node") || content.contains("#!/usr/bin/node") {
        return "javascript";
    }
    if content.contains("#!/bin/bash") || content.contains("#!/bin/sh") {
        return "bash";
    }
    
    "text"
}