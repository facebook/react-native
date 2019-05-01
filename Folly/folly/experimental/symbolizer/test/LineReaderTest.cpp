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

#include <folly/experimental/symbolizer/LineReader.h>

#include <glog/logging.h>

#include <folly/FileUtil.h>
#include <folly/experimental/TestUtil.h>
#include <folly/portability/GTest.h>

namespace folly {
namespace symbolizer {
namespace test {

using folly::test::TemporaryFile;

void writeAll(int fd, const char* str) {
  ssize_t n = strlen(str);
  CHECK_EQ(n, writeFull(fd, str, n));
}

void expect(LineReader& lr, const char* expected) {
  StringPiece line;
  size_t expectedLen = strlen(expected);
  EXPECT_EQ(
      expectedLen != 0 ? LineReader::kReading : LineReader::kEof,
      lr.readLine(line));
  EXPECT_EQ(expectedLen, line.size());
  EXPECT_EQ(std::string(expected, expectedLen), line.str());
}

TEST(LineReader, Simple) {
  TemporaryFile file;
  int fd = file.fd();
  writeAll(
      fd,
      "Meow\n"
      "Hello world\n"
      "This is a long line. It is longer than the other lines.\n"
      "\n"
      "Incomplete last line");

  {
    CHECK_ERR(lseek(fd, 0, SEEK_SET));
    char buf[10];
    LineReader lr(fd, buf, sizeof(buf));
    expect(lr, "Meow\n");
    expect(lr, "Hello worl");
    expect(lr, "d\n");
    expect(lr, "This is a ");
    expect(lr, "long line.");
    expect(lr, " It is lon");
    expect(lr, "ger than t");
    expect(lr, "he other l");
    expect(lr, "ines.\n");
    expect(lr, "\n");
    expect(lr, "Incomplete");
    expect(lr, " last line");
    expect(lr, "");
  }

  {
    CHECK_ERR(lseek(fd, 0, SEEK_SET));
    char buf[80];
    LineReader lr(fd, buf, sizeof(buf));
    expect(lr, "Meow\n");
    expect(lr, "Hello world\n");
    expect(lr, "This is a long line. It is longer than the other lines.\n");
    expect(lr, "\n");
    expect(lr, "Incomplete last line");
    expect(lr, "");
  }
}
} // namespace test
} // namespace symbolizer
} // namespace folly
