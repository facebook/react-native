/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <assert.h>
#include <gtest/gtest.h>
#include <react/renderer/mapbuffer/MapBuffer.h>

using namespace facebook::react;

// Dummy test to create setup of tests
TEST(MapBufferTest, testMapCreation) {
  auto buffer = MapBuffer();
  assert(buffer.getSize() == 0);
}
