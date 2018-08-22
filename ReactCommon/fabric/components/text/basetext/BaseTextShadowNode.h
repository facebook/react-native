/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/attributedstring/AttributedString.h>
#include <fabric/attributedstring/TextAttributes.h>

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
   */
  AttributedString getAttributedString(
    const TextAttributes &baseTextAttributes,
    const SharedShadowNodeList &childNodes
  ) const;
};

} // namespace react
} // namespace facebook
