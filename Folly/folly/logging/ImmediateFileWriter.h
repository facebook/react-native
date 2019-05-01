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

#include <folly/File.h>
#include <folly/Range.h>
#include <folly/logging/LogWriter.h>

namespace folly {

/**
 * A LogWriter implementation that immediately writes to a file descriptor when
 * it is invoked.
 *
 * The downside of this class is that logging I/O occurs directly in your
 * normal program threads, so that logging I/O may block or slow down normal
 * processing.
 *
 * However, one benefit of this class is that log messages are written out
 * immediately, so if your program crashes, all log messages generated before
 * the crash will have already been written, and no messages will be lost.
 */
class ImmediateFileWriter : public LogWriter {
 public:
  /**
   * Construct an ImmediateFileWriter that appends to the file at the specified
   * path.
   */
  explicit ImmediateFileWriter(folly::StringPiece path);

  /**
   * Construct an ImmediateFileWriter that writes to the specified File object.
   */
  explicit ImmediateFileWriter(folly::File&& file);

  using LogWriter::writeMessage;
  void writeMessage(folly::StringPiece buffer, uint32_t flags = 0) override;
  void flush() override;

  /**
   * Returns true if the output steam is a tty.
   */
  bool ttyOutput() const override {
    return isatty(file_.fd());
  }

  /**
   * Get the output file.
   */
  const folly::File& getFile() const {
    return file_;
  }

 private:
  ImmediateFileWriter(ImmediateFileWriter const&) = delete;
  ImmediateFileWriter& operator=(ImmediateFileWriter const&) = delete;

  folly::File file_;
};
} // namespace folly
