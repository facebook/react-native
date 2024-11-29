/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/graphics/Float.h>

#ifdef ANDROID
#include <folly/dynamic.h>
#endif

#if defined(__APPLE__) && TARGET_OS_IOS
#include "ModalHostViewUtils.h"
#endif

namespace facebook::react {

/*
 * State for <ModalHostView> component.
 */
class ModalHostViewState final {
 public:
  using Shared = std::shared_ptr<const ModalHostViewState>;

#if defined(__APPLE__) && TARGET_OS_IOS
  ModalHostViewState() : screenSize(RCTModalHostViewScreenSize()) {
#else
  ModalHostViewState(){
#endif
  };
  ModalHostViewState(Size screenSize_) : screenSize(screenSize_){};

#ifdef ANDROID
  ModalHostViewState(
      const ModalHostViewState& previousState,
      folly::dynamic data)
      : screenSize(Size{
            (Float)data["screenWidth"].getDouble(),
            (Float)data["screenHeight"].getDouble()}){};
#endif

  const Size screenSize{};

#ifdef ANDROID
  folly::dynamic getDynamic() const;
#endif

#pragma mark - Getters
};

} // namespace facebook::react
