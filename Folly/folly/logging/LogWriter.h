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

#include <folly/Range.h>

namespace folly {

/**
 * LogWriter defines the interface for processing a serialized log message.
 */
class LogWriter {
 public:
  /**
   * Bit flag values for use with writeMessage()
   */
  enum Flags : uint32_t {
    NO_FLAGS = 0x00,
    /**
     * Ensure that this log message never gets discarded.
     *
     * Some LogWriter implementations may discard messages when messages are
     * being received faster than they can be written.  This flag ensures that
     * this message will never be discarded.
     *
     * This flag is used to ensure that LOG(FATAL) messages never get
     * discarded, so we always report the reason for a crash.
     */
    NEVER_DISCARD = 0x01,
  };

  virtual ~LogWriter() {}

  /**
   * Write a serialized log message.
   *
   * The flags parameter is a bitwise-ORed set of Flag values defined above.
   */
  virtual void writeMessage(folly::StringPiece buffer, uint32_t flags = 0) = 0;

  /**
   * Write a serialized message.
   *
   * This version of writeMessage() accepts a std::string&&.
   * The default implementation calls the StringPiece version of
   * writeMessage(), but subclasses may override this implementation if
   * desired.
   */
  virtual void writeMessage(std::string&& buffer, uint32_t flags = 0) {
    writeMessage(folly::StringPiece{buffer}, flags);
  }

  /**
   * Block until all messages that have already been sent to this LogWriter
   * have been written.
   *
   * Other threads may still call writeMessage() while flush() is running.
   * writeMessage() calls that did not complete before the flush() call started
   * will not necessarily be processed by the flush call.
   */
  virtual void flush() = 0;

  /**
   * Is the log writer writing to a tty or not.
   */
  virtual bool ttyOutput() const = 0;
};
} // namespace folly
