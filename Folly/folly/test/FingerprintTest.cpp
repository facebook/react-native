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

#include <folly/Fingerprint.h>

#include <glog/logging.h>

#include <folly/detail/SlowFingerprint.h>
#include <folly/Benchmark.h>
#include <folly/portability/GTest.h>

using namespace folly;
using namespace folly::detail;

TEST(Fingerprint, BroderOptimization) {
  // Test that the Broder optimization produces the same result as
  // the default (slow) implementation that processes one bit at a time.
  uint64_t val_a = 0xfaceb00cdeadbeefUL;
  uint64_t val_b = 0x1234567890abcdefUL;

  uint64_t slow[2];
  uint64_t fast[2];

  SlowFingerprint<64>().update64(val_a).update64(val_b).write(slow);
  Fingerprint<64>().update64(val_a).update64(val_b).write(fast);
  EXPECT_EQ(slow[0], fast[0]);

  SlowFingerprint<96>().update64(val_a).update64(val_b).write(slow);
  Fingerprint<96>().update64(val_a).update64(val_b).write(fast);
  EXPECT_EQ(slow[0], fast[0]);
  EXPECT_EQ(slow[1], fast[1]);

  SlowFingerprint<128>().update64(val_a).update64(val_b).write(slow);
  Fingerprint<128>().update64(val_a).update64(val_b).write(fast);
  EXPECT_EQ(slow[0], fast[0]);
  EXPECT_EQ(slow[1], fast[1]);
}

TEST(Fingerprint, MultiByteUpdate) {
  // Test that the multi-byte update functions (update32, update64,
  // update(StringPiece)) produce the same result as calling update8
  // repeatedly.
  uint64_t val_a = 0xfaceb00cdeadbeefUL;
  uint64_t val_b = 0x1234567890abcdefUL;
  uint8_t bytes[16];
  for (int i = 0; i < 8; i++) {
    bytes[i] = (val_a >> (8*(7-i))) & 0xff;
  }
  for (int i = 0; i < 8; i++) {
    bytes[i+8] = (val_b >> (8*(7-i))) & 0xff;
  }
  StringPiece sp((const char*)bytes, 16);

  uint64_t u8[2];      // updating 8 bits at a time
  uint64_t u32[2];     // updating 32 bits at a time
  uint64_t u64[2];     // updating 64 bits at a time
  uint64_t usp[2];     // update(StringPiece)
  uint64_t uconv[2];   // convenience function (fingerprint*(StringPiece))

  {
    Fingerprint<64> fp;
    for (int i = 0; i < 16; i++) {
      fp.update8(bytes[i]);
    }
    fp.write(u8);
  }
  Fingerprint<64>().update32(val_a >> 32).update32(val_a & 0xffffffff).
    update32(val_b >> 32).update32(val_b & 0xffffffff).write(u32);
  Fingerprint<64>().update64(val_a).update64(val_b).write(u64);
  Fingerprint<64>().update(sp).write(usp);
  uconv[0] = fingerprint64(sp);

  EXPECT_EQ(u8[0], u32[0]);
  EXPECT_EQ(u8[0], u64[0]);
  EXPECT_EQ(u8[0], usp[0]);
  EXPECT_EQ(u8[0], uconv[0]);

  {
    Fingerprint<96> fp;
    for (int i = 0; i < 16; i++) {
      fp.update8(bytes[i]);
    }
    fp.write(u8);
  }
  Fingerprint<96>().update32(val_a >> 32).update32(val_a & 0xffffffff).
    update32(val_b >> 32).update32(val_b & 0xffffffff).write(u32);
  Fingerprint<96>().update64(val_a).update64(val_b).write(u64);
  Fingerprint<96>().update(sp).write(usp);
  uint32_t uconv_lsb;
  fingerprint96(sp, &(uconv[0]), &uconv_lsb);
  uconv[1] = (uint64_t)uconv_lsb << 32;

  EXPECT_EQ(u8[0], u32[0]);
  EXPECT_EQ(u8[1], u32[1]);
  EXPECT_EQ(u8[0], u64[0]);
  EXPECT_EQ(u8[1], u64[1]);
  EXPECT_EQ(u8[0], usp[0]);
  EXPECT_EQ(u8[1], usp[1]);
  EXPECT_EQ(u8[0], uconv[0]);
  EXPECT_EQ(u8[1], uconv[1]);

  {
    Fingerprint<128> fp;
    for (int i = 0; i < 16; i++) {
      fp.update8(bytes[i]);
    }
    fp.write(u8);
  }
  Fingerprint<128>().update32(val_a >> 32).update32(val_a & 0xffffffff).
    update32(val_b >> 32).update32(val_b & 0xffffffff).write(u32);
  Fingerprint<128>().update64(val_a).update64(val_b).write(u64);
  Fingerprint<128>().update(sp).write(usp);
  fingerprint128(sp, &(uconv[0]), &(uconv[1]));

  EXPECT_EQ(u8[0], u32[0]);
  EXPECT_EQ(u8[1], u32[1]);
  EXPECT_EQ(u8[0], u64[0]);
  EXPECT_EQ(u8[1], u64[1]);
  EXPECT_EQ(u8[0], usp[0]);
  EXPECT_EQ(u8[1], usp[1]);
  EXPECT_EQ(u8[0], uconv[0]);
  EXPECT_EQ(u8[1], uconv[1]);
}

TEST(Fingerprint, Alignment) {
  // Test that update() gives the same result regardless of string alignment
  const char test_str[] = "hello world 12345";
  int len = sizeof(test_str)-1;
  std::unique_ptr<char[]> str(new char[len+8]);
  uint64_t ref_fp;
  SlowFingerprint<64>().update(StringPiece(test_str, len)).write(&ref_fp);
  for (int i = 0; i < 8; i++) {
    char* p = str.get();
    char* q;
    // Fill the string as !!hello??????
    for (int j = 0; j < i; j++) {
      *p++ = '!';
    }
    q = p;
    for (int j = 0; j < len; j++) {
      *p++ = test_str[j];
    }
    for (int j = i; j < 8; j++) {
      *p++ = '?';
    }

    uint64_t fp;
    Fingerprint<64>().update(StringPiece(q, len)).write(&fp);
    EXPECT_EQ(ref_fp, fp);
  }
}

int main(int argc, char *argv[]) {
  testing::InitGoogleTest(&argc, argv);
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  auto ret = RUN_ALL_TESTS();
  if (!ret) {
    folly::runBenchmarksOnFlag();
  }
  return ret;
}
