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

MapBufferBuilder::MapBufferBuilder()
    : MapBufferBuilder::MapBufferBuilder(INITIAL_KEY_VALUE_SIZE) {}

MapBuffer MapBufferBuilder::EMPTY() {
  static auto emptyMap = MapBufferBuilder().build();
  return emptyMap;
}

MapBufferBuilder::MapBufferBuilder(uint16_t initialSize) {
  _keyValuesSize = initialSize;
  _keyValues = new Byte[_keyValuesSize];
  // First Key should be written right after the header.
  _keyValuesOffset = HEADER_SIZE;

  _dynamicDataSize = 0;
  _dynamicDataValues = nullptr;
  _dynamicDataOffset = 0;
}

void MapBufferBuilder::ensureKeyValueSpace() {
  int oldKeyValuesSize = _keyValuesSize;
  if (_keyValuesSize >= std::numeric_limits<uint16_t>::max() / 2) {
    LOG(ERROR)
        << "Error: trying to assign a value beyond the capacity of uint16_t"
        << static_cast<uint32_t>(_keyValuesSize) * 2;
    throw "Error: trying to assign a value beyond the capacity of uint16_t";
  }
  _keyValuesSize *= 2;
  uint8_t *newKeyValues = new Byte[_keyValuesSize];
  uint8_t *oldKeyValues = _keyValues;
  memcpy(newKeyValues, _keyValues, oldKeyValuesSize);
  _keyValues = newKeyValues;
  delete[] oldKeyValues;
}

void MapBufferBuilder::storeKeyValue(Key key, uint8_t *value, int valueSize) {
  if (key < _minKeyToStore) {
    LOG(ERROR) << "Error: key out of order - key: " << key;
    throw "Error: key out of order";
  }
  if (valueSize > MAX_VALUE_SIZE) {
    throw "Error: size of value must be <= MAX_VALUE_SIZE";
  }
  // TODO: header.count points to the next index
  // TODO: add test to verify storage of sparse keys
  int keyOffset = getKeyOffset(_header.count);
  int valueOffset = keyOffset + KEY_SIZE;

  int nextKeyValueOffset = keyOffset + BUCKET_SIZE;
  if (nextKeyValueOffset >= _keyValuesSize) {
    ensureKeyValueSpace();
  }

  memcpy(_keyValues + keyOffset, &key, KEY_SIZE);
  memcpy(_keyValues + valueOffset, value, valueSize);

  _header.count++;

  _minKeyToStore = key + 1;
  // Move _keyValuesOffset to the next available [key, value] position
  _keyValuesOffset = std::max(nextKeyValueOffset, _keyValuesOffset);
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

void MapBufferBuilder::putInt(Key key, int value) {
  uint8_t *bytePointer = reinterpret_cast<uint8_t *>(&(value));
  storeKeyValue(key, bytePointer, INT_SIZE);
}

void MapBufferBuilder::ensureDynamicDataSpace(int size) {
  if (_dynamicDataValues == nullptr) {
    _dynamicDataSize = std::max(INITIAL_DYNAMIC_DATA_SIZE, size);
    _dynamicDataValues = new Byte[_dynamicDataSize];
    _dynamicDataOffset = 0;
    return;
  }

  if (_dynamicDataOffset + size >= _dynamicDataSize) {
    int oldDynamicDataSize = _dynamicDataSize;
    if (_dynamicDataSize >= std::numeric_limits<uint16_t>::max() / 2) {
      LOG(ERROR)
          << "Error: trying to assign a value beyond the capacity of uint16_t"
          << static_cast<uint32_t>(_dynamicDataSize) * 2;
      throw "Error: trying to assign a value beyond the capacity of uint16_t";
    }
    _dynamicDataSize *= 2;
    uint8_t *newDynamicDataValues = new Byte[_dynamicDataSize];
    uint8_t *oldDynamicDataValues = _dynamicDataValues;
    memcpy(newDynamicDataValues, _dynamicDataValues, oldDynamicDataSize);
    _dynamicDataValues = newDynamicDataValues;
    delete[] oldDynamicDataValues;
  }
}

void MapBufferBuilder::putString(Key key, std::string value) {
  int strLength = value.length();
  const char *cstring = getCstring(&value);

  // format [lenght of string (int)] + [Array of Characters in the string]
  int sizeOfLength = INT_SIZE;
  // TODO : review if map.getBufferSize() should be an int or long instead of an
  // int16 (because strings can be longer than int16);

  int sizeOfDynamicData = sizeOfLength + strLength;
  ensureDynamicDataSpace(sizeOfDynamicData);
  memcpy(_dynamicDataValues + _dynamicDataOffset, &strLength, sizeOfLength);
  memcpy(
      _dynamicDataValues + _dynamicDataOffset + sizeOfLength,
      cstring,
      strLength);

  // Store Key and pointer to the string
  putInt(key, _dynamicDataOffset);

  _dynamicDataOffset += sizeOfDynamicData;
}

void MapBufferBuilder::putMapBuffer(Key key, MapBuffer &map) {
  uint16_t mapBufferSize = map.getBufferSize();

  // format [lenght of buffer (short)] + [Array of Characters in the string]
  int sizeOfDynamicData = mapBufferSize + UINT16_SIZE;

  // format [Array of bytes of the mapBuffer]
  ensureDynamicDataSpace(sizeOfDynamicData);

  memcpy(_dynamicDataValues + _dynamicDataOffset, &mapBufferSize, UINT16_SIZE);
  // Copy the content of the map into _dynamicDataValues
  map.copy(_dynamicDataValues + _dynamicDataOffset + UINT16_SIZE);

  // Store Key and pointer to the string
  putInt(key, _dynamicDataOffset);

  _dynamicDataOffset += sizeOfDynamicData;
}

MapBuffer MapBufferBuilder::build() {
  // Create buffer: [header] + [key, values] + [dynamic data]
  int bufferSize = _keyValuesOffset + _dynamicDataOffset;

  _header.bufferSize = bufferSize;

  // Copy header at the beginning of "_keyValues"
  memcpy(_keyValues, &_header, HEADER_SIZE);

  uint8_t *buffer = new Byte[bufferSize];

  memcpy(buffer, _keyValues, _keyValuesOffset);

  if (_dynamicDataValues != nullptr) {
    memcpy(buffer + _keyValuesOffset, _dynamicDataValues, _dynamicDataOffset);
  }

  // TODO: should we use std::move here?
  auto map = MapBuffer(buffer, bufferSize);

  // TODO: we should invalidate the class once the build() method is
  // called.

  // Reset internal data
  delete[] _keyValues;
  _keyValues = nullptr;
  _keyValuesSize = 0;
  _keyValuesOffset = 0;

  if (_dynamicDataValues != nullptr) {
    delete[] _dynamicDataValues;
    _dynamicDataValues = nullptr;
  }
  _dynamicDataSize = 0;
  _dynamicDataOffset = 0;

  return map;
}

MapBufferBuilder::~MapBufferBuilder() {
  if (_keyValues != nullptr) {
    delete[] _keyValues;
  }
  if (_dynamicDataValues != nullptr) {
    delete[] _dynamicDataValues;
  }
}

} // namespace react
} // namespace facebook
