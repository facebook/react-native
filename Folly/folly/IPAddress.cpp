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

#include <folly/IPAddress.h>

#include <limits>
#include <ostream>
#include <string>
#include <vector>

#include <folly/Conv.h>
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

bool IPAddress::validate(StringPiece ip) {
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

// public static
CIDRNetwork IPAddress::createNetwork(StringPiece ipSlashCidr,
                                     int defaultCidr, /* = -1 */
                                     bool applyMask /* = true */) {
  if (defaultCidr > std::numeric_limits<uint8_t>::max()) {
    throw std::range_error("defaultCidr must be <= UINT8_MAX");
  }
  vector<string> vec;
  split("/", ipSlashCidr, vec);
  vector<string>::size_type elemCount = vec.size();

  if (elemCount == 0 || // weird invalid string
      elemCount > 2) { // invalid string (IP/CIDR/extras)
    throw IPAddressFormatException(to<std::string>(
        "Invalid ipSlashCidr specified. ",
        "Expected IP/CIDR format, got ",
        "'",
        ipSlashCidr,
        "'"));
  }
  IPAddress subnet(vec.at(0));
  auto cidr =
      uint8_t((defaultCidr > -1) ? defaultCidr : (subnet.isV4() ? 32 : 128));

  if (elemCount == 2) {
    try {
      cidr = to<uint8_t>(vec.at(1));
    } catch (...) {
      throw IPAddressFormatException(
          to<std::string>("Mask value ", "'", vec.at(1), "' not a valid mask"));
    }
  }
  if (cidr > subnet.bitCount()) {
    throw IPAddressFormatException(to<std::string>(
        "CIDR value '",
        cidr,
        "' ",
        "is > network bit count ",
        "'",
        subnet.bitCount(),
        "'"));
  }
  return std::make_pair(applyMask ? subnet.mask(cidr) : subnet, cidr);
}

// public static
std::string IPAddress::networkToString(const CIDRNetwork& network) {
  return network.first.str() + "/" + folly::to<std::string>(network.second);
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
        to<std::string>("Invalid address with hex value ", "'", hexval, "'"));
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
IPAddress::IPAddress()
  : addr_()
  , family_(AF_UNSPEC)
{
}

// public string constructor
IPAddress::IPAddress(StringPiece addr)
  : addr_()
  , family_(AF_UNSPEC)
{
  string ip = addr.str();  // inet_pton() needs NUL-terminated string
  auto throwFormatException = [&](const string& msg) {
    throw IPAddressFormatException(
        to<std::string>("Invalid IP '", ip, "': ", msg));
  };

  if (ip.size() < 2) {
    throwFormatException("address too short");
  }
  if (ip.front() == '[' && ip.back() == ']') {
    ip = ip.substr(1, ip.size() - 2);
  }

  // need to check for V4 address second, since IPv4-mapped IPv6 addresses may
  // contain a period
  if (ip.find(':') != string::npos) {
    struct addrinfo* result;
    struct addrinfo hints;
    memset(&hints, 0, sizeof(hints));
    hints.ai_family = AF_INET6;
    hints.ai_socktype = SOCK_STREAM;
    hints.ai_flags = AI_NUMERICHOST;
    if (!getaddrinfo(ip.c_str(), nullptr, &hints, &result)) {
      struct sockaddr_in6* ipAddr = (struct sockaddr_in6*)result->ai_addr;
      addr_ = IPAddressV46(IPAddressV6(*ipAddr));
      family_ = AF_INET6;
      freeaddrinfo(result);
    } else {
      throwFormatException("getsockaddr failed for V6 address");
    }
  } else if (ip.find('.') != string::npos) {
    in_addr ipAddr;
    if (inet_pton(AF_INET, ip.c_str(), &ipAddr) != 1) {
      throwFormatException("inet_pton failed for V4 address");
    }
    addr_ = IPAddressV46(IPAddressV4(ipAddr));
    family_ = AF_INET;
  } else {
    throwFormatException("invalid address format");
  }
}

// public sockaddr constructor
IPAddress::IPAddress(const sockaddr* addr)
  : addr_()
  , family_(AF_UNSPEC)
{
  if (addr == nullptr) {
    throw IPAddressFormatException("sockaddr == nullptr");
  }
  family_ = addr->sa_family;
  switch (addr->sa_family) {
    case AF_INET: {
      const sockaddr_in *v4addr = reinterpret_cast<const sockaddr_in*>(addr);
      addr_.ipV4Addr = IPAddressV4(v4addr->sin_addr);
      break;
    }
    case AF_INET6: {
      const sockaddr_in6 *v6addr = reinterpret_cast<const sockaddr_in6*>(addr);
      addr_.ipV6Addr = IPAddressV6(*v6addr);
      break;
    }
    default:
      throw InvalidAddressFamilyException(addr->sa_family);
  }
}

// public ipv4 constructor
IPAddress::IPAddress(const IPAddressV4 ipV4Addr)
  : addr_(ipV4Addr)
  , family_(AF_INET)
{
}

// public ipv4 constructor
IPAddress::IPAddress(const in_addr ipV4Addr)
  : addr_(IPAddressV4(ipV4Addr))
  , family_(AF_INET)
{
}

// public ipv6 constructor
IPAddress::IPAddress(const IPAddressV6& ipV6Addr)
  : addr_(ipV6Addr)
  , family_(AF_INET6)
{
}

// public ipv6 constructor
IPAddress::IPAddress(const in6_addr& ipV6Addr)
  : addr_(IPAddressV6(ipV6Addr))
  , family_(AF_INET6)
{
}

// Assign from V4 address
IPAddress& IPAddress::operator=(const IPAddressV4& ipv4_addr) {
  addr_ = IPAddressV46(ipv4_addr);
  family_ = AF_INET;
  return *this;
}

// Assign from V6 address
IPAddress& IPAddress::operator=(const IPAddressV6& ipv6_addr) {
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
bool IPAddress::inSubnetWithMask(const IPAddress& subnet,
                                 ByteRange mask) const {
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
    throw std::invalid_argument(to<string>("Byte index must be <= ",
        to<string>(highestIndex), " for addresses of type :",
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

CIDRNetwork
IPAddress::longestCommonPrefix(const CIDRNetwork& one, const CIDRNetwork& two) {
  if (one.first.family() != two.first.family()) {
      throw std::invalid_argument(to<string>("Can't compute "
            "longest common prefix between addresses of different families. "
            "Passed: ", detail::familyNameStr(one.first.family()), " and ",
            detail::familyNameStr(two.first.family())));
  }
  if (one.first.isV4()) {
    auto prefix = IPAddressV4::longestCommonPrefix(
      {one.first.asV4(), one.second},
      {two.first.asV4(), two.second});
    return {IPAddress(prefix.first), prefix.second};
  } else if (one.first.isV6()) {
    auto prefix = IPAddressV6::longestCommonPrefix(
      {one.first.asV6(), one.second},
      {two.first.asV6(), two.second});
    return {IPAddress(prefix.first), prefix.second};
  } else {
    throw std::invalid_argument("Unknown address family");
  }
}

[[noreturn]] void IPAddress::asV4Throw() const {
  auto fam = detail::familyNameStr(family());
  throw InvalidAddressFamilyException(to<std::string>(
      "Can't convert address with family ", fam, " to AF_INET address"));
}

[[noreturn]] void IPAddress::asV6Throw() const {
  auto fam = detail::familyNameStr(family());
  throw InvalidAddressFamilyException(to<std::string>(
      "Can't convert address with family ", fam, " to AF_INET6 address"));
}


}  // folly
