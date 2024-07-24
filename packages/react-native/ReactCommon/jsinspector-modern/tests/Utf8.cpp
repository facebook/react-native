/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <jsinspector-modern/Utf8.h>

#include <gmock/gmock.h>
#include <gtest/gtest.h>

using namespace ::testing;

namespace facebook::react::jsinspector_modern {

TEST(Utf8Test, TruncateToValidUtf8) {
  auto buffer = std::vector<char>();
  std::vector<std::pair<std::string, size_t>> expectedStringsUpToSizes;
  // Construct a buffer with a concatenation of all code points, and a vector
  // or "expectedStringsUpToSizes", pairs of valid UTF8 prefix strings and sizes
  // "n" such that the string would be the expected truncation of the first "n"
  // bytes of the buffer.
  for (const std::string& codePoint : {
           "a", // 1 byte
           "é", // 2 bytes
           "✓", // 3 bytes
           "😀" // 4 bytes
       }) {
    auto partial = std::string(buffer.data(), buffer.size());
    buffer.insert(buffer.end(), codePoint.begin(), codePoint.end());
    expectedStringsUpToSizes.push_back(std::pair(partial, buffer.size()));
  }
  // The constructed buffer is 10 bytes long, comprised of 4 code points of
  // varied size. Range over naive slices of length 0-9 ensuring that the
  // truncated result matches the valid UTF8 substring of length <= n.
  size_t n = 0;
  for (const auto& expectedStringUpToSize : expectedStringsUpToSizes) {
    auto nextSize = expectedStringUpToSize.second;
    auto expectedString = expectedStringUpToSize.first;
    for (; n < nextSize; ++n) {
      // Take the first n bytes of the whole buffer, which may be slicing
      // through the middle of a code point.
      std::vector<char> slice(buffer.begin(), buffer.begin() + n);
      truncateToValidUTF8(slice);
      // Expect the final code point fragment has been discarded and that the
      // contents are equal to expectedString, which is valid UTF8.
      EXPECT_EQ(std::string(slice.begin(), slice.end()), expectedString);
    }
  }
  // Finally verify that truncating the whole buffer, which is already valid
  // UTF8, is a no-op.
  auto wholeString = std::string(buffer.begin(), buffer.end());
  truncateToValidUTF8(buffer);
  EXPECT_EQ(std::string(buffer.begin(), buffer.end()), wholeString);
}

} // namespace facebook::react::jsinspector_modern
