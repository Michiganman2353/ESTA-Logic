//// cli/utils/print.gleam
////
//// Print Utilities for CLI
////
//// Version: 1.0.0

/// ANSI color codes
pub type Color {
  Red
  Green
  Yellow
  Blue
  Magenta
  Cyan
  White
  Reset
}

/// Get ANSI escape code for color
pub fn color_code(color: Color) -> String {
  case color {
    Red -> "\u{001b}[31m"
    Green -> "\u{001b}[32m"
    Yellow -> "\u{001b}[33m"
    Blue -> "\u{001b}[34m"
    Magenta -> "\u{001b}[35m"
    Cyan -> "\u{001b}[36m"
    White -> "\u{001b}[37m"
    Reset -> "\u{001b}[0m"
  }
}

/// Print with color
pub fn color_print(text: String, color: Color) -> String {
  color_code(color) <> text <> color_code(Reset)
}

/// Print success message
pub fn success(text: String) -> String {
  color_print("✓ " <> text, Green)
}

/// Print error message
pub fn error(text: String) -> String {
  color_print("✗ " <> text, Red)
}

/// Print warning message
pub fn warning(text: String) -> String {
  color_print("⚠ " <> text, Yellow)
}

/// Print info message
pub fn info(text: String) -> String {
  color_print("ℹ " <> text, Blue)
}

/// Print table header
pub fn table_header(columns: List(String)) -> String {
  format_row(columns) <> "\n" <> separator(columns)
}

fn format_row(columns: List(String)) -> String {
  case columns {
    [] -> ""
    [col] -> col
    [col, ..rest] -> col <> " | " <> format_row(rest)
  }
}

fn separator(columns: List(String)) -> String {
  case columns {
    [] -> ""
    [_] -> "---"
    [_, ..rest] -> "--- | " <> separator(rest)
  }
}
