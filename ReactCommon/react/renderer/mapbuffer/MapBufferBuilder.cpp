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
  return MapBufferBuilder(0).build();
}

MapBufferBuilder::MapBufferBuilder(uint32_t initialSize) {
  buckets_.reserve(initialSize);
}

void MapBufferBuilder::storeKeyValue(
    Key key,
    uint8_t const *value,
    uint32_t valueSize) {
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

  header_.count++;

  minKeyToStore_ = key + 1;
}

void MapBufferBuilder::putBool(Key key, bool value) {
  putInt(key, (int)value);
}

void MapBufferBuilder::putDouble(Key key, double value) {
  auto const *bytePointer = reinterpret_cast<uint8_t *>(&value);
  storeKeyValue(key, bytePointer, DOUBLE_SIZE);
}

void MapBufferBuilder::putNull(Key key) {
  putInt(key, NULL_VALUE);
}

void MapBufferBuilder::putInt(Key key, int32_t value) {
  auto const *bytePointer = reinterpret_cast<uint8_t *>(&(value));
  storeKeyValue(key, bytePointer, INT_SIZE);
}

void MapBufferBuilder::putString(Key key, std::string const &value) {
  int32_t strSize = value.size();
  const char *strData = value.data();

  auto offset = dynamicData_.size();
  // format [length of string (int)] + [Array of Characters in the string]
  // TODO T83483191: review if map.size() should be an int32_t or long
  // instead of an int16 (because strings can be longer than int16);
  dynamicData_.resize(offset + INT_SIZE + strSize, 0);
  memcpy(dynamicData_.data() + offset, &strSize, INT_SIZE);
  memcpy(dynamicData_.data() + offset + INT_SIZE, strData, strSize);

  // Store Key and pointer to the string
  putInt(key, offset);
}

void MapBufferBuilder::putMapBuffer(Key key, MapBuffer const &map) {
  int32_t mapBufferSize = map.size();

  auto offset = dynamicData_.size();

  // format [length of buffer (int)] + [bytes of MapBuffer]
  dynamicData_.resize(offset + INT_SIZE + mapBufferSize, 0);
  memcpy(dynamicData_.data() + offset, &mapBufferSize, INT_SIZE);
  // Copy the content of the map into dynamicData_
  memcpy(dynamicData_.data() + offset + INT_SIZE, map.data(), mapBufferSize);

  // Store Key and pointer to the string
  putInt(key, offset);
}

MapBuffer MapBufferBuilder::build() {
  // Create buffer: [header] + [key, values] + [dynamic data]
  auto bucketSize = buckets_.size() * BUCKET_SIZE;
  uint32_t bufferSize = HEADER_SIZE + bucketSize + dynamicData_.size();

  header_.bufferSize = bufferSize;

  std::vector<uint8_t> buffer(bufferSize);
  memcpy(buffer.data(), &header_, HEADER_SIZE);
  memcpy(buffer.data() + HEADER_SIZE, buckets_.data(), bucketSize);
  memcpy(
      buffer.data() + HEADER_SIZE + bucketSize,
      dynamicData_.data(),
      dynamicData_.size());

  return MapBuffer(std::move(buffer));
}

} // namespace react
} // namespace facebook
