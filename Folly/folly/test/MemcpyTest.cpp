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

#include <folly/Portability.h>

#include <folly/portability/GTest.h>

namespace {

constexpr size_t kSize = 4096 * 4;
char src[kSize];
char dst[kSize];

void init() {
  for (size_t i = 0; i < kSize; ++i) {
    src[i] = static_cast<char>(i);
    dst[i] = static_cast<char>(255 - i);
  }
}
}

TEST(memcpy, zero_len)
    FOLLY_DISABLE_UNDEFINED_BEHAVIOR_SANITIZER("nonnull-attribute") {
  // If length is 0, we shouldn't touch any memory.  So this should
  // not crash.
  char* srcNull = nullptr;
  char* dstNull = nullptr;
  memcpy(dstNull, srcNull, 0);
}

// Test copy `len' bytes and verify that exactly `len' bytes are copied.
void testLen(size_t len) {
  if (len > kSize) {
    return;
  }
  init();
  memcpy(dst, src, len);
  for (size_t i = 0; i < len; ++i) {
    EXPECT_EQ(src[i], static_cast<char>(i));
    EXPECT_EQ(src[i], dst[i]);
  }
  if (len < kSize) {
    EXPECT_EQ(src[len], static_cast<char>(len));
    EXPECT_EQ(dst[len], static_cast<char>(255 - len));
  }
}

TEST(memcpy, small) {
  for (size_t len = 1; len < 8; ++len) {
    testLen(len);
  }
}

TEST(memcpy, main) {
  for (size_t len = 8; len < 128; ++len) {
    testLen(len);
  }

  for (size_t len = 128; len < kSize; len += 128) {
    testLen(len);
  }

  for (size_t len = 128; len < kSize; len += 73) {
    testLen(len);
  }
}
