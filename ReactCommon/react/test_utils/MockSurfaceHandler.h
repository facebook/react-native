/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <gmock/gmock.h>

#include <react/renderer/scheduler/SurfaceHandler.h>

namespace facebook {
namespace react {

class MockSurfaceHandler : public SurfaceHandler {
 public:
  MockSurfaceHandler() : SurfaceHandler("moduleName", 0){};

  MOCK_QUALIFIED_METHOD1(setDisplayMode, const noexcept, void(DisplayMode));
};

} // namespace react
} // namespace facebook
