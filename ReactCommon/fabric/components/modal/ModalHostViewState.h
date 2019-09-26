/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/core/StateData.h>
#include <react/graphics/Float.h>
#include <react/graphics/Geometry.h>
#include <react/graphics/conversions.h>

namespace facebook {
namespace react {

/*
 * State for <BottomSheetView> component.
 */
class ModalHostViewState : public StateData {
 public:
  using Shared = std::shared_ptr<const ModalHostViewState>;

  ModalHostViewState(){};
  ModalHostViewState(Size screenSize_) : screenSize(screenSize_){};
  virtual ~ModalHostViewState() = default;

#ifdef ANDROID
  ModalHostViewState(folly::dynamic data)
      : screenSize(Size{(Float)data["screenWidth"].getDouble(),
                        (Float)data["screenHeight"].getDouble()}){};
#endif

  const Size screenSize{};

#ifdef ANDROID
  virtual const folly::dynamic getDynamic() const override;
#endif

#pragma mark - Getters
};

} // namespace react
} // namespace facebook
