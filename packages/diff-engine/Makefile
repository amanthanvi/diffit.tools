# Makefile for diffit diff-engine

.PHONY: help build build-dev test test-rust test-wasm test-ts bench clean install lint format docs size-check optimize all

# Default target
help:
	@echo "Available targets:"
	@echo "  build      - Build both WASM and TypeScript"
	@echo "  build-dev  - Build in development mode"
	@echo "  test       - Run all tests"
	@echo "  test-rust  - Run Rust tests"
	@echo "  test-wasm  - Run WASM tests"
	@echo "  test-ts    - Run TypeScript tests"
	@echo "  bench      - Run benchmarks"
	@echo "  clean      - Clean build artifacts"
	@echo "  install    - Install dependencies"
	@echo "  lint       - Run linters"
	@echo "  format     - Format code"
	@echo "  docs       - Generate documentation"
	@echo "  size-check - Check WASM bundle size"
	@echo "  optimize   - Optimize WASM bundle"
	@echo "  all        - Build, test, and check everything"

# Install dependencies
install:
	npm install
	cargo fetch

# Build targets
build:
	npm run build

build-dev:
	npm run build:dev

# Test targets
test: test-rust test-wasm test-ts

test-rust:
	cargo test

test-wasm:
	wasm-pack test --node

test-ts:
	npm run test:ts

# Benchmark target
bench:
	cargo bench

# Lint and format
lint:
	cargo clippy -- -D warnings
	npm run lint

format:
	cargo fmt
	npm run format

# Documentation
docs:
	cargo doc --no-deps --open

# Size and optimization
size-check:
	npm run size-check

optimize:
	npm run optimize

# Clean build artifacts
clean:
	cargo clean
	rm -rf pkg dist node_modules coverage

# Complete pipeline
all: install build test lint size-check
	@echo "✅ All checks passed!"

# Development helpers
dev-setup: install
	rustup target add wasm32-unknown-unknown
	cargo install wasm-pack
	npm install -g wasm-opt

watch:
	cargo watch -x "build --target wasm32-unknown-unknown"

# CI/CD helpers
ci-build: install build test lint
	@echo "CI build complete"

release-build: install
	npm run build
	npm run optimize
	npm run test
	@echo "Release build complete"