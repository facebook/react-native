/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/debug/react_native_assert.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/primitives.h>
#include <stdlib.h>

namespace facebook {
namespace react {

// Default initial size for _keyValues array
// 108 = 10 entries = 10*10 + 8 sizeof(header)
constexpr uint16_t INITIAL_KEY_VALUE_SIZE = 108;

// Default initial size for _dynamicDataValues array
constexpr int32_t INITIAL_DYNAMIC_DATA_SIZE = 200;

/**
 * MapBufferBuilder is a builder class for MapBuffer
 */
class MapBufferBuilder {
 private:
  Header _header = {ALIGNMENT, 0, 0};

  void ensureKeyValueSpace();

  void ensureDynamicDataSpace(int32_t size);

  void storeKeyValue(Key key, uint8_t *value, int32_t valueSize);

  // Array of [key,value] map entries:
  // - Key is represented in 2 bytes
  // - Value is stored into 8 bytes. The 8 bytes of the value will contain the
  // actual value for the key or a pointer to the actual value (based on the
  // type)
  uint8_t *keyValues_ = nullptr;

  // Amount of bytes allocated on _keyValues
  uint16_t keyValuesSize_ = 0;

  // Relative offset on the _keyValues array.
  // This represents the first byte that can be written in _keyValues array
  int32_t keyValuesOffset_ = 0;

  // This array contains data for dynamic values in the MapBuffer.
  // A dynamic value is a String or another MapBuffer.
  uint8_t *dynamicDataValues_ = nullptr;

  // Amount of bytes allocated on _dynamicDataValues
  int32_t dynamicDataSize_ = 0;

  // Relative offset on the _dynamicDataValues array.
  // This represents the first byte that can be written in _dynamicDataValues
  // array
  int32_t dynamicDataOffset_ = 0;

  // Minimmum key to store in the MapBuffer (this is used to guarantee
  // consistency)
  uint16_t minKeyToStore_ = 0;

 public:
  MapBufferBuilder();

  MapBufferBuilder(uint16_t initialSize);

  ~MapBufferBuilder();

  static MapBuffer EMPTY();

  void putInt(Key key, int32_t value);

  void putBool(Key key, bool value);

  void putDouble(Key key, double value);

  void putNull(Key key);

  void putString(Key key, std::string value);

  void putMapBuffer(Key key, MapBuffer &map);

  // TODO T83483191: This should return MapBuffer!
  MapBuffer build();
};

} // namespace react
} // namespace facebook
