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

MapBuffer::MapBuffer(uint16_t initialSize) {
  _dataSize = initialSize;
  _data = new Byte[_dataSize];
  // TODO: Should we clean up memory here?
}

void MapBuffer::makeSpace() {
  int oldDataSize = _dataSize;
  if (_dataSize >= std::numeric_limits<uint16_t>::max() / 2) {
    LOG(ERROR)
        << "Error: trying to assign a value beyond the capacity of uint16_t"
        << static_cast<uint32_t>(_dataSize) * 2;
    throw "Error: trying to assign a value beyond the capacity of uint16_t" +
        std::to_string(static_cast<uint32_t>(_dataSize) * 2);
  }
  _dataSize *= 2;
  uint8_t *_newdata = new Byte[_dataSize];
  uint8_t *_oldData = _data;
  memcpy(_newdata, _data, oldDataSize);
  _data = _newdata;
  delete[] _oldData;
}

void MapBuffer::putBytes(Key key, uint8_t *value, int valueSize) {
  if (key != _header.count) {
    LOG(ERROR)
        << "Error: key out of order (for now keys should we stored contiguous) "
        << key;
    throw "Error: key out of order (for now keys should we stored contiguous) - key: " +
        std::to_string(key);
  }

  int valueOffset = getValueOffset(key);
  if (valueOffset + valueSize > _dataSize) {
    makeSpace();
  }

  memcpy(_data + getKeyOffset(key), &key, KEY_SIZE);
  memcpy(_data + valueOffset, value, valueSize);
  _header.count++;
}

void MapBuffer::putBool(Key key, bool value) {
  putInt(key, (int)value);
}

void MapBuffer::putDouble(Key key, double value) {
  uint8_t *bytePointer = reinterpret_cast<uint8_t *>(&value);
  putBytes(key, bytePointer, DOUBLE_SIZE);
}

void MapBuffer::putNull(Key key) {
  putInt(key, NULL_VALUE);
}

void MapBuffer::putInt(Key key, int value) {
  uint8_t *bytePointer = reinterpret_cast<uint8_t *>(&(value));
  putBytes(key, bytePointer, INT_SIZE);
}

void MapBuffer::finish() {
  // Copy header at the beginning of "_data"
  memcpy(_data, &_header, HEADER_SIZE);
  // TODO: create a MapBufferBuilder instead of calling the finish method.
}

// TODO: All the "getXXX" methods are currently operating on a "finished" map.
// Next step: create a MapBufferBuilder, move "putXXX" methods into the
// MapBufferBuilder, make MapBuffer class immutable.
int MapBuffer::getInt(Key key) {
  checkKeyConsistency(_header, _data, key);

  int value = 0;
  memcpy(
      reinterpret_cast<uint8_t *>(&value),
      reinterpret_cast<const uint8_t *>(_data + getValueOffset(key)),
      INT_SIZE);
  return value;
}

bool MapBuffer::getBool(Key key) {
  return getInt(key) != 0;
}

double MapBuffer::getDouble(Key key) {
  checkKeyConsistency(_header, _data, key);

  // TODO: extract this code into a "template method" and reuse it for other
  // types
  double value = 0;
  memcpy(
      reinterpret_cast<uint8_t *>(&value),
      reinterpret_cast<const uint8_t *>(_data + getValueOffset(key)),
      DOUBLE_SIZE);
  return value;
}

bool MapBuffer::isNull(Key key) {
  return getInt(key) == NULL_VALUE;
}

uint16_t MapBuffer::getBufferSize() {
  return _dataSize;
}

void MapBuffer::copy(uint8_t *output) {
  memcpy(output, _data, _dataSize);
}

uint16_t MapBuffer::getSize() {
  uint16_t size = 0;
  memcpy(
      reinterpret_cast<uint16_t *>(&size),
      reinterpret_cast<const uint16_t *>(
          _data + UINT16_SIZE), // TODO refactor this: + UINT16_SIZE describes
                                // the position in the header
      UINT16_SIZE);
  return size;
}

MapBuffer::~MapBuffer() {
  delete[] _data;
}

} // namespace react
} // namespace facebook
