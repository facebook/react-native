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

bool IPAddressV4::validate(StringPiece ip) noexcept {
  return tryFromString(ip).hasValue();
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
        sformat("Can't convert invalid IP '{}' to long", ip));
  }
  return addr.s_addr;
}

// static public
uint32_t IPAddressV4::toLongHBO(StringPiece ip) {
  return ntohl(IPAddressV4::toLong(ip));
}

// public default constructor
IPAddressV4::IPAddressV4() {}

// ByteArray4 constructor
IPAddressV4::IPAddressV4(const ByteArray4& src) noexcept : addr_(src) {}

// public string constructor
IPAddressV4::IPAddressV4(StringPiece addr) : addr_() {
  auto maybeIp = tryFromString(addr);
  if (maybeIp.hasError()) {
    throw IPAddressFormatException(
        to<std::string>("Invalid IPv4 address '", addr, "'"));
  }
  *this = std::move(maybeIp.value());
}

Expected<IPAddressV4, IPAddressFormatError> IPAddressV4::tryFromString(
    StringPiece str) noexcept {
  struct in_addr inAddr;
  if (inet_pton(AF_INET, str.str().c_str(), &inAddr) != 1) {
    return makeUnexpected(IPAddressFormatError::INVALID_IP);
  }
  return IPAddressV4(inAddr);
}

// in_addr constructor
IPAddressV4::IPAddressV4(const in_addr src) noexcept : addr_(src) {}

IPAddressV4 IPAddressV4::fromBinary(ByteRange bytes) {
  auto maybeIp = tryFromBinary(bytes);
  if (maybeIp.hasError()) {
    throw IPAddressFormatException(to<std::string>(
        "Invalid IPv4 binary data: length must be 4 bytes, got ",
        bytes.size()));
  }
  return maybeIp.value();
}

Expected<IPAddressV4, IPAddressFormatError> IPAddressV4::tryFromBinary(
    ByteRange bytes) noexcept {
  IPAddressV4 addr;
  auto setResult = addr.trySetFromBinary(bytes);
  if (setResult.hasError()) {
    return makeUnexpected(std::move(setResult.error()));
  }
  return addr;
}

Expected<Unit, IPAddressFormatError> IPAddressV4::trySetFromBinary(
    ByteRange bytes) noexcept {
  if (bytes.size() != 4) {
    return makeUnexpected(IPAddressFormatError::INVALID_IP);
  }
  memcpy(&addr_.inAddr_.s_addr, bytes.data(), sizeof(in_addr));
  return folly::unit;
}

// static
IPAddressV4 IPAddressV4::fromInverseArpaName(const std::string& arpaname) {
  auto piece = StringPiece(arpaname);
  // input must be something like 1.0.168.192.in-addr.arpa
  if (!piece.removeSuffix(".in-addr.arpa")) {
    throw IPAddressFormatException(
        sformat("input does not end with '.in-addr.arpa': '{}'", arpaname));
  }
  std::vector<StringPiece> pieces;
  split(".", piece, pieces);
  if (pieces.size() != 4) {
    throw IPAddressFormatException(sformat("Invalid input. Got {}", piece));
  }
  // reverse 1.0.168.192 -> 192.168.0.1
  return IPAddressV4(join(".", pieces.rbegin(), pieces.rend()));
}
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
  return sformat("{{family:'AF_INET', addr:'{}', hash:{}}}", str(), hash());
}

// public
bool IPAddressV4::inSubnet(StringPiece cidrNetwork) const {
  auto subnetInfo = IPAddress::createNetwork(cidrNetwork);
  auto addr = subnetInfo.first;
  if (!addr.isV4()) {
    throw IPAddressFormatException(
        sformat("Address '{}' is not a V4 address", addr.toJson()));
  }
  return inSubnetWithMask(addr.asV4(), fetchMask(subnetInfo.second));
}

// public
bool IPAddressV4::inSubnetWithMask(
    const IPAddressV4& subnet,
    const ByteArray4 cidrMask) const {
  const auto mask = detail::Bytes::mask(toByteArray(), cidrMask);
  const auto subMask = detail::Bytes::mask(subnet.toByteArray(), cidrMask);
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
      (/* align */ true && ip <= 0x00FFFFFF) || // 0.0.0.0-0.255.255.255
      (ip >= 0xC0000000 && ip <= 0xC00000FF) || // 192.0.0.0-192.0.0.255
      (ip >= 0xC0000200 && ip <= 0xC00002FF) || // 192.0.2.0-192.0.2.255
      (ip >= 0xC6120000 && ip <= 0xC613FFFF) || // 198.18.0.0-198.19.255.255
      (ip >= 0xC6336400 && ip <= 0xC63364FF) || // 198.51.100.0-198.51.100.255
      (ip >= 0xCB007100 && ip <= 0xCB0071FF) || // 203.0.113.0-203.0.113.255
      (ip >= 0xE0000000 && ip <= 0xFFFFFFFF) || // 224.0.0.0-255.255.255.255
      false;
}

// public
bool IPAddressV4::isPrivate() const {
  auto ip = toLongHBO();
  return // some ranges below
      (ip >= 0x0A000000 && ip <= 0x0AFFFFFF) || // 10.0.0.0-10.255.255.255
      (ip >= 0x7F000000 && ip <= 0x7FFFFFFF) || // 127.0.0.0-127.255.255.255
      (ip >= 0xA9FE0000 && ip <= 0xA9FEFFFF) || // 169.254.0.0-169.254.255.255
      (ip >= 0xAC100000 && ip <= 0xAC1FFFFF) || // 172.16.0.0-172.31.255.255
      (ip >= 0xC0A80000 && ip <= 0xC0A8FFFF) || // 192.168.0.0-192.168.255.255
      false;
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
        sformat("numBits({}) > bitsCount({})", numBits, bits));
  }

  ByteArray4 ba = detail::Bytes::mask(fetchMask(numBits), addr_.bytes_);
  return IPAddressV4(ba);
}

// public
string IPAddressV4::str() const {
  return detail::fastIpv4ToString(addr_.inAddr_);
}

// public
void IPAddressV4::toFullyQualifiedAppend(std::string& out) const {
  detail::fastIpv4AppendToString(addr_.inAddr_, out);
}

// public
string IPAddressV4::toInverseArpaName() const {
  return sformat(
      "{}.{}.{}.{}.in-addr.arpa",
      addr_.bytes_[3],
      addr_.bytes_[2],
      addr_.bytes_[1],
      addr_.bytes_[0]);
}

// public
uint8_t IPAddressV4::getNthMSByte(size_t byteIndex) const {
  const auto highestIndex = byteCount() - 1;
  if (byteIndex > highestIndex) {
    throw std::invalid_argument(sformat(
        "Byte index must be <= {} for addresses of type: {}",
        highestIndex,
        detail::familyNameStr(AF_INET)));
  }
  return bytes()[byteIndex];
}
// protected
const ByteArray4 IPAddressV4::fetchMask(size_t numBits) {
  static const size_t bits = bitCount();
  if (numBits > bits) {
    throw IPAddressFormatException("IPv4 addresses are 32 bits");
  }
  auto const val = Endian::big(uint32_t(~uint64_t(0) << (32 - numBits)));
  ByteArray4 arr;
  std::memcpy(arr.data(), &val, sizeof(val));
  return arr;
}
// public static
CIDRNetworkV4 IPAddressV4::longestCommonPrefix(
    const CIDRNetworkV4& one,
    const CIDRNetworkV4& two) {
  auto prefix = detail::Bytes::longestCommonPrefix(
      one.first.addr_.bytes_, one.second, two.first.addr_.bytes_, two.second);
  return {IPAddressV4(prefix.first), prefix.second};
}

} // namespace folly
