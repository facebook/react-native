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

#include <folly/MacAddress.h>

#include <ostream>

#include <folly/Exception.h>
#include <folly/Format.h>
#include <folly/IPAddressV6.h>
#include <folly/String.h>

using std::invalid_argument;
using std::string;

namespace folly {

const MacAddress MacAddress::BROADCAST{Endian::big(uint64_t(0xffffffffffffU))};
const MacAddress MacAddress::ZERO;

MacAddress::MacAddress(StringPiece str) {
  memset(&bytes_, 0, 8);
  parse(str);
}

MacAddress MacAddress::createMulticast(IPAddressV6 v6addr) {
  // This method should only be used for multicast addresses.
  DCHECK(v6addr.isMulticast());

  uint8_t bytes[SIZE];
  bytes[0] = 0x33;
  bytes[1] = 0x33;
  memcpy(bytes + 2, v6addr.bytes() + 12, 4);
  return fromBinary(ByteRange(bytes, SIZE));
}

string MacAddress::toString() const {
  static const char hexValues[] = "0123456789abcdef";
  string result;
  result.resize(17);
  result[0] = hexValues[getByte(0) >> 4];
  result[1] = hexValues[getByte(0) & 0xf];
  result[2] = ':';
  result[3] = hexValues[getByte(1) >> 4];
  result[4] = hexValues[getByte(1) & 0xf];
  result[5] = ':';
  result[6] = hexValues[getByte(2) >> 4];
  result[7] = hexValues[getByte(2) & 0xf];
  result[8] = ':';
  result[9] = hexValues[getByte(3) >> 4];
  result[10] = hexValues[getByte(3) & 0xf];
  result[11] = ':';
  result[12] = hexValues[getByte(4) >> 4];
  result[13] = hexValues[getByte(4) & 0xf];
  result[14] = ':';
  result[15] = hexValues[getByte(5) >> 4];
  result[16] = hexValues[getByte(5) & 0xf];
  return result;
}

void MacAddress::parse(StringPiece str) {
  // Helper function to convert a single hex char into an integer
  auto isSeparatorChar = [](char c) { return c == ':' || c == '-'; };

  uint8_t parsed[SIZE];
  auto p = str.begin();
  for (unsigned int byteIndex = 0; byteIndex < SIZE; ++byteIndex) {
    if (p == str.end()) {
      throw invalid_argument(
          sformat("invalid MAC address '{}': not enough digits", str));
    }

    // Skip over ':' or '-' separators between bytes
    if (byteIndex != 0 && isSeparatorChar(*p)) {
      ++p;
      if (p == str.end()) {
        throw invalid_argument(
            sformat("invalid MAC address '{}': not enough digits", str));
      }
    }

    // Parse the upper nibble
    uint8_t upper = detail::hexTable[static_cast<uint8_t>(*p)];
    if (upper & 0x10) {
      throw invalid_argument(
          sformat("invalid MAC address '{}': contains non-hex digit", str));
    }
    ++p;

    // Parse the lower nibble
    uint8_t lower;
    if (p == str.end()) {
      lower = upper;
      upper = 0;
    } else {
      lower = detail::hexTable[static_cast<uint8_t>(*p)];
      if (lower & 0x10) {
        // Also accept ':', '-', or '\0', to handle the case where one
        // of the bytes was represented by just a single digit.
        if (isSeparatorChar(*p)) {
          lower = upper;
          upper = 0;
        } else {
          throw invalid_argument(
              sformat("invalid MAC address '{}': contains non-hex digit", str));
        }
      }
      ++p;
    }

    // Update parsed with the newly parsed byte
    parsed[byteIndex] = (upper << 4) | lower;
  }

  if (p != str.end()) {
    // String is too long to be a MAC address
    throw invalid_argument(
        sformat("invalid MAC address '{}': found trailing characters", str));
  }

  // Only update now that we have successfully parsed the entire
  // string.  This way we remain unchanged on error.
  setFromBinary(ByteRange(parsed, SIZE));
}

void MacAddress::setFromBinary(ByteRange value) {
  if (value.size() != SIZE) {
    throw invalid_argument(
        sformat("MAC address must be 6 bytes long, got ", value.size()));
  }
  memcpy(bytes_ + 2, value.begin(), SIZE);
}

std::ostream& operator<<(std::ostream& os, MacAddress address) {
  os << address.toString();
  return os;
}

} // namespace folly
