#!/usr/bin/env bash
command -v emcc >/dev/null 2>&1 || {
  echo >&2 "emsdk could not be found.  Aborting."
  exit 1
}

set -e

SOURCE_DIR=$PWD

# Working directories
TARGET=$SOURCE_DIR/target
mkdir -p "$TARGET"

# Define default arguments

# JS BigInt to Wasm i64 integration, disabled by default
# This needs to test false if there exists an environment variable called
# WASM_BIGINT whose contents are empty. Don't use +x.
if [ -n "${WASM_BIGINT}" ]; then
  WASM_BIGINT=true
else
  WASM_BIGINT=false
fi

# Parse arguments
while [ $# -gt 0 ]; do
  case $1 in
  --wasm-bigint) WASM_BIGINT=true ;;
  --debug) DEBUG=true ;;
  *)
    echo "ERROR: Unknown parameter: $1" >&2
    exit 1
    ;;
  esac
  shift
done

# Common compiler flags
export CFLAGS="-O3 -fPIC"
if [ "$WASM_BIGINT" = "true" ]; then
  # We need to detect WASM_BIGINT support at compile time
  export CFLAGS+=" -DWASM_BIGINT"
fi
if [ "$DEBUG" = "true" ]; then
  export CFLAGS+=" -DDEBUG_F"
fi
export CXXFLAGS="$CFLAGS"

# Build paths
export CPATH="$TARGET/include"
export PKG_CONFIG_PATH="$TARGET/lib/pkgconfig"
export EM_PKG_CONFIG_PATH="$PKG_CONFIG_PATH"

# Specific variables for cross-compilation
export CHOST="wasm32-unknown-linux" # wasm32-unknown-emscripten

autoreconf -fiv
emconfigure ./configure --host=$CHOST --prefix="$TARGET" --enable-static --disable-shared --disable-dependency-tracking \
  --disable-builddir --disable-multi-os-directory --disable-raw-api --disable-docs
make install
cp fficonfig.h target/include/
cp include/ffi_common.h target/include/
