/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fcntl.h>
#include <sys/mman.h>

#include <cxxreact/JSBigString.h>
#include <gtest/gtest.h>

using namespace facebook::react;

namespace {
int tempFileFromString(const std::string& contents) {
  const char* tmpDir = getenv("TMPDIR");
  if (tmpDir == nullptr) {
    tmpDir = "/tmp";
  }
  std::string tmp{tmpDir};
  tmp += "/temp.XXXXXX";

  std::vector<char> tmpBuf{tmp.begin(), tmp.end()};
  tmpBuf.push_back('\0');

  const int fd = mkstemp(tmpBuf.data());
  write(fd, contents.c_str(), contents.size() + 1);

  return fd;
}
}; // namespace

TEST(JSBigFileString, MapWholeFileTest) {
  std::string data{"Hello, world"};
  const auto size = data.length() + 1;

  // Initialise Big String
  int fd = tempFileFromString("Hello, world");
  JSBigFileString bigStr{fd, size};

  // Test
  ASSERT_STREQ(data.c_str(), bigStr.c_str());
}

TEST(JSBigFileString, MapPartTest) {
  std::string data{"Hello, world"};

  // Sub-string to actually map
  std::string needle{"or"};
  off_t offset = data.find(needle);

  // Initialise Big String
  int fd = tempFileFromString(data);
  JSBigFileString bigStr{fd, needle.size(), offset};

  // Test
  EXPECT_EQ(needle.length(), bigStr.size());
  for (unsigned int i = 0; i < needle.length(); ++i) {
    EXPECT_EQ(needle[i], bigStr.c_str()[i]);
  }
}

TEST(JSBigFileString, MapPartAtLargeOffsetTest) {
  std::string data(8 * 4096, 'X');
  data += "Hello World!";

  // Sub-string to actually map
  std::string needle{"or"};
  off_t offset = data.find(needle);

  // Initialise Big String
  int fd = tempFileFromString(data);
  JSBigFileString bigStr{fd, needle.size(), offset};

  // Test
  EXPECT_EQ(needle.length(), bigStr.size());
  for (unsigned int i = 0; i < needle.length(); ++i) {
    EXPECT_EQ(needle[i], bigStr.c_str()[i]);
  }
}
