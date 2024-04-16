#!/usr/bin/env bash
emcc_exists="$(command -v emcc)"
if [ ! "${emcc_exists}" ]; then
  echo "Emscripten not on path"
  exit 1
fi

set -e

cd "$1"
shift

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


export CFLAGS="-fPIC -O2 -I../../target/include $EXTRA_CFLAGS"
export CXXFLAGS="$CFLAGS -sNO_DISABLE_EXCEPTION_CATCHING $EXTRA_CXXFLAGS"
export LDFLAGS=" \
    -L../../target/lib/ -lffi \
    -sEXPORT_ALL \
    -sMODULARIZE \
    -sMAIN_MODULE \
    -sNO_DISABLE_EXCEPTION_CATCHING \
    $EXTRA_LD_FLAGS \
"

# This needs to test false if there exists an environment variable called
# WASM_BIGINT whose contents are empty. Don't use +x.
if [ -n "${WASM_BIGINT}" ] ; then
  export LDFLAGS+=" -sWASM_BIGINT"
else
  export LDFLAGS+=" -sEXPORTED_RUNTIME_METHODS='getTempRet0,setTempRet0'"
fi

# Rename main functions to test__filename so we can link them together
ls *c | sed 's!\(.*\)\.c!sed -i "s/main/test__\1/g" \0!g' | bash

# Compile
ls *.c | sed 's/\(.*\)\.c/emcc $CFLAGS -c \1.c -o \1.o /g' | bash
ls *.cc | sed 's/\(.*\)\.cc/em++ $CXXFLAGS -c \1.cc -o \1.o /g' | bash

# Link
em++ $LDFLAGS *.o -o test.js
cp ../emscripten/test.html .
