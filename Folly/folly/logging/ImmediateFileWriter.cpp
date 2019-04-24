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
#include <folly/logging/ImmediateFileWriter.h>

#include <folly/FileUtil.h>
#include <folly/String.h>
#include <folly/logging/LoggerDB.h>
#include <folly/portability/Unistd.h>

using folly::StringPiece;

namespace folly {

ImmediateFileWriter::ImmediateFileWriter(StringPiece path)
    : file_{path.str(), O_WRONLY | O_APPEND | O_CREAT} {}

ImmediateFileWriter::ImmediateFileWriter(folly::File&& file)
    : file_{std::move(file)} {}

void ImmediateFileWriter::writeMessage(
    StringPiece buffer,
    uint32_t /* flags */) {
  // Write the data.
  // We are doing direct file descriptor writes here, so there is no buffering
  // of log message data.  Each message is immediately written to the output.
  auto ret = folly::writeFull(file_.fd(), buffer.data(), buffer.size());
  if (ret < 0) {
    int errnum = errno;
    LoggerDB::internalWarning(
        __FILE__,
        __LINE__,
        "error writing to log file ",
        file_.fd(),
        ": ",
        errnoStr(errnum));
  }
}

void ImmediateFileWriter::flush() {}
} // namespace folly
