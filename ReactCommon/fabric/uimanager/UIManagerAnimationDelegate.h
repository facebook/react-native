/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/componentregistry/ComponentDescriptorFactory.h>
#include <react/core/EventTarget.h>
#include <react/core/RawValue.h>

namespace facebook {
namespace react {

class UIManagerAnimationDelegate {
 public:
  virtual ~UIManagerAnimationDelegate(){};

  /*
   * Configure a LayoutAnimation.
   * TODO: need SurfaceId here
   */
  virtual void uiManagerDidConfigureNextLayoutAnimation(
      RawValue const &config,
      SharedEventTarget successCallback,
      SharedEventTarget errorCallback) const = 0;

  /**
   * Set ComponentDescriptor registry.
   *
   * @param componentDescriptorRegistry
   */
  virtual void setComponentDescriptorRegistry(
      const SharedComponentDescriptorRegistry &componentDescriptorRegistry) = 0;

  /**
   * Only needed on Android to drive animations.
   */
  virtual bool shouldAnimateFrame() const = 0;
};

} // namespace react
} // namespace facebook
