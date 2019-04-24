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

#include <folly/test/SingletonTestStructs.h>

#include <atomic>

namespace {
// A simple class that tracks how often instances of the class and
// subclasses are created, and the ordering.  Also tracks a global
// unique counter for each object.
std::atomic<size_t> global_counter(19770326);
} // namespace

std::vector<Watchdog*>& Watchdog::creation_order() {
  static std::vector<Watchdog*> ret;
  return ret;
}

Watchdog::Watchdog() : serial_number(++global_counter) {
  creation_order().push_back(this);
}
