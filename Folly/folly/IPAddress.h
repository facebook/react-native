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

#include <functional>
#include <iosfwd>
#include <memory>
#include <string>
#include <utility> // std::pair

#include <folly/Range.h>
#include <folly/IPAddressException.h>
#include <folly/IPAddressV4.h>
#include <folly/IPAddressV6.h>
#include <folly/detail/IPAddress.h>

namespace folly {

class IPAddress;

/**
 * Pair of IPAddress, netmask
 */
typedef std::pair<IPAddress, uint8_t> CIDRNetwork;

/**
 * Provides a unified interface for IP addresses.
 *
 * @note If you compare 2 IPAddress instances, v4-to-v6-mapped addresses are
 * compared as V4 addresses.
 *
 * @note toLong/fromLong deal in network byte order, use toLongHBO/fromLongHBO
 * if working in host byte order.
 *
 * Example usage:
 * @code
 *   IPAddress v4addr("192.0.2.129");
 *   IPAddress v6map("::ffff:192.0.2.129");
 *   CHECK(v4addr.inSubnet("192.0.2.0/24") ==
 *         v4addr.inSubnet(IPAddress("192.0.2.0"), 24));
 *   CHECK(v4addr.inSubnet("192.0.2.128/30"));
 *   CHECK(!v4addr.inSubnet("192.0.2.128/32"));
 *   CHECK(v4addr.asV4().toLong() == 2164392128);
 *   CHECK(v4addr.asV4().toLongHBO() == 3221226113);
 *   CHECK(v4addr.isV4());
 *   CHECK(v6addr.isV6());
 *   CHECK(v4addr == v6map);
 *   CHECK(v6map.isIPv4Mapped());
 *   CHECK(v4addr.asV4() == IPAddress::createIPv4(v6map));
 *   CHECK(IPAddress::createIPv6(v4addr) == v6map.asV6());
 * @encode
 */
class IPAddress {
 public:
  // returns true iff the input string can be parsed as an ip-address
  static bool validate(StringPiece ip);

  // return the V4 representation of the address, converting it from V6 to V4 if
  // needed. Note that this will throw an IPAddressFormatException if the V6
  // address is not IPv4Mapped.
  static IPAddressV4 createIPv4(const IPAddress& addr);

  // return the V6 representation of the address, converting it from V4 to V6 if
  // needed.
  static IPAddressV6 createIPv6(const IPAddress& addr);

  /**
   * Create a network and mask from a CIDR formatted address string.
   * @param [in] ipSlashCidr IP/CIDR formatted string to split
   * @param [in] defaultCidr default value if no /N specified (if defaultCidr
   *             is -1, will use /32 for IPv4 and /128 for IPv6)
   * @param [in] mask apply mask on the address or not,
   *             e.g. 192.168.13.46/24 => 192.168.13.0/24
   * @throws IPAddressFormatException if invalid address
   * @return pair with IPAddress network and uint8_t mask
   */
  static CIDRNetwork createNetwork(
    StringPiece ipSlashCidr, int defaultCidr = -1, bool mask = true);

  /**
   * Return a string representation of a CIDR block created with createNetwork.
   * @param [in] network, pair of address and cidr
   *
   * @return string representing the netblock
   */
  static std::string networkToString(const CIDRNetwork& network);

  /**
   * Create a new IPAddress instance from the provided binary data
   * in network byte order.
   * @throws IPAddressFormatException if len is not 4 or 16
   */
  static IPAddress fromBinary(ByteRange bytes);

  /**
   * Create an IPAddress from a 32bit long (network byte order).
   * @throws IPAddressFormatException
   */
  static IPAddress fromLong(uint32_t src);
  // Same as above, but host byte order
  static IPAddress fromLongHBO(uint32_t src);

  // Given 2 IPAddress,mask pairs extract the longest common IPAddress,
  // mask pair
  static CIDRNetwork longestCommonPrefix(const CIDRNetwork& one,
                                         const CIDRNetwork& two);

  /**
   * Constructs an uninitialized IPAddress.
   */
  IPAddress();

  /**
   * Parse an IPAddress from a string representation.
   *
   * Formats accepted are exactly the same as the ones accepted by inet_pton(),
   * using AF_INET6 if the string contains colons, and AF_INET otherwise;
   * with the exception that the whole address can optionally be enclosed
   * in square brackets.
   *
   * @throws IPAddressFormatException
   */
  explicit IPAddress(StringPiece ip);

  /**
   * Create an IPAddress from a sockaddr.
   * @throws IPAddressFormatException if nullptr or not AF_INET or AF_INET6
   */
  explicit IPAddress(const sockaddr* addr);

  // Create an IPAddress from a V4 address
  /* implicit */ IPAddress(const IPAddressV4 ipV4Addr);
  /* implicit */ IPAddress(const in_addr addr);

  // Create an IPAddress from a V6 address
  /* implicit */ IPAddress(const IPAddressV6& ipV6Addr);
  /* implicit */ IPAddress(const in6_addr& addr);

  // Assign from V4 address
  IPAddress& operator=(const IPAddressV4& ipV4Addr);

  // Assign from V6 address
  IPAddress& operator=(const IPAddressV6& ipV6Addr);

  /**
   * Converts an IPAddress to an IPAddressV4 instance.
   * @note This is not some handy convenience wrapper to convert an IPv4 address
   *       to a mapped IPv6 address. If you want that use
   *       IPAddress::createIPv6(addr)
   * @throws IPAddressFormatException is not a V4 instance
   */
  const IPAddressV4& asV4() const {
    if (UNLIKELY(!isV4())) {
      asV4Throw();
    }
    return addr_.ipV4Addr;
  }

  /**
   * Converts an IPAddress to an IPAddressV6 instance.
   * @throws InvalidAddressFamilyException is not a V6 instance
   */
  const IPAddressV6& asV6() const {
    if (UNLIKELY(!isV6())) {
      asV6Throw();
    }
    return addr_.ipV6Addr;
  }

  // Return sa_family_t of IPAddress
  sa_family_t family() const { return family_; }

  // Populate sockaddr_storage with an appropriate value
  int toSockaddrStorage(sockaddr_storage *dest, uint16_t port = 0) const {
    if (dest == nullptr) {
      throw IPAddressFormatException("dest must not be null");
    }
    memset(dest, 0, sizeof(sockaddr_storage));
    dest->ss_family = family();

    if (isV4()) {
      sockaddr_in *sin = reinterpret_cast<sockaddr_in*>(dest);
      sin->sin_addr = asV4().toAddr();
      sin->sin_port = port;
#if defined(__APPLE__)
      sin->sin_len = sizeof(*sin);
#endif
      return sizeof(*sin);
    } else if (isV6()) {
      sockaddr_in6 *sin = reinterpret_cast<sockaddr_in6*>(dest);
      sin->sin6_addr = asV6().toAddr();
      sin->sin6_port = port;
      sin->sin6_scope_id = asV6().getScopeId();
#if defined(__APPLE__)
      sin->sin6_len = sizeof(*sin);
#endif
      return sizeof(*sin);
    } else {
      throw InvalidAddressFamilyException(family());
    }
  }

  /**
   * Check if the address is found in the specified CIDR netblock.
   *
   * This will return false if the specified cidrNet is V4, but the address is
   * V6. It will also return false if the specified cidrNet is V6 but the
   * address is V4. This method will do the right thing in the case of a v6
   * mapped v4 address.
   *
   * @note This is slower than the below counterparts. If perf is important use
   *       one of the two argument variations below.
   * @param [in] ipSlashCidr address in "192.168.1.0/24" format
   * @throws IPAddressFormatException if no /mask
   * @return true if address is part of specified subnet with cidr
   */
  bool inSubnet(StringPiece ipSlashCidr) const;

  /**
   * Check if an IPAddress belongs to a subnet.
   * @param [in] subnet Subnet to check against (e.g. 192.168.1.0)
   * @param [in] cidr   CIDR for subnet (e.g. 24 for /24)
   * @return true if address is part of specified subnet with cidr
   */
  bool inSubnet(const IPAddress& subnet, uint8_t cidr) const;

  /**
   * Check if an IPAddress belongs to the subnet with the given mask.
   * This is the same as inSubnet but the mask is provided instead of looked up
   * from the cidr.
   * @param [in] subnet Subnet to check against
   * @param [in] mask   The netmask for the subnet
   * @return true if address is part of the specified subnet with mask
   */
  bool inSubnetWithMask(const IPAddress& subnet, ByteRange mask) const;

  // @return true if address is a v4 mapped address
  bool isIPv4Mapped() const {
    return isV6() && asV6().isIPv4Mapped();
  }

  // @return true if address is uninitialized
  bool empty() const { return (family_ == AF_UNSPEC); }

  // @return true if address is initialized
  explicit operator bool() const { return !empty(); }

  // @return true if this is an IPAddressV4 instance
  bool isV4() const { return (family_ == AF_INET); }

  // @return true if this is an IPAddressV6 instance
  bool isV6() const { return (family_ == AF_INET6); }

  // @return true if this address is all zeros
  bool isZero() const {
    return isV4() ? asV4().isZero()
                  : asV6().isZero();
  }

  // Number of bits in the address representation.
  size_t bitCount() const {
    return isV4() ? IPAddressV4::bitCount()
                  : IPAddressV6::bitCount();
  }
  // Number of bytes in the address representation.
  size_t byteCount() const {
    return bitCount() / 8;
  }
  //get nth most significant bit - 0 indexed
  bool getNthMSBit(size_t bitIndex) const {
    return detail::getNthMSBitImpl(*this, bitIndex, family());
  }
  //get nth most significant byte - 0 indexed
  uint8_t getNthMSByte(size_t byteIndex) const;
  //get nth bit - 0 indexed
  bool getNthLSBit(size_t bitIndex) const {
    return getNthMSBit(bitCount() - bitIndex - 1);
  }
  //get nth byte - 0 indexed
  uint8_t getNthLSByte(size_t byteIndex) const {
    return getNthMSByte(byteCount() - byteIndex - 1);
  }
  /**
   * Get human-readable string representation of the address.
   *
   * This prints a string representation of the address, for human consumption
   * or logging. The string will take the form of a JSON object that looks like:
   * {family:'AF_INET|AF_INET6', addr:'address', hash:long}.
   */
  std::string toJson() const {
    return isV4() ? asV4().toJson()
                  : asV6().toJson();
  }

  // Hash of address
  std::size_t hash() const {
    return isV4() ? asV4().hash()
                  : asV6().hash();
  }

  // Return true if the address qualifies as localhost.
  bool isLoopback() const {
    return isV4() ? asV4().isLoopback()
                  : asV6().isLoopback();
  }

  // Return true if the address qualifies as link local
  bool isLinkLocal() const {
    return isV4() ? asV4().isLinkLocal()
                  : asV6().isLinkLocal();
  }

  // Return true if the address qualifies as broadcast.
  bool isLinkLocalBroadcast() const {
    return isV4() ? asV4().isLinkLocalBroadcast()
                  : asV6().isLinkLocalBroadcast();
  }

  /**
   * Return true if the address is a special purpose address, as per rfc6890
   * (i.e. 0.0.0.0).
   * For V6, true if the address is not in one of global scope blocks:
   * 2000::/3, ffxe::/16.
   */
  bool isNonroutable() const {
    return isV4() ? asV4().isNonroutable()
                  : asV6().isNonroutable();
  }

  /**
   * Return true if the address is private, as per rfc1918 and rfc4193
   * (for example, 192.168.xxx.xxx or fc00::/7 addresses)
   */
  bool isPrivate() const {
    return isV4() ? asV4().isPrivate()
                  : asV6().isPrivate();
  }

  // Return true if the address is a multicast address.
  bool isMulticast() const {
    return isV4() ? asV4().isMulticast()
                  : asV6().isMulticast();
  }

  /**
   * Creates IPAddress instance with all but most significant numBits set to 0.
   * @param [in] numBits number of bits to mask
   * @throws abort if numBits > bitCount()
   * @return IPAddress instance with bits set to 0
   */
  IPAddress mask(uint8_t numBits) const {
    return isV4() ? IPAddress(asV4().mask(numBits))
                  : IPAddress(asV6().mask(numBits));
  }

  /**
   * Provides a string representation of address.
   * @note The string representation is calculated on demand.
   * @throws IPAddressFormatException on inet_ntop error
   */
  std::string str() const {
    return isV4() ? asV4().str()
                  : asV6().str();
  }

  /**
   * Return the fully qualified string representation of the address.
   * For V4 addresses this is the same as calling str(). For V6 addresses
   * this is the hex representation with : characters inserted every 4 digits.
   */
  std::string toFullyQualified() const {
    return isV4() ? asV4().toFullyQualified()
                  : asV6().toFullyQualified();
  }

  // Address version (4 or 6)
  uint8_t version() const {
    return isV4() ? asV4().version()
                  : asV6().version();
  }

  /**
   * Access to address bytes, in network byte order.
   */
  const unsigned char* bytes() const {
    return isV4() ? asV4().bytes() : asV6().bytes();
  }

 private:
  [[noreturn]] void asV4Throw() const;
  [[noreturn]] void asV6Throw() const;

  typedef union IPAddressV46 {
    IPAddressV4 ipV4Addr;
    IPAddressV6 ipV6Addr;
    // default constructor
    IPAddressV46() {
      std::memset(this, 0, sizeof(IPAddressV46));
    }
    explicit IPAddressV46(const IPAddressV4& addr): ipV4Addr(addr) {}
    explicit IPAddressV46(const IPAddressV6& addr): ipV6Addr(addr) {}
  } IPAddressV46;
  IPAddressV46 addr_;
  sa_family_t family_;
};

// boost::hash uses hash_value() so this allows boost::hash to work
// automatically for IPAddress
std::size_t hash_value(const IPAddress& addr);
std::ostream& operator<<(std::ostream& os, const IPAddress& addr);
// Define toAppend() to allow IPAddress to be used with folly::to<string>
void toAppend(IPAddress addr, std::string* result);
void toAppend(IPAddress addr, fbstring* result);

/**
 * Return true if two addresses are equal.
 *
 * @note This takes into consideration V4 mapped addresses as well. If one
 *       address is v4 mapped we compare the v4 addresses.
 *
 * @return true if the two addresses are equal.
 */
bool operator==(const IPAddress& addr1, const IPAddress& addr2);
// Return true if addr1 < addr2
bool operator<(const IPAddress& addr1, const IPAddress& addr2);
// Derived operators
inline bool operator!=(const IPAddress& a, const IPAddress& b) {
  return !(a == b);
}
inline bool operator>(const IPAddress& a, const IPAddress& b) {
  return b < a;
}
inline bool operator<=(const IPAddress& a, const IPAddress& b) {
  return !(a > b);
}
inline bool operator>=(const IPAddress& a, const IPAddress& b) {
  return !(a < b);
}

}  // folly

namespace std {
template<>
struct hash<folly::IPAddress> {
  size_t operator()(const folly::IPAddress& addr) const {
    return addr.hash();
  }
};
}  // std
