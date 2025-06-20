use std::env;
use std::path::PathBuf;

fn main() {
    // Get the target directory
    let target_dir = env::var("CARGO_TARGET_DIR")
        .unwrap_or_else(|_| env::var("OUT_DIR").unwrap());
    
    // Set up wasm-pack specific configurations
    if env::var("CARGO_CFG_TARGET_ARCH").unwrap() == "wasm32" {
        println!("cargo:rustc-link-arg=--max-memory=4294967296"); // 4GB max memory
        println!("cargo:rustc-link-arg=--initial-memory=16777216"); // 16MB initial memory
        println!("cargo:rustc-link-arg=--export-dynamic-symbol=malloc");
        println!("cargo:rustc-link-arg=--export-dynamic-symbol=free");
    }
    
    // Set optimization flags for release builds
    if env::var("PROFILE").unwrap() == "release" {
        println!("cargo:rustc-link-arg=-O3");
        println!("cargo:rustc-link-arg=--lto-O3");
    }
    
    // Enable SIMD optimizations if available
    #[cfg(target_feature = "simd128")]
    {
        println!("cargo:rustc-link-arg=--enable-simd");
    }
    
    // Set up paths for generated files
    let out_path = PathBuf::from(&target_dir);
    println!("cargo:rustc-env=WASM_OUT_DIR={}", out_path.display());
}