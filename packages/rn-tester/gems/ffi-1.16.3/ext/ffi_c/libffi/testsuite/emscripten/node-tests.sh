#!/bin/bash

# JS BigInt to Wasm i64 integration, disabled by default
WASM_BIGINT=false

emcc_exists="$(command -v emcc)"
if [ ! "${emcc_exists}" ]; then
  echo "Emscripten not on path"
  exit 1
fi

# Parse arguments
while [ $# -gt 0 ]; do
  case $1 in
  --wasm-bigint) WASM_BIGINT=true ;;
  *)
    echo "ERROR: Unknown parameter: $1" >&2
    exit 1
    ;;
  esac
  shift
done

# Common compiler flags
export CFLAGS="-fPIC $EXTRA_CFLAGS"
if [ "$WASM_BIGINT" = "true" ]; then
  # We need to detect WASM_BIGINT support at compile time
  export CFLAGS+=" -DWASM_BIGINT"
fi
export CXXFLAGS="$CFLAGS -sNO_DISABLE_EXCEPTION_CATCHING $EXTRA_CXXFLAGS"
export LDFLAGS="-sEXPORTED_FUNCTIONS=_main,_malloc,_free -sALLOW_TABLE_GROWTH -sASSERTIONS -sNO_DISABLE_EXCEPTION_CATCHING"
if [ "$WASM_BIGINT" = "true" ]; then
  export LDFLAGS+=" -sWASM_BIGINT"
else
  export LDFLAGS+=" -sEXPORTED_RUNTIME_METHODS='getTempRet0,setTempRet0'"
fi

# Specific variables for cross-compilation
export CHOST="wasm32-unknown-linux" # wasm32-unknown-emscripten

autoreconf -fiv
emconfigure ./configure --prefix="$(pwd)/target" --host=$CHOST --enable-static --disable-shared \
  --disable-builddir --disable-multi-os-directory --disable-raw-api --disable-docs ||
  (cat config.log && exit 1)
make

EMMAKEN_JUST_CONFIGURE=1 emmake make check \
  RUNTESTFLAGS="LDFLAGS_FOR_TARGET='$LDFLAGS'" || (cat testsuite/libffi.log && exit 1)
