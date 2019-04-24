/*
 * Copyright 2018-present Facebook, Inc.
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
#include <folly/synchronization/AtomicNotification.h>

#include <cstdint>

namespace folly {
namespace detail {
namespace atomic_notification {

// ParkingLot instance used for the atomic_wait() family of functions
//
// This has been defined as a static object (as opposed to allocated to avoid
// destruction order problems) because of possible uses coming from
// allocation-sensitive contexts.
ParkingLot<std::uint32_t> parkingLot;

} // namespace atomic_notification
} // namespace detail
} // namespace folly
