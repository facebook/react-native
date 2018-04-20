/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <exception>

#include <fabric/core/Sealable.h>
#include <gtest/gtest.h>

using namespace facebook::react;

TEST(SealableTest, sealObjectCorrectly) {
  Sealable obj;
  ASSERT_FALSE(obj.getSealed());

  obj.seal();
  ASSERT_TRUE(obj.getSealed());
}

TEST(SealableTest, handleAssignmentsCorrectly) {
  Sealable obj;
  Sealable other;
  EXPECT_NO_THROW(obj = other);

  // Assignment after getting sealed is not allowed.
  obj.seal();
  Sealable other2;
  EXPECT_THROW(obj = other2, std::runtime_error);

  // It doesn't matter if the other object is also sealed, it's still not allowed.
  other2.seal();
  EXPECT_THROW(obj = other2, std::runtime_error);

  // Fresh creation off other Sealable is still unsealed.
  Sealable other3(obj);
  ASSERT_FALSE(other3.getSealed());
}
