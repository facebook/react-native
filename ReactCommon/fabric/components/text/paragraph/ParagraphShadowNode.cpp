/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ParagraphShadowNode.h"
<<<<<<< HEAD
#include "ParagraphMeasurementCache.h"
=======

#include <react/attributedstring/AttributedStringBox.h>
>>>>>>> fb/0.62-stable
#include "ParagraphState.h"

namespace facebook {
namespace react {

char const ParagraphComponentName[] = "Paragraph";

AttributedString ParagraphShadowNode::getAttributedString() const {
  if (!cachedAttributedString_.has_value()) {
    auto textAttributes = TextAttributes::defaultTextAttributes();
    textAttributes.apply(getProps()->textAttributes);

    cachedAttributedString_ =
        BaseTextShadowNode::getAttributedString(textAttributes, *this);
  }

  return cachedAttributedString_.value();
}

void ParagraphShadowNode::setTextLayoutManager(
    SharedTextLayoutManager textLayoutManager) {
  ensureUnsealed();
  textLayoutManager_ = textLayoutManager;
}

<<<<<<< HEAD
void ParagraphShadowNode::setMeasureCache(
    ParagraphMeasurementCache const *cache) {
  ensureUnsealed();
  measureCache_ = cache;
}

=======
>>>>>>> fb/0.62-stable
void ParagraphShadowNode::updateStateIfNeeded() {
  ensureUnsealed();

  auto attributedString = getAttributedString();
  auto const &state = getStateData();
<<<<<<< HEAD
  if (state.attributedString == attributedString) {
    return;
  }

  setStateData(ParagraphState{attributedString, textLayoutManager_});
=======

  assert(textLayoutManager_);
  assert(
      (!state.layoutManager || state.layoutManager == textLayoutManager_) &&
      "`StateData` refers to a different `TextLayoutManager`");

  if (state.attributedString == attributedString &&
      state.layoutManager == textLayoutManager_) {
    return;
  }

  setStateData(ParagraphState{
      attributedString, getProps()->paragraphAttributes, textLayoutManager_});
>>>>>>> fb/0.62-stable
}

#pragma mark - LayoutableShadowNode

Size ParagraphShadowNode::measure(LayoutConstraints layoutConstraints) const {
  AttributedString attributedString = getAttributedString();

  if (attributedString.isEmpty()) {
<<<<<<< HEAD
    return {0, 0};
  }

  ParagraphAttributes const paragraphAttributes =
      getProps()->paragraphAttributes;

  assert(measureCache_);

  return measureCache_->get(
      ParagraphMeasurementCacheKey{
          attributedString, paragraphAttributes, layoutConstraints},
      [&](ParagraphMeasurementCacheKey const &key) {
        return textLayoutManager_->measure(
            attributedString, paragraphAttributes, layoutConstraints);
      });
=======
    return layoutConstraints.clamp({0, 0});
  }
>>>>>>> fb/0.62-stable

  return textLayoutManager_->measure(
      AttributedStringBox{attributedString},
      getProps()->paragraphAttributes,
      layoutConstraints);
}

void ParagraphShadowNode::layout(LayoutContext layoutContext) {
  updateStateIfNeeded();
  ConcreteViewShadowNode::layout(layoutContext);
}

} // namespace react
} // namespace facebook
