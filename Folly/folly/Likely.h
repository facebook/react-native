/*
 * Copyright 2011-present Facebook, Inc.
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

#pragma once

#if __GNUC__
#define FOLLY_DETAIL_BUILTIN_EXPECT(b, t) (__builtin_expect(b, t))
#else
#define FOLLY_DETAIL_BUILTIN_EXPECT(b, t) b
#endif

//  Likeliness annotations
//
//  Useful when the author has better knowledge than the compiler of whether
//  the branch condition is overwhelmingly likely to take a specific value.
//
//  Useful when the author has better knowledge than the compiler of which code
//  paths are designed as the fast path and which are designed as the slow path,
//  and to force the compiler to optimize for the fast path, even when it is not
//  overwhelmingly likely.

#define FOLLY_LIKELY(x) FOLLY_DETAIL_BUILTIN_EXPECT((x), 1)
#define FOLLY_UNLIKELY(x) FOLLY_DETAIL_BUILTIN_EXPECT((x), 0)

//  Un-namespaced annotations

#undef LIKELY
#undef UNLIKELY

#if defined(__GNUC__)
#define LIKELY(x) (__builtin_expect((x), 1))
#define UNLIKELY(x) (__builtin_expect((x), 0))
#else
#define LIKELY(x) (x)
#define UNLIKELY(x) (x)
#endif
