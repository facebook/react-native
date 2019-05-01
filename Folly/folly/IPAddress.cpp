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
#include <folly/IPAddress.h>

#include <limits>
#include <ostream>
#include <string>
#include <vector>

#include <folly/Format.h>
#include <folly/String.h>
#include <folly/detail/IPAddressSource.h>

using std::ostream;
using std::string;
using std::vector;

namespace folly {

// free functions
size_t hash_value(const IPAddress& addr) {
  return addr.hash();
}
ostream& operator<<(ostream& os, const IPAddress& addr) {
  os << addr.str();
  return os;
}
void toAppend(IPAddress addr, string* result) {
  result->append(addr.str());
}
void toAppend(IPAddress addr, fbstring* result) {
  result->append(addr.str());
}

bool IPAddress::validate(StringPiece ip) noexcept {
  return IPAddressV4::validate(ip) || IPAddressV6::validate(ip);
}

// public static
IPAddressV4 IPAddress::createIPv4(const IPAddress& addr) {
  if (addr.isV4()) {
    return addr.asV4();
  } else {
    return addr.asV6().createIPv4();
  }
}

// public static
IPAddressV6 IPAddress::createIPv6(const IPAddress& addr) {
  if (addr.isV6()) {
    return addr.asV6();
  } else {
    return addr.asV4().createIPv6();
  }
}

namespace {
vector<string> splitIpSlashCidr(StringPiece ipSlashCidr) {
  vector<string> vec;
  split("/", ipSlashCidr, vec);
  return vec;
}
} // namespace

// public static
CIDRNetwork IPAddress::createNetwork(
    StringPiece ipSlashCidr,
    int defaultCidr, /* = -1 */
    bool applyMask /* = true */) {
  auto const ret =
      IPAddress::tryCreateNetwork(ipSlashCidr, defaultCidr, applyMask);

  if (ret.hasValue()) {
    return ret.value();
  }

  if (ret.error() == CIDRNetworkError::INVALID_DEFAULT_CIDR) {
    throw std::range_error("defaultCidr must be <= UINT8_MAX");
  }

  if (ret.error() == CIDRNetworkError::INVALID_IP_SLASH_CIDR) {
    throw IPAddressFormatException(sformat(
        "Invalid ipSlashCidr specified. Expected IP/CIDR format, got '{}'",
        ipSlashCidr));
  }

  // Handler the remaining error cases. We re-parse the ip/mask pair
  // to make error messages more meaningful
  auto const vec = splitIpSlashCidr(ipSlashCidr);

  switch (ret.error()) {
    case CIDRNetworkError::INVALID_IP:
      CHECK_GE(vec.size(), 1);
      throw IPAddressFormatException(
          sformat("Invalid IP address {}", vec.at(0)));
    case CIDRNetworkError::INVALID_CIDR:
      CHECK_GE(vec.size(), 2);
      throw IPAddressFormatException(
          sformat("Mask value '{}' not a valid mask", vec.at(1)));
    case CIDRNetworkError::CIDR_MISMATCH: {
      auto const subnet = IPAddress::tryFromString(vec.at(0)).value();
      auto cidr = static_cast<uint8_t>(
          (defaultCidr > -1) ? defaultCidr : (subnet.isV4() ? 32 : 128));

      throw IPAddressFormatException(sformat(
          "CIDR value '{}' is > network bit count '{}'",
          vec.size() == 2 ? vec.at(1) : to<string>(cidr),
          subnet.bitCount()));
    }
    default:
      // unreachable
      break;
  }

  CHECK(0);

  return CIDRNetwork{};
}

// public static
Expected<CIDRNetwork, CIDRNetworkError> IPAddress::tryCreateNetwork(
    StringPiece ipSlashCidr,
    int defaultCidr,
    bool applyMask) {
  if (defaultCidr > std::numeric_limits<uint8_t>::max()) {
    return makeUnexpected(CIDRNetworkError::INVALID_DEFAULT_CIDR);
  }

  auto const vec = splitIpSlashCidr(ipSlashCidr);
  auto const elemCount = vec.size();

  if (elemCount == 0 || // weird invalid string
      elemCount > 2) { // invalid string (IP/CIDR/extras)
    return makeUnexpected(CIDRNetworkError::INVALID_IP_SLASH_CIDR);
  }

  auto const subnet = IPAddress::tryFromString(vec.at(0));
  if (subnet.hasError()) {
    return makeUnexpected(CIDRNetworkError::INVALID_IP);
  }

  auto cidr = static_cast<uint8_t>(
      (defaultCidr > -1) ? defaultCidr : (subnet.value().isV4() ? 32 : 128));

  if (elemCount == 2) {
    auto const maybeCidr = tryTo<uint8_t>(vec.at(1));
    if (maybeCidr.hasError()) {
      return makeUnexpected(CIDRNetworkError::INVALID_CIDR);
    }
    cidr = maybeCidr.value();
  }

  if (cidr > subnet.value().bitCount()) {
    return makeUnexpected(CIDRNetworkError::CIDR_MISMATCH);
  }

  return std::make_pair(
      applyMask ? subnet.value().mask(cidr) : subnet.value(), cidr);
}

// public static
std::string IPAddress::networkToString(const CIDRNetwork& network) {
  return sformat("{}/{}", network.first.str(), network.second);
}

// public static
IPAddress IPAddress::fromBinary(ByteRange bytes) {
  if (bytes.size() == 4) {
    return IPAddress(IPAddressV4::fromBinary(bytes));
  } else if (bytes.size() == 16) {
    return IPAddress(IPAddressV6::fromBinary(bytes));
  } else {
    string hexval = detail::Bytes::toHex(bytes.data(), bytes.size());
    throw IPAddressFormatException(
        sformat("Invalid address with hex value '{}'", hexval));
  }
}

Expected<IPAddress, IPAddressFormatError> IPAddress::tryFromBinary(
    ByteRange bytes) noexcept {
  // Check IPv6 first since it's our main protocol.
  if (bytes.size() == 16) {
    return IPAddressV6::tryFromBinary(bytes);
  } else if (bytes.size() == 4) {
    return IPAddressV4::tryFromBinary(bytes);
  } else {
    return makeUnexpected(IPAddressFormatError::UNSUPPORTED_ADDR_FAMILY);
  }
}

// public static
IPAddress IPAddress::fromLong(uint32_t src) {
  return IPAddress(IPAddressV4::fromLong(src));
}
IPAddress IPAddress::fromLongHBO(uint32_t src) {
  return IPAddress(IPAddressV4::fromLongHBO(src));
}

// default constructor
IPAddress::IPAddress() : addr_(), family_(AF_UNSPEC) {}

// public string constructor
IPAddress::IPAddress(StringPiece str) : addr_(), family_(AF_UNSPEC) {
  auto maybeIp = tryFromString(str);
  if (maybeIp.hasError()) {
    throw IPAddressFormatException(
        to<std::string>("Invalid IP address '", str, "'"));
  }
  *this = std::move(maybeIp.value());
}

Expected<IPAddress, IPAddressFormatError> IPAddress::tryFromString(
    StringPiece str) noexcept {
  // need to check for V4 address second, since IPv4-mapped IPv6 addresses may
  // contain a period
  if (str.find(':') != string::npos) {
    return IPAddressV6::tryFromString(str);
  } else if (str.find('.') != string::npos) {
    return IPAddressV4::tryFromString(str);
  } else {
    return makeUnexpected(IPAddressFormatError::UNSUPPORTED_ADDR_FAMILY);
  }
}

// public sockaddr constructor
IPAddress::IPAddress(const sockaddr* addr) : addr_(), family_(AF_UNSPEC) {
  if (addr == nullptr) {
    throw IPAddressFormatException("sockaddr == nullptr");
  }
  family_ = addr->sa_family;
  switch (addr->sa_family) {
    case AF_INET: {
      const sockaddr_in* v4addr = reinterpret_cast<const sockaddr_in*>(addr);
      addr_.ipV4Addr = IPAddressV4(v4addr->sin_addr);
      break;
    }
    case AF_INET6: {
      const sockaddr_in6* v6addr = reinterpret_cast<const sockaddr_in6*>(addr);
      addr_.ipV6Addr = IPAddressV6(*v6addr);
      break;
    }
    default:
      throw InvalidAddressFamilyException(addr->sa_family);
  }
}

// public ipv4 constructor
IPAddress::IPAddress(const IPAddressV4 ipV4Addr) noexcept
    : addr_(ipV4Addr), family_(AF_INET) {}

// public ipv4 constructor
IPAddress::IPAddress(const in_addr ipV4Addr) noexcept
    : addr_(IPAddressV4(ipV4Addr)), family_(AF_INET) {}

// public ipv6 constructor
IPAddress::IPAddress(const IPAddressV6& ipV6Addr) noexcept
    : addr_(ipV6Addr), family_(AF_INET6) {}

// public ipv6 constructor
IPAddress::IPAddress(const in6_addr& ipV6Addr) noexcept
    : addr_(IPAddressV6(ipV6Addr)), family_(AF_INET6) {}

// Assign from V4 address
IPAddress& IPAddress::operator=(const IPAddressV4& ipv4_addr) noexcept {
  addr_ = IPAddressV46(ipv4_addr);
  family_ = AF_INET;
  return *this;
}

// Assign from V6 address
IPAddress& IPAddress::operator=(const IPAddressV6& ipv6_addr) noexcept {
  addr_ = IPAddressV46(ipv6_addr);
  family_ = AF_INET6;
  return *this;
}

// public
bool IPAddress::inSubnet(StringPiece cidrNetwork) const {
  auto subnetInfo = IPAddress::createNetwork(cidrNetwork);
  return inSubnet(subnetInfo.first, subnetInfo.second);
}

// public
bool IPAddress::inSubnet(const IPAddress& subnet, uint8_t cidr) const {
  if (bitCount() == subnet.bitCount()) {
    if (isV4()) {
      return asV4().inSubnet(subnet.asV4(), cidr);
    } else {
      return asV6().inSubnet(subnet.asV6(), cidr);
    }
  }
  // an IPv4 address can never belong in a IPv6 subnet unless the IPv6 is a 6to4
  // address and vice-versa
  if (isV6()) {
    const IPAddressV6& v6addr = asV6();
    const IPAddressV4& v4subnet = subnet.asV4();
    if (v6addr.is6To4()) {
      return v6addr.getIPv4For6To4().inSubnet(v4subnet, cidr);
    }
  } else if (subnet.isV6()) {
    const IPAddressV6& v6subnet = subnet.asV6();
    const IPAddressV4& v4addr = asV4();
    if (v6subnet.is6To4()) {
      return v4addr.inSubnet(v6subnet.getIPv4For6To4(), cidr);
    }
  }
  return false;
}

// public
bool IPAddress::inSubnetWithMask(const IPAddress& subnet, ByteRange mask)
    const {
  auto mkByteArray4 = [&]() -> ByteArray4 {
    ByteArray4 ba{{0}};
    std::memcpy(ba.data(), mask.begin(), std::min<size_t>(mask.size(), 4));
    return ba;
  };

  if (bitCount() == subnet.bitCount()) {
    if (isV4()) {
      return asV4().inSubnetWithMask(subnet.asV4(), mkByteArray4());
    } else {
      ByteArray16 ba{{0}};
      std::memcpy(ba.data(), mask.begin(), std::min<size_t>(mask.size(), 16));
      return asV6().inSubnetWithMask(subnet.asV6(), ba);
    }
  }

  // an IPv4 address can never belong in a IPv6 subnet unless the IPv6 is a 6to4
  // address and vice-versa
  if (isV6()) {
    const IPAddressV6& v6addr = asV6();
    const IPAddressV4& v4subnet = subnet.asV4();
    if (v6addr.is6To4()) {
      return v6addr.getIPv4For6To4().inSubnetWithMask(v4subnet, mkByteArray4());
    }
  } else if (subnet.isV6()) {
    const IPAddressV6& v6subnet = subnet.asV6();
    const IPAddressV4& v4addr = asV4();
    if (v6subnet.is6To4()) {
      return v4addr.inSubnetWithMask(v6subnet.getIPv4For6To4(), mkByteArray4());
    }
  }
  return false;
}

uint8_t IPAddress::getNthMSByte(size_t byteIndex) const {
  const auto highestIndex = byteCount() - 1;
  if (byteIndex > highestIndex) {
    throw std::invalid_argument(sformat(
        "Byte index must be <= {} for addresses of type: {}",
        highestIndex,
        detail::familyNameStr(family())));
  }
  if (isV4()) {
    return asV4().bytes()[byteIndex];
  }
  return asV6().bytes()[byteIndex];
}

// public
bool operator==(const IPAddress& addr1, const IPAddress& addr2) {
  if (addr1.family() == addr2.family()) {
    if (addr1.isV6()) {
      return (addr1.asV6() == addr2.asV6());
    } else if (addr1.isV4()) {
      return (addr1.asV4() == addr2.asV4());
    } else {
      CHECK_EQ(addr1.family(), AF_UNSPEC);
      // Two default initialized AF_UNSPEC addresses should be considered equal.
      // AF_UNSPEC is the only other value for which an IPAddress can be
      // created, in the default constructor case.
      return true;
    }
  }
  // addr1 is v4 mapped v6 address, addr2 is v4
  if (addr1.isIPv4Mapped() && addr2.isV4()) {
    if (IPAddress::createIPv4(addr1) == addr2.asV4()) {
      return true;
    }
  }
  // addr2 is v4 mapped v6 address, addr1 is v4
  if (addr2.isIPv4Mapped() && addr1.isV4()) {
    if (IPAddress::createIPv4(addr2) == addr1.asV4()) {
      return true;
    }
  }
  // we only compare IPv4 and IPv6 addresses
  return false;
}

bool operator<(const IPAddress& addr1, const IPAddress& addr2) {
  if (addr1.family() == addr2.family()) {
    if (addr1.isV6()) {
      return (addr1.asV6() < addr2.asV6());
    } else if (addr1.isV4()) {
      return (addr1.asV4() < addr2.asV4());
    } else {
      CHECK_EQ(addr1.family(), AF_UNSPEC);
      // Two default initialized AF_UNSPEC addresses can not be less than each
      // other. AF_UNSPEC is the only other value for which an IPAddress can be
      // created, in the default constructor case.
      return false;
    }
  }
  if (addr1.isV6()) {
    // means addr2 is v4, convert it to a mapped v6 address and compare
    return addr1.asV6() < addr2.asV4().createIPv6();
  }
  if (addr2.isV6()) {
    // means addr2 is v6, convert addr1 to v4 mapped and compare
    return addr1.asV4().createIPv6() < addr2.asV6();
  }
  return false;
}

CIDRNetwork IPAddress::longestCommonPrefix(
    const CIDRNetwork& one,
    const CIDRNetwork& two) {
  if (one.first.family() != two.first.family()) {
    throw std::invalid_argument(sformat(
        "Can't compute longest common prefix between addresses of different"
        "families. Passed: {} and {}",
        detail::familyNameStr(one.first.family()),
        detail::familyNameStr(two.first.family())));
  }
  if (one.first.isV4()) {
    auto prefix = IPAddressV4::longestCommonPrefix(
        {one.first.asV4(), one.second}, {two.first.asV4(), two.second});
    return {IPAddress(prefix.first), prefix.second};
  } else if (one.first.isV6()) {
    auto prefix = IPAddressV6::longestCommonPrefix(
        {one.first.asV6(), one.second}, {two.first.asV6(), two.second});
    return {IPAddress(prefix.first), prefix.second};
  } else {
    throw std::invalid_argument("Unknown address family");
  }
}

// clang-format off
[[noreturn]] void IPAddress::asV4Throw() const {
  auto fam = detail::familyNameStr(family());
  throw InvalidAddressFamilyException(
      sformat("Can't convert address with family {} to AF_INET address", fam));
}

[[noreturn]] void IPAddress::asV6Throw() const {
  auto fam = detail::familyNameStr(family());
  throw InvalidAddressFamilyException(
      sformat("Can't convert address with family {} to AF_INET6 address", fam));
}
// clang-format on

} // namespace folly
