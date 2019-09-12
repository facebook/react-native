/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/core/ReactPrimitives.h>
#include <react/core/ShadowNode.h>

namespace facebook {
namespace react {

/*
 * Abstract class for UIManager's delegate.
 */
class UIManagerDelegate {
 public:
  /*
   * Called right after the new/updated Shadow Node tree is constructed.
   * The tree is not laid out and not sealed at this time.
   */
  virtual void uiManagerDidFinishTransaction(
      SurfaceId surfaceId,
      const SharedShadowNodeUnsharedList &rootChildNodes) = 0;

  /*
   * Called each time when UIManager constructs a new Shadow Node. Receiver
   * might use this to optimistically allocate a new native view
   * instances.
   */
  virtual void uiManagerDidCreateShadowNode(
      const SharedShadowNode &shadowNode) = 0;

  /*
   * Called when UIManager wants to dispatch a command to the mounting layer.
   */
  virtual void uiManagerDidDispatchCommand(
      const SharedShadowNode &shadowNode,
      std::string const &commandName,
      folly::dynamic const args) = 0;

  /*
   * Set JS responder for a view
   */
  virtual void uiManagerDidSetJSResponder(
      SurfaceId surfaceId,
      SharedShadowNode const &shadowView,
      bool blockNativeResponder) = 0;

  /*
   * Clear the JSResponder for a view
   */
  virtual void uiManagerDidClearJSResponder() = 0;

  virtual ~UIManagerDelegate() noexcept = default;
};

} // namespace react
} // namespace facebook
