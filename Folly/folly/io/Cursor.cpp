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

#include <folly/io/Cursor.h>

#include <cstdio>

#include <folly/ScopeGuard.h>

namespace folly {
namespace io {

void Appender::printf(const char* fmt, ...) {
  va_list ap;
  va_start(ap, fmt);
  vprintf(fmt, ap);
  va_end(ap);
}

void Appender::vprintf(const char* fmt, va_list ap) {
  // Make a copy of ap in case we need to retry.
  // We use ap on the first attempt, so it always gets advanced
  // passed the used arguments.  We'll only use apCopy if we need to retry.
  va_list apCopy;
  va_copy(apCopy, ap);
  SCOPE_EXIT {
    va_end(apCopy);
  };

  // First try writing into our available data space.
  int ret =
      vsnprintf(reinterpret_cast<char*>(writableData()), length(), fmt, ap);
  if (ret < 0) {
    throw std::runtime_error("error formatting printf() data");
  }
  auto len = size_t(ret);
  // vsnprintf() returns the number of characters that would be printed,
  // not including the terminating nul.
  if (len < length()) {
    // All of the data was successfully written.
    append(len);
    return;
  }

  // There wasn't enough room for the data.
  // Allocate more room, and then retry.
  ensure(len + 1);
  ret =
      vsnprintf(reinterpret_cast<char*>(writableData()), length(), fmt, apCopy);
  if (ret < 0) {
    throw std::runtime_error("error formatting printf() data");
  }
  len = size_t(ret);
  if (len >= length()) {
    // This shouldn't ever happen.
    throw std::runtime_error(
        "unexpectedly out of buffer space on second "
        "vsnprintf() attmept");
  }
  append(len);
}
} // namespace io
} // namespace folly
