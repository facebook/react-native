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
#include <folly/logging/LogStream.h>

namespace folly {

LogStreamBuffer::int_type LogStreamBuffer::overflow(int_type ch) {
  auto currentSize = str_.size();
  size_t newSize;
  if (currentSize == 0) {
    newSize = kInitialCapacity;
  } else {
    // Increase by 1.25 each time
    newSize = currentSize + (currentSize >> 2);
  }

  try {
    str_.resize(newSize);

    if (ch == EOF) {
      setp((&str_.front()) + currentSize, (&str_.front()) + newSize);
      return 'x';
    } else {
      str_[currentSize] = static_cast<char>(ch);
      setp((&str_.front()) + currentSize + 1, (&str_.front()) + newSize);
      return ch;
    }
  } catch (const std::exception&) {
    // Return EOF to indicate that the operation failed.
    // In general the only exception we really expect to see here is
    // std::bad_alloc() from the str_.resize() call.
    return EOF;
  }
}

LogStream::LogStream(LogStreamProcessor* processor)
    : std::ostream(nullptr), processor_{processor} {
  rdbuf(&buffer_);
}

LogStream::~LogStream() {}
} // namespace folly
