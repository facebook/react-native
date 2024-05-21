#!/bin/bash
set -eox pipefail

workspace=$1
sdk=$2
scheme=$3
action=$4

shift 4


if [[ $sdk == iphoneos || $sdk == iphonesimulator ]]; then
  if [[ $action == 'test' || $action == 'test-without-building' ]]; then
    device=$(xcrun simctl list devices iPhone available)
    re='iPhone [0-9]+ \(([-0-9A-Fa-f]+)\)'
    [[ $device =~ $re ]] || exit 1
    shift || true
    destination="-destination \"platform=iOS Simulator,id=${BASH_REMATCH[1]}\""
  else
    destination='-destination "generic/platform=iOS Simulator"'
  fi
elif [[ $sdk == macosx ]]; then
  destination=''
elif [[ $sdk == xros || $sdk == xrsimulator ]]; then
  if [[ $action == 'test' || $action == 'test-without-building' ]]; then
    device=$(xcrun simctl list devices visionOS available)
    re='Apple Vision Pro \(([-0-9A-Fa-f]+)\)'
    [[ $device =~ $re ]] || exit 1
    shift || true
    destination="-destination \"platform=visionOS Simulator,id=${BASH_REMATCH[1]}\""
  else
    destination='-destination "generic/platform=visionOS Simulator"'
  fi
else
  echo "Cannot detect sdk: $sdk"
  exit 1
fi

build_cmd=$(
  echo xcodebuild \
    -workspace "$workspace" \
    -scheme "$scheme" \
    -sdk "$sdk" \
    "$destination" \
    -derivedDataPath $(dirname $workspace)/build \
    CODE_SIGNING_ALLOWED=NO \
    COMPILER_INDEX_STORE_ENABLE=NO \
    "$action" \
    "$@" \

)

if [[ "$CCACHE_DISABLE" != "1" ]]; then
  if ! command -v ccache 1> /dev/null; then
    brew install ccache
  fi

  CCACHE_HOME=$(dirname $(dirname $(which ccache)))/opt/ccache

  export CCACHE_DIR="$(git rev-parse --show-toplevel)/.ccache"

  export CC="${CCACHE_HOME}/libexec/clang"
  export CXX="${CCACHE_HOME}/libexec/clang++"
  export CMAKE_C_COMPILER_LAUNCHER=$(which ccache)
  export CMAKE_CXX_COMPILER_LAUNCHER=$(which ccache)

  ccache --zero-stats 1> /dev/null
fi
if ! command -v xcbeautify 1> /dev/null; then
  brew install xcbeautify
fi

eval "$build_cmd" | xcbeautify --report junit

if [[ "$CCACHE_DISABLE" != "1" ]]; then
  ccache --show-stats --verbose
fi
