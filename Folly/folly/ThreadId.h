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

#include <cstdint>

#include <pthread.h>

namespace folly {

inline uint64_t getCurrentThreadID() {
#ifdef _WIN32
  // There's no need to force a Windows.h include, so grab the ID
  // via pthread instead.
  return uint64_t(pthread_getw32threadid_np(pthread_self()));
#else
  return uint64_t(pthread_self());
#endif
}
}
