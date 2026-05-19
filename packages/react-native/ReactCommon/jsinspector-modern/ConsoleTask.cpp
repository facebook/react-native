/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ConsoleTask.h"
#include "ConsoleTaskOrchestrator.h"

namespace facebook::react::jsinspector_modern {

ConsoleTask::ConsoleTask(std::shared_ptr<ConsoleTaskContext> taskContext)
    : taskContext_(std::move(taskContext)),
      orchestrator_(ConsoleTaskOrchestrator::getInstance()) {
  if (taskContext_) {
    orchestrator_.startTask(taskContext_->id());
  }
}

ConsoleTask::~ConsoleTask() {
  if (taskContext_) {
    orchestrator_.finishTask(taskContext_->id());
  }
}

} // namespace facebook::react::jsinspector_modern
