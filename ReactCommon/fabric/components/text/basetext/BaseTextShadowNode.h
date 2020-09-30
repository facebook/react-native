/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/attributedstring/AttributedString.h>
#include <react/attributedstring/TextAttributes.h>

namespace facebook {
namespace react {

/*
 * Base class (one of) for shadow nodes that represents attributed text,
 * such as Text and Paragraph (but not RawText).
 */
class BaseTextShadowNode {
 public:
  /*
   * Returns a `AttributedString` which represents text content of the node.
   * This is static so that both Paragraph (which subclasses BaseText) and
   * TextInput (which does not) can use this.
   * TODO T53299884: decide if this should be moved out and made a static
   * function, or if TextInput should inherit from BaseTextShadowNode.
   */
  static AttributedString getAttributedString(
      TextAttributes const &baseTextAttributes,
      ShadowNode const &parentNode);
};

} // namespace react
} // namespace facebook
