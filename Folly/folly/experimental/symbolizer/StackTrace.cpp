/*
 * Copyright 2013-present Facebook, Inc.
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
#include <folly/experimental/symbolizer/StackTrace.h>

// Must be first to ensure that UNW_LOCAL_ONLY is defined
#define UNW_LOCAL_ONLY 1
#include <libunwind.h>

namespace folly {
namespace symbolizer {

ssize_t getStackTrace(uintptr_t* addresses, size_t maxAddresses) {
  static_assert(
      sizeof(uintptr_t) == sizeof(void*), "uintptr_t / pointer size mismatch");
  // The libunwind documentation says that unw_backtrace is async-signal-safe
  // but, as of libunwind 1.0.1, it isn't (tdep_trace allocates memory on
  // x86_64)
  int r = unw_backtrace(reinterpret_cast<void**>(addresses), maxAddresses);
  return r < 0 ? -1 : r;
}

namespace {
inline bool getFrameInfo(unw_cursor_t* cursor, uintptr_t& ip) {
  unw_word_t uip;
  if (unw_get_reg(cursor, UNW_REG_IP, &uip) < 0) {
    return false;
  }
  int r = unw_is_signal_frame(cursor);
  if (r < 0) {
    return false;
  }
  // Use previous instruction in normal (call) frames (because the
  // return address might not be in the same function for noreturn functions)
  // but not in signal frames.
  ip = uip - (r == 0);
  return true;
}
} // namespace

ssize_t getStackTraceSafe(uintptr_t* addresses, size_t maxAddresses) {
  if (maxAddresses == 0) {
    return 0;
  }
  unw_context_t context;
  if (unw_getcontext(&context) < 0) {
    return -1;
  }
  unw_cursor_t cursor;
  if (unw_init_local(&cursor, &context) < 0) {
    return -1;
  }
  if (!getFrameInfo(&cursor, *addresses)) {
    return -1;
  }
  ++addresses;
  size_t count = 1;
  for (; count != maxAddresses; ++count, ++addresses) {
    int r = unw_step(&cursor);
    if (r < 0) {
      return -1;
    }
    if (r == 0) {
      break;
    }
    if (!getFrameInfo(&cursor, *addresses)) {
      return -1;
    }
  }
  return count;
}
} // namespace symbolizer
} // namespace folly
