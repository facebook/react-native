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

class ComponentDeprecatedAPI {
 public:
  ComponentDeprecatedAPI(Tag tag, Props::Shared initialProps)
      : tag_(tag), props_(std::move(initialProps)) {}

  virtual ~ComponentDeprecatedAPI() = default;

  /*
   * Called for updating component's props.
   * Receiver must update native view props accordingly changed props.
   */
  virtual void updateProps(
      Props::Shared const &oldProps,
      Props::Shared const &newProps) = 0;

  /*
   * Called for mounting (attaching) a child component view inside `self`
   * component view.
   * Receiver must add `childComponent` as a sub component.
   */
  virtual void mountChildComponent(
      std::shared_ptr<facebook::react::ComponentDeprecatedAPI> childComponent,
      int index){};

  /*
   * Called for unmounting (detaching) a child component view from `self`
   * component view.
   * Receiver must remove `childComponent` from a sub component
   */
  virtual void unmountChildComponent(
      std::shared_ptr<facebook::react::ComponentDeprecatedAPI> childComponent,
      int index){};

  /*
   * Called for updating component's state.
   * Receiver must update native view according to changed state.
   */
  virtual void updateState(){};

 protected:
  Tag tag_ = -1;
  Props::Shared props_;
};

} // namespace facebook::react
