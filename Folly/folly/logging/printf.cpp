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
#include <folly/logging/printf.h>

#include <cstdarg>

#include <folly/Conv.h>
#include <folly/String.h>

namespace folly {

std::string loggingFormatPrintf(const char* format, ...) noexcept {
  va_list ap;
  va_start(ap, format);
  SCOPE_EXIT {
    va_end(ap);
  };
  try {
    return stringVPrintf(format, ap);
  } catch (const std::exception&) {
    // We don't bother including the exception message here.
    // The exceptions thrown by stringVPrintf() don't normally have much useful
    // information regarding what precisely went wrong.
    return folly::to<std::string>(
        "error formatting printf-style log message: ", format);
  }
}
} // namespace folly
