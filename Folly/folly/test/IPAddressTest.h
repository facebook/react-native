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

#pragma once

#include <string>

#include <sys/types.h>

#include <folly/IPAddress.h>
#include <folly/portability/GTest.h>
#include <folly/portability/Sockets.h>

namespace folly {

class IPAddress;

typedef std::vector<uint8_t> ByteVector;

struct AddressData {
  std::string address;
  ByteVector bytes;
  uint8_t version;

  AddressData(const std::string& address, const ByteVector& bytes,
              uint8_t version)
    : address(address), bytes(bytes), version(version) {}
  AddressData(const std::string& address, uint8_t version)
    : address(address), bytes(), version(version) {}
  explicit AddressData(const std::string& address)
    : address(address), bytes(), version(0) {}
  AddressData(): address(""), bytes(), version(0) {}

  static in_addr parseAddress4(const std::string& src) {
    in_addr addr;
    inet_pton(AF_INET, src.c_str(), &addr);
    return addr;
  }

  static in6_addr parseAddress6(const std::string& src) {
    in6_addr addr;
    inet_pton(AF_INET6, src.c_str(), &addr);
    return addr;
  }
};

struct AddressFlags {
  std::string address;
  uint8_t flags;
  uint8_t version;

  static const uint8_t IS_LOCAL = 1 << 0;
  static const uint8_t IS_NONROUTABLE = 1 << 1;
  static const uint8_t IS_PRIVATE = 1 << 2;
  static const uint8_t IS_ZERO = 1 << 3;
  static const uint8_t IS_LINK_LOCAL = 1 << 4;
  static const uint8_t IS_MULTICAST = 1 << 5;
  static const uint8_t IS_LINK_LOCAL_BROADCAST = 1 << 6;

  AddressFlags(const std::string& addr, uint8_t version, uint8_t flags)
    : address(addr)
    , flags(flags)
    , version(version)
  {}

  bool isLoopback() const {
    return (flags & IS_LOCAL);
  }
  bool isNonroutable() const {
    return (flags & IS_NONROUTABLE);
  }
  bool isPrivate() const {
    return (flags & IS_PRIVATE);
  }
  bool isZero() const {
    return (flags & IS_ZERO);
  }
  bool isLinkLocal() const {
    return (flags & IS_LINK_LOCAL);
  }
  bool isLinkLocalBroadcast() const {
    return (flags & IS_LINK_LOCAL_BROADCAST);
  }
};

struct MaskData {
  std::string address;
  uint8_t mask;
  std::string subnet;
  MaskData(const std::string& addr, uint8_t mask,
           const std::string& subnet)
    : address(addr)
    , mask(mask)
    , subnet(subnet)
  {}
};

struct MaskBoundaryData : MaskData {
  bool inSubnet;
  MaskBoundaryData(const std::string& addr, uint8_t mask,
                   const std::string& subnet, bool inSubnet)
    : MaskData(addr, mask, subnet)
    , inSubnet(inSubnet)
  {}
};

struct SerializeData {
  std::string address;
  ByteVector bytes;

  SerializeData(const std::string& addr, const ByteVector& bytes)
    : address(addr)
    , bytes(bytes)
  {}
};

struct IPAddressTest : public ::testing::TestWithParam<AddressData> {
  void ExpectIsValid(const IPAddress& addr) {
    AddressData param = GetParam();
    EXPECT_EQ(param.version, addr.version());
    EXPECT_EQ(param.address, addr.str());
    if (param.version == 4) {
      in_addr v4addr = AddressData::parseAddress4(param.address);
      EXPECT_EQ(0, memcmp(&v4addr, addr.asV4().toByteArray().data(), 4));
      EXPECT_TRUE(addr.isV4());
      EXPECT_FALSE(addr.isV6());
    } else {
      in6_addr v6addr = AddressData::parseAddress6(param.address);
      EXPECT_EQ(0, memcmp(&v6addr, addr.asV6().toByteArray().data(), 16));
      EXPECT_TRUE(addr.isV6());
      EXPECT_FALSE(addr.isV4());
    }
  }
};
struct IPAddressFlagTest : public ::testing::TestWithParam<AddressFlags> {};
struct IPAddressCtorTest : public ::testing::TestWithParam<std::string> {};
struct IPAddressCtorBinaryTest : public ::testing::TestWithParam<ByteVector> {};
struct IPAddressMappedTest :
    public ::testing::TestWithParam<std::pair<std::string,std::string> > {};
struct IPAddressMaskTest : public ::testing::TestWithParam<MaskData> {};
struct IPAddressMaskBoundaryTest :
    public ::testing::TestWithParam<MaskBoundaryData> {};
struct IPAddressSerializeTest :
    public ::testing::TestWithParam<SerializeData> {};
struct IPAddressByteAccessorTest:
    public ::testing::TestWithParam<AddressData> {};
struct IPAddressBitAccessorTest:
    public ::testing::TestWithParam<AddressData> {};
} // folly
