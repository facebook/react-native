/*
 * Copyright 2014-present Facebook, Inc.
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

#include <folly/MacAddress.h>
#include <folly/Format.h>
#include <folly/IPAddressV6.h>
#include <folly/portability/GTest.h>

using folly::IPAddressV6;
using folly::MacAddress;
using folly::StringPiece;

void testMAC(const std::string& str, uint64_t expectedHBO) {
  SCOPED_TRACE(str);
  MacAddress addr(str);
  // Make sure parsing returned the expected value.
  EXPECT_EQ(expectedHBO, addr.u64HBO());

  // Perform additional checks on the MacAddress

  // Check using operator==()
  EXPECT_EQ(MacAddress::fromHBO(expectedHBO), addr);
  // Check using operator==() when passing in non-zero padding bytes
  EXPECT_EQ(MacAddress::fromHBO(expectedHBO | 0xa5a5000000000000), addr);

  // Similar checks after converting to network byte order
  uint64_t expectedNBO = folly::Endian::big(expectedHBO);
  EXPECT_EQ(expectedNBO, addr.u64NBO());
  EXPECT_EQ(MacAddress::fromNBO(expectedNBO), addr);
  uint64_t nboWithPad = folly::Endian::big(expectedHBO | 0xa5a5000000000000);
  EXPECT_EQ(MacAddress::fromNBO(nboWithPad), addr);

  // Check they value returned by bytes()
  uint8_t expectedBytes[8];
  memcpy(expectedBytes, &expectedNBO, 8);
  for (int n = 0; n < 6; ++n) {
    EXPECT_EQ(expectedBytes[n + 2], addr.bytes()[n]);
  }
}

TEST(MacAddress, parse) {
  testMAC("12:34:56:78:9a:bc", 0x123456789abc);
  testMAC("00-11-22-33-44-55", 0x1122334455);
  testMAC("abcdef123456", 0xabcdef123456);
  testMAC("1:2:3:4:5:6", 0x010203040506);
  testMAC("0:0:0:0:0:0", 0);
  testMAC("0:0:5e:0:1:1", 0x00005e000101);

  EXPECT_THROW(MacAddress(""), std::invalid_argument);
  EXPECT_THROW(MacAddress("0"), std::invalid_argument);
  EXPECT_THROW(MacAddress("12:34"), std::invalid_argument);
  EXPECT_THROW(MacAddress("12:3"), std::invalid_argument);
  EXPECT_THROW(MacAddress("12:"), std::invalid_argument);
  EXPECT_THROW(MacAddress("12:x4:56:78:9a:bc"), std::invalid_argument);
  EXPECT_THROW(MacAddress("12x34:56:78:9a:bc"), std::invalid_argument);
  EXPECT_THROW(MacAddress("12:34:56:78:9a:bc:de"), std::invalid_argument);
  EXPECT_THROW(MacAddress("12:34:56:78:9a:bcde"), std::invalid_argument);
  EXPECT_THROW(MacAddress("12:34:56:78:9a:bc  "), std::invalid_argument);
  EXPECT_THROW(MacAddress("  12:34:56:78:9a:bc"), std::invalid_argument);
  EXPECT_THROW(MacAddress("12:34:56:78:-1:bc"), std::invalid_argument);
}

void testFromBinary(const char* str, uint64_t expectedHBO) {
  StringPiece bin(str, 6);
  auto mac = MacAddress::fromBinary(bin);
  SCOPED_TRACE(mac.toString());
  EXPECT_EQ(expectedHBO, mac.u64HBO());
}

TEST(MacAddress, fromBinary) {
  testFromBinary("\0\0\0\0\0\0", 0);
  testFromBinary("\x12\x34\x56\x78\x9a\xbc", 0x123456789abc);
  testFromBinary("\x11\x22\x33\x44\x55\x66", 0x112233445566);

  StringPiece empty("");
  EXPECT_THROW(MacAddress::fromBinary(empty), std::invalid_argument);
  StringPiece tooShort("\x11", 1);
  EXPECT_THROW(MacAddress::fromBinary(tooShort), std::invalid_argument);
  StringPiece tooLong("\x11\x22\x33\x44\x55\x66\x77", 7);
  EXPECT_THROW(MacAddress::fromBinary(tooLong), std::invalid_argument);
}

TEST(MacAddress, toString) {
  EXPECT_EQ(
      "12:34:56:78:9a:bc", MacAddress::fromHBO(0x123456789abc).toString());
  EXPECT_EQ("12:34:56:78:9a:bc", MacAddress("12:34:56:78:9a:bc").toString());
  EXPECT_EQ("01:23:45:67:89:ab", MacAddress("01-23-45-67-89-ab").toString());
  EXPECT_EQ("01:23:45:67:89:ab", MacAddress("0123456789ab").toString());
}

TEST(MacAddress, attributes) {
  EXPECT_TRUE(MacAddress("ff:ff:ff:ff:ff:ff").isBroadcast());
  EXPECT_FALSE(MacAddress("7f:ff:ff:ff:ff:ff").isBroadcast());
  EXPECT_FALSE(MacAddress("7f:ff:ff:ff:ff:fe").isBroadcast());
  EXPECT_FALSE(MacAddress("00:00:00:00:00:00").isBroadcast());
  EXPECT_TRUE(MacAddress::fromNBO(0xffffffffffffffffU).isBroadcast());

  EXPECT_TRUE(MacAddress("ff:ff:ff:ff:ff:ff").isMulticast());
  EXPECT_TRUE(MacAddress("01:00:00:00:00:00").isMulticast());
  EXPECT_FALSE(MacAddress("00:00:00:00:00:00").isMulticast());
  EXPECT_FALSE(MacAddress("fe:ff:ff:ff:ff:ff").isMulticast());
  EXPECT_FALSE(MacAddress("00:00:5e:00:01:01").isMulticast());

  EXPECT_FALSE(MacAddress("ff:ff:ff:ff:ff:ff").isUnicast());
  EXPECT_FALSE(MacAddress("01:00:00:00:00:00").isUnicast());
  EXPECT_TRUE(MacAddress("00:00:00:00:00:00").isUnicast());
  EXPECT_TRUE(MacAddress("fe:ff:ff:ff:ff:ff").isUnicast());
  EXPECT_TRUE(MacAddress("00:00:5e:00:01:01").isUnicast());

  EXPECT_TRUE(MacAddress("ff:ff:ff:ff:ff:ff").isLocallyAdministered());
  EXPECT_TRUE(MacAddress("02:00:00:00:00:00").isLocallyAdministered());
  EXPECT_FALSE(MacAddress("01:00:00:00:00:00").isLocallyAdministered());
  EXPECT_FALSE(MacAddress("00:00:00:00:00:00").isLocallyAdministered());
  EXPECT_FALSE(MacAddress("fd:ff:ff:ff:ff:ff").isLocallyAdministered());
  EXPECT_TRUE(MacAddress("fe:ff:ff:ff:ff:ff").isLocallyAdministered());
  EXPECT_FALSE(MacAddress("00:00:5e:00:01:01").isLocallyAdministered());
  EXPECT_TRUE(MacAddress("02:12:34:56:78:9a").isLocallyAdministered());
}

TEST(MacAddress, createMulticast) {
  EXPECT_EQ(
      MacAddress("33:33:00:01:00:03"),
      MacAddress::createMulticast(IPAddressV6("ff02:dead:beef::1:3")));
  EXPECT_EQ(
      MacAddress("33:33:12:34:56:78"),
      MacAddress::createMulticast(IPAddressV6("ff02::abcd:1234:5678")));
}

void testCmp(const char* str1, const char* str2) {
  SCOPED_TRACE(folly::sformat("{} < {}", str1, str2));
  MacAddress m1(str1);
  MacAddress m2(str2);

  // Test the comparison operators
  EXPECT_TRUE(m1 < m2);
  EXPECT_FALSE(m1 < m1);
  EXPECT_TRUE(m1 <= m2);
  EXPECT_TRUE(m2 > m1);
  EXPECT_TRUE(m2 >= m1);
  EXPECT_TRUE(m1 != m2);
  EXPECT_TRUE(m1 == (m1));
  EXPECT_FALSE(m1 == m2);

  // Also test the copy constructor and assignment operator
  MacAddress copy(m1);
  EXPECT_EQ(copy, m1);
  copy = m2;
  EXPECT_EQ(copy, m2);
}

TEST(MacAddress, ordering) {
  testCmp("00:00:00:00:00:00", "00:00:00:00:00:01");
  testCmp("00:00:00:00:00:01", "00:00:00:00:00:02");
  testCmp("01:00:00:00:00:00", "02:00:00:00:00:00");
  testCmp("00:00:00:00:00:01", "00:00:00:00:01:00");
}

TEST(MacAddress, hash) {
  EXPECT_EQ(
      std::hash<MacAddress>()(MacAddress("00:11:22:33:44:55")),
      std::hash<MacAddress>()(MacAddress("00-11-22-33-44-55")));
  EXPECT_NE(
      std::hash<MacAddress>()(MacAddress("00:11:22:33:44:55")),
      std::hash<MacAddress>()(MacAddress("00:11:22:33:44:56")));
}
