/*
 * Copyright 2015-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * GCC compatible wrappers around clang attributes.
 *
 * @author Dominik Gabi
 */

#pragma once

#ifndef __has_attribute
#define FOLLY_HAS_ATTRIBUTE(x) 0
#else
#define FOLLY_HAS_ATTRIBUTE(x) __has_attribute(x)
#endif

#ifndef __has_cpp_attribute
#define FOLLY_HAS_CPP_ATTRIBUTE(x) 0
#else
#define FOLLY_HAS_CPP_ATTRIBUTE(x) __has_cpp_attribute(x)
#endif

#ifndef __has_extension
#define FOLLY_HAS_EXTENSION(x) 0
#else
#define FOLLY_HAS_EXTENSION(x) __has_extension(x)
#endif

/**
 * Fallthrough to indicate that `break` was left out on purpose in a switch
 * statement, e.g.
 *
 * switch (n) {
 *   case 22:
 *   case 33:  // no warning: no statements between case labels
 *     f();
 *   case 44:  // warning: unannotated fall-through
 *     g();
 *     FOLLY_FALLTHROUGH; // no warning: annotated fall-through
 * }
 */
#if FOLLY_HAS_CPP_ATTRIBUTE(fallthrough)
#define FOLLY_FALLTHROUGH [[fallthrough]]
#elif FOLLY_HAS_CPP_ATTRIBUTE(clang::fallthrough)
#define FOLLY_FALLTHROUGH [[clang::fallthrough]]
#elif FOLLY_HAS_CPP_ATTRIBUTE(gnu::fallthrough)
#define FOLLY_FALLTHROUGH [[gnu::fallthrough]]
#else
#define FOLLY_FALLTHROUGH
#endif

/**
 *  Maybe_unused indicates that a function, variable or parameter might or
 *  might not be used, e.g.
 *
 *  int foo(FOLLY_MAYBE_UNUSED int x) {
 *    #ifdef USE_X
 *      return x;
 *    #else
 *      return 0;
 *    #endif
 *  }
 */
#if FOLLY_HAS_CPP_ATTRIBUTE(maybe_unused)
#define FOLLY_MAYBE_UNUSED [[maybe_unused]]
#elif FOLLY_HAS_ATTRIBUTE(__unused__) || __GNUC__
#define FOLLY_MAYBE_UNUSED __attribute__((__unused__))
#else
#define FOLLY_MAYBE_UNUSED
#endif

/**
 * Nullable indicates that a return value or a parameter may be a `nullptr`,
 * e.g.
 *
 * int* FOLLY_NULLABLE foo(int* a, int* FOLLY_NULLABLE b) {
 *   if (*a > 0) {  // safe dereference
 *     return nullptr;
 *   }
 *   if (*b < 0) {  // unsafe dereference
 *     return *a;
 *   }
 *   if (b != nullptr && *b == 1) {  // safe checked dereference
 *     return new int(1);
 *   }
 *   return nullptr;
 * }
 */
#if FOLLY_HAS_EXTENSION(nullability)
#define FOLLY_NULLABLE _Nullable
#define FOLLY_NONNULL _Nonnull
#else
#define FOLLY_NULLABLE
#define FOLLY_NONNULL
#endif

/**
 * "Cold" indicates to the compiler that a function is only expected to be
 * called from unlikely code paths. It can affect decisions made by the
 * optimizer both when processing the function body and when analyzing
 * call-sites.
 */
#if __GNUC__
#define FOLLY_COLD __attribute__((__cold__))
#else
#define FOLLY_COLD
#endif
