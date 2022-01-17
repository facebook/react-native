/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/debug/react_native_assert.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/primitives.h>
#include <cstdlib>

namespace facebook {
namespace react {

// Default reserved size for buckets_ vector
constexpr uint16_t INITIAL_BUCKETS_SIZE = 10;

/**
 * MapBufferBuilder is a builder class for MapBuffer
 */
class MapBufferBuilder {
 private:
  Header _header = {ALIGNMENT, 0, 0};

  void ensureDynamicDataSpace(int32_t size);

  void storeKeyValue(Key key, uint8_t *value, int32_t valueSize);

  std::vector<Bucket> buckets_{};

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
  MapBufferBuilder(uint32_t initialSize = INITIAL_BUCKETS_SIZE);

  ~MapBufferBuilder();

  static MapBuffer EMPTY();

  void putInt(Key key, int32_t value);

  void putBool(Key key, bool value);

  void putDouble(Key key, double value);

  void putNull(Key key);

  void putString(Key key, std::string const &value);

  void putMapBuffer(Key key, MapBuffer const &map);

  // TODO T83483191: This should return MapBuffer!
  MapBuffer build();
};

} // namespace react
} // namespace facebook
