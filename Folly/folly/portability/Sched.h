/*
 * Copyright 2017-present Facebook, Inc.
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

#ifndef _WIN32
#include <sched.h>
#else
#define SCHED_OTHER 0
#define SCHED_FIFO 1
#define SCHED_RR 2

namespace folly {
namespace portability {
namespace sched {
struct sched_param {
  int sched_priority;
};
int sched_yield();
int sched_get_priority_min(int policy);
int sched_get_priority_max(int policy);
} // namespace sched
} // namespace portability
} // namespace folly

/* using override */ using namespace folly::portability::sched;
#endif
