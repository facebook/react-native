/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include <folly/dynamic.h>
#include <jsi/jsi.h>
#include <react/renderer/core/RawValue.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/primitives.h>

namespace facebook::react {

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
      jsi::Runtime &runtime,
      RuntimeExecutor const &runtimeExecutor);

  /*
   * Returns a pointer to UIManagerBinding previously installed into a runtime.
   * Thread synchronization must be enforced externally.
   */
  static std::shared_ptr<UIManagerBinding> getBinding(jsi::Runtime &runtime);

  UIManagerBinding(RuntimeExecutor const &runtimeExecutor);

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
      std::string const &moduleName,
      folly::dynamic const &initalProps,
      DisplayMode displayMode) const;

  /*
   * Updates the React Native Surface identified with surfaceId and moduleName
   * with the given props.
   * Thread synchronization must be enforced externally.
   */
  void setSurfaceProps(
      jsi::Runtime &runtime,
      SurfaceId surfaceId,
      std::string const &moduleName,
      folly::dynamic const &props,
      DisplayMode displayMode) const;

  jsi::Value getInspectorDataForInstance(
      jsi::Runtime &runtime,
      EventEmitter const &eventEmitter) const;

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
      EventTarget const *eventTarget,
      std::string const &type,
      ReactEventPriority priority,
      ValueFactory const &payloadFactory) const;

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
  jsi::Value get(jsi::Runtime &runtime, jsi::PropNameID const &name) override;

 private:
  std::shared_ptr<UIManager> uiManager_;
  std::unique_ptr<EventHandler const> eventHandler_;
  mutable ReactEventPriority currentEventPriority_;

  RuntimeExecutor runtimeExecutor_;
};

} // namespace facebook::react
