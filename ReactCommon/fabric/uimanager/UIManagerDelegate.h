/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/core/ShadowNode.h>
#include <fabric/core/ReactPrimitives.h>

namespace facebook {
namespace react {

/*
 * Abstract class for UIManager's delegate.
 */
class UIManagerDelegate {
public:

  /*
   * Called right after the new/updated Shadow Node tree is constructed.
   * The tree is not layed out and not sealed at this time.
   */
  virtual void uiManagerDidFinishTransaction(Tag rootTag, const SharedShadowNodeUnsharedList &rootChildNodes) = 0;

  /*
   * Called each time when UIManager constructs a new Shadow Node. Receiver
   * maight use this to preluminary optimistically allocate a new native view
   * instances.
   */
  virtual void uiManagerDidCreateShadowNode(const SharedShadowNode &shadowNode) = 0;
};

} // namespace react
} // namespace facebook
