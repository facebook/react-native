/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <react/attributedstring/AttributedString.h>
#include <react/attributedstring/ParagraphAttributes.h>
#include <react/core/LayoutConstraints.h>
#include <react/utils/ContextContainer.h>
#include <react/utils/SimpleThreadSafeCache.h>

namespace facebook {
namespace react {

class TextLayoutManager;

using SharedTextLayoutManager = std::shared_ptr<const TextLayoutManager>;

/*
 * Cross platform facade for iOS-specific RCTTTextLayoutManager.
 */
class TextLayoutManager {
 public:
  TextLayoutManager(ContextContainer::Shared const &contextContainer);
  ~TextLayoutManager();

  /*
   * Measures `attributedString` using native text rendering infrastructure.
   */
  Size measure(
      AttributedString attributedString,
      ParagraphAttributes paragraphAttributes,
      LayoutConstraints layoutConstraints) const;

  /*
   * Returns an opaque pointer to platform-specific TextLayoutManager.
   * Is used on a native views layer to delegate text rendering to the manager.
   */
  void *getNativeTextLayoutManager() const;

 private:
  using MeasureCacheKey =
      std::tuple<AttributedString, ParagraphAttributes, LayoutConstraints>;
  using MeasureCache = SimpleThreadSafeCache<MeasureCacheKey, Size, 256>;

  void *self_;
  MeasureCache measureCache_{};
};

} // namespace react
} // namespace facebook
