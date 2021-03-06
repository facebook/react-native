/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/mapbuffer/Primitives.h>

namespace facebook {
namespace react {

// 506 = 5 entries = 50*10 + 6 sizeof(header)
constexpr uint16_t INITIAL_SIZE = 506;

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
  Header _header = {ALIGNMENT, 0, 0};

  void makeSpace();

  void putBytes(Key key, uint8_t *value, int valueSize);

  // Buffer and its size
  uint8_t *_data;

  uint16_t _dataSize;

 public:
  MapBuffer() : MapBuffer(INITIAL_SIZE) {}

  MapBuffer(uint16_t initialSize);

  ~MapBuffer();

  void putInt(Key key, int value);

  void putBool(Key key, bool value);

  void putDouble(Key key, double value);

  void putNull(Key key);

  // TODO: create a MapBufferBuilder instead or add checks to verify
  // if it's ok to read and write the Map
  void finish();

  int getInt(Key key);

  bool getBool(Key key);

  double getDouble(Key key);

  uint16_t getBufferSize();

  // TODO: review parameters of copy method
  void copy(uint8_t *output);

  bool isNull(Key key);

  uint16_t getSize();
};

} // namespace react
} // namespace facebook
