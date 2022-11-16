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

  virtual void updateFloatProp(const std::string &propName, float value) = 0;

  virtual ~Component() = default;

 protected:
  Tag tag_ = -1;
};

} // namespace facebook::react
