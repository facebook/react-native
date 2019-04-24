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

// Make sure we include ThreadId.h before anything else.
// There is no ThreadId.cpp file, so this test is the only thing that verifies
// that ThreadId.h compiles by itself when included first.
#include <folly/system/ThreadId.h>

#include <thread>

#include <folly/portability/GTest.h>

TEST(ThreadId, getCurrentID) {
  auto thisThreadID = folly::getCurrentThreadID();
  uint64_t otherThreadID;
  std::thread otherThread{[&] { otherThreadID = folly::getCurrentThreadID(); }};
  otherThread.join();
  EXPECT_NE(thisThreadID, otherThreadID);
}

TEST(ThreadId, getOSThreadID) {
  auto thisThreadID = folly::getOSThreadID();
  uint64_t otherThreadID;
  std::thread otherThread{[&] { otherThreadID = folly::getOSThreadID(); }};
  otherThread.join();
  EXPECT_NE(thisThreadID, otherThreadID);
}
