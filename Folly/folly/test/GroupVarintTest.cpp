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

#include <stdarg.h>
#include <algorithm>
#include <folly/GroupVarint.h>

// On platforms where it's not supported, GroupVarint will be compiled out.
#if HAVE_GROUP_VARINT

#include <folly/portability/GTest.h>

using namespace folly;

namespace {

class StringAppender {
 public:
  /* implicit */ StringAppender(std::string& s) : s_(s) { }
  void operator()(StringPiece sp) {
    s_.append(sp.data(), sp.size());
  }
 private:
  std::string& s_;
};

typedef GroupVarintEncoder<uint32_t, StringAppender> GroupVarint32Encoder;
typedef GroupVarintEncoder<uint64_t, StringAppender> GroupVarint64Encoder;

// Expected bytes follow, terminate with -1
void testGroupVarint32(uint32_t a, uint32_t b, uint32_t c, uint32_t d, ...) {
  va_list ap;
  va_start(ap, d);
  std::vector<char> expectedBytes;
  int byte;
  while ((byte = va_arg(ap, int)) != -1) {
    expectedBytes.push_back(byte);
  }
  va_end(ap);

  size_t size = GroupVarint32::size(a, b, c, d);
  EXPECT_EQ(expectedBytes.size(), size);

  std::vector<char> foundBytes;

  // ssse3 decoding requires that the source buffer have length >= 17,
  // so that it can read 128 bits from &start[1] via _mm_loadu_si128.
  foundBytes.resize(std::max<size_t>(size + 4, 17UL));
  char* start = &(foundBytes.front());
  char* p = GroupVarint32::encode(start, a, b, c, d);
  EXPECT_EQ((void*)(start + size), (void*)p);

  for (size_t i = 0; i < size; i++) {
    EXPECT_EQ(0xff & expectedBytes[i], 0xff & foundBytes[i]);
  }

  // Test decoding
  EXPECT_EQ(size, GroupVarint32::encodedSize(start));

  uint32_t fa, fb, fc, fd;
  const char* r = GroupVarint32::decode(start, &fa, &fb, &fc, &fd);
  EXPECT_EQ((void*)(start + size), (void*)r);

  EXPECT_EQ(a, fa);
  EXPECT_EQ(b, fb);
  EXPECT_EQ(c, fc);
  EXPECT_EQ(d, fd);
}

void testGroupVarint64(uint64_t a, uint64_t b, uint64_t c, uint64_t d,
                       uint64_t e, ...) {
  va_list ap;
  va_start(ap, e);
  std::vector<char> expectedBytes;
  int byte;
  while ((byte = va_arg(ap, int)) != -1) {
    expectedBytes.push_back(byte);
  }
  va_end(ap);

  size_t size = GroupVarint64::size(a, b, c, d, e);
  EXPECT_EQ(expectedBytes.size(), size);

  std::vector<char> foundBytes;
  foundBytes.resize(size + 8);
  char* start = &(foundBytes.front());
  char* p = GroupVarint64::encode(start, a, b, c, d, e);
  EXPECT_EQ((void*)(start + size), (void*)p);

  for (size_t i = 0; i < size; i++) {
    EXPECT_EQ(0xff & expectedBytes[i], 0xff & foundBytes[i]);
  }

  // Test decoding
  EXPECT_EQ(size, GroupVarint64::encodedSize(start));

  uint64_t fa, fb, fc, fd, fe;
  const char* r = GroupVarint64::decode(start, &fa, &fb, &fc, &fd, &fe);
  EXPECT_EQ((void*)(start + size), (void*)r);

  EXPECT_EQ(a, fa);
  EXPECT_EQ(b, fb);
  EXPECT_EQ(c, fc);
  EXPECT_EQ(d, fd);
  EXPECT_EQ(e, fe);
}

}  // namespace

TEST(GroupVarint, GroupVarint32) {
  EXPECT_EQ(0, GroupVarint32::maxSize(0));
  EXPECT_EQ(5, GroupVarint32::maxSize(1));
  EXPECT_EQ(9, GroupVarint32::maxSize(2));
  EXPECT_EQ(13, GroupVarint32::maxSize(3));
  EXPECT_EQ(17, GroupVarint32::maxSize(4));
  EXPECT_EQ(22, GroupVarint32::maxSize(5));
  EXPECT_EQ(26, GroupVarint32::maxSize(6));
  testGroupVarint32(0, 0, 0, 0,
                    0, 0, 0, 0, 0, -1);
  testGroupVarint32(1, 2, 3, 4,
                    0, 1, 2, 3, 4, -1);
  testGroupVarint32(1 << 8, (2 << 16) + 3, (4 << 24) + (5 << 8) + 6, 7,
                    0x39, 0, 1, 3, 0, 2, 6, 5, 0, 4, 7, -1);
}

TEST(GroupVarint, GroupVarint64) {
  EXPECT_EQ(0, GroupVarint64::maxSize(0));
  EXPECT_EQ(10, GroupVarint64::maxSize(1));
  EXPECT_EQ(18, GroupVarint64::maxSize(2));
  EXPECT_EQ(26, GroupVarint64::maxSize(3));
  EXPECT_EQ(34, GroupVarint64::maxSize(4));
  EXPECT_EQ(42, GroupVarint64::maxSize(5));
  EXPECT_EQ(52, GroupVarint64::maxSize(6));
  testGroupVarint64(0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, -1);
  testGroupVarint64(1, 2, 3, 4, 5,
                    0, 0, 1, 2, 3, 4, 5, -1);
  testGroupVarint64(1 << 8, (2 << 16) + 3, (4 << 24) + (5 << 8) + 6,
                    (7ULL << 32) + (8 << 16),
                    (9ULL << 56) + (10ULL << 40) + 11,
                    0xd1, 0x78,
                    0, 1,
                    3, 0, 2,
                    6, 5, 0, 4,
                    0, 0, 8, 0, 7,
                    11, 0, 0, 0, 0, 10, 0, 9,
                    -1);
}

TEST(GroupVarint, GroupVarintEncoder) {
  std::string s;
  {
    GroupVarint32Encoder gv(s);
    gv.add(0);
    gv.finish();
  }
  EXPECT_EQ(2, s.size());
  EXPECT_EQ(std::string("\x00\x00", 2), s);
  s.clear();
  {
    GroupVarint32Encoder gv(s);
    gv.add(1);
    gv.add(2);
    gv.add(3);
    gv.add(4);
    gv.finish();
  }
  EXPECT_EQ(5, s.size());
  EXPECT_EQ(std::string("\x00\x01\x02\x03\x04", 5), s);
}


TEST(GroupVarint, GroupVarintDecoder) {
  // Make sure we don't read out of bounds
  std::string padding(17, 'X');

  {
    std::string s("\x00\x00", 2);
    s += padding;
    StringPiece p(s.data(), 2);

    GroupVarint32Decoder gv(p);
    uint32_t v;
    EXPECT_TRUE(gv.next(&v));
    EXPECT_EQ(0, v);
    EXPECT_FALSE(gv.next(&v));
    EXPECT_TRUE(gv.rest().empty());
  }

  {
    std::string s("\x00\x01\x02\x03\x04\x01\x02\x03\x04", 9);
    s += padding;
    StringPiece p(s.data(), 9);

    GroupVarint32Decoder gv(p);
    uint32_t v;
    EXPECT_TRUE(gv.next(&v));
    EXPECT_EQ(1, v);
    EXPECT_TRUE(gv.next(&v));
    EXPECT_EQ(2, v);
    EXPECT_TRUE(gv.next(&v));
    EXPECT_EQ(3, v);
    EXPECT_TRUE(gv.next(&v));
    EXPECT_EQ(4, v);
    EXPECT_TRUE(gv.next(&v));
    EXPECT_EQ(0x0302, v);
    EXPECT_TRUE(gv.next(&v));
    EXPECT_EQ(4, v);
    EXPECT_FALSE(gv.next(&v));
    EXPECT_TRUE(gv.rest().empty());
  }

  {
    // Limit max count when reading a full block
    std::string s("\x00\x01\x02\x03\x04\x01\x02\x03\x04", 9);
    s += padding;
    StringPiece p(s.data(), 9);

    GroupVarint32Decoder gv(p, 3);
    uint32_t v;
    EXPECT_TRUE(gv.next(&v));
    EXPECT_EQ(1, v);
    EXPECT_TRUE(gv.next(&v));
    EXPECT_EQ(2, v);
    EXPECT_TRUE(gv.next(&v));
    EXPECT_EQ(3, v);
    EXPECT_FALSE(gv.next(&v));
    EXPECT_EQ(std::string("\x04\x01\x02\x03\x04", 5), gv.rest().toString());
  }

  {
    // Limit max count when reading a partial block
    std::string s("\x00\x01\x02\x03\x04\x01\x02\x03\x04", 9);
    s += padding;
    StringPiece p(s.data(), 9);

    GroupVarint32Decoder gv(p, 5);
    uint32_t v;
    EXPECT_TRUE(gv.next(&v));
    EXPECT_EQ(1, v);
    EXPECT_TRUE(gv.next(&v));
    EXPECT_EQ(2, v);
    EXPECT_TRUE(gv.next(&v));
    EXPECT_EQ(3, v);
    EXPECT_TRUE(gv.next(&v));
    EXPECT_EQ(4, v);
    EXPECT_TRUE(gv.next(&v));
    EXPECT_EQ(0x0302, v);
    EXPECT_FALSE(gv.next(&v));
    EXPECT_EQ(std::string("\x04", 1), gv.rest().toString());
  }
}

#endif
