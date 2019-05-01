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

#include <folly/SocketAddress.h>

#include <iostream>
#include <sstream>
#include <system_error>

#include <folly/String.h>
#include <folly/container/Array.h>
#include <folly/experimental/TestUtil.h>
#include <folly/portability/GTest.h>
#include <folly/portability/Sockets.h>
#include <folly/test/SocketAddressTestHelper.h>

using folly::SocketAddress;
using folly::SocketAddressTestHelper;
using folly::test::TemporaryDirectory;
using std::cerr;
using std::endl;
using std::string;

namespace fsp = folly::portability::sockets;

TEST(SocketAddress, Size) {
  SocketAddress addr;
  EXPECT_EQ(sizeof(addr), 32);
}

TEST(SocketAddress, ConstructFromIpv4) {
  SocketAddress addr("1.2.3.4", 4321);
  EXPECT_EQ(addr.getFamily(), AF_INET);
  EXPECT_EQ(addr.getAddressStr(), "1.2.3.4");
  EXPECT_EQ(addr.getPort(), 4321);
  sockaddr_storage addrStorage;
  addr.getAddress(&addrStorage);
  const sockaddr_in* inaddr = reinterpret_cast<sockaddr_in*>(&addrStorage);
  EXPECT_EQ(inaddr->sin_addr.s_addr, htonl(0x01020304));
  EXPECT_EQ(inaddr->sin_port, htons(4321));
}

TEST(SocketAddress, StringConversion) {
  SocketAddress addr("1.2.3.4", 4321);
  EXPECT_EQ(addr.getFamily(), AF_INET);
  EXPECT_EQ(addr.getAddressStr(), "1.2.3.4");
  char buf[30];
  addr.getAddressStr(buf, 2);
  EXPECT_STREQ(buf, "1");
}

TEST(SocketAddress, IPv4ToStringConversion) {
  // testing addresses *.5.5.5, 5.*.5.5, 5.5.*.5, 5.5.5.*
  SocketAddress addr;
  for (int pos = 0; pos < 4; ++pos) {
    for (int i = 0; i < 256; ++i) {
      auto fragments = folly::make_array(5, 5, 5, 5);
      fragments[pos] = i;
      auto ipString = folly::join(".", fragments);
      addr.setFromIpPort(ipString, 1234);
      EXPECT_EQ(addr.getAddressStr(), ipString);
    }
  }
}

TEST(SocketAddress, SetFromIpAddressPort) {
  SocketAddress addr;
  folly::IPAddress ipAddr("123.234.0.23");
  addr.setFromIpAddrPort(ipAddr, 8888);
  EXPECT_EQ(addr.getFamily(), AF_INET);
  EXPECT_EQ(addr.getAddressStr(), "123.234.0.23");
  EXPECT_EQ(addr.getIPAddress(), ipAddr);
  EXPECT_EQ(addr.getPort(), 8888);

  folly::IPAddress ip6Addr("2620:0:1cfe:face:b00c::3");
  SocketAddress addr6(ip6Addr, 8888);
  EXPECT_EQ(addr6.getFamily(), AF_INET6);
  EXPECT_EQ(addr6.getAddressStr(), "2620:0:1cfe:face:b00c::3");
  EXPECT_EQ(addr6.getIPAddress(), ip6Addr);
  EXPECT_EQ(addr6.getPort(), 8888);
}

TEST(SocketAddress, SetFromIpv4) {
  SocketAddress addr;
  addr.setFromIpPort("255.254.253.252", 8888);
  EXPECT_EQ(addr.getFamily(), AF_INET);
  EXPECT_EQ(addr.getAddressStr(), "255.254.253.252");
  EXPECT_EQ(addr.getPort(), 8888);
  sockaddr_storage addrStorage;
  addr.getAddress(&addrStorage);
  const sockaddr_in* inaddr = reinterpret_cast<sockaddr_in*>(&addrStorage);
  EXPECT_EQ(inaddr->sin_addr.s_addr, htonl(0xfffefdfc));
  EXPECT_EQ(inaddr->sin_port, htons(8888));
}

TEST(SocketAddress, ConstructFromInvalidIpv4) {
  EXPECT_THROW(SocketAddress("1.2.3.256", 1234), std::runtime_error);
}

TEST(SocketAddress, SetFromInvalidIpv4) {
  SocketAddress addr("12.34.56.78", 80);

  // Try setting to an invalid value
  // Since setFromIpPort() shouldn't allow hostname lookups, setting to
  // "localhost" should fail, even if localhost is resolvable
  EXPECT_THROW(addr.setFromIpPort("localhost", 1234), std::runtime_error);

  // Make sure the address still has the old contents
  EXPECT_EQ(addr.getFamily(), AF_INET);
  EXPECT_EQ(addr.getAddressStr(), "12.34.56.78");
  EXPECT_EQ(addr.getPort(), 80);
  sockaddr_storage addrStorage;
  addr.getAddress(&addrStorage);
  const sockaddr_in* inaddr = reinterpret_cast<sockaddr_in*>(&addrStorage);
  EXPECT_EQ(inaddr->sin_addr.s_addr, htonl(0x0c22384e));
}

TEST(SocketAddress, SetFromHostname) {
  // hopefully "localhost" is resolvable on any system that will run the tests
  EXPECT_THROW(SocketAddress("localhost", 80), std::runtime_error);
  SocketAddress addr("localhost", 80, true);

  SocketAddress addr2;
  EXPECT_THROW(addr2.setFromIpPort("localhost", 0), std::runtime_error);
  addr2.setFromHostPort("localhost", 0);
}

TEST(SocketAddress, SetFromStrings) {
  SocketAddress addr;

  // Set from a numeric port string
  addr.setFromLocalPort("1234");
  EXPECT_EQ(addr.getPort(), 1234);

  // setFromLocalPort() should not accept service names
  EXPECT_THROW(addr.setFromLocalPort("http"), std::runtime_error);

  // Call setFromLocalIpPort() with just a port, no IP
  addr.setFromLocalIpPort("80");
  EXPECT_EQ(addr.getPort(), 80);

  // Call setFromLocalIpPort() with an IP and port.
  if (SocketAddressTestHelper::isIPv4Enabled()) {
    addr.setFromLocalIpPort("127.0.0.1:4321");
    EXPECT_EQ(addr.getAddressStr(), "127.0.0.1");
    EXPECT_EQ(addr.getPort(), 4321);
  }
  if (SocketAddressTestHelper::isIPv6Enabled()) {
    addr.setFromLocalIpPort("::1:4321");
    EXPECT_EQ(addr.getAddressStr(), "::1");
    EXPECT_EQ(addr.getPort(), 4321);
  }

  // setFromIpPort() without an address should fail
  EXPECT_THROW(addr.setFromIpPort("4321"), std::invalid_argument);

  // Call setFromIpPort() with an IPv6 address and port
  addr.setFromIpPort("2620:0:1cfe:face:b00c::3:65535");
  EXPECT_EQ(addr.getFamily(), AF_INET6);
  EXPECT_EQ(addr.getAddressStr(), "2620:0:1cfe:face:b00c::3");
  EXPECT_EQ(addr.getPort(), 65535);

  // Call setFromIpPort() with an IPv4 address and port
  addr.setFromIpPort("1.2.3.4:9999");
  EXPECT_EQ(addr.getFamily(), AF_INET);
  EXPECT_EQ(addr.getAddressStr(), "1.2.3.4");
  EXPECT_EQ(addr.getPort(), 9999);

  // Call setFromIpPort() with a bracketed IPv6
  addr.setFromIpPort("[::]:1234");
  EXPECT_EQ(addr.getFamily(), AF_INET6);
  EXPECT_EQ(addr.getAddressStr(), "::");
  EXPECT_EQ(addr.getPort(), 1234);

  // Call setFromIpPort() with a bracketed IPv6
  addr.setFromIpPort("[9:8::2]:1234");
  EXPECT_EQ(addr.getFamily(), AF_INET6);
  EXPECT_EQ(addr.getAddressStr(), "9:8::2");
  EXPECT_EQ(addr.getPort(), 1234);

  // Call setFromIpPort() with a bracketed IPv6 and no port
  EXPECT_THROW(addr.setFromIpPort("[::]"), std::system_error);
}

TEST(SocketAddress, EqualityAndHash) {
  // IPv4
  SocketAddress local1("127.0.0.1", 1234);
  EXPECT_EQ(local1, local1);
  EXPECT_EQ(local1.hash(), local1.hash());

  SocketAddress local2("127.0.0.1", 1234);
  EXPECT_EQ(local1, local2);
  EXPECT_EQ(local1.hash(), local2.hash());

  SocketAddress local3("127.0.0.1", 4321);
  EXPECT_NE(local1, local3);
  EXPECT_NE(local1.hash(), local3.hash());

  SocketAddress other1("1.2.3.4", 1234);
  EXPECT_EQ(other1, other1);
  EXPECT_EQ(other1.hash(), other1.hash());
  EXPECT_NE(local1, other1);
  EXPECT_NE(local1.hash(), other1.hash());

  SocketAddress other2("4.3.2.1", 1234);
  EXPECT_NE(other1.hash(), other2.hash());
  EXPECT_NE(other1.hash(), other2.hash());

  other2.setFromIpPort("1.2.3.4", 0);
  EXPECT_NE(other1.hash(), other2.hash());
  EXPECT_NE(other1.hash(), other2.hash());
  other2.setPort(1234);
  EXPECT_EQ(other1.hash(), other2.hash());
  EXPECT_EQ(other1.hash(), other2.hash());

  // IPv6
  SocketAddress v6_1("2620:0:1c00:face:b00c:0:0:abcd", 1234);
  SocketAddress v6_2("2620:0:1c00:face:b00c::abcd", 1234);
  SocketAddress v6_3("2620:0:1c00:face:b00c::bcda", 1234);
  EXPECT_EQ(v6_1, v6_2);
  EXPECT_EQ(v6_1.hash(), v6_2.hash());
  EXPECT_NE(v6_1, v6_3);
  EXPECT_NE(v6_1.hash(), v6_3.hash());

  // IPv4 versus IPv6 comparison
  SocketAddress localIPv6("::1", 1234);
  // Even though these both refer to localhost,
  // IPv4 and IPv6 addresses are never treated as the same address
  EXPECT_NE(local1, localIPv6);
  EXPECT_NE(local1.hash(), localIPv6.hash());

  // IPv4-mapped IPv6 addresses are not treated as equal
  // to the equivalent IPv4 address
  SocketAddress v4("10.0.0.3", 99);
  SocketAddress v6_mapped1("::ffff:10.0.0.3", 99);
  SocketAddress v6_mapped2("::ffff:0a00:0003", 99);
  EXPECT_NE(v4, v6_mapped1);
  EXPECT_NE(v4, v6_mapped2);
  EXPECT_EQ(v6_mapped1, v6_mapped2);

  // However, after calling convertToIPv4(), the mapped address should now be
  // equal to the v4 version.
  EXPECT_TRUE(v6_mapped1.isIPv4Mapped());
  v6_mapped1.convertToIPv4();
  EXPECT_EQ(v6_mapped1, v4);
  EXPECT_NE(v6_mapped1, v6_mapped2);

  // Unix
  SocketAddress unix1;
  unix1.setFromPath("/foo");
  SocketAddress unix2;
  unix2.setFromPath("/foo");
  SocketAddress unix3;
  unix3.setFromPath("/bar");
  SocketAddress unixAnon;
  unixAnon.setFromPath("");
  auto unix5 = SocketAddress::makeFromPath("/foo");
  auto unixAnon2 = SocketAddress::makeFromPath("");

  EXPECT_EQ(unix1, unix2);
  EXPECT_EQ(unix1, unix5);
  EXPECT_EQ(unix1.hash(), unix2.hash());
  EXPECT_EQ(unix1.hash(), unix5.hash());
  EXPECT_NE(unix1, unix3);
  EXPECT_NE(unix1, unixAnon);
  EXPECT_NE(unix1, unixAnon2);
  EXPECT_NE(unix2, unix3);
  EXPECT_NE(unix5, unix3);
  EXPECT_NE(unix2, unixAnon);
  EXPECT_NE(unix2, unixAnon2);
  EXPECT_NE(unix5, unixAnon);
  EXPECT_NE(unix5, unixAnon2);
  // anonymous addresses aren't equal to any other address,
  // including themselves
  EXPECT_NE(unixAnon, unixAnon);
  EXPECT_NE(unixAnon2, unixAnon2);

  // It isn't strictly required that hashes for different addresses be
  // different, but we should have very few collisions.  It generally indicates
  // a problem if these collide
  EXPECT_NE(unix1.hash(), unix3.hash());
  EXPECT_NE(unix1.hash(), unixAnon.hash());
  EXPECT_NE(unix3.hash(), unixAnon.hash());
  EXPECT_NE(unix1.hash(), unixAnon2.hash());
  EXPECT_NE(unix3.hash(), unixAnon2.hash());
}

TEST(SocketAddress, IsPrivate) {
  // IPv4
  SocketAddress addr("9.255.255.255", 0);
  EXPECT_TRUE(!addr.isPrivateAddress());
  addr.setFromIpPort("10.0.0.0", 0);
  EXPECT_TRUE(addr.isPrivateAddress());
  addr.setFromIpPort("10.255.255.255", 0);
  EXPECT_TRUE(addr.isPrivateAddress());
  addr.setFromIpPort("11.0.0.0", 0);
  EXPECT_TRUE(!addr.isPrivateAddress());

  addr.setFromIpPort("172.15.255.255", 0);
  EXPECT_TRUE(!addr.isPrivateAddress());
  addr.setFromIpPort("172.16.0.0", 0);
  EXPECT_TRUE(addr.isPrivateAddress());
  addr.setFromIpPort("172.31.255.255", 0);
  EXPECT_TRUE(addr.isPrivateAddress());
  addr.setFromIpPort("172.32.0.0", 0);
  EXPECT_TRUE(!addr.isPrivateAddress());

  addr.setFromIpPort("192.167.255.255", 0);
  EXPECT_TRUE(!addr.isPrivateAddress());
  addr.setFromIpPort("192.168.0.0", 0);
  EXPECT_TRUE(addr.isPrivateAddress());
  addr.setFromIpPort("192.168.255.255", 0);
  EXPECT_TRUE(addr.isPrivateAddress());
  addr.setFromIpPort("192.169.0.0", 0);
  EXPECT_TRUE(!addr.isPrivateAddress());

  addr.setFromIpPort("126.255.255.255", 0);
  EXPECT_TRUE(!addr.isPrivateAddress());
  addr.setFromIpPort("127.0.0.0", 0);
  EXPECT_TRUE(addr.isPrivateAddress());
  addr.setFromIpPort("127.0.0.1", 0);
  EXPECT_TRUE(addr.isPrivateAddress());
  addr.setFromIpPort("127.255.255.255", 0);
  EXPECT_TRUE(addr.isPrivateAddress());
  addr.setFromIpPort("128.0.0.0", 0);
  EXPECT_TRUE(!addr.isPrivateAddress());

  addr.setFromIpPort("1.2.3.4", 0);
  EXPECT_TRUE(!addr.isPrivateAddress());
  addr.setFromIpPort("69.171.239.10", 0);
  EXPECT_TRUE(!addr.isPrivateAddress());

  // IPv6
  addr.setFromIpPort("fbff:ffff:ffff:ffff:ffff:ffff:ffff:ffff", 0);
  EXPECT_TRUE(!addr.isPrivateAddress());
  addr.setFromIpPort("fc00::", 0);
  EXPECT_TRUE(addr.isPrivateAddress());
  addr.setFromIpPort("fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff", 0);
  EXPECT_TRUE(addr.isPrivateAddress());
  addr.setFromIpPort("fe00::", 0);
  EXPECT_TRUE(!addr.isPrivateAddress());

  addr.setFromIpPort("fe7f:ffff:ffff:ffff:ffff:ffff:ffff:ffff", 0);
  EXPECT_TRUE(!addr.isPrivateAddress());
  addr.setFromIpPort("fe80::", 0);
  EXPECT_TRUE(addr.isPrivateAddress());
  addr.setFromIpPort("fe80::ffff:ffff:ffff:ffff", 0);
  EXPECT_TRUE(addr.isPrivateAddress());
  addr.setFromIpPort("febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff", 0);
  EXPECT_TRUE(addr.isPrivateAddress());
  addr.setFromIpPort("fec0::", 0);
  EXPECT_TRUE(!addr.isPrivateAddress());

  addr.setFromIpPort("::0", 0);
  EXPECT_TRUE(!addr.isPrivateAddress());
  addr.setFromIpPort("2620:0:1c00:face:b00c:0:0:abcd", 0);
  EXPECT_TRUE(!addr.isPrivateAddress());

  // IPv4-mapped IPv6
  addr.setFromIpPort("::ffff:127.0.0.1", 0);
  EXPECT_TRUE(addr.isPrivateAddress());
  addr.setFromIpPort("::ffff:10.1.2.3", 0);
  EXPECT_TRUE(addr.isPrivateAddress());
  addr.setFromIpPort("::ffff:172.24.0.115", 0);
  EXPECT_TRUE(addr.isPrivateAddress());
  addr.setFromIpPort("::ffff:192.168.0.1", 0);
  EXPECT_TRUE(addr.isPrivateAddress());
  addr.setFromIpPort("::ffff:69.171.239.10", 0);
  EXPECT_TRUE(!addr.isPrivateAddress());

  // Unix sockets are considered private addresses
  addr.setFromPath("/tmp/mysock");
  EXPECT_TRUE(addr.isPrivateAddress());
}

TEST(SocketAddress, IsLoopback) {
  // IPv4
  SocketAddress addr("127.0.0.1", 0);
  EXPECT_TRUE(addr.isLoopbackAddress());
  addr.setFromIpPort("127.0.0.0", 0xffff);
  EXPECT_TRUE(addr.isLoopbackAddress());
  addr.setFromIpPort("127.1.1.1", 0xffff);
  EXPECT_TRUE(addr.isLoopbackAddress());
  addr.setFromIpPort("127.255.255.255", 80);
  EXPECT_TRUE(addr.isLoopbackAddress());

  addr.setFromIpPort("128.0.0.0", 0);
  EXPECT_TRUE(!addr.isLoopbackAddress());
  addr.setFromIpPort("126.255.255.255", 0);
  EXPECT_TRUE(!addr.isLoopbackAddress());
  addr.setFromIpPort("10.1.2.3", 0);
  EXPECT_TRUE(!addr.isLoopbackAddress());

  // IPv6
  addr.setFromIpPort("::1", 0);
  EXPECT_TRUE(addr.isLoopbackAddress());
  addr.setFromIpPort("::0", 0);
  EXPECT_TRUE(!addr.isLoopbackAddress());
  addr.setFromIpPort("::2", 0);
  EXPECT_TRUE(!addr.isLoopbackAddress());

  // IPv4-mapped IPv6
  addr.setFromIpPort("::ffff:127.0.0.1", 0);
  EXPECT_TRUE(addr.isLoopbackAddress());
  addr.setFromIpPort("::ffff:7f0a:141e", 0);
  EXPECT_TRUE(addr.isLoopbackAddress());
  addr.setFromIpPort("::ffff:169.254.0.13", 0);
  EXPECT_TRUE(!addr.isLoopbackAddress());

  // Unix sockets are considered loopback addresses
  addr.setFromPath("/tmp/mysock");
  EXPECT_TRUE(addr.isLoopbackAddress());
}

void CheckPrefixMatch(
    const SocketAddress& first,
    const SocketAddress& second,
    unsigned matchingPrefixLen) {
  unsigned i;
  for (i = 0; i <= matchingPrefixLen; i++) {
    EXPECT_TRUE(first.prefixMatch(second, i));
  }
  unsigned addrLen = (first.getFamily() == AF_INET6) ? 128 : 32;
  for (; i <= addrLen; i++) {
    EXPECT_TRUE(!first.prefixMatch(second, i));
  }
}

TEST(SocketAddress, PrefixMatch) {
  // IPv4
  SocketAddress addr1("127.0.0.1", 0);
  SocketAddress addr2("127.0.0.1", 0);
  CheckPrefixMatch(addr1, addr2, 32);

  addr2.setFromIpPort("127.0.1.1", 0);
  CheckPrefixMatch(addr1, addr2, 23);

  addr2.setFromIpPort("1.1.0.127", 0);
  CheckPrefixMatch(addr1, addr2, 1);

  // Address family mismatch
  addr2.setFromIpPort("::ffff:127.0.0.1", 0);
  EXPECT_TRUE(!addr1.prefixMatch(addr2, 1));

  // IPv6
  addr1.setFromIpPort("2a03:2880:10:8f02:face:b00c:0:25", 0);
  CheckPrefixMatch(addr1, addr2, 2);

  addr2.setFromIpPort("2a03:2880:10:8f02:face:b00c:0:25", 0);
  CheckPrefixMatch(addr1, addr2, 128);

  addr2.setFromIpPort("2a03:2880:30:8f02:face:b00c:0:25", 0);
  CheckPrefixMatch(addr1, addr2, 42);
}

void CheckFirstLessThanSecond(SocketAddress first, SocketAddress second) {
  EXPECT_TRUE(!(first < first));
  EXPECT_TRUE(!(second < second));
  EXPECT_TRUE(first < second);
  EXPECT_TRUE(!(first == second));
  EXPECT_TRUE(!(second < first));
}

TEST(SocketAddress, CheckComparatorBehavior) {
  SocketAddress first, second;
  // The following comparison are strict (so if first and second were
  // inverted that is ok.

  // IP V4

  // port comparisions
  first.setFromIpPort("128.0.0.0", 0);
  second.setFromIpPort("128.0.0.0", 0xFFFF);
  CheckFirstLessThanSecond(first, second);
  first.setFromIpPort("128.0.0.100", 0);
  second.setFromIpPort("128.0.0.0", 0xFFFF);
  CheckFirstLessThanSecond(first, second);

  // Address comparisons
  first.setFromIpPort("128.0.0.0", 10);
  second.setFromIpPort("128.0.0.100", 10);
  CheckFirstLessThanSecond(first, second);

  // Comaprision between IPV4 and IPV6
  first.setFromIpPort("128.0.0.0", 0);
  second.setFromIpPort("::ffff:127.0.0.1", 0);
  CheckFirstLessThanSecond(first, second);
  first.setFromIpPort("128.0.0.0", 100);
  second.setFromIpPort("::ffff:127.0.0.1", 0);
  CheckFirstLessThanSecond(first, second);

  // IPV6 comparisons

  // port comparisions
  first.setFromIpPort("::0", 0);
  second.setFromIpPort("::0", 0xFFFF);
  CheckFirstLessThanSecond(first, second);
  first.setFromIpPort("::0", 0);
  second.setFromIpPort("::1", 0xFFFF);
  CheckFirstLessThanSecond(first, second);

  // Address comparisons
  first.setFromIpPort("::0", 10);
  second.setFromIpPort("::1", 10);
  CheckFirstLessThanSecond(first, second);

  // Unix
  first.setFromPath("/foo");
  second.setFromPath("/1234");
  // The exact comparison order doesn't really matter, as long as
  // (a < b), (b < a), and (a == b) are consistent.
  // This checks our current comparison rules, which checks the path length
  // before the path contents.
  CheckFirstLessThanSecond(first, second);
  first.setFromPath("/1234");
  second.setFromPath("/5678");
  CheckFirstLessThanSecond(first, second);

  // IPv4 vs Unix.
  // We currently compare the address family values, and AF_UNIX < AF_INET
  first.setFromPath("/foo");
  second.setFromIpPort("127.0.0.1", 80);
  CheckFirstLessThanSecond(first, second);
}

TEST(SocketAddress, Unix) {
  SocketAddress addr;

  // Test a small path
  addr.setFromPath("foo");
  EXPECT_EQ(addr.getFamily(), AF_UNIX);
  EXPECT_EQ(addr.describe(), "foo");
  EXPECT_THROW(addr.getAddressStr(), std::invalid_argument);
  EXPECT_THROW(addr.getPort(), std::invalid_argument);
  EXPECT_TRUE(addr.isPrivateAddress());
  EXPECT_TRUE(addr.isLoopbackAddress());

  // Test a path that is too large
  const char longPath[] =
      "abcdefghijklmnopqrstuvwxyz0123456789"
      "abcdefghijklmnopqrstuvwxyz0123456789"
      "abcdefghijklmnopqrstuvwxyz0123456789"
      "abcdefghijklmnopqrstuvwxyz0123456789";
  EXPECT_THROW(addr.setFromPath(longPath), std::invalid_argument);
  // The original address should still be the same
  EXPECT_EQ(addr.getFamily(), AF_UNIX);
  EXPECT_EQ(addr.describe(), "foo");

  // Test a path that exactly fits in sockaddr_un
  // (not including the NUL terminator)
  const char exactLengthPath[] =
      "abcdefghijklmnopqrstuvwxyz0123456789"
      "abcdefghijklmnopqrstuvwxyz0123456789"
      "abcdefghijklmnopqrstuvwxyz0123456789";
  addr.setFromPath(exactLengthPath);
  EXPECT_EQ(addr.describe(), exactLengthPath);

  // Test converting a unix socket address to an IPv4 one, then back
  addr.setFromHostPort("127.0.0.1", 1234);
  EXPECT_EQ(addr.getFamily(), AF_INET);
  EXPECT_EQ(addr.describe(), "127.0.0.1:1234");
  addr.setFromPath("/i/am/a/unix/address");
  EXPECT_EQ(addr.getFamily(), AF_UNIX);
  EXPECT_EQ(addr.describe(), "/i/am/a/unix/address");

  // Test copy constructor and assignment operator
  {
    SocketAddress copy(addr);
    EXPECT_EQ(copy, addr);
    copy.setFromPath("/abc");
    EXPECT_NE(copy, addr);
    copy = addr;
    EXPECT_EQ(copy, addr);
    copy.setFromIpPort("127.0.0.1", 80);
    EXPECT_NE(copy, addr);
    copy = addr;
    EXPECT_EQ(copy, addr);
  }

  {
    SocketAddress copy(addr);
    EXPECT_EQ(copy, addr);
    EXPECT_EQ(copy.describe(), "/i/am/a/unix/address");
    EXPECT_EQ(copy.getPath(), "/i/am/a/unix/address");

    SocketAddress other("127.0.0.1", 80);
    EXPECT_NE(other, addr);
    other = copy;
    EXPECT_EQ(other, copy);
    EXPECT_EQ(other, addr);
    EXPECT_EQ(copy, addr);
  }

#if __GXX_EXPERIMENTAL_CXX0X__
  {
    SocketAddress copy;
    {
      // move a unix address into a non-unix address
      SocketAddress tmpCopy(addr);
      copy = std::move(tmpCopy);
    }
    EXPECT_EQ(copy, addr);

    copy.setFromPath("/another/path");
    {
      // move a unix address into a unix address
      SocketAddress tmpCopy(addr);
      copy = std::move(tmpCopy);
    }
    EXPECT_EQ(copy, addr);

    {
      // move a non-unix address into a unix address
      SocketAddress tmp("127.0.0.1", 80);
      copy = std::move(tmp);
    }
    EXPECT_EQ(copy.getAddressStr(), "127.0.0.1");
    EXPECT_EQ(copy.getPort(), 80);

    copy = addr;
    // move construct a unix address
    SocketAddress other(std::move(copy));
    EXPECT_EQ(other, addr);
    EXPECT_EQ(other.getPath(), addr.getPath());
  }
#endif
}

TEST(SocketAddress, AnonymousUnix) {
  // Create a unix socket pair, and get the addresses.
  int fds[2];
  int rc = socketpair(AF_UNIX, SOCK_STREAM, 0, fds);
  EXPECT_EQ(rc, 0);

  SocketAddress addr0;
  SocketAddress peer0;
  SocketAddress addr1;
  SocketAddress peer1;
  addr0.setFromLocalAddress(fds[0]);
  peer0.setFromPeerAddress(fds[0]);
  addr1.setFromLocalAddress(fds[1]);
  peer1.setFromPeerAddress(fds[1]);
  close(fds[0]);
  close(fds[1]);

  EXPECT_EQ(addr0.describe(), "<anonymous unix address>");
  EXPECT_EQ(addr1.describe(), "<anonymous unix address>");
  EXPECT_EQ(peer0.describe(), "<anonymous unix address>");
  EXPECT_EQ(peer1.describe(), "<anonymous unix address>");

  // Anonymous addresses should never compare equal
  EXPECT_NE(addr0, addr1);
  EXPECT_NE(peer0, peer1);

  // Note that logically addr0 and peer1 are the same,
  // but since they are both anonymous we have no way to determine this
  EXPECT_NE(addr0, peer1);
  // We can't even tell if an anonymous address is equal to itself
  EXPECT_NE(addr0, addr0);
}

#define REQUIRE_ERRNO(cond, msg)                                \
  if (!(cond)) {                                                \
    ADD_FAILURE() << (msg) << ": " << ::folly::errnoStr(errno); \
  }

void testSetFromSocket(
    const SocketAddress* serverBindAddr,
    const SocketAddress* clientBindAddr,
    SocketAddress* listenAddrRet,
    SocketAddress* acceptAddrRet,
    SocketAddress* serverAddrRet,
    SocketAddress* serverPeerAddrRet,
    SocketAddress* clientAddrRet,
    SocketAddress* clientPeerAddrRet) {
  int listenSock = fsp::socket(serverBindAddr->getFamily(), SOCK_STREAM, 0);
  REQUIRE_ERRNO(listenSock > 0, "failed to create listen socket");
  sockaddr_storage laddr;
  serverBindAddr->getAddress(&laddr);
  socklen_t laddrLen = serverBindAddr->getActualSize();
  int rc = bind(listenSock, reinterpret_cast<sockaddr*>(&laddr), laddrLen);
  REQUIRE_ERRNO(rc == 0, "failed to bind to server socket");
  rc = listen(listenSock, 10);
  REQUIRE_ERRNO(rc == 0, "failed to listen");

  listenAddrRet->setFromLocalAddress(listenSock);

  SocketAddress listenPeerAddr;
  EXPECT_THROW(
      listenPeerAddr.setFromPeerAddress(listenSock), std::runtime_error);

  // Note that we use the family from serverBindAddr here, since we allow
  // clientBindAddr to be nullptr.
  int clientSock = fsp::socket(serverBindAddr->getFamily(), SOCK_STREAM, 0);
  REQUIRE_ERRNO(clientSock > 0, "failed to create client socket");
  if (clientBindAddr != nullptr) {
    sockaddr_storage clientAddr;
    clientBindAddr->getAddress(&clientAddr);

    rc = bind(
        clientSock,
        reinterpret_cast<sockaddr*>(&clientAddr),
        clientBindAddr->getActualSize());
    REQUIRE_ERRNO(rc == 0, "failed to bind to client socket");
  }

  sockaddr_storage listenAddr;
  listenAddrRet->getAddress(&listenAddr);
  rc = connect(
      clientSock,
      reinterpret_cast<sockaddr*>(&listenAddr),
      listenAddrRet->getActualSize());
  REQUIRE_ERRNO(rc == 0, "failed to connect");

  sockaddr_storage acceptAddr;
  socklen_t acceptAddrLen = sizeof(acceptAddr);
  int serverSock = accept(
      listenSock, reinterpret_cast<sockaddr*>(&acceptAddr), &acceptAddrLen);
  REQUIRE_ERRNO(serverSock > 0, "failed to accept");
  acceptAddrRet->setFromSockaddr(
      reinterpret_cast<sockaddr*>(&acceptAddr), acceptAddrLen);

  serverAddrRet->setFromLocalAddress(serverSock);
  serverPeerAddrRet->setFromPeerAddress(serverSock);
  clientAddrRet->setFromLocalAddress(clientSock);
  clientPeerAddrRet->setFromPeerAddress(clientSock);

  close(clientSock);
  close(serverSock);
  close(listenSock);
}

TEST(SocketAddress, SetFromSocketIPv4) {
  SocketAddress serverBindAddr("0.0.0.0", 0);
  SocketAddress clientBindAddr("0.0.0.0", 0);
  SocketAddress listenAddr;
  SocketAddress acceptAddr;
  SocketAddress serverAddr;
  SocketAddress serverPeerAddr;
  SocketAddress clientAddr;
  SocketAddress clientPeerAddr;

  testSetFromSocket(
      &serverBindAddr,
      &clientBindAddr,
      &listenAddr,
      &acceptAddr,
      &serverAddr,
      &serverPeerAddr,
      &clientAddr,
      &clientPeerAddr);

  // The server socket's local address should have the same port as the listen
  // address.  The IP will be different, since the listening socket is
  // listening on INADDR_ANY, but the server socket will have a concrete IP
  // address assigned to it.
  EXPECT_EQ(serverAddr.getPort(), listenAddr.getPort());

  // The client's peer address should always be the same as the server
  // socket's address.
  EXPECT_EQ(clientPeerAddr, serverAddr);
  // The address returned by getpeername() on the server socket should
  // be the same as the address returned by accept()
  EXPECT_EQ(serverPeerAddr, acceptAddr);
  EXPECT_EQ(serverPeerAddr, clientAddr);
  EXPECT_EQ(acceptAddr, clientAddr);
}

/*
 * Note this test exercises Linux-specific Unix socket behavior
 */
TEST(SocketAddress, SetFromSocketUnixAbstract) {
  // Explicitly binding to an empty path results in an abstract socket
  // name being picked for us automatically.
  SocketAddress serverBindAddr;
  string path(1, 0);
  path.append("test address");
  serverBindAddr.setFromPath(path);
  SocketAddress clientBindAddr;
  clientBindAddr.setFromPath("");

  SocketAddress listenAddr;
  SocketAddress acceptAddr;
  SocketAddress serverAddr;
  SocketAddress serverPeerAddr;
  SocketAddress clientAddr;
  SocketAddress clientPeerAddr;

  testSetFromSocket(
      &serverBindAddr,
      &clientBindAddr,
      &listenAddr,
      &acceptAddr,
      &serverAddr,
      &serverPeerAddr,
      &clientAddr,
      &clientPeerAddr);

  // The server socket's local address should be the same as the listen
  // address.
  EXPECT_EQ(serverAddr, listenAddr);

  // The client's peer address should always be the same as the server
  // socket's address.
  EXPECT_EQ(clientPeerAddr, serverAddr);

  EXPECT_EQ(serverPeerAddr, clientAddr);
  // Oddly, the address returned by accept() does not seem to match the address
  // returned by getpeername() on the server socket or getsockname() on the
  // client socket.
  // EXPECT_EQ(serverPeerAddr, acceptAddr);
  // EXPECT_EQ(acceptAddr, clientAddr);
}

TEST(SocketAddress, SetFromSocketUnixExplicit) {
  // Pick two temporary path names.
  TemporaryDirectory tempDirectory("SocketAddressTest");
  std::string serverPath = (tempDirectory.path() / "server").string();
  std::string clientPath = (tempDirectory.path() / "client").string();

  SocketAddress serverBindAddr;
  SocketAddress clientBindAddr;
  SocketAddress listenAddr;
  SocketAddress acceptAddr;
  SocketAddress serverAddr;
  SocketAddress serverPeerAddr;
  SocketAddress clientAddr;
  SocketAddress clientPeerAddr;
  try {
    serverBindAddr.setFromPath(serverPath.c_str());
    clientBindAddr.setFromPath(clientPath.c_str());

    testSetFromSocket(
        &serverBindAddr,
        &clientBindAddr,
        &listenAddr,
        &acceptAddr,
        &serverAddr,
        &serverPeerAddr,
        &clientAddr,
        &clientPeerAddr);
  } catch (...) {
    // Remove the socket files after we are done
    unlink(serverPath.c_str());
    unlink(clientPath.c_str());
    throw;
  }
  unlink(serverPath.c_str());
  unlink(clientPath.c_str());

  // The server socket's local address should be the same as the listen
  // address.
  EXPECT_EQ(serverAddr, listenAddr);

  // The client's peer address should always be the same as the server
  // socket's address.
  EXPECT_EQ(clientPeerAddr, serverAddr);

  EXPECT_EQ(serverPeerAddr, clientAddr);
  EXPECT_EQ(serverPeerAddr, acceptAddr);
  EXPECT_EQ(acceptAddr, clientAddr);
}

TEST(SocketAddress, SetFromSocketUnixAnonymous) {
  // Test an anonymous client talking to a fixed-path unix socket.
  TemporaryDirectory tempDirectory("SocketAddressTest");
  std::string serverPath = (tempDirectory.path() / "server").string();

  SocketAddress serverBindAddr;
  SocketAddress listenAddr;
  SocketAddress acceptAddr;
  SocketAddress serverAddr;
  SocketAddress serverPeerAddr;
  SocketAddress clientAddr;
  SocketAddress clientPeerAddr;
  try {
    serverBindAddr.setFromPath(serverPath.c_str());

    testSetFromSocket(
        &serverBindAddr,
        nullptr,
        &listenAddr,
        &acceptAddr,
        &serverAddr,
        &serverPeerAddr,
        &clientAddr,
        &clientPeerAddr);
  } catch (...) {
    // Remove the socket file after we are done
    unlink(serverPath.c_str());
    throw;
  }
  unlink(serverPath.c_str());

  // The server socket's local address should be the same as the listen
  // address.
  EXPECT_EQ(serverAddr, listenAddr);

  // The client's peer address should always be the same as the server
  // socket's address.
  EXPECT_EQ(clientPeerAddr, serverAddr);

  // Since the client is using an anonymous address, it won't compare equal to
  // any other anonymous addresses.  Make sure the addresses are anonymous.
  EXPECT_EQ(serverPeerAddr.getPath(), "");
  EXPECT_EQ(clientAddr.getPath(), "");
  EXPECT_EQ(acceptAddr.getPath(), "");
}

TEST(SocketAddress, ResetUnixAddress) {
  SocketAddress addy;
  addy.setFromPath("/foo");

  addy.reset();
  EXPECT_EQ(addy.getFamily(), AF_UNSPEC);
}

TEST(SocketAddress, ResetIPAddress) {
  SocketAddress addr;
  addr.setFromIpPort("127.0.0.1", 80);
  addr.reset();
  EXPECT_EQ(addr.getFamily(), AF_UNSPEC);
  EXPECT_FALSE(addr.isInitialized());
  EXPECT_TRUE(addr.empty());

  addr.setFromIpPort("2620:0:1cfe:face:b00c::3:65535");
  addr.reset();
  EXPECT_EQ(addr.getFamily(), AF_UNSPEC);
  EXPECT_FALSE(addr.isInitialized());
  EXPECT_TRUE(addr.empty());
}

TEST(SocketAddress, ValidFamilyInet) {
  SocketAddress addr;
  EXPECT_FALSE(addr.isFamilyInet());
  folly::IPAddress ipAddr("123.234.0.23");
  addr.setFromIpAddrPort(ipAddr, 8888);
  EXPECT_TRUE(addr.isFamilyInet());

  folly::IPAddress ip6Addr("2620:0:1cfe:face:b00c::3");
  SocketAddress addr6(ip6Addr, 8888);
  EXPECT_TRUE(addr6.isFamilyInet());
}
