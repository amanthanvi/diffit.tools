use crate::diff::{ChangeType, SemanticInfo};
use regex::Regex;
use std::collections::HashMap;
use once_cell::sync::Lazy;

/// Semantic analyzer for understanding code structure
pub struct SemanticAnalyzer {
    language: Option<String>,
    patterns: HashMap<String, Vec<Pattern>>,
}

/// Pattern for matching semantic entities
struct Pattern {
    regex: Regex,
    entity_type: String,
    name_group: Option<usize>,
    importance: f32,
}

static PATTERNS: Lazy<HashMap<String, Vec<Pattern>>> = Lazy::new(|| {
    let mut patterns = HashMap::new();

    // JavaScript/TypeScript patterns
    patterns.insert(
        "javascript".to_string(),
        vec![
            Pattern {
                regex: Regex::new(r"(?:export\s+)?(?:default\s+)?class\s+(\w+)").unwrap(),
                entity_type: "class".to_string(),
                name_group: Some(1),
                importance: 0.9,
            },
            Pattern {
                regex: Regex::new(r"(?:export\s+)?(?:async\s+)?function\s+(\w+)").unwrap(),
                entity_type: "function".to_string(),
                name_group: Some(1),
                importance: 0.8,
            },
            Pattern {
                regex: Regex::new(r"(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>").unwrap(),
                entity_type: "arrow_function".to_string(),
                name_group: Some(1),
                importance: 0.7,
            },
            Pattern {
                regex: Regex::new(r"interface\s+(\w+)").unwrap(),
                entity_type: "interface".to_string(),
                name_group: Some(1),
                importance: 0.8,
            },
            Pattern {
                regex: Regex::new(r"type\s+(\w+)\s*=").unwrap(),
                entity_type: "type_alias".to_string(),
                name_group: Some(1),
                importance: 0.7,
            },
            Pattern {
                regex: Regex::new(r#"import\s+.*\s+from\s+['"]([^'"]+)['"]"#).unwrap(),
                entity_type: "import".to_string(),
                name_group: Some(1),
                importance: 0.5,
            },
        ],
    );

    // Python patterns
    patterns.insert(
        "python".to_string(),
        vec![
            Pattern {
                regex: Regex::new(r"class\s+(\w+)(?:\([^)]*\))?:").unwrap(),
                entity_type: "class".to_string(),
                name_group: Some(1),
                importance: 0.9,
            },
            Pattern {
                regex: Regex::new(r"def\s+(\w+)\s*\([^)]*\):").unwrap(),
                entity_type: "function".to_string(),
                name_group: Some(1),
                importance: 0.8,
            },
            Pattern {
                regex: Regex::new(r"async\s+def\s+(\w+)\s*\([^)]*\):").unwrap(),
                entity_type: "async_function".to_string(),
                name_group: Some(1),
                importance: 0.8,
            },
            Pattern {
                regex: Regex::new(r"^(\w+)\s*=\s*").unwrap(),
                entity_type: "variable".to_string(),
                name_group: Some(1),
                importance: 0.5,
            },
            Pattern {
                regex: Regex::new(r"from\s+(\S+)\s+import").unwrap(),
                entity_type: "import".to_string(),
                name_group: Some(1),
                importance: 0.5,
            },
            Pattern {
                regex: Regex::new(r"@(\w+)").unwrap(),
                entity_type: "decorator".to_string(),
                name_group: Some(1),
                importance: 0.6,
            },
        ],
    );

    // Rust patterns
    patterns.insert(
        "rust".to_string(),
        vec![
            Pattern {
                regex: Regex::new(r"(?:pub\s+)?struct\s+(\w+)").unwrap(),
                entity_type: "struct".to_string(),
                name_group: Some(1),
                importance: 0.9,
            },
            Pattern {
                regex: Regex::new(r"(?:pub\s+)?enum\s+(\w+)").unwrap(),
                entity_type: "enum".to_string(),
                name_group: Some(1),
                importance: 0.9,
            },
            Pattern {
                regex: Regex::new(r"(?:pub\s+)?(?:async\s+)?fn\s+(\w+)").unwrap(),
                entity_type: "function".to_string(),
                name_group: Some(1),
                importance: 0.8,
            },
            Pattern {
                regex: Regex::new(r"impl(?:<[^>]+>)?\s+(?:\w+\s+for\s+)?(\w+)").unwrap(),
                entity_type: "impl".to_string(),
                name_group: Some(1),
                importance: 0.8,
            },
            Pattern {
                regex: Regex::new(r"(?:pub\s+)?trait\s+(\w+)").unwrap(),
                entity_type: "trait".to_string(),
                name_group: Some(1),
                importance: 0.9,
            },
            Pattern {
                regex: Regex::new(r"use\s+([^;]+);").unwrap(),
                entity_type: "use".to_string(),
                name_group: Some(1),
                importance: 0.5,
            },
        ],
    );

    patterns
});

impl SemanticAnalyzer {
    /// Create a new semantic analyzer
    pub fn new(language: Option<&str>) -> Self {
        Self {
            language: language.map(|s| s.to_string()),
            patterns: PATTERNS.clone(),
        }
    }

    /// Analyze changes and add semantic information
    pub fn analyze_changes(
        &self,
        changes: Vec<(ChangeType, usize, usize)>,
        old_lines: &[&str],
        new_lines: &[&str],
    ) -> Vec<(ChangeType, usize, usize)> {
        // For now, just return the changes as-is
        // In a full implementation, we would analyze the context
        // and add semantic information to each change
        changes
    }

    /// Extract semantic information from a line
    pub fn extract_semantic_info(&self, line: &str, context: &[&str]) -> Option<SemanticInfo> {
        let language = self.language.as_ref()?;
        let patterns = self.patterns.get(language)?;

        for pattern in patterns {
            if let Some(captures) = pattern.regex.captures(line) {
                let entity_name = pattern
                    .name_group
                    .and_then(|g| captures.get(g))
                    .map(|m| m.as_str().to_string());

                return Some(SemanticInfo {
                    entity_type: pattern.entity_type.clone(),
                    entity_name,
                    scope: self.determine_scope(line, context),
                    importance: pattern.importance,
                });
            }
        }

        None
    }

    /// Determine the scope of a change
    fn determine_scope(&self, _line: &str, context: &[&str]) -> Option<String> {
        // Simple scope detection based on indentation
        if context.is_empty() {
            return None;
        }

        // Find the nearest non-empty line with less indentation
        let current_indent = get_indentation_level(context.last()?);
        
        for line in context.iter().rev().skip(1) {
            let indent = get_indentation_level(line);
            if indent < current_indent && !line.trim().is_empty() {
                // Try to extract a scope name from this line
                if let Some(info) = self.extract_semantic_info(line, &[]) {
                    return info.entity_name;
                }
            }
        }

        None
    }

    /// Group related changes together
    pub fn group_related_changes(
        &self,
        changes: &[(ChangeType, usize, usize)],
        lines: &[&str],
    ) -> Vec<ChangeGroup> {
        let mut groups = Vec::new();
        let mut current_group: Option<ChangeGroup> = None;

        for &(change_type, old_idx, new_idx) in changes {
            let line = match change_type {
                ChangeType::Removed => lines.get(old_idx).copied(),
                ChangeType::Added | ChangeType::Modified => lines.get(new_idx).copied(),
                ChangeType::Unchanged => None,
            };

            if let Some(line) = line {
                if let Some(info) = self.extract_semantic_info(line, lines) {
                    // Start a new group if this is a high-importance entity
                    if info.importance > 0.7 {
                        if let Some(group) = current_group.take() {
                            groups.push(group);
                        }
                        current_group = Some(ChangeGroup {
                            entity_type: info.entity_type.clone(),
                            entity_name: info.entity_name.clone(),
                            changes: vec![(change_type, old_idx, new_idx)],
                            importance: info.importance,
                        });
                    } else if let Some(ref mut group) = current_group {
                        group.changes.push((change_type, old_idx, new_idx));
                    }
                } else if let Some(ref mut group) = current_group {
                    group.changes.push((change_type, old_idx, new_idx));
                }
            }
        }

        if let Some(group) = current_group {
            groups.push(group);
        }

        groups
    }
}

/// A group of related changes
#[derive(Debug, Clone)]
pub struct ChangeGroup {
    pub entity_type: String,
    pub entity_name: Option<String>,
    pub changes: Vec<(ChangeType, usize, usize)>,
    pub importance: f32,
}

/// Get the indentation level of a line
fn get_indentation_level(line: &str) -> usize {
    line.len() - line.trim_start().len()
}

/// Analyze the impact of changes
pub fn analyze_change_impact(
    changes: &[(ChangeType, usize, usize)],
    old_lines: &[&str],
    new_lines: &[&str],
) -> ChangeImpact {
    let mut impact = ChangeImpact::default();

    for &(change_type, old_idx, new_idx) in changes {
        match change_type {
            ChangeType::Added => {
                if let Some(line) = new_lines.get(new_idx) {
                    impact.analyze_added_line(line);
                }
            }
            ChangeType::Removed => {
                if let Some(line) = old_lines.get(old_idx) {
                    impact.analyze_removed_line(line);
                }
            }
            ChangeType::Modified => {
                if let (Some(old_line), Some(new_line)) = (old_lines.get(old_idx), new_lines.get(new_idx)) {
                    impact.analyze_modified_line(old_line, new_line);
                }
            }
            ChangeType::Unchanged => {}
        }
    }

    impact
}

/// Impact analysis of changes
#[derive(Debug, Default)]
pub struct ChangeImpact {
    pub added_functions: usize,
    pub removed_functions: usize,
    pub modified_functions: usize,
    pub added_classes: usize,
    pub removed_classes: usize,
    pub modified_classes: usize,
    pub complexity_change: i32,
}

impl ChangeImpact {
    fn analyze_added_line(&mut self, line: &str) {
        if line.contains("function") || line.contains("fn ") || line.contains("def ") {
            self.added_functions += 1;
        }
        if line.contains("class ") || line.contains("struct ") {
            self.added_classes += 1;
        }
    }

    fn analyze_removed_line(&mut self, line: &str) {
        if line.contains("function") || line.contains("fn ") || line.contains("def ") {
            self.removed_functions += 1;
        }
        if line.contains("class ") || line.contains("struct ") {
            self.removed_classes += 1;
        }
    }

    fn analyze_modified_line(&mut self, _old: &str, _new: &str) {
        // Simplified analysis - in reality would be more sophisticated
        self.modified_functions += 1;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_javascript_patterns() {
        let analyzer = SemanticAnalyzer::new(Some("javascript"));
        
        let info = analyzer.extract_semantic_info("export function myFunction() {", &[]);
        assert!(info.is_some());
        let info = info.unwrap();
        assert_eq!(info.entity_type, "function");
        assert_eq!(info.entity_name, Some("myFunction".to_string()));
    }

    #[test]
    fn test_python_patterns() {
        let analyzer = SemanticAnalyzer::new(Some("python"));
        
        let info = analyzer.extract_semantic_info("class MyClass(BaseClass):", &[]);
        assert!(info.is_some());
        let info = info.unwrap();
        assert_eq!(info.entity_type, "class");
        assert_eq!(info.entity_name, Some("MyClass".to_string()));
    }

    #[test]
    fn test_rust_patterns() {
        let analyzer = SemanticAnalyzer::new(Some("rust"));
        
        let info = analyzer.extract_semantic_info("pub fn process_data(input: &str) -> Result<String, Error> {", &[]);
        assert!(info.is_some());
        let info = info.unwrap();
        assert_eq!(info.entity_type, "function");
        assert_eq!(info.entity_name, Some("process_data".to_string()));
    }
}