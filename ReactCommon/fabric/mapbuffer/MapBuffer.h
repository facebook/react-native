/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>

namespace facebook {
namespace react {

/**
 * MapBuffer is an optimized map format for transferring data like props between
 * C++ and other platforms The implemenation of this map is optimized to:
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
 public:
  MapBuffer();
  virtual ~MapBuffer();
};

} // namespace react
} // namespace facebook
