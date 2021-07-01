/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "MapBufferBuilder.h"

using namespace facebook::react;

namespace facebook {
namespace react {

// TODO T83483191: Add asserts to check overflowing on additions
MapBufferBuilder::MapBufferBuilder()
    : MapBufferBuilder::MapBufferBuilder(INITIAL_KEY_VALUE_SIZE) {}

MapBuffer MapBufferBuilder::EMPTY() {
  static auto emptyMap = MapBufferBuilder().build();
  return emptyMap;
}

MapBufferBuilder::MapBufferBuilder(uint16_t initialSize) {
  keyValuesSize_ = initialSize;
  keyValues_ = new Byte[keyValuesSize_];
  // First Key should be written right after the header.
  keyValuesOffset_ = HEADER_SIZE;

  dynamicDataSize_ = 0;
  dynamicDataValues_ = nullptr;
  dynamicDataOffset_ = 0;
}

void MapBufferBuilder::ensureKeyValueSpace() {
  int32_t oldKeyValuesSize = keyValuesSize_;
  react_native_assert(
      (keyValuesSize_ < std::numeric_limits<uint16_t>::max() / 2) &&
      "Error trying to assign a value beyond the capacity of uint16_t: ");
  keyValuesSize_ *= 2;
  uint8_t *newKeyValues = new Byte[keyValuesSize_];
  uint8_t *oldKeyValues = keyValues_;
  memcpy(newKeyValues, keyValues_, oldKeyValuesSize);
  keyValues_ = newKeyValues;
  delete[] oldKeyValues;
}

void MapBufferBuilder::storeKeyValue(
    Key key,
    uint8_t *value,
    int32_t valueSize) {
  if (key < minKeyToStore_) {
    LOG(ERROR) << "Error: key out of order - key: " << key;
    abort();
  }
  if (valueSize > MAX_VALUE_SIZE) {
    LOG(ERROR) << "Error: size of value must be <= MAX_VALUE_SIZE. ValueSize: "
               << valueSize;
    abort();
  }

  // TODO T83483191: header.count points to the next index
  // TODO T83483191: add test to verify storage of sparse keys
  int32_t keyOffset = getKeyOffset(_header.count);
  int32_t valueOffset = keyOffset + KEY_SIZE;

  int32_t nextKeyValueOffset = keyOffset + BUCKET_SIZE;
  if (nextKeyValueOffset >= keyValuesSize_) {
    ensureKeyValueSpace();
  }

  memcpy(keyValues_ + keyOffset, &key, KEY_SIZE);
  memcpy(keyValues_ + valueOffset, value, valueSize);

  _header.count++;

  minKeyToStore_ = key + 1;
  // Move keyValuesOffset_ to the next available [key, value] position
  keyValuesOffset_ = std::max(nextKeyValueOffset, keyValuesOffset_);
}

void MapBufferBuilder::putBool(Key key, bool value) {
  putInt(key, (int)value);
}

void MapBufferBuilder::putDouble(Key key, double value) {
  uint8_t *bytePointer = reinterpret_cast<uint8_t *>(&value);
  storeKeyValue(key, bytePointer, DOUBLE_SIZE);
}

void MapBufferBuilder::putNull(Key key) {
  putInt(key, NULL_VALUE);
}

void MapBufferBuilder::putInt(Key key, int32_t value) {
  uint8_t *bytePointer = reinterpret_cast<uint8_t *>(&(value));
  storeKeyValue(key, bytePointer, INT_SIZE);
}

void MapBufferBuilder::ensureDynamicDataSpace(int32_t size) {
  if (dynamicDataValues_ == nullptr) {
    dynamicDataSize_ = size;
    dynamicDataValues_ = new Byte[dynamicDataSize_];
    dynamicDataOffset_ = 0;
    return;
  }

  if (dynamicDataOffset_ + size >= dynamicDataSize_) {
    int32_t oldDynamicDataSize = dynamicDataSize_;
    react_native_assert(
        (dynamicDataSize_ < std::numeric_limits<int32_t>::max() / 2) &&
        "Error: trying to assign a value beyond the capacity of int");
    dynamicDataSize_ *= dynamicDataSize_;

    react_native_assert(
        (dynamicDataSize_ < std::numeric_limits<int32_t>::max() - size) &&
        "Error: trying to assign a value beyond the capacity of int");

    // sum size to ensure that the size always fit into newDynamicDataValues
    dynamicDataSize_ += size;
    uint8_t *newDynamicDataValues = new Byte[dynamicDataSize_];
    uint8_t *oldDynamicDataValues = dynamicDataValues_;
    memcpy(newDynamicDataValues, dynamicDataValues_, oldDynamicDataSize);
    dynamicDataValues_ = newDynamicDataValues;
    delete[] oldDynamicDataValues;
  }
}

void MapBufferBuilder::putString(Key key, std::string value) {
  int32_t strLength = static_cast<int32_t>(value.length());
  const char *cstring = getCstring(&value);

  // format [lenght of string (int)] + [Array of Characters in the string]
  int32_t sizeOfLength = INT_SIZE;
  // TODO T83483191: review if map.getBufferSize() should be an int32_t or long
  // instead of an int16 (because strings can be longer than int16);

  int32_t sizeOfDynamicData = sizeOfLength + strLength;
  ensureDynamicDataSpace(sizeOfDynamicData);
  memcpy(dynamicDataValues_ + dynamicDataOffset_, &strLength, sizeOfLength);
  memcpy(
      dynamicDataValues_ + dynamicDataOffset_ + sizeOfLength,
      cstring,
      strLength);

  // Store Key and pointer to the string
  putInt(key, dynamicDataOffset_);

  dynamicDataOffset_ += sizeOfDynamicData;
}

void MapBufferBuilder::putMapBuffer(Key key, MapBuffer &map) {
  int32_t mapBufferSize = map.getBufferSize();

  // format [lenght of buffer (int)] + [bytes of MapBuffer]
  int32_t sizeOfDynamicData = mapBufferSize + INT_SIZE;

  // format [Array of bytes of the mapBuffer]
  ensureDynamicDataSpace(sizeOfDynamicData);

  memcpy(dynamicDataValues_ + dynamicDataOffset_, &mapBufferSize, INT_SIZE);
  // Copy the content of the map into dynamicDataValues_
  map.copy(dynamicDataValues_ + dynamicDataOffset_ + INT_SIZE);

  // Store Key and pointer to the string
  putInt(key, dynamicDataOffset_);

  dynamicDataOffset_ += sizeOfDynamicData;
}

MapBuffer MapBufferBuilder::build() {
  react_native_assert(
      (keyValues_ != nullptr) &&
      "Error when building mapbuffer with invalid datastructures.");

  // Create buffer: [header] + [key, values] + [dynamic data]
  int32_t bufferSize = keyValuesOffset_ + dynamicDataOffset_;

  _header.bufferSize = bufferSize;

  // Copy header at the beginning of "keyValues_"
  memcpy(keyValues_, &_header, HEADER_SIZE);

  uint8_t *buffer = new Byte[bufferSize];

  memcpy(buffer, keyValues_, keyValuesOffset_);

  if (dynamicDataValues_ != nullptr) {
    memcpy(buffer + keyValuesOffset_, dynamicDataValues_, dynamicDataOffset_);
  }

  // TODO T83483191: should we use std::move here?
  auto map = MapBuffer(buffer, bufferSize);

  // TODO T83483191: we should invalidate the class once the build() method is
  // called.

  if (keyValues_ != nullptr) {
    delete[] keyValues_;
  }
  keyValues_ = nullptr;
  keyValuesSize_ = 0;
  keyValuesOffset_ = 0;

  if (dynamicDataValues_ != nullptr) {
    delete[] dynamicDataValues_;
    dynamicDataValues_ = nullptr;
  }
  dynamicDataSize_ = 0;
  dynamicDataOffset_ = 0;
  _header = {ALIGNMENT, 0, 0};

  return map;
}

MapBufferBuilder::~MapBufferBuilder() {
  if (keyValues_ != nullptr) {
    delete[] keyValues_;
  }
  if (dynamicDataValues_ != nullptr) {
    delete[] dynamicDataValues_;
  }
}

} // namespace react
} // namespace facebook
