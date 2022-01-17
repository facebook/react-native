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

  void storeKeyValue(Key key, uint8_t const *value, uint32_t valueSize);

  std::vector<Bucket> buckets_{};

  std::vector<Byte> dynamicData_{};

  // Minimmum key to store in the MapBuffer (this is used to guarantee
  // consistency)
  uint16_t minKeyToStore_ = 0;

 public:
  MapBufferBuilder(uint32_t initialSize = INITIAL_BUCKETS_SIZE);

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
