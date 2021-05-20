/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "MapBuffer.h"

using namespace facebook::react;

namespace facebook {
namespace react {

// TODO T83483191: Extend MapBuffer C++ implementation to support basic random
// access
MapBuffer::MapBuffer(uint8_t *const data, int32_t dataSize) {
  react_native_assert(
      (data != nullptr) && "Error trying to build an invalid MapBuffer");

  // Should we move the memory here or document it?
  data_ = data;

  count_ = 0;
  memcpy(
      reinterpret_cast<uint8_t *>(&count_),
      reinterpret_cast<const uint8_t *>(data_ + HEADER_COUNT_OFFSET),
      UINT16_SIZE);

  // TODO T83483191: extract memcpy calls into an inline function to simplify
  // the code
  dataSize_ = 0;
  memcpy(
      reinterpret_cast<uint8_t *>(&dataSize_),
      reinterpret_cast<const uint8_t *>(data_ + HEADER_BUFFER_SIZE_OFFSET),
      INT_SIZE);

  if (dataSize != dataSize_) {
    LOG(ERROR) << "Error: Data size does not match, expected " << dataSize
               << " found: " << dataSize_;
    abort();
  }
}

int32_t MapBuffer::getInt(Key key) const {
  int32_t value = 0;
  memcpy(
      reinterpret_cast<uint8_t *>(&value),
      reinterpret_cast<const uint8_t *>(data_ + getValueOffset(key)),
      INT_SIZE);
  return value;
}

bool MapBuffer::getBool(Key key) const {
  return getInt(key) != 0;
}

double MapBuffer::getDouble(Key key) const {
  // TODO T83483191: extract this code into a "template method" and reuse it for
  // other types
  double value = 0;
  memcpy(
      reinterpret_cast<uint8_t *>(&value),
      reinterpret_cast<const uint8_t *>(data_ + getValueOffset(key)),
      DOUBLE_SIZE);
  return value;
}

int32_t MapBuffer::getDynamicDataOffset() const {
  // The begininig of dynamic data can be calculated as the offset of the next
  // key in the map
  return getKeyOffset(count_);
}

std::string MapBuffer::getString(Key key) const {
  // TODO T83483191:Add checks to verify that offsets are under the boundaries
  // of the map buffer
  int32_t dynamicDataOffset = getDynamicDataOffset();
  int32_t stringLength = 0;
  int32_t offset = getInt(key);
  memcpy(
      reinterpret_cast<uint8_t *>(&stringLength),
      reinterpret_cast<const uint8_t *>(data_ + dynamicDataOffset + offset),
      INT_SIZE);

  char *value = new char[stringLength];

  memcpy(
      reinterpret_cast<char *>(value),
      reinterpret_cast<const char *>(
          data_ + dynamicDataOffset + offset + INT_SIZE),
      stringLength);

  return std::string(value, 0, stringLength);
}

MapBuffer MapBuffer::getMapBuffer(Key key) const {
  // TODO T83483191: Add checks to verify that offsets are under the boundaries
  // of the map buffer
  int32_t dynamicDataOffset = getDynamicDataOffset();

  int32_t mapBufferLength = 0;
  int32_t offset = getInt(key);
  memcpy(
      reinterpret_cast<uint8_t *>(&mapBufferLength),
      reinterpret_cast<const uint8_t *>(data_ + dynamicDataOffset + offset),
      INT_SIZE);

  uint8_t *value = new Byte[mapBufferLength];

  memcpy(
      reinterpret_cast<uint8_t *>(value),
      reinterpret_cast<const uint8_t *>(
          data_ + dynamicDataOffset + offset + INT_SIZE),
      mapBufferLength);

  return MapBuffer(value, mapBufferLength);
}

bool MapBuffer::isNull(Key key) const {
  return getInt(key) == NULL_VALUE;
}

int32_t MapBuffer::getBufferSize() const {
  return dataSize_;
}

void MapBuffer::copy(uint8_t *output) const {
  memcpy(output, data_, dataSize_);
}

uint16_t MapBuffer::getCount() const {
  uint16_t size = 0;

  memcpy(
      reinterpret_cast<uint16_t *>(&size),
      reinterpret_cast<const uint16_t *>(data_ + HEADER_COUNT_OFFSET),

      UINT16_SIZE);

  return size;
}

MapBuffer::~MapBuffer() {
  delete[] data_;
}

} // namespace react
} // namespace facebook
