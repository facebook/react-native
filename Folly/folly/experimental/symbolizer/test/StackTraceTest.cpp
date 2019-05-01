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

#include <cstring>

#include <folly/experimental/TestUtil.h>
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

ssize_t read_all(int fd, uint8_t* buffer, size_t size) {
  uint8_t* pos = buffer;
  ssize_t bytes_read;
  do {
    bytes_read = read(fd, pos, size);
    if (bytes_read < 0) {
      if (errno == EAGAIN || errno == EWOULDBLOCK || errno == EINTR) {
        continue;
      }
      return bytes_read;
    }

    pos += bytes_read;
    size -= bytes_read;
  } while (bytes_read > 0 && size > 0);

  return pos - buffer;
}

// Returns the position in the file after done reading.
off_t get_stack_trace(int fd, size_t file_pos, uint8_t* buffer, size_t count) {
  off_t rv = lseek(fd, file_pos, SEEK_SET);
  CHECK_EQ(rv, (off_t)file_pos);

  // Subtract 1 from size of buffer to hold nullptr.
  ssize_t bytes_read = read_all(fd, buffer, count - 1);
  CHECK_GT(bytes_read, 0);
  buffer[bytes_read] = '\0';
  return lseek(fd, 0, SEEK_CUR);
}

template <class StackTracePrinter>
void testStackTracePrinter(StackTracePrinter& printer, int fd) {
  ASSERT_GT(fd, 0);

  printer.printStackTrace(true);
  printer.flush();

  std::array<uint8_t, 4000> first;
  off_t pos = get_stack_trace(fd, 0, first.data(), first.size());
  ASSERT_GT(pos, 0);

  printer.printStackTrace(true);
  printer.flush();

  std::array<uint8_t, 4000> second;
  get_stack_trace(fd, pos, second.data(), second.size());

  // The first two lines refer to this stack frame, which is different in the
  // two cases, so strip those off.  The rest should be equal.
  ASSERT_STREQ(
      strchr(strchr((const char*)first.data(), '\n') + 1, '\n') + 1,
      strchr(strchr((const char*)second.data(), '\n') + 1, '\n') + 1);
}

TEST(StackTraceTest, SafeStackTracePrinter) {
  test::TemporaryFile file;

  SafeStackTracePrinter printer{10, file.fd()};

  testStackTracePrinter<SafeStackTracePrinter>(printer, file.fd());
}

TEST(StackTraceTest, FastStackTracePrinter) {
  test::TemporaryFile file;

  FastStackTracePrinter printer{
      std::make_unique<FDSymbolizePrinter>(file.fd())};

  testStackTracePrinter<FastStackTracePrinter>(printer, file.fd());
}
