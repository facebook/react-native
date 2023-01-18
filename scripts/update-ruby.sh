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
echo "Setting Ruby version to: $VERSION"

cd "$ROOT" || die "Failed to change to $ROOT"

# do this first, so rbenv/rvm will automatically pick the desired version
echo "$VERSION" > .ruby-version

# make sure we're using it
CURRENT_VERSION=$(ruby --version | cut -d' ' -f2 | cut -dp -f1)
if [ -z "$CURRENT_VERSION" ]; then
    # rbenv/rvm uses shims, the commands do exist, but do not return a version if misconfigured
    die "Missing usable ruby, check your installation"
elif [ "$VERSION" != "$CURRENT_VERSION" ]; then
    die "Plese use the ruby version you are trying to set: $VERSION ('$CURRENT_VERSION' in use)"
fi

echo "$VERSION" > template/_ruby-version

sed_i -e "s/^\(ruby '\)[^']*\('.*\)$/\1$VERSION\2/" Gemfile
sed_i -e "s/^\(ruby '\)[^']*\('.*\)$/\1$VERSION\2/" template/Gemfile

rm -f Gemfile.lock

export BUNDLE_APP_CONFIG="$ROOT/.bundle"
cp "$BUNDLE_APP_CONFIG/"* template/_bundle # sync!

bundle lock

# Disabling getting a potential fatal exit with for crossing filesystem boundary
export GIT_DISCOVERY_ACROSS_FILESYSTEM=1;
IS_GIT_REPO=$(git rev-parse --is-inside-work-tree 2> /dev/null || true)
export GIT_DISCOVERY_ACROSS_FILESYSTEM=0;
if [ "$IS_GIT_REPO" = "true" ]; then
    git add \
        .ruby-version \
        Gemfile \
        Gemfile.lock \
        template/_ruby-version \
        template/Gemfile
else
    echo "Detected that you're not in Git. If on another SCM, don't forget to commit the edited files."
fi
