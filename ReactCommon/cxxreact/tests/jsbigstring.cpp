// Copyright 2004-present Facebook. All Rights Reserved.
#include <sys/mman.h>
#include <fcntl.h>

#include <folly/File.h>
#include <gtest/gtest.h>
#include <cxxreact/Executor.h>
#include <cxxreact/MethodCall.h>

using namespace facebook;
using namespace facebook::react;

namespace {
int tempFileFromString(std::string contents)
{
  std::string tmp {getenv("TMPDIR")};
  tmp += "/temp.XXXXXX";

  std::vector<char> tmpBuf {tmp.begin(), tmp.end()};
  tmpBuf.push_back('\0');

  const int fd = mkstemp(tmpBuf.data());
  write(fd, contents.c_str(), contents.size() + 1);

  return fd;
}
};

TEST(JSBigFileString, MapWholeFileTest) {
  std::string data {"Hello, world"};
  const auto size = data.length() + 1;

  // Initialise Big String
  int fd = tempFileFromString("Hello, world");
  JSBigFileString bigStr {fd, size};

  // Test
  ASSERT_STREQ(data.c_str(), bigStr.c_str());
}

TEST(JSBigFileString, MapPartTest) {
  std::string data {"Hello, world"};

  // Sub-string to actually map
  std::string needle {"or"};
  off_t offset = data.find(needle);

  // Initialise Big String
  int fd = tempFileFromString(data);
  JSBigFileString bigStr {fd, needle.size(), offset};

  // Test
  ASSERT_EQ(needle.length(), bigStr.size());
  for (unsigned int i = 0; i < needle.length(); ++i) {
    ASSERT_EQ(needle[i], bigStr.c_str()[i]);
  }
}
