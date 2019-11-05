/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <jsi/jsi.h>
#include <react/uimanager/UIManager.h>
#include <react/uimanager/primitives.h>

namespace facebook {
namespace react {

/*
 * Exposes UIManager to JavaScript realm.
 */
class UIManagerBinding : public jsi::HostObject {
 public:
  /*
   * Installs UIManagerBinding into JavaScript runtime if needed.
   * Creates and sets `UIManagerBinding` into the global namespace.
   * In case if the global namespace already has a `UIManagerBinding` installed,
   * returns that.
   * Thread synchronization must be enforced externally.
   */
  static std::shared_ptr<UIManagerBinding> createAndInstallIfNeeded(
      jsi::Runtime &runtime);

  ~UIManagerBinding();

  /*
   * Establish a relationship between `UIManager` and `UIManagerBinding` by
   * setting internal pointers to each other.
   * Must be called on JavaScript thread or during VM destruction.
   */
  void attach(std::shared_ptr<UIManager> const &uiManager);

  /*
   * Starts React Native Surface with given id, moduleName, and props.
   * Thread synchronization must be enforced externally.
   */
  void startSurface(
      jsi::Runtime &runtime,
      SurfaceId surfaceId,
      const std::string &moduleName,
      const folly::dynamic &initalProps) const;

  /*
   * Stops React Native Surface with given id.
   * Thread synchronization must be enforced externally.
   */
  void stopSurface(jsi::Runtime &runtime, SurfaceId surfaceId) const;

  /*
   * Delivers raw event data to JavaScript.
   * Thread synchronization must be enforced externally.
   */
  void dispatchEvent(
      jsi::Runtime &runtime,
      const EventTarget *eventTarget,
      const std::string &type,
      const ValueFactory &payloadFactory) const;

  /*
   * Invalidates the binding and underlying UIManager.
   * Allows to save some resources and prevents UIManager's delegate to be
   * called.
   * Calling public methods of this class after calling this method is UB.
   * Can be called on any thread.
   */
  void invalidate() const;

  /*
   * `jsi::HostObject` specific overloads.
   */
  jsi::Value get(jsi::Runtime &runtime, const jsi::PropNameID &name) override;

 private:
  std::shared_ptr<UIManager> uiManager_;
  std::unique_ptr<const EventHandler> eventHandler_;
};

} // namespace react
} // namespace facebook
