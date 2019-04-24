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
#include <folly/logging/xlog.h>

namespace logging_test {

// A sample functions that uses XLOGF() macros in a header file.
inline void testXlogHdrLoop(size_t numIters, folly::StringPiece arg) {
  XLOGF(DBG1, "starting: {}", arg);
  for (size_t n = 0; n < numIters; ++n) {
    XLOGF(DBG5, "test: {}", arg);
  }
  XLOGF(DBG1, "finished: {}", arg);
}

// Prototypes for functions defined in XlogFile1.cpp and XlogFile2.cpp
void testXlogFile1Dbg1(folly::StringPiece msg);
void testXlogFile2Dbg1(folly::StringPiece msg);
} // namespace logging_test
