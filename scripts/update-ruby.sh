#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -e

if [ "$VERBOSE" = 1 ]; then
    set -x
fi

case $(sed --help 2>&1) in
  *GNU*) sed_i () { sed -i "$@"; };;
  *) sed_i () { sed -i '' "$@"; };;
esac

SCRIPTS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$SCRIPTS")"

die() {
    echo "ERROR: $*" >&2
    exit 1
}

if [ $# -eq 1 ]; then
    VERSION=$1
else
    VERSION=$(ruby --version | cut -d' ' -f2 | cut -dp -f1)
fi

if [ -z "$VERSION" ]; then
    die "Please provide an installed/usable Ruby version"
fi

rm -f Gemfile.lock

export BUNDLE_APP_CONFIG="$ROOT/.bundle"
cp "$BUNDLE_APP_CONFIG/"* template/_bundle # sync!

bundle lock

git add Gemfile.lock
