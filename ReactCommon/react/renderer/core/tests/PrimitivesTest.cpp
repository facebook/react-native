/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <exception>

#include <gtest/gtest.h>
#include <react/renderer/core/Sealable.h>

using namespace facebook::react;

TEST(SealableTest, sealObjectCorrectly) {
  Sealable obj;
  EXPECT_FALSE(obj.getSealed());

  obj.seal();
  EXPECT_TRUE(obj.getSealed());
}

TEST(SealableTest, handleAssignmentsCorrectly) {
  Sealable obj;
  Sealable other;

  // Should work fine.
  obj = other;

  // Assignment after getting sealed is not allowed.
  obj.seal();
  Sealable other2;

  EXPECT_DEATH_IF_SUPPORTED(
      { obj = other2; }, "Attempt to mutate a sealed object.");

  // It doesn't matter if the other object is also sealed, it's still not
  // allowed.
  other2.seal();
  EXPECT_DEATH_IF_SUPPORTED(
      { obj = other2; }, "Attempt to mutate a sealed object.");

  // Fresh creation off other Sealable is still unsealed.
  Sealable other3(obj);
  EXPECT_FALSE(other3.getSealed());
}
