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

#include <glog/logging.h>

#ifdef HAZPTR_DEBUG
#define HAZPTR_DEBUG_ HAZPTR_DEBUG
#else
#define HAZPTR_DEBUG_ false
#endif

#define HAZPTR_DEBUG_PRINT(...)                      \
  do {                                               \
    if (HAZPTR_DEBUG_) {                             \
      VLOG(2) << __func__ << " --- " << __VA_ARGS__; \
    }                                                \
  } while (false)
