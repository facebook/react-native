/*
 * Copyright 2017 Facebook, Inc.
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

#define FOLLY_SDT(provider, name, ...)                                         \
  FOLLY_SDT_PROBE_N(                                                           \
    provider, name, FOLLY_SDT_NARG(0, ##__VA_ARGS__), ##__VA_ARGS__)
#else
#define FOLLY_SDT(provider, name, ...) do {} while(0)
#endif
