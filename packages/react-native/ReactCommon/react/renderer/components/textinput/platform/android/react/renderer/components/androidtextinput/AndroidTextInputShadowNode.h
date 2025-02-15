/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "AndroidTextInputEventEmitter.h"
#include "AndroidTextInputProps.h"

#include <react/renderer/components/textinput/BaseTextInputShadowNode.h>
#include <react/renderer/components/textinput/TextInputState.h>

namespace facebook::react {

extern const char AndroidTextInputComponentName[];

/*
 * `ShadowNode` for <AndroidTextInput> component.
 */
class AndroidTextInputShadowNode final
    : public BaseTextInputShadowNode<
          AndroidTextInputComponentName,
          AndroidTextInputProps,
          AndroidTextInputEventEmitter,
          TextInputState,
          /* usesMapBufferForStateData */ true> {
 public:
  using BaseTextInputShadowNode::BaseTextInputShadowNode;

  Size measureContent(
      const LayoutContext& layoutContext,
      const LayoutConstraints& layoutConstraints) const override;

 protected:
  void updateStateIfNeeded(const LayoutContext& layoutContext) override;
};

} // namespace facebook::react
