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

#include <folly/experimental/symbolizer/LineReader.h>

#include <cstring>

#include <folly/FileUtil.h>

namespace folly {
namespace symbolizer {

LineReader::LineReader(int fd, char* buf, size_t bufSize)
    : fd_(fd),
      buf_(buf),
      bufEnd_(buf_ + bufSize),
      bol_(buf),
      eol_(buf),
      end_(buf),
      state_(kReading) {}

LineReader::State LineReader::readLine(StringPiece& line) {
  bol_ = eol_; // Start past what we already returned
  for (;;) {
    // Search for newline
    char* newline = static_cast<char*>(memchr(eol_, '\n', end_ - eol_));
    if (newline) {
      eol_ = newline + 1;
      break;
    } else if (state_ != kReading || (bol_ == buf_ && end_ == bufEnd_)) {
      // If the buffer is full with one line (line too long), or we're
      // at the end of the file, return what we have.
      eol_ = end_;
      break;
    }

    // We don't have a full line in the buffer, but we have room to read.
    // Move to the beginning of the buffer.
    memmove(buf_, eol_, end_ - eol_);
    end_ -= (eol_ - buf_);
    bol_ = buf_;
    eol_ = end_;

    // Refill
    ssize_t available = bufEnd_ - end_;
    ssize_t n = readFull(fd_, end_, available);
    if (n < 0) {
      state_ = kError;
      n = 0;
    } else if (n < available) {
      state_ = kEof;
    }
    end_ += n;
  }

  line.assign(bol_, eol_);
  return eol_ != bol_ ? kReading : state_;
}
} // namespace symbolizer
} // namespace folly
