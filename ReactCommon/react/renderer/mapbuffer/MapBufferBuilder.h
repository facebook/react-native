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
 public:
  MapBufferBuilder(uint32_t initialSize = INITIAL_BUCKETS_SIZE);

  static MapBuffer EMPTY();

  void putInt(Key key, int32_t value);

  void putBool(Key key, bool value);

  void putDouble(Key key, double value);

  void putNull(Key key);

  void putString(Key key, std::string const &value);

  void putMapBuffer(Key key, MapBuffer const &map);

  MapBuffer build();

 private:
  Header header_ = {ALIGNMENT, 0, 0};

  std::vector<Bucket> buckets_{};

  std::vector<Byte> dynamicData_{};

  uint16_t lastKey_{0};

  bool needsSort_{false};

  void storeKeyValue(Key key, uint8_t const *value, uint32_t valueSize);
};

} // namespace react
} // namespace facebook
