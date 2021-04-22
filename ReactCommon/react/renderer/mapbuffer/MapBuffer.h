/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/debug/react_native_assert.h>
#include <react/renderer/mapbuffer/primitives.h>

#include <stdlib.h>
#include <limits>

namespace facebook {
namespace react {

/**
 * MapBuffer is an optimized map format for transferring data like props between
 * C++ and other platforms The implementation of this map is optimized to:
 * - be compact to optimize space when sparse (sparse is the common case).
 * - be accessible through JNI with zero/minimal copying via ByteBuffer.
 * - be Have excellent C++ single-write and many-read performance by maximizing
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
 private:
  // Buffer and its size
  const uint8_t *data_ = nullptr;

  // amount of bytes in the MapBuffer
  int32_t dataSize_ = 0;

  // amount of items in the MapBuffer
  uint16_t count_ = 0;

  // returns the relative offset of the first byte of dynamic data
  int32_t getDynamicDataOffset() const;

 public:
  MapBuffer(uint8_t *const data, int32_t dataSize);

  ~MapBuffer();

  int32_t getInt(Key key) const;

  bool getBool(Key key) const;

  double getDouble(Key key) const;

  std::string getString(Key key) const;

  // TODO T83483191: review this declaration
  MapBuffer getMapBuffer(Key key) const;

  int32_t getBufferSize() const;

  // TODO T83483191: review parameters of copy method
  void copy(uint8_t *output) const;

  bool isNull(Key key) const;

  uint16_t getCount() const;
};

} // namespace react
} // namespace facebook
