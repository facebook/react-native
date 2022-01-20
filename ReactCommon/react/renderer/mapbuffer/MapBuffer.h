/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/debug/react_native_assert.h>
#include <react/renderer/mapbuffer/primitives.h>

#include <limits>

namespace facebook {
namespace react {

class ReadableMapBuffer;

/**
 * MapBuffer is an optimized sparse array format for transferring props-like
 * between C++ and other VMs. The implementation of this map is optimized to:
 * - be compact to optimize space when sparse (sparse is the common case).
 * - be accessible through JNI with zero/minimal copying via ByteBuffer.
 * - Have excellent C++ single-write and many-read performance by maximizing
 *   CPU cache performance through compactness, data locality, and fixed offsets
 *   where possible.
 * - be optimized for iteration and intersection against other maps, but with
 *   reasonably good random access as well.
 * - Work recursively for nested maps/arrays.
 * - Supports dynamic types that map to JSON.
 * - Don't require mutability - single-write on creation.
 * - have minimal APK size and build time impact.
 */
class MapBuffer {
 public:
  /**
   * Data types available for serialization in MapBuffer
   * Keep in sync with `DataType` enum in `ReadableMapBuffer.java`, which
   * expects the same values after reading them through JNI.
   */
  enum DataType : uint16_t {
    Boolean = 0,
    Int = 1,
    Double = 2,
    String = 3,
    Map = 4,
  };

  explicit MapBuffer(std::vector<uint8_t> data);

  MapBuffer(MapBuffer const &buffer) = delete;

  MapBuffer &operator=(MapBuffer other) = delete;

  MapBuffer(MapBuffer &&buffer) = default;

  int32_t getInt(Key key) const;

  bool getBool(Key key) const;

  double getDouble(Key key) const;

  std::string getString(Key key) const;

  // TODO T83483191: review this declaration
  MapBuffer getMapBuffer(Key key) const;

  uint32_t size() const;

  uint8_t const *data() const;

  uint16_t count() const;

 private:
  // Buffer and its size
  std::vector<uint8_t> const bytes_;

  // amount of items in the MapBuffer
  uint16_t count_ = 0;

  // returns the relative offset of the first byte of dynamic data
  int32_t getDynamicDataOffset() const;

  uint32_t getKeyBucket(Key key) const;

  friend ReadableMapBuffer;
};

} // namespace react
} // namespace facebook
