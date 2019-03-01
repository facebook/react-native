/*
 * Copyright 2017 Facebook, Inc.
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

#include <folly/experimental/symbolizer/StackTrace.h>
#include <folly/experimental/symbolizer/Symbolizer.h>

#include <glog/logging.h>

#include <folly/portability/GTest.h>

using namespace folly;
using namespace folly::symbolizer;

FOLLY_NOINLINE void foo1();
FOLLY_NOINLINE void foo2();

void verifyStackTraces() {
  constexpr size_t kMaxAddresses = 100;
  FrameArray<kMaxAddresses> fa;
  CHECK(getStackTrace(fa));

  FrameArray<kMaxAddresses> faSafe;
  CHECK(getStackTraceSafe(faSafe));

  CHECK_EQ(fa.frameCount, faSafe.frameCount);

  if (VLOG_IS_ON(1)) {
    Symbolizer symbolizer;
    OStreamSymbolizePrinter printer(std::cerr, SymbolizePrinter::COLOR_IF_TTY);

    symbolizer.symbolize(fa);
    VLOG(1) << "getStackTrace\n";
    printer.println(fa);

    symbolizer.symbolize(faSafe);
    VLOG(1) << "getStackTraceSafe\n";
    printer.println(faSafe);
  }

  // Other than the top 2 frames (this one and getStackTrace /
  // getStackTraceSafe), the stack traces should be identical
  for (size_t i = 2; i < fa.frameCount; ++i) {
    LOG(INFO) << "i=" << i << " " << std::hex << "0x" << fa.addresses[i]
              << " 0x" << faSafe.addresses[i];
    EXPECT_EQ(fa.addresses[i], faSafe.addresses[i]);
  }
}

void foo1() {
  foo2();
}

void foo2() {
  verifyStackTraces();
}

volatile bool handled = false;
void handler(int /* num */, siginfo_t* /* info */, void* /* ctx */) {
  // Yes, getStackTrace and VLOG aren't async-signal-safe, but signals
  // raised with raise() aren't "async" signals.
  foo1();
  handled = true;
}

TEST(StackTraceTest, Simple) {
  foo1();
}

TEST(StackTraceTest, Signal) {
  struct sigaction sa;
  memset(&sa, 0, sizeof(sa));
  sa.sa_sigaction = handler;
  sa.sa_flags = SA_RESETHAND | SA_SIGINFO;
  CHECK_ERR(sigaction(SIGUSR1, &sa, nullptr));
  raise(SIGUSR1);
  EXPECT_TRUE(handled);
}

int main(int argc, char *argv[]) {
  testing::InitGoogleTest(&argc, argv);
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  google::InitGoogleLogging(argv[0]);
  return RUN_ALL_TESTS();
}
