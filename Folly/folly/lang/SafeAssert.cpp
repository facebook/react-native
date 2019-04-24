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

#include <folly/lang/SafeAssert.h>

#include <folly/Conv.h>
#include <folly/FileUtil.h>

namespace folly {
namespace detail {

namespace {
void writeStderr(const char* s, size_t len) {
  writeFull(STDERR_FILENO, s, len);
}
void writeStderr(const char* s) {
  writeStderr(s, strlen(s));
}
} // namespace

void assertionFailure(
    const char* expr,
    const char* msg,
    const char* file,
    unsigned int line,
    const char* function) {
  writeStderr("\n\nAssertion failure: ");
  writeStderr(expr + 1, strlen(expr) - 2);
  writeStderr("\nMessage: ");
  writeStderr(msg);
  writeStderr("\nFile: ");
  writeStderr(file);
  writeStderr("\nLine: ");
  char buf[20];
  uint32_t n = uint64ToBufferUnsafe(line, buf);
  writeFull(STDERR_FILENO, buf, n);
  writeStderr("\nFunction: ");
  writeStderr(function);
  writeStderr("\n");
  fsyncNoInt(STDERR_FILENO);
  abort();
}

} // namespace detail
} // namespace folly
