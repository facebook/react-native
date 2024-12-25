/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <hermes/hermes.h>
#include <react/renderer/core/EventTarget.h>
#include <react/renderer/core/InstanceHandle.h>

using namespace facebook;
using namespace facebook::react;

TEST(EventTargetTests, getInstanceHandle) {
  auto runtime = facebook::hermes::makeHermesRuntime();
  auto object = jsi::Object(*runtime);
  auto instanceHandle = std::make_shared<InstanceHandle>(
      *runtime, jsi::Value(*runtime, object), 1);

  EXPECT_EQ(instanceHandle->getTag(), 1);

  auto eventTarget = EventTarget(std::move(instanceHandle), 41);

  EXPECT_EQ(eventTarget.getTag(), 1);

  EXPECT_EQ(eventTarget.getSurfaceId(), 41);

  EXPECT_TRUE(eventTarget.getInstanceHandle(*runtime).isNull());

  eventTarget.retain(*runtime);

  EXPECT_TRUE(eventTarget.getInstanceHandle(*runtime).isNull());

  eventTarget.setEnabled(true);

  eventTarget.retain(*runtime);

  EXPECT_FALSE(eventTarget.getInstanceHandle(*runtime).isNull());

  eventTarget.release(*runtime);

  EXPECT_TRUE(eventTarget.getInstanceHandle(*runtime).isNull());
}
