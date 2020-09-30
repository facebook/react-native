/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/modal/ModalHostViewState.h>
#include <react/components/rncore/EventEmitters.h>
#include <react/components/rncore/Props.h>
#include <react/components/view/ConcreteViewShadowNode.h>

namespace facebook {
namespace react {

extern const char ModalHostViewComponentName[];

/*
 * `ShadowNode` for <Slider> component.
 */
class ModalHostViewShadowNode final : public ConcreteViewShadowNode<
                                          ModalHostViewComponentName,
                                          ModalHostViewProps,
                                          ModalHostViewEventEmitter,
                                          ModalHostViewState> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;
};

} // namespace react
} // namespace facebook
