use crate::diff::ChangeType;
use std::cmp::{max, min};
use std::collections::HashMap;

/// Myers diff algorithm implementation
pub struct MyersDiff<'a> {
    old_lines: &'a [&'a str],
    new_lines: &'a [&'a str],
}

impl<'a> MyersDiff<'a> {
    /// Create a new Myers diff instance
    pub fn new(old_lines: &'a [&'a str], new_lines: &'a [&'a str]) -> Self {
        Self {
            old_lines,
            new_lines,
        }
    }

    /// Compute the diff using Myers algorithm
    pub fn compute_diff(&self) -> Vec<(ChangeType, usize, usize)> {
        if self.old_lines.is_empty() && self.new_lines.is_empty() {
            return vec![];
        }

        if self.old_lines.is_empty() {
            return self
                .new_lines
                .iter()
                .enumerate()
                .map(|(i, _)| (ChangeType::Added, 0, i))
                .collect();
        }

        if self.new_lines.is_empty() {
            return self
                .old_lines
                .iter()
                .enumerate()
                .map(|(i, _)| (ChangeType::Removed, i, 0))
                .collect();
        }

        // Run Myers algorithm
        let ses = self.shortest_edit_script();
        self.ses_to_changes(ses)
    }

    /// Find the shortest edit script using Myers algorithm
    fn shortest_edit_script(&self) -> Vec<SnakeMove> {
        let n = self.old_lines.len();
        let m = self.new_lines.len();
        let max_d = n + m;

        let mut v = vec![0i32; 2 * max_d + 1];
        let mut trace = Vec::new();

        for d in 0..=max_d {
            let mut v_snapshot = v.clone();
            
            for k in (-(d as i32)..=(d as i32)).step_by(2) {
                let idx = (k + max_d as i32) as usize;
                
                let mut x = if k == -(d as i32) || (k != d as i32 && v[idx - 1] < v[idx + 1]) {
                    v[idx + 1]
                } else {
                    v[idx - 1] + 1
                };

                let mut y = x - k;

                // Extend the snake
                let start_x = x;
                let start_y = y;
                while (x as usize) < n && (y as usize) < m && self.old_lines[x as usize] == self.new_lines[y as usize] {
                    x += 1;
                    y += 1;
                }

                v[idx] = x;

                // Check if we've reached the end
                if x as usize >= n && y as usize >= m {
                    // Reconstruct the path
                    v_snapshot[idx] = x;
                    trace.push((d, v_snapshot));
                    return self.backtrack_ses(trace, n, m);
                }
            }

            trace.push((d, v.clone()));
        }

        vec![]
    }

    /// Backtrack through the trace to reconstruct the shortest edit script
    fn backtrack_ses(&self, trace: Vec<(usize, Vec<i32>)>, n: usize, m: usize) -> Vec<SnakeMove> {
        let mut moves = Vec::new();
        let mut x = n as i32;
        let mut y = m as i32;

        for (d, v) in trace.iter().rev() {
            let k = x - y;
            let idx = (k + (n + m) as i32) as usize;

            let prev_k = if k == -(*d as i32) || (k != *d as i32 && v[idx - 1] < v[idx + 1]) {
                k + 1
            } else {
                k - 1
            };

            let prev_idx = (prev_k + (n + m) as i32) as usize;
            let prev_x = v[prev_idx];
            let prev_y = prev_x - prev_k;

            while x > prev_x && y > prev_y {
                x -= 1;
                y -= 1;
                moves.push(SnakeMove::Diagonal(x as usize, y as usize));
            }

            if x > prev_x {
                x -= 1;
                moves.push(SnakeMove::Down(x as usize, y as usize));
            } else if y > prev_y {
                y -= 1;
                moves.push(SnakeMove::Right(x as usize, y as usize));
            }

            if *d == 0 {
                break;
            }
        }

        moves.reverse();
        moves
    }

    /// Convert snake moves to change list
    fn ses_to_changes(&self, moves: Vec<SnakeMove>) -> Vec<(ChangeType, usize, usize)> {
        let mut changes = Vec::new();
        let mut old_idx = 0;
        let mut new_idx = 0;

        for snake_move in moves {
            match snake_move {
                SnakeMove::Diagonal(x, y) => {
                    while old_idx < x || new_idx < y {
                        if old_idx < x && new_idx < y {
                            changes.push((ChangeType::Unchanged, old_idx, new_idx));
                            old_idx += 1;
                            new_idx += 1;
                        } else if old_idx < x {
                            changes.push((ChangeType::Removed, old_idx, new_idx));
                            old_idx += 1;
                        } else {
                            changes.push((ChangeType::Added, old_idx, new_idx));
                            new_idx += 1;
                        }
                    }
                    changes.push((ChangeType::Unchanged, old_idx, new_idx));
                    old_idx += 1;
                    new_idx += 1;
                }
                SnakeMove::Down(x, _) => {
                    while old_idx <= x {
                        changes.push((ChangeType::Removed, old_idx, new_idx));
                        old_idx += 1;
                    }
                }
                SnakeMove::Right(_, y) => {
                    while new_idx <= y {
                        changes.push((ChangeType::Added, old_idx, new_idx));
                        new_idx += 1;
                    }
                }
            }
        }

        // Handle remaining lines
        while old_idx < self.old_lines.len() {
            changes.push((ChangeType::Removed, old_idx, new_idx));
            old_idx += 1;
        }

        while new_idx < self.new_lines.len() {
            changes.push((ChangeType::Added, old_idx, new_idx));
            new_idx += 1;
        }

        // Post-process to detect modifications
        self.detect_modifications(changes)
    }

    /// Detect line modifications (changed lines rather than add/remove pairs)
    fn detect_modifications(&self, changes: Vec<(ChangeType, usize, usize)>) -> Vec<(ChangeType, usize, usize)> {
        let mut result = Vec::new();
        let mut i = 0;

        while i < changes.len() {
            if i + 1 < changes.len() {
                let (type1, old1, new1) = changes[i];
                let (type2, old2, new2) = changes[i + 1];

                // Look for remove followed by add pattern
                if type1 == ChangeType::Removed && type2 == ChangeType::Added {
                    // Check if lines are similar enough to be considered modifications
                    if self.are_lines_similar(old1, new2) {
                        result.push((ChangeType::Modified, old1, new2));
                        i += 2;
                        continue;
                    }
                }
            }

            result.push(changes[i]);
            i += 1;
        }

        result
    }

    /// Check if two lines are similar enough to be considered a modification
    fn are_lines_similar(&self, old_idx: usize, new_idx: usize) -> bool {
        if old_idx >= self.old_lines.len() || new_idx >= self.new_lines.len() {
            return false;
        }

        let old_line = self.old_lines[old_idx];
        let new_line = self.new_lines[new_idx];

        // Calculate similarity using Levenshtein distance
        let distance = levenshtein_distance(old_line, new_line);
        let max_len = max(old_line.len(), new_line.len());

        if max_len == 0 {
            return true;
        }

        let similarity = 1.0 - (distance as f32 / max_len as f32);
        similarity > 0.5 // Consider lines similar if more than 50% similar
    }
}

/// Snake moves in the edit graph
#[derive(Debug, Clone, Copy)]
enum SnakeMove {
    Diagonal(usize, usize), // Match
    Down(usize, usize),     // Delete
    Right(usize, usize),    // Insert
}

/// Calculate Levenshtein distance between two strings
fn levenshtein_distance(s1: &str, s2: &str) -> usize {
    let len1 = s1.len();
    let len2 = s2.len();

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
            curr_row[j + 1] = min(
                min(prev_row[j + 1] + 1, curr_row[j] + 1),
                prev_row[j] + cost,
            );
        }
        std::mem::swap(&mut prev_row, &mut curr_row);
    }

    prev_row[len2]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty_diff() {
        let old_lines: Vec<&str> = vec![];
        let new_lines: Vec<&str> = vec![];
        let diff = MyersDiff::new(&old_lines, &new_lines);
        let changes = diff.compute_diff();
        assert!(changes.is_empty());
    }

    #[test]
    fn test_all_added() {
        let old_lines: Vec<&str> = vec![];
        let new_lines = vec!["line1", "line2", "line3"];
        let diff = MyersDiff::new(&old_lines, &new_lines);
        let changes = diff.compute_diff();
        assert_eq!(changes.len(), 3);
        assert!(changes.iter().all(|(t, _, _)| *t == ChangeType::Added));
    }

    #[test]
    fn test_all_removed() {
        let old_lines = vec!["line1", "line2", "line3"];
        let new_lines: Vec<&str> = vec![];
        let diff = MyersDiff::new(&old_lines, &new_lines);
        let changes = diff.compute_diff();
        assert_eq!(changes.len(), 3);
        assert!(changes.iter().all(|(t, _, _)| *t == ChangeType::Removed));
    }

    #[test]
    fn test_mixed_changes() {
        let old_lines = vec!["a", "b", "c"];
        let new_lines = vec!["a", "d", "c"];
        let diff = MyersDiff::new(&old_lines, &new_lines);
        let changes = diff.compute_diff();
        
        // Should detect: unchanged, modified, unchanged
        assert!(changes.iter().any(|(t, _, _)| *t == ChangeType::Unchanged));
        assert!(changes.iter().any(|(t, _, _)| *t == ChangeType::Modified || *t == ChangeType::Removed || *t == ChangeType::Added));
    }
}