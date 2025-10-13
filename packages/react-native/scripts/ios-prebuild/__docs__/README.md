# iOS Prebuild Scripts

This directory contains scripts for prebuilding React Native itself into XCFrameworks for iOS and related platforms.

## Overview

These scripts automate the process of building React Native as a Swift Package and packaging it into XCFrameworks that can be distributed and consumed by iOS applications. The build process creates optimized frameworks for multiple architectures and platforms.

## Purpose

The prebuild scripts are used to:

- Build React Native itself (not its dependencies) as XCFrameworks
- Create distributable binaries for iOS, iOS Simulator, Catalyst, Vision, and visionOS platforms
- Support both Debug and Release build configurations
- Generate Debug Symbol (dSYM) files for debugging
- Enable library evolution and module stability for Swift packages

## Architecture

The build system consists of several components:

### `cli.js`
The main entry point that orchestrates the build process. It:
- Parses command-line arguments
- Validates build parameters
- Coordinates the build, archiving, and XCFramework creation steps

### `build.js`
Handles the Swift Package build process. It:
- Executes `xcodebuild` commands with appropriate flags
- Builds for specific platforms and build types (Debug/Release)
- Locates and validates the generated framework artifacts
- Uses build settings like `BUILD_LIBRARY_FOR_DISTRIBUTION=YES` for binary compatibility

### `types.js`
Defines TypeScript/Flow type definitions for:
- `BuildFlavor`: Debug or Release configurations
- `Destination`: Target platforms (iOS, iOS Simulator, Catalyst, Vision, visionOS)
- `ArchiveOptions`: Configuration options for the build process

### `utils.js`
Provides utility functions including:
- Logging functionality with prefixed output
- Common helper functions used across scripts

## Usage

Run the prebuild script from the command line:

```bash
node cli.js [options]
```

### Options


| Option | Alias | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `--setup` | `-s` | boolean | - | Download and setup dependencies |
| `--build` | `-b` | boolean | - | Build dependencies/platforms |
| `--compose` | `-c` | boolean | - | Compose XCFramework from built dependencies |
| `--platforms` | `-p` | array | `['ios', 'ios-simulator', 'mac-catalyst']` | Specify one or more platforms to build for |
| `--flavor` | `-f` | string | `Debug` | Specify the flavor to build: `Debug` or `Release` |
| `--identity` | `-i` | string | - | Specify the code signing identity to use for signing the frameworks |
| `--help` | - | boolean | - | Show help information |


### Build Process

1. **Build Phase**: Compiles the React Native Swift Package for the specified platform and configuration
2. **Archive Phase**: Collects the built frameworks from the derived data path
3. **XCFramework Creation**: Packages the frameworks into XCFrameworks with debug symbols

### Output Structure

The build produces:
- XCFrameworks in the specified output directory
- Debug symbols (dSYM files) for debugging
- Build products organized by platform and configuration

## Build Flags

The build process uses specific `xcodebuild` flags:

- `BUILD_LIBRARY_FOR_DISTRIBUTION=YES`: Enables module stability
- `SKIP_INSTALL=NO`: Ensures frameworks are properly installed
- `DEBUG_INFORMATION_FORMAT="dwarf-with-dsym"`: Generates debug symbols
- `OTHER_SWIFT_FLAGS="-no-verify-emitted-module-interface"`: Skips interface verification

## Requirements

- Xcode installed with command-line tools
- Swift Package Manager support
- macOS development environment
- Node.js for running the scripts

## Notes

- These scripts build React Native itself, not third-party dependencies
- The build process requires significant disk space for derived data
- Build times vary depending on the target platform and configuration
- XCFrameworks support multiple architectures in a single bundle

## Known Issues

The generated XCFrameworks currently use CocoaPods-style header structures rather than standard framework header conventions. This may cause modularity issues when:

- Consuming the XCFrameworks in projects that expect standard framework headers
- Building dependent frameworks that rely on proper module boundaries
- Integrating with Swift Package Manager projects expecting modular headers

## Usage

To use the prebuilt React Native dependencies XCFrameworks in your iOS project, run pod install with the environment variable `RCT_USE_RN_DEP` set to `1`:

```bash
RCT_USE_RN_DEP=1 bundle exec pod install
```

For debugging and troubleshooting the Cocoapods scripts, you can use the following environment variables:

- `RCT_USE_LOCAL_RN_DEP`: **TEST ONLY** If set, it will use a local tarball of ReactNativeDependencies if it exists.
- `RCT_DEPS_VERSION`: **TEST ONLY** If set, it will override the version of ReactNativeDependencies to be used.