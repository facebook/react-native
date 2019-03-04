/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace facebook {
namespace better {

/*
 * `Better` is a trivial collection of basic tools borrowed from other low-level
 * general purpose libraries (like Folly, Abseil or Boost). The main goals of
 * Better:
 * - Make the codebase more portable;
 * - Make the dependency list explicit (by decoupling it as a dependency list of
 * Better);
 * - Make relying on modern C++ patterns and tools in code simple and easy.
 * - Make executing experiments with different dependencies easier.
 *
 * What should be part of Better and what should not? Should I add some piece of
 * functionality in the Better? Here is a quick checklist.
 *
 * If one of the following is true, yes, go for it:
 * - If some feature is already in some future C++ standard (possibly in draft
 * stage) and it's already implemented in some 3rd party library.
 * - If some standardized feature of C++ is implemented in the standard not in
 * the most efficient way (because the standard enforces some tricky constraints
 * (like always-valid iterators) which nobody uses and should use), but you have
 * a library that does it right providing exact same interface.
 *
 * If one of the following is true, please do *NOT* do it (at least as part of
 * the library):
 * - You want to use some very fancy pattern that your favorite library (but
 * nothing else) provides, and You want to make this pattern very command in the
 * code base. Your hope is that this pattern will conquer the world and be
 * a part of the C++ standard eventually.
 * - You favorite library provides some general purpose container that 10x times
 * faster than the standard one, so You want to use that in the code base. That
 * container does not have compatible API though (because it's a clear trade-off
 * with efficiency, of course).
 */

/*
 * Configuration
 */

/*
 * Enables using Folly containers instead of standard ones (such as map, vector,
 * string, optional and etc.)
 */
#define BETTER_USE_FOLLY_CONTAINERS

} // namespace better
} // namespace facebook
