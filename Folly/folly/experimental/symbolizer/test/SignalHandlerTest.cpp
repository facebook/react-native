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

#include <folly/experimental/symbolizer/test/SignalHandlerTest.h>
#include <folly/experimental/symbolizer/SignalHandler.h>

#include <folly/CPortability.h>
#include <folly/FileUtil.h>
#include <folly/Range.h>
#include <folly/portability/GTest.h>

namespace folly {
namespace symbolizer {
namespace test {

namespace {

void print(StringPiece sp) {
  writeFull(STDERR_FILENO, sp.data(), sp.size());
}

void callback1() {
  print("Callback1\n");
}

void callback2() {
  print("Callback2\n");
}

} // namespace

TEST(SignalHandler, Simple) {
  addFatalSignalCallback(callback1);
  addFatalSignalCallback(callback2);
  installFatalSignalHandler();
  installFatalSignalCallbacks();

  EXPECT_DEATH(
      failHard(),
      "^\\*\\*\\* Aborted at [0-9]+ \\(Unix time, try 'date -d @[0-9]+'\\) "
      "\\*\\*\\*\n"
      "\\*\\*\\* Signal 11 \\(SIGSEGV\\) \\(0x2a\\) received by PID [0-9]+ "
      "\\(pthread TID 0x[0-9a-f]+\\) \\(linux TID [0-9]+\\) "
      "\\(maybe from PID [0-9]+, UID [0-9]+\\) "
      "\\(code: address not mapped to object\\), "
      "stack trace: \\*\\*\\*\n"
      ".*\n"
      ".*    @ [0-9a-f]+.* folly::symbolizer::test::SignalHandler_Simple_Test"
      "::TestBody\\(\\).*\n"
      ".*\n"
      ".*    @ [0-9a-f]+.* main.*\n"
      ".*\n"
      "Callback1\n"
      "Callback2\n"
      ".*");
}
} // namespace test
} // namespace symbolizer
} // namespace folly

// Can't use initFacebookLight since that would install its own signal handlers
// Can't use initFacebookNoSignals since we cannot depend on common
int main(int argc, char** argv) {
  ::testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}
