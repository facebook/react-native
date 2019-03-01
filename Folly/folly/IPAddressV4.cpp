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

#include <folly/IPAddressV4.h>

#include <ostream>
#include <string>

#include <folly/Format.h>
#include <folly/IPAddress.h>
#include <folly/IPAddressV6.h>
#include <folly/detail/IPAddressSource.h>

using std::ostream;
using std::string;

namespace folly {


// free functions
size_t hash_value(const IPAddressV4& addr) {
  return addr.hash();
}
ostream& operator<<(ostream& os, const IPAddressV4& addr) {
  os << addr.str();
  return os;
}
void toAppend(IPAddressV4 addr, string* result) {
  result->append(addr.str());
}
void toAppend(IPAddressV4 addr, fbstring* result) {
  result->append(addr.str());
}

bool IPAddressV4::validate(StringPiece ip) {
  constexpr size_t kStrMaxLen = INET_ADDRSTRLEN;
  std::array<char, kStrMaxLen + 1> ip_cstr;
  const size_t len = std::min(ip.size(), kStrMaxLen);
  std::memcpy(ip_cstr.data(), ip.data(), len);
  ip_cstr[len] = 0;
  struct in_addr addr;
  return 1 == inet_pton(AF_INET, ip_cstr.data(), &addr);
}

// public static
IPAddressV4 IPAddressV4::fromLong(uint32_t src) {
  in_addr addr;
  addr.s_addr = src;
  return IPAddressV4(addr);
}

IPAddressV4 IPAddressV4::fromLongHBO(uint32_t src) {
  in_addr addr;
  addr.s_addr = htonl(src);
  return IPAddressV4(addr);
}

// static public
uint32_t IPAddressV4::toLong(StringPiece ip) {
  auto str = ip.str();
  in_addr addr;
  if (inet_pton(AF_INET, str.c_str(), &addr) != 1) {
    throw IPAddressFormatException(
        to<std::string>("Can't convert invalid IP '", ip, "' ", "to long"));
  }
  return addr.s_addr;
}

// static public
uint32_t IPAddressV4::toLongHBO(StringPiece ip) {
  return ntohl(IPAddressV4::toLong(ip));
}

// public default constructor
IPAddressV4::IPAddressV4() {
}

// ByteArray4 constructor
IPAddressV4::IPAddressV4(const ByteArray4& src)
  : addr_(src)
{
}

// public string constructor
IPAddressV4::IPAddressV4(StringPiece addr)
  : addr_()
{
  auto ip = addr.str();
  if (inet_pton(AF_INET, ip.c_str(), &addr_.inAddr_) != 1) {
    throw IPAddressFormatException(
        to<std::string>("Invalid IPv4 address '", addr, "'"));
  }
}

// in_addr constructor
IPAddressV4::IPAddressV4(const in_addr src)
  : addr_(src)
{
}

// public
void IPAddressV4::setFromBinary(ByteRange bytes) {
  if (bytes.size() != 4) {
    throw IPAddressFormatException(to<std::string>(
        "Invalid IPv4 binary data: length must ",
        "be 4 bytes, got ",
        bytes.size()));
  }
  memcpy(&addr_.inAddr_.s_addr, bytes.data(), sizeof(in_addr));
}

// public
IPAddressV6 IPAddressV4::createIPv6() const {
  ByteArray16 ba{};
  ba[10] = 0xff;
  ba[11] = 0xff;
  std::memcpy(&ba[12], bytes(), 4);
  return IPAddressV6(ba);
}

// public
IPAddressV6 IPAddressV4::getIPv6For6To4() const {
  ByteArray16 ba{};
  ba[0] = (uint8_t)((IPAddressV6::PREFIX_6TO4 & 0xFF00) >> 8);
  ba[1] = (uint8_t)(IPAddressV6::PREFIX_6TO4 & 0x00FF);
  std::memcpy(&ba[2], bytes(), 4);
  return IPAddressV6(ba);
}

// public
string IPAddressV4::toJson() const {
  return format(
      "{{family:'AF_INET', addr:'{}', hash:{}}}", str(), hash()).str();
}

// public
bool IPAddressV4::inSubnet(StringPiece cidrNetwork) const {
  auto subnetInfo = IPAddress::createNetwork(cidrNetwork);
  auto addr = subnetInfo.first;
  if (!addr.isV4()) {
    throw IPAddressFormatException(to<std::string>(
        "Address '", addr.toJson(), "' ", "is not a V4 address"));
  }
  return inSubnetWithMask(addr.asV4(), fetchMask(subnetInfo.second));
}

// public
bool IPAddressV4::inSubnetWithMask(const IPAddressV4& subnet,
                                   const ByteArray4 cidrMask) const {
  const ByteArray4 mask = detail::Bytes::mask(toByteArray(), cidrMask);
  const ByteArray4 subMask = detail::Bytes::mask(subnet.toByteArray(),
                                                 cidrMask);
  return (mask == subMask);
}

// public
bool IPAddressV4::isLoopback() const {
  static IPAddressV4 loopback_addr("127.0.0.0");
  return inSubnetWithMask(loopback_addr, fetchMask(8));
}

// public
bool IPAddressV4::isLinkLocal() const {
  static IPAddressV4 linklocal_addr("169.254.0.0");
  return inSubnetWithMask(linklocal_addr, fetchMask(16));
}

// public
bool IPAddressV4::isNonroutable() const {
  auto ip = toLongHBO();
  return isPrivate() ||
      (ip <= 0x00FFFFFF)                     || // 0.0.0.0-0.255.255.255
      (ip >= 0xC0000000 && ip <= 0xC00000FF) || // 192.0.0.0-192.0.0.255
      (ip >= 0xC0000200 && ip <= 0xC00002FF) || // 192.0.2.0-192.0.2.255
      (ip >= 0xC6120000 && ip <= 0xC613FFFF) || // 198.18.0.0-198.19.255.255
      (ip >= 0xC6336400 && ip <= 0xC63364FF) || // 198.51.100.0-198.51.100.255
      (ip >= 0xCB007100 && ip <= 0xCB0071FF) || // 203.0.113.0-203.0.113.255
      (ip >= 0xE0000000 && ip <= 0xFFFFFFFF);   // 224.0.0.0-255.255.255.255
}

// public
bool IPAddressV4::isPrivate() const {
  auto ip = toLongHBO();
  return
      (ip >= 0x0A000000 && ip <= 0x0AFFFFFF) || // 10.0.0.0-10.255.255.255
      (ip >= 0x7F000000 && ip <= 0x7FFFFFFF) || // 127.0.0.0-127.255.255.255
      (ip >= 0xA9FE0000 && ip <= 0xA9FEFFFF) || // 169.254.0.0-169.254.255.255
      (ip >= 0xAC100000 && ip <= 0xAC1FFFFF) || // 172.16.0.0-172.31.255.255
      (ip >= 0xC0A80000 && ip <= 0xC0A8FFFF);   // 192.168.0.0-192.168.255.255
}

// public
bool IPAddressV4::isMulticast() const {
  return (toLongHBO() & 0xf0000000) == 0xe0000000;
}

// public
IPAddressV4 IPAddressV4::mask(size_t numBits) const {
  static const auto bits = bitCount();
  if (numBits > bits) {
    throw IPAddressFormatException(
        to<std::string>("numBits(", numBits, ") > bitsCount(", bits, ")"));
  }

  ByteArray4 ba = detail::Bytes::mask(fetchMask(numBits), addr_.bytes_);
  return IPAddressV4(ba);
}

// public
string IPAddressV4::str() const {
  return detail::fastIpv4ToString(addr_.inAddr_);
}

// public
uint8_t IPAddressV4::getNthMSByte(size_t byteIndex) const {
  const auto highestIndex = byteCount() - 1;
  if (byteIndex > highestIndex) {
    throw std::invalid_argument(to<string>("Byte index must be <= ",
        to<string>(highestIndex), " for addresses of type :",
        detail::familyNameStr(AF_INET)));
  }
  return bytes()[byteIndex];
}
// protected
const ByteArray4 IPAddressV4::fetchMask(size_t numBits) {
  static const size_t bits = bitCount();
  if (numBits > bits) {
    throw IPAddressFormatException(
        to<std::string>("IPv4 addresses are 32 bits"));
  }
  // masks_ is backed by an array so is zero indexed
  return masks_[numBits];
}
// public static
CIDRNetworkV4 IPAddressV4::longestCommonPrefix(
    const CIDRNetworkV4& one,
    const CIDRNetworkV4& two) {
  auto prefix = detail::Bytes::longestCommonPrefix(
      one.first.addr_.bytes_, one.second, two.first.addr_.bytes_, two.second);
  return {IPAddressV4(prefix.first), prefix.second};
}

// static private
const std::array<ByteArray4, 33> IPAddressV4::masks_ = {{
  {{0x00, 0x00, 0x00, 0x00}},
  {{0x80, 0x00, 0x00, 0x00}},
  {{0xc0, 0x00, 0x00, 0x00}},
  {{0xe0, 0x00, 0x00, 0x00}},
  {{0xf0, 0x00, 0x00, 0x00}},
  {{0xf8, 0x00, 0x00, 0x00}},
  {{0xfc, 0x00, 0x00, 0x00}},
  {{0xfe, 0x00, 0x00, 0x00}},
  {{0xff, 0x00, 0x00, 0x00}},
  {{0xff, 0x80, 0x00, 0x00}},
  {{0xff, 0xc0, 0x00, 0x00}},
  {{0xff, 0xe0, 0x00, 0x00}},
  {{0xff, 0xf0, 0x00, 0x00}},
  {{0xff, 0xf8, 0x00, 0x00}},
  {{0xff, 0xfc, 0x00, 0x00}},
  {{0xff, 0xfe, 0x00, 0x00}},
  {{0xff, 0xff, 0x00, 0x00}},
  {{0xff, 0xff, 0x80, 0x00}},
  {{0xff, 0xff, 0xc0, 0x00}},
  {{0xff, 0xff, 0xe0, 0x00}},
  {{0xff, 0xff, 0xf0, 0x00}},
  {{0xff, 0xff, 0xf8, 0x00}},
  {{0xff, 0xff, 0xfc, 0x00}},
  {{0xff, 0xff, 0xfe, 0x00}},
  {{0xff, 0xff, 0xff, 0x00}},
  {{0xff, 0xff, 0xff, 0x80}},
  {{0xff, 0xff, 0xff, 0xc0}},
  {{0xff, 0xff, 0xff, 0xe0}},
  {{0xff, 0xff, 0xff, 0xf0}},
  {{0xff, 0xff, 0xff, 0xf8}},
  {{0xff, 0xff, 0xff, 0xfc}},
  {{0xff, 0xff, 0xff, 0xfe}},
  {{0xff, 0xff, 0xff, 0xff}}
}};

} // folly
