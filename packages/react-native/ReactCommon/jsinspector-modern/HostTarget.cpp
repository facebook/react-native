/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HostTarget.h"
#include "CdpJson.h"
#include "HostAgent.h"
#include "InspectorInterfaces.h"
#include "InspectorUtilities.h"
#include "InstanceTarget.h"
#include "SessionState.h"

#include <folly/dynamic.h>
#include <folly/json.h>

#include <memory>

namespace facebook::react::jsinspector_modern {

/**
 * A Session connected to a HostTarget, passing CDP messages to and from a
 * HostAgent which it owns.
 */
class HostTargetSession {
 public:
  explicit HostTargetSession(
      std::unique_ptr<IRemoteConnection> remote,
      HostTargetController& targetController,
      HostTargetMetadata hostMetadata)
      : remote_(std::make_shared<RAIIRemoteConnection>(std::move(remote))),
        frontendChannel_(
            [remoteWeak = std::weak_ptr(remote_)](std::string_view message) {
              if (auto remote = remoteWeak.lock()) {
                remote->onMessage(std::string(message));
              }
            }),
        hostAgent_(
            frontendChannel_,
            targetController,
            std::move(hostMetadata),
            state_) {}

  /**
   * Called by CallbackLocalConnection to send a message to this Session's
   * Agent.
   */
  void operator()(std::string message) {
    cdp::PreparsedRequest request;
    // Messages may be invalid JSON, or have unexpected types.
    try {
      request = cdp::preparse(message);
    } catch (const cdp::ParseError& e) {
      frontendChannel_(
          cdp::jsonError(std::nullopt, cdp::ErrorCode::ParseError, e.what()));
      return;
    } catch (const cdp::TypeError& e) {
      frontendChannel_(cdp::jsonError(
          std::nullopt, cdp::ErrorCode::InvalidRequest, e.what()));
      return;
    }

    // Catch exceptions that may arise from accessing dynamic params during
    // request handling.
    try {
      hostAgent_.handleRequest(request);
    } catch (const cdp::TypeError& e) {
      frontendChannel_(
          cdp::jsonError(request.id, cdp::ErrorCode::InvalidRequest, e.what()));
      return;
    }
  }

  /**
   * Replace the current instance agent inside hostAgent_ with a new one
   * connected to the new InstanceTarget.
   * \param instance The new instance target. May be nullptr to indicate
   * there's no current instance.
   */
  void setCurrentInstance(InstanceTarget* instance) {
    if (instance) {
      hostAgent_.setCurrentInstanceAgent(
          instance->createAgent(frontendChannel_, state_));
    } else {
      hostAgent_.setCurrentInstanceAgent(nullptr);
    }
  }

 private:
  // Owned by this instance, but shared (weakly) with the frontend channel
  std::shared_ptr<RAIIRemoteConnection> remote_;
  FrontendChannel frontendChannel_;
  SessionState state_;

  // NOTE: hostAgent_ has a raw reference to state_ so must be destroyed first.
  HostAgent hostAgent_;
};

/**
 * Converts HostCommands to CDP method calls and sends them over a private
 * connection to the HostTarget.
 */
class HostCommandSender {
 public:
  explicit HostCommandSender(HostTarget& target)
      : connection_(target.connect(std::make_unique<NullRemoteConnection>())) {}

  /**
   * Send a \c HostCommand to the HostTarget.
   */
  void sendCommand(HostCommand command) {
    cdp::RequestId id = makeRequestId();
    switch (command) {
      case HostCommand::DebuggerResume:
        connection_->sendMessage(cdp::jsonRequest(id, "Debugger.resume"));
        break;
      case HostCommand::DebuggerStepOver:
        connection_->sendMessage(cdp::jsonRequest(id, "Debugger.stepOver"));
        break;
      default:
        assert(false && "unknown HostCommand");
    }
  }

 private:
  cdp::RequestId makeRequestId() {
    return nextRequestId_++;
  }

  cdp::RequestId nextRequestId_{1};
  std::unique_ptr<ILocalConnection> connection_;
};

std::shared_ptr<HostTarget> HostTarget::create(
    HostTargetDelegate& delegate,
    VoidExecutor executor) {
  std::shared_ptr<HostTarget> hostTarget{new HostTarget(delegate)};
  hostTarget->setExecutor(executor);
  return hostTarget;
}

HostTarget::HostTarget(HostTargetDelegate& delegate)
    : delegate_(delegate),
      executionContextManager_{std::make_shared<ExecutionContextManager>()} {}

std::unique_ptr<ILocalConnection> HostTarget::connect(
    std::unique_ptr<IRemoteConnection> connectionToFrontend) {
  auto session = std::make_shared<HostTargetSession>(
      std::move(connectionToFrontend), controller_, delegate_.getMetadata());
  session->setCurrentInstance(currentInstance_.get());
  sessions_.insert(std::weak_ptr(session));
  return std::make_unique<CallbackLocalConnection>(
      [session](std::string message) { (*session)(message); });
}

HostTarget::~HostTarget() {
  // HostCommandSender owns a session, so we must release it for the assertion
  // below to be valid.
  commandSender_.reset();
  // Sessions are owned by InspectorPackagerConnection, not by HostTarget, but
  // they hold a HostTarget& that we must guarantee is valid.
  assert(
      sessions_.empty() &&
      "HostTargetSession objects must be destroyed before their HostTarget. Did you call getInspectorInstance().removePage()?");
}

HostTargetDelegate::~HostTargetDelegate() {}

InstanceTarget& HostTarget::registerInstance(InstanceTargetDelegate& delegate) {
  assert(!currentInstance_ && "Only one instance allowed");
  currentInstance_ = InstanceTarget::create(
      executionContextManager_, delegate, makeVoidExecutor(executorFromThis()));
  sessions_.forEach(
      [currentInstance = &*currentInstance_](HostTargetSession& session) {
        session.setCurrentInstance(currentInstance);
      });
  return *currentInstance_;
}

void HostTarget::unregisterInstance(InstanceTarget& instance) {
  assert(
      currentInstance_ && currentInstance_.get() == &instance &&
      "Invalid unregistration");
  sessions_.forEach(
      [](HostTargetSession& session) { session.setCurrentInstance(nullptr); });
  currentInstance_.reset();
}

void HostTarget::sendCommand(HostCommand command) {
  executorFromThis()([command](HostTarget& self) {
    if (!self.commandSender_) {
      self.commandSender_ = std::make_unique<HostCommandSender>(self);
    }
    self.commandSender_->sendCommand(command);
  });
}

HostTargetController::HostTargetController(HostTarget& target)
    : target_(target) {}

HostTargetDelegate& HostTargetController::getDelegate() {
  return target_.getDelegate();
}

bool HostTargetController::hasInstance() const {
  return target_.hasInstance();
}

void HostTargetController::incrementPauseOverlayCounter() {
  ++pauseOverlayCounter_;
}

bool HostTargetController::decrementPauseOverlayCounter() {
  assert(pauseOverlayCounter_ > 0 && "Pause overlay counter underflow");
  if (--pauseOverlayCounter_ == 0) {
    return false;
  }
  return true;
}

folly::dynamic hostMetadataToDynamic(const HostTargetMetadata& metadata) {
  folly::dynamic result = folly::dynamic::object;

  result["integrationName"] = metadata.integrationName.value_or(nullptr);

  return result;
}

} // namespace facebook::react::jsinspector_modern
