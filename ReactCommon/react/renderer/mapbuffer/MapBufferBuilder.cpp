/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "MapBufferBuilder.h"

using namespace facebook::react;

namespace facebook {
namespace react {

MapBuffer MapBufferBuilder::EMPTY() {
  return MapBufferBuilder().build();
}

MapBufferBuilder::MapBufferBuilder(uint32_t initialSize) {
  buckets_.reserve(initialSize);

  dynamicDataSize_ = 0;
  dynamicDataValues_ = nullptr;
  dynamicDataOffset_ = 0;
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

  uint64_t data = 0;
  auto *dataPtr = reinterpret_cast<uint8_t *>(&data);
  memcpy(dataPtr, value, valueSize);

  buckets_.emplace_back(key, data);

  _header.count++;

  minKeyToStore_ = key + 1;
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

void MapBufferBuilder::putString(Key key, std::string const &value) {
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

void MapBufferBuilder::putMapBuffer(Key key, MapBuffer const &map) {
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
  // Create buffer: [header] + [key, values] + [dynamic data]
  auto bucketSize = buckets_.size() * BUCKET_SIZE;
  int32_t bufferSize = HEADER_SIZE + bucketSize + dynamicDataOffset_;

  _header.bufferSize = bufferSize;

  std::vector<uint8_t> buffer(bufferSize);
  memcpy(buffer.data(), &_header, HEADER_SIZE);
  memcpy(buffer.data() + HEADER_SIZE, buckets_.data(), bucketSize);

  if (dynamicDataValues_ != nullptr) {
    memcpy(
        buffer.data() + HEADER_SIZE + bucketSize,
        dynamicDataValues_,
        dynamicDataOffset_);
  }

  return MapBuffer(std::move(buffer));
}

MapBufferBuilder::~MapBufferBuilder() {
  if (dynamicDataValues_ != nullptr) {
    delete[] dynamicDataValues_;
  }
}

} // namespace react
} // namespace facebook
