/*
 * Copyright 2016-present Facebook, Inc.
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

#include <ostream>
#include <vector>

#include <folly/experimental/exception_tracer/ExceptionTracer.h>

namespace folly {
namespace exception_tracer {

struct ExceptionStats {
  uint64_t count;
  ExceptionInfo info;
};

/**
 * This function accumulates exception throwing statistics across all threads.
 * Please note, that during call to this function, other threads might block
 * on exception throws, so it should be called seldomly.
 * All pef-thread statistics is being reset by the call.
 */
std::vector<ExceptionStats> getExceptionStatistics();

std::ostream& operator<<(std::ostream& out, const ExceptionStats& data);

} // namespace exception_tracer
} // namespace folly
