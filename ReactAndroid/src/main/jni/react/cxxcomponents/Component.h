/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/Props.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <memory>
#include <string>

namespace facebook::react {

class Component {
 public:
  Component(Tag tag) : tag_(tag) {}

  virtual ~Component() = default;

  // Updates the prop with name and value received as a parameter in the
  // component
  virtual void updateFloatProp(const std::string &propName, float value) = 0;

  // Mounts the child component into the children index received as parameter
  virtual void mountChildComponent(
      std::shared_ptr<facebook::react::Component> component,
      int index) = 0;

  // Unmounts the child component from the index received as a parameter
  virtual void unmountChildComponent(int index) = 0;

  // Draw the component
  virtual void draw() = 0;

 protected:
  Tag tag_ = -1;
};

} // namespace facebook::react
