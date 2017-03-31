#!/bin/bash
set -ex

SCRIPTS=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(dirname "$SCRIPTS")

cd "$ROOT"

SCHEME="UIExplorer"
SDK="iphonesimulator"
DESTINATION="platform=iOS Simulator,name=iPhone 5s,OS=10.1"
TEST="test"

. ./scripts/objc-test.sh

