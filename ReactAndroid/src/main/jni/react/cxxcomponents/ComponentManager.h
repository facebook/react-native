/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxcomponents/Component.h>
#include <react/cxxcomponents/ComponentDeprecatedAPI.h>
#include <react/renderer/core/Props.h>

namespace facebook::react {

class ComponentManager {
 public:
  ComponentManager() {}

  virtual std::shared_ptr<ComponentDeprecatedAPI> createComponent(
      Tag tag,
      Props::Shared initialProps) = 0;

  virtual std::shared_ptr<Component> createComponent(Tag tag) = 0;

  virtual ~ComponentManager() = default;
};

} // namespace facebook::react
