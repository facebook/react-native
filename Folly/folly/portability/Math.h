/*
 * Copyright 2016-present Facebook, Inc.
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

#include <cmath>

namespace folly {

#ifndef __ANDROID__

/**
 * Most platforms hopefully provide std::nextafter.
 */

/* using override */ using std::nextafter;

#else // !__ANDROID__

/**
 * On Android, std::nextafter isn't implemented. However, the C functions and
 * compiler builtins are still provided. Using the GCC builtin is actually
 * slightly faster, as they're constexpr and the use cases within folly are in
 * constexpr context.
 */

#if defined(__GNUC__) && !defined(__clang__)

constexpr float nextafter(float x, float y) {
  return __builtin_nextafterf(x, y);
}

constexpr double nextafter(double x, double y) {
  return __builtin_nextafter(x, y);
}

constexpr long double nextafter(long double x, long double y) {
  return __builtin_nextafterl(x, y);
}

#else // __GNUC__

inline float nextafter(float x, float y) {
  return ::nextafterf(x, y);
}

inline double nextafter(double x, double y) {
  return ::nextafter(x, y);
}

inline long double nextafter(long double x, long double y) {
  return ::nextafterl(x, y);
}

#endif // __GNUC__

#endif // __ANDROID__
} // namespace folly
