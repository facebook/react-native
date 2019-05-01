/*
 * Copyright 2012-present Facebook, Inc.
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

//
// Exception tracer library.

#pragma once

#include <cstdint>
#include <iosfwd>
#include <typeinfo>
#include <vector>

namespace folly {
namespace exception_tracer {

struct ExceptionInfo {
  const std::type_info* type{nullptr};
  // The values in frames are IP (instruction pointer) addresses.
  // They are only filled if the low-level exception tracer library is
  // linked in or LD_PRELOADed.
  std::vector<uintptr_t> frames; // front() is top of stack
};

void printExceptionInfo(
    std::ostream& out,
    const ExceptionInfo& info,
    int options);
std::ostream& operator<<(std::ostream& out, const ExceptionInfo& info);

/**
 * Get current exceptions being handled.  front() is the most recent exception.
 * There should be at most one unless rethrowing.
 */
std::vector<ExceptionInfo> getCurrentExceptions();

/**
 * Install the terminate / unexpected handlers to dump exceptions.
 */
void installHandlers();

} // namespace exception_tracer
} // namespace folly
