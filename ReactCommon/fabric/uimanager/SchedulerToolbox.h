// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <react/core/EventBeat.h>
#include <react/uimanager/ComponentDescriptorFactory.h>
#include <react/uimanager/primitives.h>
#include <react/utils/ContextContainer.h>

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
   * Asynchronous & synchronous event beats.
   * Represent connections with the platform-specific run loops and general
   * purpose background queue.
   */
  EventBeatFactory asynchronousEventBeatFactory;
  EventBeatFactory synchronousEventBeatFactory;
};

} // namespace react
} // namespace facebook
