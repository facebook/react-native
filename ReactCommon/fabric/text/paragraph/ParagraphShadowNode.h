/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/core/ConcreteShadowNode.h>
#include <fabric/core/ShadowNode.h>
#include <fabric/core/LayoutContext.h>
#include <fabric/text/ParagraphProps.h>
#include <fabric/text/TextShadowNode.h>
#include <fabric/textlayoutmanager/TextLayoutManager.h>
#include <fabric/view/ConcreteViewShadowNode.h>

namespace facebook {
namespace react {

class ParagraphShadowNode;

using SharedParagraphShadowNode = std::shared_ptr<const ParagraphShadowNode>;

/*
 * `ShadowNode` for <Paragraph> component, represents <View>-like component
 * containing and displaying text. Text content is represented as nested <Text>
 * and <RawText> components.
 */
class ParagraphShadowNode:
  public ConcreteViewShadowNode<ParagraphProps>,
  public BaseTextShadowNode {

public:

  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  ComponentName getComponentName() const override;

  /*
   * Returns a `AttributedString` which represents text content of the node.
   */
  AttributedString getAttributedString() const;

  /*
   * Associates a shared TextLayoutManager with the node.
   * `ParagraphShadowNode` uses the manager to measure text content
   * and construct `ParagraphLocalData` objects.
   */
  void setTextLayoutManager(SharedTextLayoutManager textLayoutManager);

#pragma mark - LayoutableShadowNode

  void layout(LayoutContext layoutContext) override;
  Size measure(LayoutConstraints layoutConstraints) const override;

private:

  /*
   * Creates a `LocalData` object (with `AttributedText` and
   * `TextLayoutManager`) if needed.
   */
  void updateLocalData();

  SharedTextLayoutManager textLayoutManager_;
};

} // namespace react
} // namespace facebook
