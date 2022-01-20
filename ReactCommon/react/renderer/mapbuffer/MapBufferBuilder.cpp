/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "MapBufferBuilder.h"
#include <algorithm>

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
    MapBuffer::DataType type,
    Byte const *value,
    uint32_t valueSize) {
  if (valueSize > MAX_VALUE_SIZE) {
    LOG(ERROR) << "Error: size of value must be <= MAX_VALUE_SIZE. ValueSize: "
               << valueSize;
    abort();
  }

  uint64_t data = 0;
  auto *dataPtr = reinterpret_cast<uint8_t *>(&data);
  memcpy(dataPtr, value, valueSize);

  buckets_.emplace_back(key, static_cast<uint16_t>(type), data);

  header_.count++;

  if (lastKey_ > key) {
    needsSort_ = true;
  }
  lastKey_ = key;
}

void MapBufferBuilder::putBool(Key key, bool value) {
  int intValue = (int)value;
  storeKeyValue(
      key,
      MapBuffer::DataType::Boolean,
      reinterpret_cast<uint8_t const *>(&intValue),
      INT_SIZE);
}

void MapBufferBuilder::putDouble(Key key, double value) {
  storeKeyValue(
      key,
      MapBuffer::DataType::Double,
      reinterpret_cast<uint8_t const *>(&value),
      DOUBLE_SIZE);
}

void MapBufferBuilder::putInt(Key key, int32_t value) {
  storeKeyValue(
      key,
      MapBuffer::DataType::Int,
      reinterpret_cast<uint8_t const *>(&value),
      INT_SIZE);
}

void MapBufferBuilder::putString(Key key, std::string const &value) {
  int32_t strSize = value.size();
  const char *strData = value.data();

  // format [length of string (int)] + [Array of Characters in the string]
  auto offset = dynamicData_.size();
  dynamicData_.resize(offset + INT_SIZE + strSize, 0);
  memcpy(dynamicData_.data() + offset, &strSize, INT_SIZE);
  memcpy(dynamicData_.data() + offset + INT_SIZE, strData, strSize);

  // Store Key and pointer to the string
  storeKeyValue(
      key,
      MapBuffer::DataType::String,
      reinterpret_cast<uint8_t const *>(&offset),
      INT_SIZE);
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
  storeKeyValue(
      key,
      MapBuffer::DataType::Map,
      reinterpret_cast<uint8_t const *>(&offset),
      INT_SIZE);
}

static inline bool compareBuckets(Bucket const &a, Bucket const &b) {
  return a.key < b.key;
}

MapBuffer MapBufferBuilder::build() {
  // Create buffer: [header] + [key, values] + [dynamic data]
  auto bucketSize = buckets_.size() * BUCKET_SIZE;
  uint32_t bufferSize = HEADER_SIZE + bucketSize + dynamicData_.size();

  header_.bufferSize = bufferSize;

  if (needsSort_) {
    std::sort(buckets_.begin(), buckets_.end(), compareBuckets);
  }

  // TODO(T83483191): add pass to check for duplicates

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
