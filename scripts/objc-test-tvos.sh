#!/bin/bash
set -ex

SCRIPTS=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(dirname "$SCRIPTS")

cd "$ROOT"

SCHEME="UIExplorer-tvOS"
SDK="appletvsimulator"
DESTINATION="platform=tvOS Simulator,name=Apple TV 1080p,OS=10.1"
# Uncomment the line below to enable tvOS testing
#TEST="test"

. ./scripts/objc-test.sh

