/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ReactCommon/RuntimeExecutor.h>
#include <react/renderer/componentregistry/ComponentDescriptorFactory.h>
#include <react/renderer/core/EventBeat.h>
#include <react/renderer/leakchecker/LeakChecker.h>
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>
#include <react/renderer/uimanager/UIManagerCommitHook.h>
#include <react/renderer/uimanager/primitives.h>
#include <react/utils/ContextContainer.h>
#include <react/utils/RunLoopObserver.h>

namespace facebook {
namespace react {

/*
 * Contains all external dependencies of Scheduler.
 * Copyable.
 */
struct SchedulerToolbox final {
  /*
   * Represents general purpose DI container for product components/needs.
   * Must not be `nullptr`.
   */
  ContextContainer::Shared contextContainer;

  /*
   * Represents externally managed, lazily available collection of components.
   */
  ComponentRegistryFactory componentRegistryFactory;

  /*
   * Represents running JavaScript VM and associated execution queue.
   */
  RuntimeExecutor runtimeExecutor;

  /*
   * Represent connections with a platform-specific UI run loops.
   */
  RunLoopObserver::Factory mainRunLoopObserverFactory;

  /*
   * Asynchronous & synchronous event beats.
   * Represent connections with the platform-specific run loops and general
   * purpose background queue.
   */
  EventBeat::Factory asynchronousEventBeatFactory;
  EventBeat::Factory synchronousEventBeatFactory;

  /*
   * General-purpose executor that is used to dispatch work on some utility
   * queue (mostly) asynchronously to avoid unnecessary blocking the caller
   * queue.
   * The concrete implementation can use a serial or concurrent queue.
   * Due to architectural constraints, the concrete implementation *must* call
   * the call back synchronously if the executor is invoked on the main thread.
   */
  BackgroundExecutor backgroundExecutor;

  /*
   * A list of `UIManagerCommitHook`s that should be registered in `UIManager`.
   */
  std::vector<std::shared_ptr<UIManagerCommitHook const>> commitHooks;
};

} // namespace react
} // namespace facebook
