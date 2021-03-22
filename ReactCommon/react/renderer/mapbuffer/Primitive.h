/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <glog/logging.h>

// TODO: Enable CHECK_CONSISTENCY only in debug mode or test environments (or
// just in demand)
#define CHECK_CONSISTENCY 1

constexpr static int NULL_VALUE = 0;

// Value used to verify if the data is serialized with LittleEndian order
constexpr static int ALIGNMENT = 0xFE;

using Key = uint16_t;

using Byte = uint8_t;

namespace facebook {
namespace react {

struct Header {
  uint16_t alignment; // alignment of serialization
  uint16_t count; // amount of items
  uint16_t bufferSize; // Size of buffer that contains Strings and Objects
};

constexpr static int KEY_SIZE = sizeof(Key);
constexpr static int HEADER_SIZE = sizeof(Header);
constexpr static int INT_SIZE = sizeof(int);
constexpr static int DOUBLE_SIZE = sizeof(double);
constexpr static int UINT8_SIZE = sizeof(uint8_t);
constexpr static int UINT16_SIZE = sizeof(uint16_t);
constexpr static int UINT64_SIZE = sizeof(uint64_t);

// 10 bytes : 2 key + 8 value
constexpr static int BUCKET_SIZE = KEY_SIZE + UINT64_SIZE;

/**
 * Returns the offset of the key received by parameter.
 */
inline int getKeyOffset(Key key) {
  return HEADER_SIZE + BUCKET_SIZE * key;
}

/**
 * Returns the offset of the value associated to the key received by parameter.
 */
inline int getValueOffset(Key key) {
  return getKeyOffset(key) + KEY_SIZE;
}

inline void
checkKeyConsistency(const Header &header, const uint8_t *data, Key key) {
#ifdef CHECK_CONSISTENCY
  if (key >= header.count) {
    LOG(ERROR) << "Error: Key is higher than size of Map - key '" << key
               << "' - size: '" << header.count << "'";
    exit(1);
  }

  Key storedKey = 0;
  memcpy(
      reinterpret_cast<Key *>(&storedKey),
      reinterpret_cast<const Key *>(data + getKeyOffset(key)),
      KEY_SIZE);

  if (storedKey != key) {
    LOG(ERROR) << "Error while reading key, expecting '" << key << "' found: '"
               << storedKey << "'";
    exit(1);
  }
#endif
}

} // namespace react
} // namespace facebook
