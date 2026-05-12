/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Smoke test that the SPM autolinker excludes `__tests__/` directories from
 * the `sources:` allowlist. If this file ever ends up in a target's sources,
 * the build fails immediately with an unresolved header — making the
 * regression loud.
 */

#include <this/header/intentionally/does/not/exist.h>

static_assert(false, "TestLibraryAppleTests.cpp must not be compiled by the SPM autolinker");
