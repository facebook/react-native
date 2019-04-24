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

#if defined(__ELF__) && (defined(__x86_64__) || defined(__i386__))

#include <folly/tracing/StaticTracepoint-ELFx86.h>

#define FOLLY_SDT(provider, name, ...) \
  FOLLY_SDT_PROBE_N(                   \
      provider, name, 0, FOLLY_SDT_NARG(0, ##__VA_ARGS__), ##__VA_ARGS__)
// Use FOLLY_SDT_DEFINE_SEMAPHORE(provider, name) to define the semaphore
// as global variable before using the FOLLY_SDT_WITH_SEMAPHORE macro
#define FOLLY_SDT_WITH_SEMAPHORE(provider, name, ...) \
  FOLLY_SDT_PROBE_N(                                  \
      provider, name, 1, FOLLY_SDT_NARG(0, ##__VA_ARGS__), ##__VA_ARGS__)
#define FOLLY_SDT_IS_ENABLED(provider, name) \
  (FOLLY_SDT_SEMAPHORE(provider, name) > 0)

#else

#define FOLLY_SDT(provider, name, ...) \
  do {                                 \
  } while (0)
#define FOLLY_SDT_WITH_SEMAPHORE(provider, name, ...) \
  do {                                                \
  } while (0)
#define FOLLY_SDT_IS_ENABLED(provider, name) (false)
#define FOLLY_SDT_DEFINE_SEMAPHORE(provider, name)
#define FOLLY_SDT_DECLARE_SEMAPHORE(provider, name)
#endif
