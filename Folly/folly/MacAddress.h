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

#pragma once

#include <iosfwd>

#include <folly/Range.h>
#include <folly/lang/Bits.h>

namespace folly {

class IPAddressV6;

/*
 * MacAddress represents an IEEE 802 MAC address.
 */
class MacAddress {
 public:
  static constexpr size_t SIZE = 6;
  static const MacAddress BROADCAST;
  static const MacAddress ZERO;

  /*
   * Construct a zero-initialized MacAddress.
   */
  MacAddress() {
    memset(&bytes_, 0, 8);
  }

  /*
   * Parse a MacAddress from a human-readable string.
   * The string must contain 6 one- or two-digit hexadecimal
   * numbers, separated by dashes or colons.
   * Examples: 00:02:C9:C8:F9:68 or 0-2-c9-c8-f9-68
   */
  explicit MacAddress(StringPiece str);

  /*
   * Construct a MAC address from its 6-byte binary value
   */
  static MacAddress fromBinary(ByteRange value) {
    MacAddress ret;
    ret.setFromBinary(value);
    return ret;
  }

  /*
   * Construct a MacAddress from a uint64_t in network byte order.
   *
   * The first two bytes are ignored, and the MAC address is taken from the
   * latter 6 bytes.
   *
   * This is a static method rather than a constructor to avoid confusion
   * between host and network byte order constructors.
   */
  static MacAddress fromNBO(uint64_t value) {
    return MacAddress(value);
  }

  /*
   * Construct a MacAddress from a uint64_t in host byte order.
   *
   * The most significant two bytes are ignored, and the MAC address is taken
   * from the least significant 6 bytes.
   *
   * This is a static method rather than a constructor to avoid confusion
   * between host and network byte order constructors.
   */
  static MacAddress fromHBO(uint64_t value) {
    return MacAddress(Endian::big(value));
  }

  /*
   * Construct the multicast MacAddress for the specified multicast IPv6
   * address.
   */
  static MacAddress createMulticast(IPAddressV6 addr);

  /*
   * Get a pointer to the MAC address' binary value.
   *
   * The returned value points to internal storage inside the MacAddress
   * object.  It is only valid as long as the MacAddress, and its contents may
   * change if the MacAddress is updated.
   */
  const uint8_t* bytes() const {
    return bytes_ + 2;
  }

  /*
   * Return the address as a uint64_t, in network byte order.
   *
   * The first two bytes will be 0, and the subsequent 6 bytes will contain
   * the address in network byte order.
   */
  uint64_t u64NBO() const {
    return packedBytes();
  }

  /*
   * Return the address as a uint64_t, in host byte order.
   *
   * The two most significant bytes will be 0, and the remaining 6 bytes will
   * contain the address.  The most significant of these 6 bytes will contain
   * the first byte that appear on the wire, and the least significant byte
   * will contain the last byte.
   */
  uint64_t u64HBO() const {
    // Endian::big() does what we want here, even though we are converting
    // from big-endian to host byte order.  This swaps if and only if
    // the host byte order is little endian.
    return Endian::big(packedBytes());
  }

  /*
   * Return a human-readable representation of the MAC address.
   */
  std::string toString() const;

  /*
   * Update the current MacAddress object from a human-readable string.
   */
  void parse(StringPiece str);

  /*
   * Update the current MacAddress object from a 6-byte binary representation.
   */
  void setFromBinary(ByteRange value);

  bool isBroadcast() const {
    return *this == BROADCAST;
  }
  bool isMulticast() const {
    return getByte(0) & 0x1;
  }
  bool isUnicast() const {
    return !isMulticast();
  }

  /*
   * Return true if this MAC address is locally administered.
   *
   * Locally administered addresses are assigned by the local network
   * administrator, and are not guaranteed to be globally unique.  (It is
   * similar to IPv4's private address space.)
   *
   * Note that isLocallyAdministered() will return true for the broadcast
   * address, since it has the locally administered bit set.
   */
  bool isLocallyAdministered() const {
    return getByte(0) & 0x2;
  }

  // Comparison operators.

  bool operator==(const MacAddress& other) const {
    // All constructors and modifying methods make sure padding is 0,
    // so we don't need to mask these bytes out when comparing here.
    return packedBytes() == other.packedBytes();
  }

  bool operator<(const MacAddress& other) const {
    return u64HBO() < other.u64HBO();
  }

  bool operator!=(const MacAddress& other) const {
    return !(*this == other);
  }

  bool operator>(const MacAddress& other) const {
    return other < *this;
  }

  bool operator>=(const MacAddress& other) const {
    return !(*this < other);
  }

  bool operator<=(const MacAddress& other) const {
    return !(*this > other);
  }

 private:
  explicit MacAddress(uint64_t valueNBO) {
    memcpy(&bytes_, &valueNBO, 8);
    // Set the pad bytes to 0.
    // This allows us to easily compare two MacAddresses,
    // without having to worry about differences in the padding.
    bytes_[0] = 0;
    bytes_[1] = 0;
  }

  /* We store the 6 bytes starting at bytes_[2] (most significant)
     through bytes_[7] (least).
     bytes_[0] and bytes_[1] are always equal to 0 to simplify comparisons.
  */
  unsigned char bytes_[8];

  inline uint64_t getByte(size_t index) const {
    return bytes_[index + 2];
  }

  uint64_t packedBytes() const {
    uint64_t u64;
    memcpy(&u64, bytes_, 8);
    return u64;
  }
};

/* Define toAppend() so to<string> will work */
template <class Tgt>
typename std::enable_if<IsSomeString<Tgt>::value>::type toAppend(
    MacAddress address,
    Tgt* result) {
  toAppend(address.toString(), result);
}

std::ostream& operator<<(std::ostream& os, MacAddress address);

} // namespace folly

namespace std {

// Provide an implementation for std::hash<MacAddress>
template <>
struct hash<folly::MacAddress> {
  size_t operator()(const folly::MacAddress& address) const {
    return std::hash<uint64_t>()(address.u64HBO());
  }
};

} // namespace std
