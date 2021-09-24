/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <glog/logging.h>

// TODO T83483191: Enable CHECK_CONSISTENCY only in debug mode or test
// environments (or just in demand) #define CHECK_CONSISTENCY 1

constexpr static int32_t NULL_VALUE = 0;

// Value used to verify if the data is serialized with LittleEndian order
constexpr static uint16_t ALIGNMENT = 0xFE;

using Key = uint16_t;

using Byte = uint8_t;

namespace facebook {
namespace react {

struct Header {
  uint16_t alignment; // alignment of serialization
  uint16_t count; // amount of items in the map
  int32_t bufferSize; // Amount of bytes used to store the map in memory
};

constexpr static int32_t KEY_SIZE = sizeof(Key);
constexpr static int32_t HEADER_SIZE = sizeof(Header);
constexpr static int32_t INT_SIZE = sizeof(int32_t);
constexpr static int32_t DOUBLE_SIZE = sizeof(double);
constexpr static int32_t UINT8_SIZE = sizeof(uint8_t);
constexpr static int32_t UINT16_SIZE = sizeof(uint16_t);
constexpr static int32_t UINT64_SIZE = sizeof(uint64_t);
constexpr static int32_t HEADER_ALIGNMENT_OFFSET = 0;
constexpr static int32_t HEADER_COUNT_OFFSET = UINT16_SIZE;
constexpr static int32_t HEADER_BUFFER_SIZE_OFFSET = UINT16_SIZE * 2;

constexpr static int32_t MAX_VALUE_SIZE = UINT64_SIZE;

// 10 bytes : 2 key + 8 value
constexpr static int32_t BUCKET_SIZE = KEY_SIZE + UINT64_SIZE;

/**
 * Returns the offset of the key received by parameter.
 */
inline int32_t getKeyOffset(Key key) {
  return HEADER_SIZE + BUCKET_SIZE * key;
}

/**
 * Returns the offset of the value associated to the key received by parameter.
 */
inline int32_t getValueOffset(Key key) {
  return getKeyOffset(key) + KEY_SIZE;
}

static inline const char *getCstring(const std::string *str) {
  return str ? str->c_str() : "";
}

inline void
checkKeyConsistency(const Header &header, const uint8_t *data, Key key) {
#ifdef CHECK_CONSISTENCY
  if (key >= header.count) {
    LOG(ERROR) << "Error: Key is higher than size of Map - key '" << key
               << "' - size: '" << header.count << "'";
    assert(false && "Error while reading key");
  }

  Key storedKey = 0;
  memcpy(
      reinterpret_cast<Key *>(&storedKey),
      reinterpret_cast<const Key *>(data + getKeyOffset(key)),
      KEY_SIZE);

  if (storedKey != key) {
    LOG(ERROR) << "Error while reading key, expecting '" << key << "' found: '"
               << storedKey << "'";
    assert(false && "Error while reading key");
  }
#endif
}

} // namespace react
} // namespace facebook
