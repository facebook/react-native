/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace facebook {
namespace butter {

/*
 * `Butter` is a minimal collection of basic tools borrowed from other low-level
 * general purpose libraries (like Folly, Abseil or Boost). The main goals of
 * Butter:
 * - Make the codebase more portable;
 * - Make the dependency list explicit (by decoupling it as a dependency list of
 * Butter);
 * - Make relying on modern C++ patterns and tools in code simple and easy.
 * - Make executing experiments with different dependencies easier.
 * - Limit reliance on third-party libraries eventually.
 *
 * Target C++ Version
 * ------------------
 * Currently, Butter targets c++20.
 *
 * The Scope
 * ---------
 * What should be part of Butter and what should not? Should I add some piece of
 * functionality in the Butter? Here is a quick checklist.
 *
 * As of now, Butter is relatively permissive per the guidance below:
 *
 * If one of the following is true, yes, go for it:
 * - If some feature is already in some future C++ standard (possibly in draft
 * stage) and it's already implemented in some 3rd party library.
 * - If some standardized feature of C++ is implemented in the standard not in
 * the most efficient way (because the standard enforces some tricky
 * constraints, like always-valid iterators, which nobody uses and should use),
 * but you have a library that does it right providing exact same interface.
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
 *
 * Note that eventually Butter will restrict the API collection to reduce
 * reliance on non-standard C++ builtin libraries. That way, the API footprint
 * stays small and is limited to just the essential APIs. This restriction is
 * currently a work in progress.
 */

/*
 * Configuration
 */

/*
 * Enables using Folly containers instead of standard ones (such as map, vector,
 * small_vector, optional and etc.)
 * Custom containers are only enabled in release mode. Using custom stuff
 * complicates debugging process because it breaks embedded into IDE
 * introspections mechanisms.
 */
#ifndef DEBUG
#define BUTTER_USE_FOLLY_CONTAINERS
#endif

} // namespace butter
} // namespace facebook
