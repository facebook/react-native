/*
 * Copyright 2014-present Facebook, Inc.
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

#include <functional>

#include <folly/portability/Event.h>

namespace folly {

#if LIBEVENT_VERSION_NUMBER <= 0x02010101
#define FOLLY_LIBEVENT_COMPAT_PLUCK(name) ev_##name
#else
#define FOLLY_LIBEVENT_COMPAT_PLUCK(name) ev_evcallback.evcb_##name
#endif
#define FOLLY_LIBEVENT_DEF_ACCESSORS(name)                           \
  inline auto event_ref_##name(struct event* ev)                     \
      ->decltype(std::ref(ev->FOLLY_LIBEVENT_COMPAT_PLUCK(name))) {  \
    return std::ref(ev->FOLLY_LIBEVENT_COMPAT_PLUCK(name));          \
  }                                                                  \
  inline auto event_ref_##name(struct event const* ev)               \
      ->decltype(std::cref(ev->FOLLY_LIBEVENT_COMPAT_PLUCK(name))) { \
    return std::cref(ev->FOLLY_LIBEVENT_COMPAT_PLUCK(name));         \
  }                                                                  \
  //

FOLLY_LIBEVENT_DEF_ACCESSORS(flags)

#undef FOLLY_LIBEVENT_COMPAT_PLUCK
#undef FOLLY_LIBEVENT_DEF_ACCESSORS

/**
 * low-level libevent utility functions
 */
class EventUtil {
 public:
  static bool isEventRegistered(const struct event* ev) {
    // If any of these flags are set, the event is registered.
    enum {
      EVLIST_REGISTERED =
          (EVLIST_INSERTED | EVLIST_ACTIVE | EVLIST_TIMEOUT | EVLIST_SIGNAL)
    };
    return (event_ref_flags(ev) & EVLIST_REGISTERED);
  }
};

} // namespace folly
