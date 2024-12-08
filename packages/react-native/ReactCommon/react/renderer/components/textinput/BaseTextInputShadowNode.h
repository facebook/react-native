/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/attributedstring/AttributedString.h>
#include <react/renderer/components/textinput/BaseTextInputProps.h>
#include <react/renderer/components/textinput/TextInputState.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/textlayoutmanager/TextLayoutManager.h>
#include <react/utils/ContextContainer.h>
#include <optional>

namespace facebook::react {

/*
 * Base `ShadowNode` for <TextInput> component.
 */
class BaseTextInputShadowNode {
 public:
  virtual ~BaseTextInputShadowNode() = default;

  /*
   * Associates a shared `TextLayoutManager` with the node.
   * `TextInputShadowNode` uses the manager to measure text content
   * and construct `TextInputState` objects.
   */
  void setTextLayoutManager(
      std::shared_ptr<const TextLayoutManager> textLayoutManager);

 protected:
  Size measureContent(
      const LayoutContext& layoutContext,
      const LayoutConstraints& layoutConstraints,
      const BaseTextInputProps& props,
      const TextInputState& state) const;

  Float baseline(
      const LayoutContext& layoutContext,
      Size size,
      const BaseTextInputProps& props,
      const yoga::Node& yogaNode) const;

  /*
   * Creates a `State` object if needed.
   */
  std::optional<TextInputState> updateStateIfNeeded(
      const LayoutContext& layoutContext,
      const BaseTextInputProps& props,
      const TextInputState& state) const;

  virtual const ShadowNode& getShadowNode() const = 0;
  virtual bool hasMeaningfulState() const = 0;
  virtual void ensureUnsealed() const = 0;

  std::shared_ptr<const TextLayoutManager> textLayoutManager_;

 private:
  /*
   * Returns a `AttributedString` which represents text content of the node.
   */
  AttributedString getAttributedString(
      const LayoutContext& layoutContext,
      const BaseTextInputProps& props) const;

  /*
   * Returns an `AttributedStringBox` which represents text content that should
   * be used for measuring purposes. It might contain actual text value,
   * placeholder value or some character that represents the size of the font.
   */
  AttributedStringBox attributedStringBoxToMeasure(
      const LayoutContext& layoutContext,
      const BaseTextInputProps& props,
      const TextInputState& state) const;
};

} // namespace facebook::react
