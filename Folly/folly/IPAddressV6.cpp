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

#include <folly/IPAddressV6.h>

#include <ostream>
#include <string>

#include <folly/Format.h>
#include <folly/IPAddress.h>
#include <folly/IPAddressV4.h>
#include <folly/MacAddress.h>
#include <folly/detail/IPAddressSource.h>

#if !_WIN32
#include <net/if.h>
#else
// Because of the massive pain that is libnl, this can't go into the socket
// portability header as you can't include <linux/if.h> and <net/if.h> in
// the same translation unit without getting errors -_-...
#include <iphlpapi.h> // @manual
#include <ntddndis.h> // @manual

// Alias the max size of an interface name to what posix expects.
#define IFNAMSIZ IF_NAMESIZE
#endif

using std::ostream;
using std::string;

namespace folly {

// public static const
const uint32_t IPAddressV6::PREFIX_TEREDO = 0x20010000;
const uint32_t IPAddressV6::PREFIX_6TO4 = 0x2002;

// free functions
size_t hash_value(const IPAddressV6& addr) {
  return addr.hash();
}
ostream& operator<<(ostream& os, const IPAddressV6& addr) {
  os << addr.str();
  return os;
}
void toAppend(IPAddressV6 addr, string* result) {
  result->append(addr.str());
}
void toAppend(IPAddressV6 addr, fbstring* result) {
  result->append(addr.str());
}

bool IPAddressV6::validate(StringPiece ip) noexcept {
  return tryFromString(ip).hasValue();
}

// public default constructor
IPAddressV6::IPAddressV6() {}

// public string constructor
IPAddressV6::IPAddressV6(StringPiece addr) {
  auto maybeIp = tryFromString(addr);
  if (maybeIp.hasError()) {
    throw IPAddressFormatException(
        to<std::string>("Invalid IPv6 address '", addr, "'"));
  }
  *this = std::move(maybeIp.value());
}

Expected<IPAddressV6, IPAddressFormatError> IPAddressV6::tryFromString(
    StringPiece str) noexcept {
  auto ip = str.str();

  // Allow addresses surrounded in brackets
  if (ip.size() < 2) {
    return makeUnexpected(IPAddressFormatError::INVALID_IP);
  }
  if (ip.front() == '[' && ip.back() == ']') {
    ip = ip.substr(1, ip.size() - 2);
  }

  struct addrinfo* result;
  struct addrinfo hints;
  memset(&hints, 0, sizeof(hints));
  hints.ai_family = AF_INET6;
  hints.ai_socktype = SOCK_STREAM;
  hints.ai_flags = AI_NUMERICHOST;
  if (::getaddrinfo(ip.c_str(), nullptr, &hints, &result) == 0) {
    SCOPE_EXIT {
      ::freeaddrinfo(result);
    };
    const struct sockaddr_in6* sa =
        reinterpret_cast<struct sockaddr_in6*>(result->ai_addr);
    return IPAddressV6(*sa);
  }
  return makeUnexpected(IPAddressFormatError::INVALID_IP);
}

// in6_addr constructor
IPAddressV6::IPAddressV6(const in6_addr& src) noexcept : addr_(src) {}

// sockaddr_in6 constructor
IPAddressV6::IPAddressV6(const sockaddr_in6& src) noexcept
    : addr_(src.sin6_addr), scope_(uint16_t(src.sin6_scope_id)) {}

// ByteArray16 constructor
IPAddressV6::IPAddressV6(const ByteArray16& src) noexcept : addr_(src) {}

// link-local constructor
IPAddressV6::IPAddressV6(LinkLocalTag, MacAddress mac) : addr_(mac) {}

IPAddressV6::AddressStorage::AddressStorage(MacAddress mac) {
  // The link-local address uses modified EUI-64 format,
  // See RFC 4291 sections 2.5.1, 2.5.6, and Appendix A
  const auto* macBytes = mac.bytes();
  memcpy(&bytes_.front(), "\xfe\x80\x00\x00\x00\x00\x00\x00", 8);
  bytes_[8] = uint8_t(macBytes[0] ^ 0x02);
  bytes_[9] = macBytes[1];
  bytes_[10] = macBytes[2];
  bytes_[11] = 0xff;
  bytes_[12] = 0xfe;
  bytes_[13] = macBytes[3];
  bytes_[14] = macBytes[4];
  bytes_[15] = macBytes[5];
}

Optional<MacAddress> IPAddressV6::getMacAddressFromLinkLocal() const {
  // Returned MacAddress must be constructed from a link-local IPv6 address.
  if (!isLinkLocal()) {
    return folly::none;
  }
  return getMacAddressFromEUI64();
}

Optional<MacAddress> IPAddressV6::getMacAddressFromEUI64() const {
  if (!(addr_.bytes_[11] == 0xff && addr_.bytes_[12] == 0xfe)) {
    return folly::none;
  }
  // The auto configured address uses modified EUI-64 format,
  // See RFC 4291 sections 2.5.1, 2.5.6, and Appendix A
  std::array<uint8_t, MacAddress::SIZE> bytes;
  // Step 1: first 8 bytes are network prefix, and can be stripped
  // Step 2: invert the universal/local (U/L) flag (bit 7)
  bytes[0] = addr_.bytes_[8] ^ 0x02;
  // Step 3: copy these bytes as they are
  bytes[1] = addr_.bytes_[9];
  bytes[2] = addr_.bytes_[10];
  // Step 4: strip bytes (0xfffe), which are bytes_[11] and bytes_[12]
  // Step 5: copy the rest.
  bytes[3] = addr_.bytes_[13];
  bytes[4] = addr_.bytes_[14];
  bytes[5] = addr_.bytes_[15];
  return Optional<MacAddress>(MacAddress::fromBinary(range(bytes)));
}

IPAddressV6 IPAddressV6::fromBinary(ByteRange bytes) {
  auto maybeIp = tryFromBinary(bytes);
  if (maybeIp.hasError()) {
    throw IPAddressFormatException(to<std::string>(
        "Invalid IPv6 binary data: length must be 16 bytes, got ",
        bytes.size()));
  }
  return maybeIp.value();
}

Expected<IPAddressV6, IPAddressFormatError> IPAddressV6::tryFromBinary(
    ByteRange bytes) noexcept {
  IPAddressV6 addr;
  auto setResult = addr.trySetFromBinary(bytes);
  if (setResult.hasError()) {
    return makeUnexpected(std::move(setResult.error()));
  }
  return addr;
}

Expected<Unit, IPAddressFormatError> IPAddressV6::trySetFromBinary(
    ByteRange bytes) noexcept {
  if (bytes.size() != 16) {
    return makeUnexpected(IPAddressFormatError::INVALID_IP);
  }
  memcpy(&addr_.in6Addr_.s6_addr, bytes.data(), sizeof(in6_addr));
  scope_ = 0;
  return unit;
}

// static
IPAddressV6 IPAddressV6::fromInverseArpaName(const std::string& arpaname) {
  auto piece = StringPiece(arpaname);
  if (!piece.removeSuffix(".ip6.arpa")) {
    throw IPAddressFormatException(sformat(
        "Invalid input. Should end with 'ip6.arpa'. Got '{}'", arpaname));
  }
  std::vector<StringPiece> pieces;
  split(".", piece, pieces);
  if (pieces.size() != 32) {
    throw IPAddressFormatException(sformat("Invalid input. Got '{}'", piece));
  }
  std::array<char, IPAddressV6::kToFullyQualifiedSize> ip;
  size_t pos = 0;
  int count = 0;
  for (size_t i = 1; i <= pieces.size(); i++) {
    ip[pos] = pieces[pieces.size() - i][0];
    pos++;
    count++;
    // add ':' every 4 chars
    if (count == 4 && pos < ip.size()) {
      ip[pos++] = ':';
      count = 0;
    }
  }
  return IPAddressV6(folly::range(ip));
}

// public
IPAddressV4 IPAddressV6::createIPv4() const {
  if (!isIPv4Mapped()) {
    throw IPAddressFormatException("addr is not v4-to-v6-mapped");
  }
  const unsigned char* by = bytes();
  return IPAddressV4(detail::Bytes::mkAddress4(&by[12]));
}

// convert two uint8_t bytes into a uint16_t as hibyte.lobyte
static inline uint16_t unpack(uint8_t lobyte, uint8_t hibyte) {
  return uint16_t((uint16_t(hibyte) << 8) | lobyte);
}

// given a src string, unpack count*2 bytes into dest
// dest must have as much storage as count
static inline void
unpackInto(const unsigned char* src, uint16_t* dest, size_t count) {
  for (size_t i = 0, hi = 1, lo = 0; i < count; i++) {
    dest[i] = unpack(src[hi], src[lo]);
    hi += 2;
    lo += 2;
  }
}

// public
IPAddressV4 IPAddressV6::getIPv4For6To4() const {
  if (!is6To4()) {
    throw IPAddressV6::TypeError(
        sformat("Invalid IP '{}': not a 6to4 address", str()));
  }
  // convert 16x8 bytes into first 4x16 bytes
  uint16_t ints[4] = {0, 0, 0, 0};
  unpackInto(bytes(), ints, 4);
  // repack into 4x8
  union {
    unsigned char bytes[4];
    in_addr addr;
  } ipv4;
  ipv4.bytes[0] = (uint8_t)((ints[1] & 0xFF00) >> 8);
  ipv4.bytes[1] = (uint8_t)(ints[1] & 0x00FF);
  ipv4.bytes[2] = (uint8_t)((ints[2] & 0xFF00) >> 8);
  ipv4.bytes[3] = (uint8_t)(ints[2] & 0x00FF);
  return IPAddressV4(ipv4.addr);
}

// public
bool IPAddressV6::isIPv4Mapped() const {
  // v4 mapped addresses have their first 10 bytes set to 0, the next 2 bytes
  // set to 255 (0xff);
  const unsigned char* by = bytes();

  // check if first 10 bytes are 0
  for (int i = 0; i < 10; i++) {
    if (by[i] != 0x00) {
      return false;
    }
  }
  // check if bytes 11 and 12 are 255
  if (by[10] == 0xff && by[11] == 0xff) {
    return true;
  }
  return false;
}

// public
IPAddressV6::Type IPAddressV6::type() const {
  // convert 16x8 bytes into first 2x16 bytes
  uint16_t ints[2] = {0, 0};
  unpackInto(bytes(), ints, 2);

  if ((((uint32_t)ints[0] << 16) | ints[1]) == IPAddressV6::PREFIX_TEREDO) {
    return Type::TEREDO;
  }

  if ((uint32_t)ints[0] == IPAddressV6::PREFIX_6TO4) {
    return Type::T6TO4;
  }

  return Type::NORMAL;
}

// public
string IPAddressV6::toJson() const {
  return sformat("{{family:'AF_INET6', addr:'{}', hash:{}}}", str(), hash());
}

// public
size_t IPAddressV6::hash() const {
  if (isIPv4Mapped()) {
    /* An IPAddress containing this object would be equal (i.e. operator==)
       to an IPAddress containing the corresponding IPv4.
       So we must make sure that the hash values are the same as well */
    return IPAddress::createIPv4(*this).hash();
  }

  static const uint64_t seed = AF_INET6;
  uint64_t hash1 = 0, hash2 = 0;
  hash::SpookyHashV2::Hash128(&addr_, 16, &hash1, &hash2);
  return hash::hash_combine(seed, hash1, hash2);
}

// public
bool IPAddressV6::inSubnet(StringPiece cidrNetwork) const {
  auto subnetInfo = IPAddress::createNetwork(cidrNetwork);
  auto addr = subnetInfo.first;
  if (!addr.isV6()) {
    throw IPAddressFormatException(
        sformat("Address '{}' is not a V6 address", addr.toJson()));
  }
  return inSubnetWithMask(addr.asV6(), fetchMask(subnetInfo.second));
}

// public
bool IPAddressV6::inSubnetWithMask(
    const IPAddressV6& subnet,
    const ByteArray16& cidrMask) const {
  const auto mask = detail::Bytes::mask(toByteArray(), cidrMask);
  const auto subMask = detail::Bytes::mask(subnet.toByteArray(), cidrMask);
  return (mask == subMask);
}

// public
bool IPAddressV6::isLoopback() const {
  // Check if v4 mapped is loopback
  if (isIPv4Mapped() && createIPv4().isLoopback()) {
    return true;
  }
  auto socka = toSockAddr();
  return IN6_IS_ADDR_LOOPBACK(&socka.sin6_addr);
}

bool IPAddressV6::isRoutable() const {
  return
      // 2000::/3 is the only assigned global unicast block
      inBinarySubnet({{0x20, 0x00}}, 3) ||
      // ffxe::/16 are global scope multicast addresses,
      // which are eligible to be routed over the internet
      (isMulticast() && getMulticastScope() == 0xe);
}

bool IPAddressV6::isLinkLocalBroadcast() const {
  static const IPAddressV6 kLinkLocalBroadcast("ff02::1");
  return *this == kLinkLocalBroadcast;
}

// public
bool IPAddressV6::isPrivate() const {
  // Check if mapped is private
  if (isIPv4Mapped() && createIPv4().isPrivate()) {
    return true;
  }
  return isLoopback() || inBinarySubnet({{0xfc, 0x00}}, 7);
}

// public
bool IPAddressV6::isLinkLocal() const {
  return inBinarySubnet({{0xfe, 0x80}}, 10);
}

bool IPAddressV6::isMulticast() const {
  return addr_.bytes_[0] == 0xff;
}

uint8_t IPAddressV6::getMulticastFlags() const {
  DCHECK(isMulticast());
  return uint8_t((addr_.bytes_[1] >> 4) & 0xf);
}

uint8_t IPAddressV6::getMulticastScope() const {
  DCHECK(isMulticast());
  return uint8_t(addr_.bytes_[1] & 0xf);
}

IPAddressV6 IPAddressV6::getSolicitedNodeAddress() const {
  // Solicted node addresses must be constructed from unicast (or anycast)
  // addresses
  DCHECK(!isMulticast());

  uint8_t bytes[16] = {
      0xff,
      0x02,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x01,
      0xff,
      addr_.bytes_[13],
      addr_.bytes_[14],
      addr_.bytes_[15],
  };
  return IPAddressV6::fromBinary(ByteRange(bytes, 16));
}

// public
IPAddressV6 IPAddressV6::mask(size_t numBits) const {
  static const auto bits = bitCount();
  if (numBits > bits) {
    throw IPAddressFormatException(
        sformat("numBits({}) > bitCount({})", numBits, bits));
  }
  ByteArray16 ba = detail::Bytes::mask(fetchMask(numBits), addr_.bytes_);
  return IPAddressV6(ba);
}

// public
string IPAddressV6::str() const {
  char buffer[INET6_ADDRSTRLEN + IFNAMSIZ + 1];

  if (!inet_ntop(AF_INET6, toAddr().s6_addr, buffer, INET6_ADDRSTRLEN)) {
    throw IPAddressFormatException(sformat(
        "Invalid address with hex '{}' with error {}",
        detail::Bytes::toHex(bytes(), 16),
        errnoStr(errno)));
  }

  auto scopeId = getScopeId();
  if (scopeId != 0) {
    auto len = strlen(buffer);
    buffer[len] = '%';

    auto errsv = errno;
    if (!if_indextoname(scopeId, buffer + len + 1)) {
      // if we can't map the if because eg. it no longer exists,
      // append the if index instead
      snprintf(buffer + len + 1, IFNAMSIZ, "%u", scopeId);
    }
    errno = errsv;
  }

  return string(buffer);
}

// public
string IPAddressV6::toFullyQualified() const {
  return detail::fastIpv6ToString(addr_.in6Addr_);
}

// public
void IPAddressV6::toFullyQualifiedAppend(std::string& out) const {
  detail::fastIpv6AppendToString(addr_.in6Addr_, out);
}

// public
string IPAddressV6::toInverseArpaName() const {
  constexpr folly::StringPiece lut = "0123456789abcdef";
  std::array<char, 32> a;
  int j = 0;
  for (int i = 15; i >= 0; i--) {
    a[j] = (lut[bytes()[i] & 0xf]);
    a[j + 1] = (lut[bytes()[i] >> 4]);
    j += 2;
  }
  return sformat("{}.ip6.arpa", join(".", a));
}

// public
uint8_t IPAddressV6::getNthMSByte(size_t byteIndex) const {
  const auto highestIndex = byteCount() - 1;
  if (byteIndex > highestIndex) {
    throw std::invalid_argument(sformat(
        "Byte index must be <= {} for addresses of type: {}",
        highestIndex,
        detail::familyNameStr(AF_INET6)));
  }
  return bytes()[byteIndex];
}

// protected
const ByteArray16 IPAddressV6::fetchMask(size_t numBits) {
  static const size_t bits = bitCount();
  if (numBits > bits) {
    throw IPAddressFormatException("IPv6 addresses are 128 bits.");
  }
  if (numBits == 0) {
    return {{0}};
  }
  constexpr auto _0s = uint64_t(0);
  constexpr auto _1s = ~_0s;
  auto const fragment = Endian::big(_1s << ((128 - numBits) % 64));
  auto const hi = numBits <= 64 ? fragment : _1s;
  auto const lo = numBits <= 64 ? _0s : fragment;
  uint64_t const parts[] = {hi, lo};
  ByteArray16 arr;
  std::memcpy(arr.data(), parts, sizeof(parts));
  return arr;
}

// public static
CIDRNetworkV6 IPAddressV6::longestCommonPrefix(
    const CIDRNetworkV6& one,
    const CIDRNetworkV6& two) {
  auto prefix = detail::Bytes::longestCommonPrefix(
      one.first.addr_.bytes_, one.second, two.first.addr_.bytes_, two.second);
  return {IPAddressV6(prefix.first), prefix.second};
}

// protected
bool IPAddressV6::inBinarySubnet(
    const std::array<uint8_t, 2> addr,
    size_t numBits) const {
  auto masked = mask(numBits);
  return (std::memcmp(addr.data(), masked.bytes(), 2) == 0);
}
} // namespace folly
