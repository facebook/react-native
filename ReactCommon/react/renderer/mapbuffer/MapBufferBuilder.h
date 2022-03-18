/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/debug/react_native_assert.h>
#include <react/renderer/mapbuffer/MapBuffer.h>

namespace facebook {
namespace react {

// Default reserved size for buckets_ vector
constexpr uint32_t INITIAL_BUCKETS_SIZE = 10;

/**
 * MapBufferBuilder is a builder class for MapBuffer
 */
class MapBufferBuilder {
 public:
  MapBufferBuilder(uint32_t initialSize = INITIAL_BUCKETS_SIZE);

  static MapBuffer EMPTY();

  void putInt(MapBuffer::Key key, int32_t value);

  void putBool(MapBuffer::Key key, bool value);

  void putDouble(MapBuffer::Key key, double value);

  void putString(MapBuffer::Key key, std::string const &value);

  void putMapBuffer(MapBuffer::Key key, MapBuffer const &map);

  MapBuffer build();

 private:
  MapBuffer::Header header_;

  std::vector<MapBuffer::Bucket> buckets_{};

  std::vector<uint8_t> dynamicData_{};

  uint16_t lastKey_{0};

  bool needsSort_{false};

  void storeKeyValue(
      MapBuffer::Key key,
      MapBuffer::DataType type,
      uint8_t const *value,
      uint32_t valueSize);
};

} // namespace react
} // namespace facebook
