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
#include <sys/types.h>

#include <string>

#include <folly/Format.h>
#include <folly/IPAddress.h>
#include <folly/MacAddress.h>
#include <folly/String.h>
#include <folly/container/BitIterator.h>
#include <folly/detail/IPAddressSource.h>
#include <folly/lang/Bits.h>
#include <folly/portability/GMock.h>
#include <folly/portability/GTest.h>

using namespace folly;
using namespace std;
using namespace testing;

typedef std::vector<uint8_t> ByteVector;

struct AddressData {
  std::string address;
  ByteVector bytes;
  uint8_t version;

  AddressData(
      const std::string& address_,
      const ByteVector& bytes_,
      uint8_t version_)
      : address(address_), bytes(bytes_), version(version_) {}
  AddressData(const std::string& address_, uint8_t version_)
      : address(address_), bytes(), version(version_) {}
  explicit AddressData(const std::string& address_)
      : address(address_), bytes(), version(0) {}
  AddressData() : address(""), bytes(), version(0) {}

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

  AddressFlags(const std::string& addr, uint8_t version_, uint8_t flags_)
      : address(addr), flags(flags_), version(version_) {}

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
  MaskData(const std::string& addr, uint8_t mask_, const std::string& subnet_)
      : address(addr), mask(mask_), subnet(subnet_) {}
};

struct MaskBoundaryData : MaskData {
  bool inSubnet;
  MaskBoundaryData(
      const std::string& addr,
      uint8_t mask_,
      const std::string& subnet_,
      bool inSubnet_)
      : MaskData(addr, mask_, subnet_), inSubnet(inSubnet_) {}
};

struct SerializeData {
  std::string address;
  ByteVector bytes;

  SerializeData(const std::string& addr, const ByteVector& bytes_)
      : address(addr), bytes(bytes_) {}
};

struct IPAddressTest : TestWithParam<AddressData> {
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
struct IPAddressFlagTest : TestWithParam<AddressFlags> {};
struct IPAddressCtorTest : TestWithParam<std::string> {};
struct IPAddressCtorBinaryTest : TestWithParam<ByteVector> {};
struct IPAddressMappedTest
    : TestWithParam<std::pair<std::string, std::string>> {};
struct IPAddressMaskTest : TestWithParam<MaskData> {};
struct IPAddressMaskBoundaryTest : TestWithParam<MaskBoundaryData> {};
struct IPAddressSerializeTest : TestWithParam<SerializeData> {};
struct IPAddressByteAccessorTest : TestWithParam<AddressData> {};
struct IPAddressBitAccessorTest : TestWithParam<AddressData> {};

struct StringTestParam {
  std::string in;
  folly::Optional<std::string> out;
  folly::Optional<std::string> out4;
  folly::Optional<std::string> out6;
};

struct TryFromStringTest : TestWithParam<StringTestParam> {
  static std::vector<StringTestParam> ipInOutProvider() {
    const std::string lo6{"::1"};
    const std::string lo6brackets{"[::1]"};
    const std::string ip6{"1234::abcd"};
    const std::string invalid6{"[::aaaR]"};

    const std::string lo4{"127.0.0.1"};
    const std::string ip4{"192.168.0.1"};
    const std::string invalid4{"127.0.0.256"};

    const static std::vector<StringTestParam> ret = {
        {lo6, lo6, none, lo6},
        {lo6brackets, lo6, none, lo6},
        {ip6, ip6, none, ip6},
        {invalid6, none, none, none},
        {lo4, lo4, lo4, none},
        {ip4, ip4, ip4, none},
        {invalid4, none, none, none},
    };

    return ret;
  }
};

// tests code example
TEST(IPAddress, CodeExample) {
  EXPECT_EQ(4, sizeof(IPAddressV4));
  EXPECT_EQ(20, sizeof(IPAddressV6));
  EXPECT_EQ(24, sizeof(IPAddress));
  IPAddress uninitaddr;
  IPAddress v4addr("192.0.2.129");
  IPAddress v6map("::ffff:192.0.2.129");
  ASSERT_TRUE(uninitaddr.empty());
  ASSERT_FALSE(v4addr.empty());
  ASSERT_FALSE(v6map.empty());
  EXPECT_TRUE(v4addr.inSubnet("192.0.2.0/24"));
  EXPECT_TRUE(v4addr.inSubnet(IPAddress("192.0.2.0"), 24));
  EXPECT_TRUE(v4addr.inSubnet("192.0.2.128/30"));
  EXPECT_FALSE(v4addr.inSubnet("192.0.2.128/32"));
  EXPECT_EQ(2164392128, v4addr.asV4().toLong());
  EXPECT_EQ(3221226113, v4addr.asV4().toLongHBO());
  ASSERT_FALSE(uninitaddr.isV4());
  ASSERT_FALSE(uninitaddr.isV6());
  ASSERT_TRUE(v4addr.isV4());
  ASSERT_TRUE(v6map.isV6());
  EXPECT_TRUE(v4addr == v6map);
  ASSERT_TRUE(v6map.isIPv4Mapped());
  EXPECT_TRUE(v4addr.asV4() == IPAddress::createIPv4(v6map));
  EXPECT_TRUE(IPAddress::createIPv6(v4addr) == v6map.asV6());
}

TEST(IPAddress, Scope) {
  // Test that link-local scope is saved
  auto str = "fe80::62eb:69ff:fe9b:ba60%eth0";
  IPAddressV6 a2(str);
  EXPECT_EQ(str, a2.str());

  sockaddr_in6 sock = a2.toSockAddr();
  EXPECT_NE(0, sock.sin6_scope_id);

  IPAddress a1(str);
  EXPECT_EQ(str, a1.str());

  a2.setScopeId(0);
  EXPECT_NE(a1, a2);

  EXPECT_TRUE(a2 < a1);
}

TEST(IPAddress, ScopeNumeric) {
  // it's very unlikely that the host running these
  // tests will have 42 network interfaces
  auto str = "fe80::62eb:69ff:fe9b:ba60%42";
  IPAddressV6 a2(str);
  EXPECT_EQ(str, a2.str());

  sockaddr_in6 sock = a2.toSockAddr();
  EXPECT_NE(0, sock.sin6_scope_id);

  IPAddress a1(str);
  EXPECT_EQ(str, a1.str());

  a2.setScopeId(0);
  EXPECT_NE(a1, a2);

  EXPECT_TRUE(a2 < a1);
}

TEST(IPAddress, Ordering) {
  IPAddress a1("0.1.1.1");
  IPAddress a2("1.1.1.0");
  EXPECT_TRUE(a1 < a2);

  IPAddress b1("::ffff:0.1.1.1");
  IPAddress b2("::ffff:1.1.1.0");
  EXPECT_TRUE(b1 < b2);
}

TEST(IPAddress, InvalidAddressFamilyExceptions) {
  // asV4
  {
    IPAddress addr;
    EXPECT_THROW(addr.asV4(), InvalidAddressFamilyException);
  }
  // asV6
  {
    IPAddress addr;
    EXPECT_THROW(addr.asV6(), InvalidAddressFamilyException);
  }
  // sockaddr ctor
  {
    // setup
    sockaddr_in addr;
    addr.sin_family = AF_UNSPEC;

    EXPECT_THROW(IPAddress((sockaddr*)&addr), InvalidAddressFamilyException);
  }
}

TEST(IPAddress, TryCreateNetwork) {
  // test valid IPv4 network
  {
    auto net = IPAddress::tryCreateNetwork("192.168.0.1/24").value();
    ASSERT_TRUE(net.first.isV4());
    EXPECT_EQ("192.168.0.0", net.first.str());
    EXPECT_EQ(24, net.second);
    EXPECT_EQ("192.168.0.0/24", IPAddress::networkToString(net));
  }
  // test valid IPv4 network without applying mask
  {
    auto net = IPAddress::tryCreateNetwork("192.168.0.1/24", -1, false).value();
    ASSERT_TRUE(net.first.isV4());
    EXPECT_EQ("192.168.0.1", net.first.str());
    EXPECT_EQ(24, net.second);
    EXPECT_EQ("192.168.0.1/24", IPAddress::networkToString(net));
  }
  // test valid IPv6 network
  {
    auto net = IPAddress::tryCreateNetwork("1999::1/24").value();
    ASSERT_TRUE(net.first.isV6());
    EXPECT_EQ("1999::", net.first.str());
    EXPECT_EQ(24, net.second);
    EXPECT_EQ("1999::/24", IPAddress::networkToString(net));
  }
  // test valid IPv6 network without applying mask
  {
    auto net = IPAddress::tryCreateNetwork("1999::1/24", -1, false).value();
    ASSERT_TRUE(net.first.isV6());
    EXPECT_EQ("1999::1", net.first.str());
    EXPECT_EQ(24, net.second);
    EXPECT_EQ("1999::1/24", IPAddress::networkToString(net));
  }

  // test invalid default CIDR
  EXPECT_EQ(
      CIDRNetworkError::INVALID_DEFAULT_CIDR,
      IPAddress::tryCreateNetwork("192.168.1.1", 300).error());

  // test empty string
  EXPECT_EQ(
      CIDRNetworkError::INVALID_IP, IPAddress::tryCreateNetwork("").error());

  // test multi slash string
  EXPECT_EQ(
      CIDRNetworkError::INVALID_IP_SLASH_CIDR,
      IPAddress::tryCreateNetwork("192.168.0.1/24/36").error());

  // test no slash string with default IPv4
  {
    auto net = IPAddress::tryCreateNetwork("192.168.0.1").value();
    ASSERT_TRUE(net.first.isV4());
    EXPECT_EQ("192.168.0.1", net.first.str());
    EXPECT_EQ(32, net.second); // auto-detected
    net = IPAddress::createNetwork("192.168.0.1", -1, false);
    ASSERT_TRUE(net.first.isV4());
    EXPECT_EQ("192.168.0.1", net.first.str());
    EXPECT_EQ(32, net.second);
  }
  // test no slash string with default IPv6
  {
    auto net = IPAddress::tryCreateNetwork("1999::1").value();
    ASSERT_TRUE(net.first.isV6());
    EXPECT_EQ("1999::1", net.first.str());
    EXPECT_EQ(128, net.second);
  }
  // test no slash string with invalid default
  EXPECT_EQ(
      CIDRNetworkError::CIDR_MISMATCH,
      IPAddress::tryCreateNetwork("192.168.0.1", 33).error());
}

// test that throwing version actually throws
TEST(IPAddress, CreateNetworkExceptions) {
  // test invalid default CIDR
  EXPECT_THROW(IPAddress::createNetwork("192.168.0.1", 300), std::range_error);
  // test empty string
  EXPECT_THROW(IPAddress::createNetwork(""), IPAddressFormatException);
  // test multi slash string
  EXPECT_THROW(
      IPAddress::createNetwork("192.168.0.1/24/36"), IPAddressFormatException);
  // test no slash string with invalid default
  EXPECT_THROW(
      IPAddress::createNetwork("192.168.0.1", 33), IPAddressFormatException);
}

// test assignment operators
TEST(IPAddress, Assignment) {
  static const string kIPv4Addr = "69.63.189.16";
  static const string kIPv6Addr = "2620:0:1cfe:face:b00c::3";

  // Test assigning IPAddressV6 addr to IPAddress (was V4)
  {
    IPAddress addr(kIPv4Addr);
    IPAddressV6 addrV6 = IPAddress(kIPv6Addr).asV6();
    EXPECT_TRUE(addr.isV4());
    EXPECT_EQ(kIPv4Addr, addr.str());
    addr = addrV6;
    EXPECT_TRUE(addr.isV6());
    EXPECT_EQ(kIPv6Addr, addr.str());
  }
  // Test assigning IPAddressV4 addr to IPAddress (was V6)
  {
    IPAddress addr(kIPv6Addr);
    IPAddressV4 addrV4 = IPAddress(kIPv4Addr).asV4();
    EXPECT_TRUE(addr.isV6());
    EXPECT_EQ(kIPv6Addr, addr.str());
    addr = addrV4;
    EXPECT_TRUE(addr.isV4());
    EXPECT_EQ(kIPv4Addr, addr.str());
  }
  // Test assigning IPAddress(v6) to IPAddress (was v4)
  {
    IPAddress addr(kIPv4Addr);
    IPAddress addrV6 = IPAddress(kIPv6Addr);
    EXPECT_TRUE(addr.isV4());
    EXPECT_EQ(kIPv4Addr, addr.str());
    addr = addrV6;
    EXPECT_TRUE(addr.isV6());
    EXPECT_EQ(kIPv6Addr, addr.str());
  }
  // Test assigning IPAddress(v4) to IPAddress (was v6)
  {
    IPAddress addr(kIPv6Addr);
    IPAddress addrV4 = IPAddress(kIPv4Addr);
    EXPECT_TRUE(addr.isV6());
    EXPECT_EQ(kIPv6Addr, addr.str());
    addr = addrV4;
    EXPECT_TRUE(addr.isV4());
    EXPECT_EQ(kIPv4Addr, addr.str());
  }
}

// Test the default constructors
TEST(IPAddress, CtorDefault) {
  IPAddressV4 v4;
  EXPECT_EQ(IPAddressV4("0.0.0.0"), v4);
  IPAddressV6 v6;
  EXPECT_EQ(IPAddressV6("::0"), v6);
}

TEST(IPAddressV4, validate) {
  EXPECT_TRUE(IPAddressV4::validate("0.0.0.0"));
  EXPECT_FALSE(IPAddressV4::validate("0.0.0."));
  EXPECT_TRUE(IPAddressV4::validate("127.127.127.127"));
}

TEST(IPAddressV6, validate) {
  EXPECT_TRUE(IPAddressV6::validate("2620:0:1cfe:face:b00c::3"));
  EXPECT_FALSE(IPAddressV6::validate("0.0.0.0"));
  EXPECT_TRUE(IPAddressV6::validate("[2620:0:1cfe:face:b00c::3]"));
  EXPECT_TRUE(IPAddressV6::validate("::ffff:0.1.1.1"));
  EXPECT_TRUE(IPAddressV6::validate("2620:0000:1cfe:face:b00c:0000:0000:0003"));
  EXPECT_TRUE(
      IPAddressV6::validate("2620:0000:1cfe:face:b00c:0000:127.127.127.127"));
}

TEST(IPAddress, validate) {
  EXPECT_TRUE(IPAddress::validate("0.0.0.0"));
  EXPECT_TRUE(IPAddress::validate("::"));
  EXPECT_FALSE(IPAddress::validate("asdf"));
}

// Test addresses constructed using a in[6]_addr value
TEST_P(IPAddressTest, CtorAddress) {
  AddressData param = GetParam();
  IPAddress strAddr(param.address);
  IPAddress address;

  if (param.version == 4) {
    in_addr v4addr = detail::Bytes::mkAddress4(&param.bytes[0]);
    address = IPAddress(v4addr);
  } else {
    in6_addr v6addr = detail::Bytes::mkAddress6(&param.bytes[0]);
    address = IPAddress(v6addr);
  }
  ExpectIsValid(address);
  EXPECT_EQ(strAddr, address);
}

// Test addresses constructed using a binary address
TEST_P(IPAddressTest, CtorBinary) {
  AddressData param = GetParam();
  IPAddress address;

  if (param.version == 4) {
    in_addr v4addr = AddressData::parseAddress4(param.address);
    address = IPAddress::fromBinary(ByteRange((unsigned char*)&v4addr, 4));
  } else {
    in6_addr v6addr = AddressData::parseAddress6(param.address);
    address = IPAddress::fromBinary(ByteRange((unsigned char*)&v6addr, 16));
  }

  ExpectIsValid(address);
  EXPECT_EQ(IPAddress(param.address), address);
}

// Test addresses constructed using a string
TEST_P(IPAddressTest, CtorString) {
  AddressData param = GetParam();
  IPAddress address(param.address);

  ExpectIsValid(address);

  // Test the direct version-specific constructor
  if (param.version == 4) {
    IPAddressV4 v4(param.address);
    ExpectIsValid(IPAddress(v4));
    EXPECT_THROW(IPAddressV6 v6(param.address), IPAddressFormatException);
  } else if (param.version == 6) {
    IPAddressV6 v6(param.address);
    ExpectIsValid(IPAddress(v6));
    EXPECT_THROW(IPAddressV4 v4(param.address), IPAddressFormatException);
  }
}

TEST(IPAddress, CtorSockaddr) {
  // test v4 address
  {
    // setup
    sockaddr_in addr;
    in_addr sin_addr;
    sin_addr.s_addr = htonl(2122547223);
    addr.sin_family = AF_INET;
    addr.sin_addr = sin_addr;

    IPAddress ipAddr((sockaddr*)&addr);
    EXPECT_TRUE(ipAddr.isV4());
    EXPECT_EQ("126.131.128.23", ipAddr.str());
  }
  // test v6 address
  {
    // setup
    sockaddr_in6 addr;
    memset(&addr, 0, sizeof(addr));
    in6_addr sin_addr;
    // 2620:0:1cfe:face:b00c::3
    ByteArray16 sec{
        {38, 32, 0, 0, 28, 254, 250, 206, 176, 12, 0, 0, 0, 0, 0, 3}};
    std::memcpy(sin_addr.s6_addr, sec.data(), 16);
    addr.sin6_family = AF_INET6;
    addr.sin6_addr = sin_addr;

    IPAddress ipAddr((sockaddr*)&addr);
    EXPECT_TRUE(ipAddr.isV6());
    EXPECT_EQ("2620:0:1cfe:face:b00c::3", ipAddr.str());
  }
  // test nullptr exception
  {
    sockaddr* addr = nullptr;
    EXPECT_THROW(IPAddress((const sockaddr*)addr), IPAddressFormatException);
  }
  // test invalid family exception
  {
    // setup
    sockaddr_in addr;
    in_addr sin_addr;
    sin_addr.s_addr = htonl(2122547223);
    addr.sin_family = AF_UNSPEC;
    addr.sin_addr = sin_addr;

    EXPECT_THROW(IPAddress((sockaddr*)&addr), IPAddressFormatException);
  }
}

TEST(IPAddress, ToSockaddrStorage) {
  // test v4 address
  {
    string strAddr("126.131.128.23");
    IPAddress addr(strAddr);
    sockaddr_storage out;

    ASSERT_TRUE(addr.isV4()); // test invariant
    EXPECT_GT(addr.toSockaddrStorage(&out), 0);

    IPAddress sockAddr((sockaddr*)&out);
    ASSERT_TRUE(sockAddr.isV4());
    EXPECT_EQ(strAddr, sockAddr.str());
  }
  // test v6 address
  {
    string strAddr("2620:0:1cfe:face:b00c::3");
    IPAddress addr(strAddr);
    sockaddr_storage out;

    ASSERT_TRUE(addr.isV6()); // test invariant
    EXPECT_GT(addr.toSockaddrStorage(&out), 0);

    IPAddress sockAddr((sockaddr*)&out);
    ASSERT_TRUE(sockAddr.isV6());
    EXPECT_EQ(strAddr, sockAddr.str());
  }
  // test nullptr exception
  {
    sockaddr_storage* out = nullptr;
    IPAddress addr("127.0.0.1");
    EXPECT_THROW(addr.toSockaddrStorage(out), IPAddressFormatException);
  }
  // test invalid family exception
  {
    IPAddress addr;
    sockaddr_storage out;
    ASSERT_EQ(AF_UNSPEC, addr.family());
    EXPECT_THROW(addr.toSockaddrStorage(&out), InvalidAddressFamilyException);
  }
}

TEST_P(TryFromStringTest, IPAddress) {
  auto param = GetParam();
  auto maybeIp = IPAddress::tryFromString(param.in);
  if (param.out) {
    EXPECT_TRUE(maybeIp.hasValue());
    EXPECT_EQ(param.out, maybeIp.value().str());
  } else {
    EXPECT_TRUE(maybeIp.hasError());
    EXPECT_TRUE(
        IPAddressFormatError::INVALID_IP == maybeIp.error() ||
        IPAddressFormatError::UNSUPPORTED_ADDR_FAMILY == maybeIp.error());
  }
}

TEST_P(TryFromStringTest, IPAddressV4) {
  auto param = GetParam();
  auto maybeIp = IPAddressV4::tryFromString(param.in);
  if (param.out4) {
    EXPECT_TRUE(maybeIp.hasValue());
    EXPECT_EQ(param.out4, maybeIp.value().str());
  } else {
    EXPECT_TRUE(maybeIp.hasError());
    EXPECT_EQ(IPAddressFormatError::INVALID_IP, maybeIp.error());
  }
}

TEST_P(TryFromStringTest, IPAddressV6) {
  auto param = GetParam();
  auto maybeIp = IPAddressV6::tryFromString(param.in);
  if (param.out6) {
    EXPECT_TRUE(maybeIp.hasValue());
    EXPECT_EQ(param.out6, maybeIp.value().str());
  } else {
    EXPECT_TRUE(maybeIp.hasError());
    EXPECT_EQ(IPAddressFormatError::INVALID_IP, maybeIp.error());
  }
}

TEST(IPAddress, ToString) {
  // Test with IPAddressV4
  IPAddressV4 addr_10_0_0_1("10.0.0.1");
  EXPECT_EQ("10.0.0.1", folly::to<string>(addr_10_0_0_1));
  // Test with IPAddressV6
  IPAddressV6 addr_1("::1");
  EXPECT_EQ("::1", folly::to<string>(addr_1));
  // Test with IPAddress, both V4 and V6
  IPAddress addr_10_1_2_3("10.1.2.3");
  EXPECT_EQ("10.1.2.3", folly::to<string>(addr_10_1_2_3));
  IPAddress addr_1_2_3("1:2::3");
  EXPECT_EQ("1:2::3", folly::to<string>(addr_1_2_3));

  // Test a combination of all the above arguments
  EXPECT_EQ(
      "1:2::3 - 10.0.0.1 - ::1 - 10.1.2.3",
      folly::to<string>(
          addr_1_2_3,
          " - ",
          addr_10_0_0_1,
          " - ",
          addr_1,
          " - ",
          addr_10_1_2_3));
}

TEST(IPaddress, toInverseArpaName) {
  IPAddressV4 addr_ipv4("10.0.0.1");
  EXPECT_EQ("1.0.0.10.in-addr.arpa", addr_ipv4.toInverseArpaName());
  IPAddressV6 addr_ipv6("2620:0000:1cfe:face:b00c:0000:0000:0003");
  EXPECT_EQ(
      sformat(
          "{}.ip6.arpa",
          "3.0.0.0.0.0.0.0.0.0.0.0.c.0.0.b.e.c.a.f.e.f.c.1.0.0.0.0.0.2.6.2"),
      addr_ipv6.toInverseArpaName());
}

TEST(IPaddress, fromInverseArpaName) {
  EXPECT_EQ(
      IPAddressV4("10.0.0.1"),
      IPAddressV4::fromInverseArpaName("1.0.0.10.in-addr.arpa"));
  EXPECT_EQ(
      IPAddressV6("2620:0000:1cfe:face:b00c:0000:0000:0003"),
      IPAddressV6::fromInverseArpaName(sformat(
          "{}.ip6.arpa",
          "3.0.0.0.0.0.0.0.0.0.0.0.c.0.0.b.e.c.a.f.e.f.c.1.0.0.0.0.0.2.6.2")));
}

// Test that invalid string values are killed
TEST_P(IPAddressCtorTest, InvalidCreation) {
  string addr = GetParam();
  EXPECT_THROW(IPAddress((const string)addr), IPAddressFormatException)
      << "IPAddress(" << addr << ") "
      << "should have thrown an IPAddressFormatException";
}

// Test that invalid binary values throw or return an exception
TEST_P(IPAddressCtorBinaryTest, InvalidBinary) {
  auto bin = GetParam();
  auto byteRange = ByteRange(&bin[0], bin.size());
  // Throwing versions.
  EXPECT_THROW(IPAddress::fromBinary(byteRange), IPAddressFormatException);
  EXPECT_THROW(IPAddressV4::fromBinary(byteRange), IPAddressFormatException);
  EXPECT_THROW(IPAddressV6::fromBinary(byteRange), IPAddressFormatException);
  // Non-throwing versions.
  EXPECT_TRUE(IPAddress::tryFromBinary(byteRange).hasError());
  EXPECT_TRUE(IPAddressV4::tryFromBinary(byteRange).hasError());
  EXPECT_TRUE(IPAddressV6::tryFromBinary(byteRange).hasError());
}

TEST(IPAddressSource, ToHex) {
  vector<std::uint8_t> data = {{0xff, 0x20, 0x45}};
  EXPECT_EQ(detail::Bytes::toHex(data.data(), 0), "");
  EXPECT_EQ(detail::Bytes::toHex(data.data(), 1), "ff");
  EXPECT_EQ(detail::Bytes::toHex(data.data(), 2), "ff20");
  EXPECT_EQ(detail::Bytes::toHex(data.data(), 3), "ff2045");
}

// Test toFullyQualified()
TEST(IPAddress, ToFullyQualifiedFb) {
  IPAddress ip("2620:0:1cfe:face:b00c::3");
  EXPECT_EQ("2620:0000:1cfe:face:b00c:0000:0000:0003", ip.toFullyQualified())
      << ip;
}
TEST(IPAddress, ToFullyQualifiedLocal) {
  IPAddress ip("::1");
  EXPECT_EQ("0000:0000:0000:0000:0000:0000:0000:0001", ip.toFullyQualified())
      << ip;
}
TEST(IPAddress, ToFullyQualifiedAppendV6) {
  IPAddress ip("2620:0:1cfe:face:b00c::3");
  std::string result;
  ip.toFullyQualifiedAppend(result);
  EXPECT_EQ("2620:0000:1cfe:face:b00c:0000:0000:0003", result) << ip;
}
TEST(IPAddress, ToFullyQualifiedAppendV4) {
  IPAddress ip("127.0.0.1");
  std::string result;
  ip.toFullyQualifiedAppend(result);
  EXPECT_EQ("127.0.0.1", result) << ip;
}
TEST(IPAddress, ToFullyQualifiedSizeV6) {
  auto actual = IPAddressV6::kToFullyQualifiedSize;
  auto expected = IPAddress("::").toFullyQualified().size();
  EXPECT_EQ(expected, actual);
}
TEST(IPAddress, MaxToFullyQualifiedSizeV4) {
  auto actual = IPAddressV4::kMaxToFullyQualifiedSize;
  auto expected = IPAddress("255.255.255.255").toFullyQualified().size();
  EXPECT_EQ(expected, actual);
}

// test v4-v6 mapped addresses
TEST_P(IPAddressMappedTest, MappedEqual) {
  auto param = GetParam();
  string mappedIp = param.first;
  string otherIp = param.second;

  auto mapped = IPAddress(mappedIp);
  auto expected = IPAddress(otherIp);

  EXPECT_EQ(expected, mapped);

  IPAddress v6addr;
  if (mapped.isV4()) {
    v6addr = mapped.asV4().createIPv6();
  } else if (expected.isV4()) {
    v6addr = expected.asV4().createIPv6();
  }
  EXPECT_TRUE(v6addr.isV6());
  EXPECT_TRUE(mapped == v6addr);
  EXPECT_TRUE(expected == v6addr);
}

// Test subnet mask calculations
TEST_P(IPAddressMaskTest, Masks) {
  auto param = GetParam();

  IPAddress ip(param.address);
  IPAddress masked = ip.mask(param.mask);
  EXPECT_EQ(param.subnet, masked.str())
      << param.address << "/" << folly::to<std::string>(param.mask) << " -> "
      << param.subnet;
}

// Test inSubnet calculations
TEST_P(IPAddressMaskTest, InSubnet) {
  auto param = GetParam();

  IPAddress ip(param.address);
  IPAddress subnet(param.subnet);
  EXPECT_TRUE(ip.inSubnet(subnet, param.mask));
}

// Test boundary conditions for subnet calculations
TEST_P(IPAddressMaskBoundaryTest, NonMaskedSubnet) {
  auto param = GetParam();
  IPAddress ip(param.address);
  IPAddress subnet(param.subnet);
  EXPECT_EQ(param.inSubnet, ip.inSubnet(subnet, param.mask));
}

TEST(IPAddress, UnitializedEqual) {
  IPAddress addrEmpty;
  IPAddress ip4("127.0.0.1");
  EXPECT_FALSE(addrEmpty == ip4);
  EXPECT_FALSE(ip4 == addrEmpty);
  IPAddress ip6("::1");
  EXPECT_FALSE(addrEmpty == ip6);
  EXPECT_FALSE(ip6 == addrEmpty);
  IPAddress ip6Map("::ffff:192.0.2.129");
  EXPECT_FALSE(addrEmpty == ip6Map);
  EXPECT_FALSE(ip6Map == addrEmpty);
  IPAddress ip4Zero("0.0.0.0");
  EXPECT_FALSE(addrEmpty == ip4Zero);
  EXPECT_FALSE(ip4Zero == addrEmpty);
  IPAddress ip6Zero("::");
  EXPECT_FALSE(addrEmpty == ip6Zero);
  EXPECT_FALSE(ip6Zero == addrEmpty);
  EXPECT_EQ(addrEmpty, addrEmpty);
}

// Test subnet calcs with 6to4 addresses
TEST(IPAddress, InSubnetWith6to4) {
  auto ip = IPAddress("2002:c000:022a::"); // 192.0.2.42
  auto subnet = IPAddress("192.0.0.0");
  EXPECT_TRUE(ip.inSubnet(subnet, 16));

  auto ip2 = IPAddress("192.0.0.1");
  auto subnet2 = IPAddress("2002:c000:0000::"); // 192.0.0.0
  EXPECT_TRUE(ip2.inSubnet(subnet2, 14));

  auto ip3 = IPAddress("2002:c000:022a::"); // 192.0.2.42
  auto subnet3 = IPAddress("2002:c000:0000::"); // 192.0.0.0
  EXPECT_TRUE(ip3.inSubnet(subnet3, 16));
}

static const vector<string> ipv4Strs = {
    "127.0.0.1",
    "198.168.0.1",
    "8.8.0.0",
};
TEST(IPAddress, getIPv6For6To4) {
  for (auto ipv4Str : ipv4Strs) {
    auto ip = IPAddress(ipv4Str);
    EXPECT_TRUE(ip.isV4());
    IPAddressV4 ipv4 = ip.asV4();
    auto ipv6 = ipv4.getIPv6For6To4();
    EXPECT_EQ(ipv6.type(), IPAddressV6::Type::T6TO4);
    auto ipv4New = ipv6.getIPv4For6To4();
    EXPECT_EQ(ipv4Str, ipv4New.str());
  }
}

static const vector<pair<string, uint8_t>> invalidMasks = {
    {"127.0.0.1", 33},
    {"::1", 129},
};
TEST(IPAddress, InvalidMask) {
  for (auto& tc : invalidMasks) {
    auto ip = IPAddress(tc.first);
    EXPECT_THROW(ip.mask(tc.second), IPAddressFormatException);
  }
}

static const vector<pair<string, IPAddressV6::Type>> v6types = {
    {"::1", IPAddressV6::Type::NORMAL},
    {"2620:0:1cfe:face:b00c::3", IPAddressV6::Type::NORMAL},
    {"2001:0000:4136:e378:8000:63bf:3fff:fdd2", IPAddressV6::Type::TEREDO},
    {"2002:c000:022a::", IPAddressV6::Type::T6TO4},
};
TEST(IPAddress, V6Types) {
  auto mkName = [&](const IPAddressV6::Type t) -> string {
    switch (t) {
      case IPAddressV6::Type::TEREDO:
        return "teredo";
      case IPAddressV6::Type::T6TO4:
        return "6to4";
      default:
        return "default";
    }
  };

  for (auto& tc : v6types) {
    auto ip = IPAddress(tc.first);
    EXPECT_TRUE(ip.isV6());
    IPAddressV6 ipv6 = ip.asV6();
    EXPECT_EQ(tc.second, ipv6.type())
        << "expected " << mkName(tc.second) << ", got " << mkName(ipv6.type());
    switch (tc.second) {
      case IPAddressV6::Type::TEREDO:
        EXPECT_TRUE(ipv6.isTeredo()) << "isTeredo was false";
        EXPECT_FALSE(ipv6.is6To4()) << "is6To4 was true";
        break;
      case IPAddressV6::Type::T6TO4:
        EXPECT_TRUE(ipv6.is6To4()) << "is6To4 was false";
        EXPECT_FALSE(ipv6.isTeredo()) << "isTeredo was true";
        break;
      case IPAddressV6::Type::NORMAL:
        EXPECT_FALSE(ipv6.is6To4()) << "is6To4 was true";
        EXPECT_FALSE(ipv6.isTeredo()) << "isTeredo was true";
        break;
      default:
        FAIL() << "Invalid expected type: " << to<std::string>(tc.second);
    }
  }
}

static const vector<pair<string, uint32_t>> provideToLong = {
    {"0.0.0.0", 0},
    {"10.0.0.0", 167772160},
    {"126.131.128.23", 2122547223},
    {"192.168.0.0", 3232235520},
};
TEST(IPAddress, ToLong) {
  for (auto& tc : provideToLong) {
    auto ip = IPAddress(tc.first);
    EXPECT_TRUE(ip.isV4());
    IPAddressV4 ipv4 = ip.asV4();
    EXPECT_EQ(tc.second, ipv4.toLongHBO());

    auto ip2 = IPAddress::fromLongHBO(tc.second);
    EXPECT_TRUE(ip2.isV4());
    EXPECT_EQ(tc.first, ip2.str());
    EXPECT_EQ(tc.second, ip2.asV4().toLongHBO());

    auto nla = htonl(tc.second);
    auto ip3 = IPAddress::fromLong(nla);
    EXPECT_TRUE(ip3.isV4());
    EXPECT_EQ(tc.first, ip3.str());
    EXPECT_EQ(nla, ip3.asV4().toLong());
  }
}

TEST(IPAddress, fromBinaryV4) {
  for (auto& tc : provideToLong) {
    SCOPED_TRACE(tc.first);
    union {
      uint8_t u8[4];
      uint32_t u32;
    } data;
    data.u32 = Endian::big(tc.second);
    ByteRange bytes(data.u8, 4);

    auto fromBin = IPAddressV4::fromBinary(bytes);
    IPAddressV4 fromStr(tc.first);
    EXPECT_EQ(fromStr, fromBin);

    IPAddressV4 addr2("0.0.0.0");
    addr2 = IPAddressV4::fromBinary(bytes);
    EXPECT_EQ(fromStr, addr2);

    auto maybeAddr3 = IPAddressV4::tryFromBinary(bytes);
    EXPECT_TRUE(maybeAddr3.hasValue());
    EXPECT_EQ(fromStr, maybeAddr3.value());

    IPAddress genericAddr = IPAddress::fromBinary(bytes);
    ASSERT_TRUE(genericAddr.isV4());
    EXPECT_EQ(fromStr, genericAddr.asV4());
    EXPECT_EQ(ByteRange(genericAddr.bytes(), genericAddr.byteCount()), bytes);
  }

  uint8_t data[20];
  EXPECT_THROW(
      IPAddressV4::fromBinary(ByteRange(data, 3)), IPAddressFormatException);
  EXPECT_THROW(
      IPAddressV4::fromBinary(ByteRange(data, 16)), IPAddressFormatException);
  EXPECT_THROW(
      IPAddressV4::fromBinary(ByteRange(data, 20)), IPAddressFormatException);
}

TEST(IPAddress, toBinaryV4) {
  for (auto& tc : provideToLong) {
    SCOPED_TRACE(tc.first);
    union {
      uint8_t u8[4];
      uint32_t u32;
    } data;
    data.u32 = Endian::big(tc.second);
    ByteRange bytes(data.u8, 4);

    auto fromBin = IPAddressV4::fromBinary(bytes);
    auto toBin = fromBin.toBinary();
    EXPECT_EQ(bytes, toBin);
  }
}

using ByteArray8 = std::array<uint8_t, 8>;

static auto join8 = [](std::array<ByteArray8, 2> parts) {
  ByteArray16 _return;
  std::memcpy(_return.data(), parts.data(), _return.size());
  return _return;
};

static const vector<pair<string, ByteArray16>> provideBinary16Bytes = {
    make_pair(
        "::0",
        join8({{
            ByteArray8{{0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00}},
            ByteArray8{{0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00}},
        }})),
    make_pair(
        "1::2",
        join8({{
            ByteArray8{{0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00}},
            ByteArray8{{0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02}},
        }})),
    make_pair(
        "fe80::0012:34ff:fe56:78ab",
        join8(
            {{ByteArray8{{0xfe, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00}},
              ByteArray8{{0x00, 0x12, 0x34, 0xff, 0xfe, 0x56, 0x78, 0xab}}}})),
    make_pair(
        "2001:db8:1234:5678:90ab:cdef:8765:4321",
        join8({{
            ByteArray8{{0x20, 0x01, 0x0d, 0xb8, 0x12, 0x34, 0x56, 0x78}},
            ByteArray8{{0x90, 0xab, 0xcd, 0xef, 0x87, 0x65, 0x43, 0x21}},
        }})),
    make_pair(
        "::ffff:0:c0a8:1",
        join8({{
            ByteArray8{{0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00}},
            ByteArray8{{0xff, 0xff, 0x00, 0x00, 0xc0, 0xa8, 0x00, 0x01}},
        }})),
};

TEST(IPAddress, fromBinaryV6) {
  for (auto& tc : provideBinary16Bytes) {
    SCOPED_TRACE(tc.first);
    ByteRange bytes(&tc.second.front(), tc.second.size());

    auto fromBin = IPAddressV6::fromBinary(bytes);
    IPAddressV6 fromStr(tc.first);
    EXPECT_EQ(fromStr, fromBin);

    IPAddressV6 addr2("::0");
    addr2 = IPAddressV6::fromBinary(bytes);
    EXPECT_EQ(fromStr, addr2);

    auto maybeAddr3 = IPAddressV6::tryFromBinary(bytes);
    EXPECT_TRUE(maybeAddr3.hasValue());
    EXPECT_EQ(fromStr, maybeAddr3.value());

    IPAddress genericAddr = IPAddress::fromBinary(bytes);
    ASSERT_TRUE(genericAddr.isV6());
    EXPECT_EQ(fromStr, genericAddr.asV6());
    EXPECT_EQ(ByteRange(genericAddr.bytes(), genericAddr.byteCount()), bytes);
  }

  uint8_t data[20];
  EXPECT_THROW(
      IPAddressV6::fromBinary(ByteRange(data, 3)), IPAddressFormatException);
  EXPECT_THROW(
      IPAddressV6::fromBinary(ByteRange(data, 4)), IPAddressFormatException);
  EXPECT_THROW(
      IPAddressV6::fromBinary(ByteRange(data, 20)), IPAddressFormatException);
}

TEST(IPAddress, toBinaryV6) {
  for (auto& tc : provideBinary16Bytes) {
    SCOPED_TRACE(tc.first);
    ByteRange bytes(&tc.second.front(), tc.second.size());

    auto fromBin = IPAddressV6::fromBinary(bytes);
    auto toBin = fromBin.toBinary();
    EXPECT_EQ(bytes, toBin);
  }
}

TEST_P(IPAddressFlagTest, IsLoopback) {
  AddressFlags param = GetParam();
  IPAddress addr(param.address);

  EXPECT_EQ(param.version, addr.version());
  EXPECT_EQ(param.isLoopback(), addr.isLoopback());
}

TEST_P(IPAddressFlagTest, IsPrivate) {
  AddressFlags param = GetParam();
  IPAddress addr(param.address);

  EXPECT_EQ(param.version, addr.version());
  EXPECT_EQ(param.isPrivate(), addr.isPrivate()) << addr;
}

TEST_P(IPAddressFlagTest, IsNonroutable) {
  AddressFlags param = GetParam();
  IPAddress addr(param.address);

  EXPECT_EQ(param.version, addr.version());
  EXPECT_EQ(param.isNonroutable(), addr.isNonroutable()) << addr;
}

TEST_P(IPAddressFlagTest, IsZero) {
  AddressFlags param = GetParam();
  IPAddress addr(param.address);

  EXPECT_EQ(param.version, addr.version());
  EXPECT_EQ(param.isZero(), addr.isZero()) << addr;
}

TEST_P(IPAddressFlagTest, IsLinkLocal) {
  AddressFlags param = GetParam();
  IPAddress addr(param.address);
  EXPECT_EQ(param.isLinkLocal(), addr.isLinkLocal()) << addr;
}

TEST(IPAddress, CreateLinkLocal) {
  IPAddressV6 addr(IPAddressV6::LINK_LOCAL, MacAddress("00:05:73:f9:46:fc"));
  EXPECT_EQ(IPAddressV6("fe80::0205:73ff:fef9:46fc"), addr);

  addr = IPAddressV6(IPAddressV6::LINK_LOCAL, MacAddress("02:00:00:12:34:56"));
  EXPECT_EQ(IPAddressV6("fe80::ff:fe12:3456"), addr);
}

TEST_P(IPAddressFlagTest, IsLinkLocalBroadcast) {
  AddressFlags param = GetParam();
  IPAddress addr(param.address);
  EXPECT_EQ(param.version, addr.version());
  EXPECT_EQ(param.isLinkLocalBroadcast(), addr.isLinkLocalBroadcast());
}

TEST(IPAddress, SolicitedNodeAddress) {
  // An example from RFC 4291 section 2.7.1
  EXPECT_EQ(
      IPAddressV6("ff02::1:ff0e:8c6c"),
      IPAddressV6("4037::01:800:200e:8c6c").getSolicitedNodeAddress());

  // An example from wikipedia
  // (http://en.wikipedia.org/wiki/Solicited-node_multicast_address)
  EXPECT_EQ(
      IPAddressV6("ff02::1:ff28:9c5a"),
      IPAddressV6("fe80::2aa:ff:fe28:9c5a").getSolicitedNodeAddress());
}

TEST_P(IPAddressByteAccessorTest, CheckBytes) {
  auto addrData = GetParam();
  IPAddress ip(addrData.address);
  size_t i = 0;
  for (auto byitr = addrData.bytes.begin(); i < ip.byteCount(); ++i, ++byitr) {
    EXPECT_EQ(*byitr, ip.getNthMSByte(i));
    EXPECT_EQ(
        *byitr,
        ip.isV4() ? ip.asV4().getNthMSByte(i) : ip.asV6().getNthMSByte(i));
  }
  i = 0;
  for (auto byritr = addrData.bytes.rbegin(); i < ip.byteCount();
       ++i, ++byritr) {
    EXPECT_EQ(*byritr, ip.getNthLSByte(i));
    EXPECT_EQ(
        *byritr,
        ip.isV4() ? ip.asV4().getNthLSByte(i) : ip.asV6().getNthLSByte(i));
  }
}

TEST_P(IPAddressBitAccessorTest, CheckBits) {
  auto addrData = GetParam();
  auto littleEndianAddrData = addrData.bytes;
  // IPAddress stores address data in n/w byte order.
  reverse(littleEndianAddrData.begin(), littleEndianAddrData.end());
  // Bit iterator goes from LSBit to MSBit
  // We will traverse the IPAddress bits from 0 to bitCount -1
  auto bitr = folly::makeBitIterator(littleEndianAddrData.begin());
  IPAddress ip(addrData.address);
  for (size_t i = 0; i < ip.bitCount(); ++i) {
    auto msbIndex = ip.bitCount() - i - 1;
    EXPECT_EQ(*bitr, ip.getNthMSBit(msbIndex));
    EXPECT_EQ(
        *bitr,
        ip.isV4() ? ip.asV4().getNthMSBit(msbIndex)
                  : ip.asV6().getNthMSBit(msbIndex));
    EXPECT_EQ(*bitr, ip.getNthLSBit(i));
    EXPECT_EQ(
        *bitr, ip.isV4() ? ip.asV4().getNthLSBit(i) : ip.asV6().getNthLSBit(i));
    ++bitr;
  }
}

TEST(IPAddress, InvalidByteAccess) {
  IPAddress ip4("10.10.10.10");
  // MSByte, LSByte accessors are 0 indexed
  EXPECT_THROW(ip4.getNthMSByte(ip4.byteCount()), std::invalid_argument);
  EXPECT_THROW(ip4.getNthLSByte(ip4.byteCount()), std::invalid_argument);
  EXPECT_THROW(ip4.getNthMSByte(-1), std::invalid_argument);
  EXPECT_THROW(ip4.getNthLSByte(-1), std::invalid_argument);
  auto asV4 = ip4.asV4();
  EXPECT_THROW(asV4.getNthMSByte(asV4.byteCount()), std::invalid_argument);
  EXPECT_THROW(asV4.getNthLSByte(asV4.byteCount()), std::invalid_argument);
  EXPECT_THROW(asV4.getNthMSByte(-1), std::invalid_argument);
  EXPECT_THROW(asV4.getNthLSByte(-1), std::invalid_argument);

  IPAddress ip6("2620:0:1cfe:face:b00c::3");
  EXPECT_THROW(ip6.getNthMSByte(ip6.byteCount()), std::invalid_argument);
  EXPECT_THROW(ip6.getNthLSByte(ip6.byteCount()), std::invalid_argument);
  EXPECT_THROW(ip6.getNthMSByte(-1), std::invalid_argument);
  EXPECT_THROW(ip6.getNthLSByte(-1), std::invalid_argument);
  auto asV6 = ip6.asV6();
  EXPECT_THROW(asV6.getNthMSByte(asV6.byteCount()), std::invalid_argument);
  EXPECT_THROW(asV6.getNthLSByte(asV6.byteCount()), std::invalid_argument);
  EXPECT_THROW(asV6.getNthMSByte(-1), std::invalid_argument);
  EXPECT_THROW(asV6.getNthLSByte(-1), std::invalid_argument);
}

TEST(IPAddress, InvalidBBitAccess) {
  IPAddress ip4("10.10.10.10");
  // MSByte, LSByte accessors are 0 indexed
  EXPECT_THROW(ip4.getNthMSBit(ip4.bitCount()), std::invalid_argument);
  EXPECT_THROW(ip4.getNthLSBit(ip4.bitCount()), std::invalid_argument);
  EXPECT_THROW(ip4.getNthMSBit(-1), std::invalid_argument);
  EXPECT_THROW(ip4.getNthLSBit(-1), std::invalid_argument);
  auto asV4 = ip4.asV4();
  EXPECT_THROW(asV4.getNthMSBit(asV4.bitCount()), std::invalid_argument);
  EXPECT_THROW(asV4.getNthLSBit(asV4.bitCount()), std::invalid_argument);
  EXPECT_THROW(asV4.getNthMSBit(-1), std::invalid_argument);
  EXPECT_THROW(asV4.getNthLSBit(-1), std::invalid_argument);

  IPAddress ip6("2620:0:1cfe:face:b00c::3");
  EXPECT_THROW(ip6.getNthMSBit(ip6.bitCount()), std::invalid_argument);
  EXPECT_THROW(ip6.getNthLSBit(ip6.bitCount()), std::invalid_argument);
  EXPECT_THROW(ip6.getNthMSBit(-1), std::invalid_argument);
  EXPECT_THROW(ip6.getNthLSBit(-1), std::invalid_argument);
  auto asV6 = ip6.asV6();
  EXPECT_THROW(asV6.getNthMSBit(asV6.bitCount()), std::invalid_argument);
  EXPECT_THROW(asV6.getNthLSBit(asV6.bitCount()), std::invalid_argument);
  EXPECT_THROW(asV6.getNthMSBit(-1), std::invalid_argument);
  EXPECT_THROW(asV6.getNthLSBit(-1), std::invalid_argument);
}

TEST(IPAddress, StringFormat) {
  in6_addr a6;
  for (int i = 0; i < 8; ++i) {
    auto t = htons(0x0123 + ((i % 4) * 0x4444));
#ifdef _WIN32
    a6.u.Word[i] = t;
#else
    a6.s6_addr16[i] = t;
#endif
  }
  EXPECT_EQ(
      "0123:4567:89ab:cdef:0123:4567:89ab:cdef", detail::fastIpv6ToString(a6));

  in_addr a4;
  a4.s_addr = htonl(0x01020304);
  EXPECT_EQ("1.2.3.4", detail::fastIpv4ToString(a4));
}

TEST(IPAddress, getMacAddressFromLinkLocal) {
  IPAddressV6 ip6("fe80::f652:14ff:fec5:74d8");
  EXPECT_TRUE(ip6.getMacAddressFromLinkLocal().hasValue());
  EXPECT_EQ("f4:52:14:c5:74:d8", ip6.getMacAddressFromLinkLocal()->toString());
}

TEST(IPAddress, getMacAddressFromLinkLocal_Negative) {
  IPAddressV6 no_link_local_ip6("2803:6082:a2:4447::1");
  EXPECT_FALSE(no_link_local_ip6.getMacAddressFromLinkLocal().hasValue());
  no_link_local_ip6 = IPAddressV6("fe80::f652:14ff:ccc5:74d8");
  EXPECT_FALSE(no_link_local_ip6.getMacAddressFromLinkLocal().hasValue());
  no_link_local_ip6 = IPAddressV6("fe80::f652:14ff:ffc5:74d8");
  EXPECT_FALSE(no_link_local_ip6.getMacAddressFromLinkLocal().hasValue());
  no_link_local_ip6 = IPAddressV6("fe81::f652:14ff:ffc5:74d8");
  EXPECT_FALSE(no_link_local_ip6.getMacAddressFromLinkLocal().hasValue());
}

TEST(IPAddress, getMacAddressFromEUI64) {
  IPAddressV6 ip6("2401:db00:3020:51dc:4a57:ddff:fe04:5643");
  EXPECT_TRUE(ip6.getMacAddressFromEUI64().hasValue());
  EXPECT_EQ("48:57:dd:04:56:43", ip6.getMacAddressFromEUI64()->toString());
  ip6 = IPAddressV6("fe80::4a57:ddff:fe04:5643");
  EXPECT_TRUE(ip6.getMacAddressFromEUI64().hasValue());
  EXPECT_EQ("48:57:dd:04:56:43", ip6.getMacAddressFromEUI64()->toString());
}

TEST(IPAddress, getMacAddressFromEUI64_Negative) {
  IPAddressV6 not_eui64_ip6("2401:db00:3020:51dc:face:0000:009a:0000");
  EXPECT_FALSE(not_eui64_ip6.getMacAddressFromEUI64().hasValue());
}

TEST(IPAddress, LongestCommonPrefix) {
  IPAddress ip10("10.0.0.0");
  IPAddress ip11("11.0.0.0");
  IPAddress ip12("12.0.0.0");
  IPAddress ip128("128.0.0.0");
  IPAddress ip10dot10("10.10.0.0");
  auto prefix = IPAddress::longestCommonPrefix({ip10, 8}, {ip128, 8});
  auto prefix4 =
      IPAddressV4::longestCommonPrefix({ip10.asV4(), 8}, {ip128.asV4(), 8});
  // No bits match b/w 128/8 and 10/8
  EXPECT_EQ(IPAddress("0.0.0.0"), prefix.first);
  EXPECT_EQ(0, prefix.second);
  EXPECT_EQ(IPAddressV4("0.0.0.0"), prefix4.first);
  EXPECT_EQ(0, prefix4.second);

  prefix = IPAddress::longestCommonPrefix({ip10, 8}, {ip10dot10, 16});
  prefix4 = IPAddressV4::longestCommonPrefix(
      {ip10.asV4(), 8}, {ip10dot10.asV4(), 16});
  // Between 10/8 and 10.10/16, 10/8 is the longest common match
  EXPECT_EQ(ip10, prefix.first);
  EXPECT_EQ(8, prefix.second);
  EXPECT_EQ(ip10.asV4(), prefix4.first);
  EXPECT_EQ(8, prefix4.second);

  prefix = IPAddress::longestCommonPrefix({ip11, 8}, {ip12, 8});
  prefix4 =
      IPAddressV4::longestCommonPrefix({ip11.asV4(), 8}, {ip12.asV4(), 8});
  // 12 = 1100, 11 = 1011, longest match - 1000 = 8
  EXPECT_EQ(IPAddress("8.0.0.0"), prefix.first);
  EXPECT_EQ(5, prefix.second);
  EXPECT_EQ(IPAddressV4("8.0.0.0"), prefix4.first);
  EXPECT_EQ(5, prefix4.second);

  // Between 128/1 and 128/2, longest match 128/1
  prefix = IPAddress::longestCommonPrefix({ip128, 1}, {ip128, 2});
  prefix4 =
      IPAddressV4::longestCommonPrefix({ip128.asV4(), 1}, {ip128.asV4(), 2});
  EXPECT_EQ(ip128, prefix.first);
  EXPECT_EQ(1, prefix.second);
  EXPECT_EQ(ip128.asV4(), prefix4.first);
  EXPECT_EQ(1, prefix4.second);

  IPAddress ip6("2620:0:1cfe:face:b00c::3");
  prefix = IPAddress::longestCommonPrefix(
      {ip6, ip6.bitCount()}, {ip6, ip6.bitCount()});
  auto prefix6 = IPAddressV6::longestCommonPrefix(
      {ip6.asV6(), IPAddressV6::bitCount()},
      {ip6.asV6(), IPAddressV6::bitCount()});
  // Longest common b/w me and myself is myself
  EXPECT_EQ(ip6, prefix.first);
  EXPECT_EQ(ip6.bitCount(), prefix.second);
  EXPECT_EQ(ip6.asV6(), prefix6.first);
  EXPECT_EQ(ip6.asV6().bitCount(), prefix6.second);

  IPAddress ip6Zero("::");
  prefix = IPAddress::longestCommonPrefix({ip6, ip6.bitCount()}, {ip6Zero, 0});
  prefix6 = IPAddressV6::longestCommonPrefix(
      {ip6.asV6(), IPAddressV6::bitCount()}, {ip6Zero.asV6(), 0});
  // Longest common b/w :: (ipv6 equivalent of 0/0) is ::
  EXPECT_EQ(ip6Zero, prefix.first);
  EXPECT_EQ(0, prefix.second);

  // Exceptional cases
  EXPECT_THROW(
      IPAddress::longestCommonPrefix({ip10, 8}, {ip6, 128}),
      std::invalid_argument);
  EXPECT_THROW(
      IPAddress::longestCommonPrefix({ip10, ip10.bitCount() + 1}, {ip10, 8}),
      std::invalid_argument);
  EXPECT_THROW(
      IPAddressV4::longestCommonPrefix(
          {ip10.asV4(), IPAddressV4::bitCount() + 1}, {ip10.asV4(), 8}),
      std::invalid_argument);
  EXPECT_THROW(
      IPAddress::longestCommonPrefix(
          {ip6, ip6.bitCount() + 1}, {ip6, ip6.bitCount()}),
      std::invalid_argument);
  EXPECT_THROW(
      IPAddressV6::longestCommonPrefix(
          {ip6.asV6(), IPAddressV6::bitCount() + 1},
          {ip6.asV6(), IPAddressV6::bitCount()}),
      std::invalid_argument);
}

static const vector<AddressData> validAddressProvider = {
    AddressData("127.0.0.1", {127, 0, 0, 1}, 4),
    AddressData("69.63.189.16", {69, 63, 189, 16}, 4),
    AddressData("0.0.0.0", {0, 0, 0, 0}, 4),
    AddressData("::1", {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1}, 6),
    AddressData(
        "2620:0:1cfe:face:b00c::3",
        {38, 32, 0, 0, 28, 254, 250, 206, 176, 12, 0, 0, 0, 0, 0, 3},
        6),
};

static const vector<string> invalidAddressProvider = {
    "",
    "foo",
    "1.1.1.256",
    "1",
    ":1",
    "127.0.0.1,127.0.0.1",
    "[1234]",
};

static const vector<ByteVector> invalidBinaryProvider = {
    {0x31, 0x32, 0x37, 0x2e, 0x30, 0x30, 0x2e, 0x30, 0x2e, 0x31},
    // foo
    {0x66, 0x6f, 0x6f},
    {0x00},
    {0x00, 0x00},
    {0x00, 0x00, 0x00},
    {0x00, 0x00, 0x00, 0x00, 0x00},
    {0xff},
};

static const uint8_t IS_LOCAL = AddressFlags::IS_LOCAL;
static const uint8_t IS_NONROUTABLE = AddressFlags::IS_NONROUTABLE;
static const uint8_t IS_PRIVATE = AddressFlags::IS_PRIVATE;
static const uint8_t IS_ZERO = AddressFlags::IS_ZERO;
static const uint8_t IS_LINK_LOCAL =
    AddressFlags::IS_LINK_LOCAL | IS_NONROUTABLE;
static const uint8_t IS_PVT_NONROUTE = IS_NONROUTABLE | IS_PRIVATE;
static const uint8_t IS_MULTICAST = AddressFlags::IS_MULTICAST;
static const uint8_t IS_LINK_LOCAL_BROADCAST =
    AddressFlags::IS_LINK_LOCAL_BROADCAST;

static vector<AddressFlags> flagProvider = {
    // public v4
    AddressFlags("69.63.176.1", 4, 0),
    AddressFlags("128.12.65.3", 4, 0),
    AddressFlags("192.0.1.0", 4, 0),
    AddressFlags("198.51.101.0", 4, 0),
    AddressFlags("203.0.114.0", 4, 0),
    AddressFlags("128.12.64.115", 4, 0),

    // public v6
    AddressFlags("2620:0:1cfe:face:b00c::3", 6, 0),

    // localhost
    AddressFlags("127.0.0.1", 4, IS_LOCAL | IS_PVT_NONROUTE),
    AddressFlags("::1", 6, IS_LOCAL | IS_PVT_NONROUTE),

    // link-local v4
    AddressFlags("169.254.0.1", 4, IS_LINK_LOCAL | IS_PVT_NONROUTE),

    // private v4
    AddressFlags("10.0.0.0", 4, IS_PVT_NONROUTE),
    AddressFlags("10.11.12.13", 4, IS_PVT_NONROUTE),
    AddressFlags("10.255.255.255", 4, IS_PVT_NONROUTE),
    AddressFlags("127.128.129.200", 4, IS_LOCAL | IS_PVT_NONROUTE),
    AddressFlags("127.255.255.255", 4, IS_LOCAL | IS_PVT_NONROUTE),
    AddressFlags("169.254.0.0", 4, IS_LINK_LOCAL | IS_PVT_NONROUTE),
    AddressFlags("192.168.0.0", 4, IS_PVT_NONROUTE),
    AddressFlags("192.168.200.255", 4, IS_PVT_NONROUTE),
    AddressFlags("192.168.255.255", 4, IS_PVT_NONROUTE),

    // private v6
    AddressFlags("fd01:1637:1c56:66af::", 6, IS_PVT_NONROUTE),

    // non routable v4
    AddressFlags("0.0.0.0", 4, IS_NONROUTABLE | IS_ZERO),
    AddressFlags("0.255.255.255", 4, IS_NONROUTABLE),
    AddressFlags("192.0.0.0", 4, IS_NONROUTABLE),
    AddressFlags("192.0.2.0", 4, IS_NONROUTABLE),
    AddressFlags("198.18.0.0", 4, IS_NONROUTABLE),
    AddressFlags("198.19.255.255", 4, IS_NONROUTABLE),
    AddressFlags("198.51.100.0", 4, IS_NONROUTABLE),
    AddressFlags("198.51.100.255", 4, IS_NONROUTABLE),
    AddressFlags("203.0.113.0", 4, IS_NONROUTABLE),
    AddressFlags("203.0.113.255", 4, IS_NONROUTABLE),
    AddressFlags("224.0.0.0", 4, IS_NONROUTABLE | IS_MULTICAST),
    AddressFlags("240.0.0.0", 4, IS_NONROUTABLE),
    AddressFlags("224.0.0.0", 4, IS_NONROUTABLE),
    // v4 link local broadcast
    AddressFlags(
        "255.255.255.255",
        4,
        IS_NONROUTABLE | IS_LINK_LOCAL_BROADCAST),

    // non routable v6
    AddressFlags("1999::1", 6, IS_NONROUTABLE),
    AddressFlags("0::0", 6, IS_NONROUTABLE | IS_ZERO),
    AddressFlags("0::0:0", 6, IS_NONROUTABLE | IS_ZERO),
    AddressFlags("0:0:0::0", 6, IS_NONROUTABLE | IS_ZERO),

    // link-local v6
    AddressFlags("fe80::0205:73ff:fef9:46fc", 6, IS_LINK_LOCAL),
    AddressFlags("fe80::0012:34ff:fe56:7890", 6, IS_LINK_LOCAL),

    // multicast v4
    AddressFlags("224.0.0.1", 4, IS_MULTICAST | IS_NONROUTABLE),
    AddressFlags("224.0.0.251", 4, IS_MULTICAST | IS_NONROUTABLE),
    AddressFlags("239.12.34.56", 4, IS_MULTICAST | IS_NONROUTABLE),

    // multicast v6
    AddressFlags("ff00::", 6, IS_MULTICAST | IS_NONROUTABLE),
    AddressFlags("ff02:ffff::1", 6, IS_MULTICAST | IS_NONROUTABLE),
    AddressFlags("ff02::101", 6, IS_MULTICAST | IS_NONROUTABLE),
    AddressFlags("ff0e::101", 6, IS_MULTICAST),
    // v6 link local broadcast
    AddressFlags("ff02::1", 6, IS_NONROUTABLE | IS_LINK_LOCAL_BROADCAST),
};

static const vector<pair<string, string>> mapProvider = {
    {"::ffff:192.0.2.128", "192.0.2.128"},
    {"192.0.2.128", "::ffff:192.0.2.128"},
    {"::FFFF:129.144.52.38", "129.144.52.38"},
    {"129.144.52.38", "::FFFF:129.144.52.38"},
    {"0:0:0:0:0:FFFF:222.1.41.90", "222.1.41.90"},
    {"::FFFF:222.1.41.90", "222.1.41.90"},
};

static const vector<MaskData> masksProvider = {
    MaskData("255.255.255.255", 1, "128.0.0.0"),
    MaskData("255.255.255.255", 2, "192.0.0.0"),
    MaskData("192.0.2.42", 16, "192.0.0.0"),
    MaskData("255.255.255.255", 24, "255.255.255.0"),
    MaskData("255.255.255.255", 32, "255.255.255.255"),
    MaskData("10.10.10.10", 0, "0.0.0.0"),
    MaskData("::1", 64, "::"),
    MaskData("2620:0:1cfe:face:b00c::3", 1, "::"),
    MaskData("2620:0:1cfe:face:b00c::3", 3, "2000::"),
    MaskData("2620:0:1cfe:face:b00c::3", 6, "2400::"),
    MaskData("2620:0:1cfe:face:b00c::3", 7, "2600::"),
    MaskData("2620:0:1cfe:face:b00c::3", 11, "2620::"),
    MaskData("2620:0:1cfe:face:b00c::3", 36, "2620:0:1000::"),
    MaskData("2620:0:1cfe:face:b00c::3", 37, "2620:0:1800::"),
    MaskData("2620:0:1cfe:face:b00c::3", 38, "2620:0:1c00::"),
    MaskData("2620:0:1cfe:face:b00c::3", 41, "2620:0:1c80::"),
    MaskData("2620:0:1cfe:face:b00c::3", 42, "2620:0:1cc0::"),
    MaskData("2620:0:1cfe:face:b00c::3", 43, "2620:0:1ce0::"),
    MaskData("2620:0:1cfe:face:b00c::3", 44, "2620:0:1cf0::"),
    MaskData("2620:0:1cfe:face:b00c::3", 45, "2620:0:1cf8::"),
    MaskData("2620:0:1cfe:face:b00c::3", 46, "2620:0:1cfc::"),
    MaskData("2620:0:1cfe:face:b00c::3", 47, "2620:0:1cfe::"),
    MaskData("2620:0:1cfe:face:b00c::3", 49, "2620:0:1cfe:8000::"),
    MaskData("2620:0:1cfe:face:b00c::3", 50, "2620:0:1cfe:c000::"),
    MaskData("2620:0:1cfe:face:b00c::3", 51, "2620:0:1cfe:e000::"),
    MaskData("2620:0:1cfe:face:b00c::3", 52, "2620:0:1cfe:f000::"),
    MaskData("2620:0:1cfe:face:b00c::3", 53, "2620:0:1cfe:f800::"),
    MaskData("2620:0:1cfe:face:b00c::3", 55, "2620:0:1cfe:fa00::"),
    MaskData("2620:0:1cfe:face:b00c::3", 57, "2620:0:1cfe:fa80::"),
    MaskData("2620:0:1cfe:face:b00c::3", 58, "2620:0:1cfe:fac0::"),
    MaskData("2620:0:1cfe:face:b00c::3", 61, "2620:0:1cfe:fac8::"),
    MaskData("2620:0:1cfe:face:b00c::3", 62, "2620:0:1cfe:facc::"),
    MaskData("2620:0:1cfe:face:b00c::3", 63, "2620:0:1cfe:face::"),
    MaskData("2620:0:1cfe:face:b00c::3", 65, "2620:0:1cfe:face:8000::"),
    MaskData("2620:0:1cfe:face:b00c::3", 67, "2620:0:1cfe:face:a000::"),
    MaskData("2620:0:1cfe:face:b00c::3", 68, "2620:0:1cfe:face:b000::"),
    MaskData("2620:0:1cfe:face:b00c::3", 77, "2620:0:1cfe:face:b008::"),
    MaskData("2620:0:1cfe:face:b00c::3", 78, "2620:0:1cfe:face:b00c::"),
    MaskData("2620:0:1cfe:face:b00c::3", 127, "2620:0:1cfe:face:b00c::2"),
    MaskData("2620:0:1cfe:face:b00c::3", 128, "2620:0:1cfe:face:b00c::3"),
    MaskData("2620:0:1cfe:face:b00c::3", 0, "::"),
};

static const vector<MaskBoundaryData> maskBoundaryProvider = {
    MaskBoundaryData("10.1.1.1", 24, "10.1.1.1", true),
    MaskBoundaryData("10.1.1.1", 8, "10.1.2.3", true),
    MaskBoundaryData("2620:0:1cfe:face:b00c::1", 48, "2620:0:1cfe::", true),
    // addresses that are NOT in the same subnet once mask is applied
    MaskBoundaryData("10.1.1.1", 24, "10.1.2.1", false),
    MaskBoundaryData("10.1.1.1", 16, "10.2.3.4", false),
    MaskBoundaryData("2620:0:1cfe:face:b00c::1", 48, "2620:0:1cfc::", false),
};

INSTANTIATE_TEST_CASE_P(
    IPAddress,
    IPAddressTest,
    ::testing::ValuesIn(validAddressProvider));
INSTANTIATE_TEST_CASE_P(
    IPAddress,
    IPAddressFlagTest,
    ::testing::ValuesIn(flagProvider));
INSTANTIATE_TEST_CASE_P(
    IPAddress,
    IPAddressMappedTest,
    ::testing::ValuesIn(mapProvider));
INSTANTIATE_TEST_CASE_P(
    IPAddress,
    IPAddressCtorTest,
    ::testing::ValuesIn(invalidAddressProvider));
INSTANTIATE_TEST_CASE_P(
    IPAddress,
    IPAddressCtorBinaryTest,
    ::testing::ValuesIn(invalidBinaryProvider));
INSTANTIATE_TEST_CASE_P(
    IPAddress,
    IPAddressMaskTest,
    ::testing::ValuesIn(masksProvider));
INSTANTIATE_TEST_CASE_P(
    IPAddress,
    IPAddressMaskBoundaryTest,
    ::testing::ValuesIn(maskBoundaryProvider));
INSTANTIATE_TEST_CASE_P(
    IPAddress,
    IPAddressByteAccessorTest,
    ::testing::ValuesIn(validAddressProvider));
INSTANTIATE_TEST_CASE_P(
    IPAddress,
    IPAddressBitAccessorTest,
    ::testing::ValuesIn(validAddressProvider));
INSTANTIATE_TEST_CASE_P(
    IPAddress,
    TryFromStringTest,
    ::testing::ValuesIn(TryFromStringTest::ipInOutProvider()));

TEST(IPAddressV4, fetchMask) {
  struct X : private IPAddressV4 {
    using IPAddressV4::fetchMask;
  };

  EXPECT_THAT(
      X::fetchMask(0),
      ::testing::ElementsAreArray(ByteArray4{{0x00, 0x00, 0x00, 0x00}}));

  EXPECT_THAT(
      X::fetchMask(1),
      ::testing::ElementsAreArray(ByteArray4{{0x80, 0x00, 0x00, 0x00}}));

  EXPECT_THAT(
      X::fetchMask(31),
      ::testing::ElementsAreArray(ByteArray4{{0xff, 0xff, 0xff, 0xfe}}));

  EXPECT_THAT(
      X::fetchMask(32),
      ::testing::ElementsAreArray(ByteArray4{{0xff, 0xff, 0xff, 0xff}}));
}

TEST(IPAddressV6, fetchMask) {
  struct X : private IPAddressV6 {
    using IPAddressV6::fetchMask;
  };

  EXPECT_THAT(
      X::fetchMask(0),
      ::testing::ElementsAreArray(join8({{
          ByteArray8{{0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00}},
          ByteArray8{{0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00}},
      }})));

  EXPECT_THAT(
      X::fetchMask(1),
      ::testing::ElementsAreArray(join8({{
          ByteArray8{{0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00}},
          ByteArray8{{0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00}},
      }})));

  EXPECT_THAT(
      X::fetchMask(63),
      ::testing::ElementsAreArray(join8({{
          ByteArray8{{0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xfe}},
          ByteArray8{{0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00}},
      }})));

  EXPECT_THAT(
      X::fetchMask(64),
      ::testing::ElementsAreArray(join8({{
          ByteArray8{{0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff}},
          ByteArray8{{0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00}},
      }})));

  EXPECT_THAT(
      X::fetchMask(65),
      ::testing::ElementsAreArray(join8({{
          ByteArray8{{0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff}},
          ByteArray8{{0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00}},
      }})));

  EXPECT_THAT(
      X::fetchMask(127),
      ::testing::ElementsAreArray(join8({{
          ByteArray8{{0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff}},
          ByteArray8{{0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xfe}},
      }})));

  EXPECT_THAT(
      X::fetchMask(128),
      ::testing::ElementsAreArray(join8({{
          ByteArray8{{0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff}},
          ByteArray8{{0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff}},
      }})));
}
