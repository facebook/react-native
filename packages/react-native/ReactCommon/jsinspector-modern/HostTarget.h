/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ExecutionContextManager.h"
#include "HostCommand.h"
#include "InspectorInterfaces.h"
#include "InstanceTarget.h"
#include "NetworkIOAgent.h"
#include "PerfMonitorV2.h"
#include "ScopedExecutor.h"
#include "WeakList.h"

#include <optional>
#include <string>

#include <jsinspector-modern/tracing/TracingMode.h>
#include <jsinspector-modern/tracing/TracingState.h>

#ifndef JSINSPECTOR_EXPORT
#ifdef _MSC_VER
#ifdef CREATE_SHARED_LIBRARY
#define JSINSPECTOR_EXPORT __declspec(dllexport)
#else
#define JSINSPECTOR_EXPORT
#endif // CREATE_SHARED_LIBRARY
#else // _MSC_VER
#define JSINSPECTOR_EXPORT __attribute__((visibility("default")))
#endif // _MSC_VER
#endif // !defined(JSINSPECTOR_EXPORT)

namespace facebook::react::jsinspector_modern {

class HostTargetSession;
class HostAgent;
class HostTracingAgent;
class HostCommandSender;
class HostRuntimeBinding;
class HostTarget;
class HostTargetTraceRecording;

struct HostTargetMetadata {
  std::optional<std::string> appDisplayName;
  std::optional<std::string> appIdentifier;
  std::optional<std::string> deviceName;
  std::optional<std::string> integrationName;
  std::optional<std::string> platform;
  std::optional<std::string> reactNativeVersion;
};

/**
 * Receives events from a HostTarget. This is a shared interface that each
 * React Native platform needs to implement in order to integrate with the
 * debugging stack.
 */
class HostTargetDelegate : public LoadNetworkResourceDelegate {
 public:
  HostTargetDelegate() = default;
  HostTargetDelegate(const HostTargetDelegate&) = delete;
  HostTargetDelegate(HostTargetDelegate&&) = delete;
  HostTargetDelegate& operator=(const HostTargetDelegate&) = delete;
  HostTargetDelegate& operator=(HostTargetDelegate&&) = delete;

  // TODO(moti): This is 1:1 the shape of the corresponding CDP message -
  // consider reusing typed/generated CDP interfaces when we have those.
  struct PageReloadRequest {
    // It isn't clear what the ignoreCache parameter of @cdp Page.reload should
    // mean in React Native. We parse it, but don't do anything with it yet.
    std::optional<bool> ignoreCache;

    // TODO: Implement scriptToEvaluateOnLoad parameter of @cdp Page.reload.
    std::optional<std::string> scriptToEvaluateOnLoad;

    /**
     * Equality operator, useful for unit tests
     */
    inline bool operator==(const PageReloadRequest& rhs) const {
      return ignoreCache == rhs.ignoreCache &&
          scriptToEvaluateOnLoad == rhs.scriptToEvaluateOnLoad;
    }
  };

  struct OverlaySetPausedInDebuggerMessageRequest {
    /**
     * The message to display in the overlay. If nullopt, hide the overlay.
     */
    std::optional<std::string> message;

    /**
     * Equality operator, useful for unit tests
     */
    inline bool operator==(
        const OverlaySetPausedInDebuggerMessageRequest& rhs) const {
      return message == rhs.message;
    }
  };

  virtual ~HostTargetDelegate() override;

  /**
   * Returns a metadata object describing the host. This is called on an
   * initial response to @cdp ReactNativeApplication.enable.
   */
  virtual HostTargetMetadata getMetadata() = 0;

  /**
   * Called when the debugger requests a reload of the page. This is called on
   * the thread on which messages are dispatched to the session (that is, where
   * ILocalConnection::sendMessage was called).
   */
  virtual void onReload(const PageReloadRequest& request) = 0;

  /**
   * Called when the debugger requests that the "paused in debugger" overlay be
   * shown or hidden. If the message is nullopt, hide the overlay, otherwise
   * show it with the given message. This is called on the inspector thread.
   *
   * If this method is called with a non-null message, it's guaranteed to
   * eventually be called again with a null message. In all other respects,
   * the timing and payload of these messages are fully controlled by the
   * client.
   */
  virtual void onSetPausedInDebuggerMessage(
      const OverlaySetPausedInDebuggerMessageRequest& request) = 0;

  /**
   * [Experimental] Called when the runtime has new data for the V2 Perf
   * Monitor overlay. This is called on the inspector thread.
   */
  virtual void unstable_onPerfMonitorUpdate(
      const PerfMonitorUpdateRequest& /*request*/) {}

  /**
   * Called by NetworkIOAgent on handling a `Network.loadNetworkResource` CDP
   * request. Platform implementations should override this to perform a
   * network request of the given URL, and use listener's callbacks on receipt
   * of headers, data chunks, and errors.
   */
  void loadNetworkResource(
      const LoadNetworkResourceRequest& /*params*/,
      ScopedExecutor<NetworkRequestListener> /*executor*/) override {
    throw NotImplementedException(
        "LoadNetworkResourceDelegate.loadNetworkResource is not implemented by this host target delegate.");
  }

  /**
   * [Experimental] Will be called at the CDP session initialization to get the
   * trace recording that may have been stashed by the Host from the previous
   * background session.
   *
   * \return the trace recording state if there is one that needs to be
   * displayed, otherwise std::nullopt.
   */
  virtual std::optional<tracing::TraceRecordingState>
  unstable_getTraceRecordingThatWillBeEmittedOnInitialization() {
    return std::nullopt;
  }
};

/**
 * The limited interface that HostTarget exposes to its associated
 * sessions/agents.
 */
class HostTargetController final {
 public:
  explicit HostTargetController(HostTarget& target);

  HostTargetDelegate& getDelegate();

  bool hasInstance() const;

  /**
   * Increments the target's pause overlay counter. The counter represents the
   * exact number of Agents that have (concurrently) requested the pause
   * overlay to be shown. It's the caller's responsibility to only call this
   * when the pause overlay's requested state transitions from hidden to
   * visible.
   */
  void incrementPauseOverlayCounter();

  /**
   * Decrements the target's pause overlay counter. The counter represents the
   * exact number of Agents that have (concurrently) requested the pause
   * overlay to be shown. It's the caller's responsibility to only call this
   * when the pause overlay's requested state transitions from hidden to
   * visible.
   * \returns false if the counter has reached 0, otherwise true.
   */
  bool decrementPauseOverlayCounter();

  /**
   * Starts trace recording for this HostTarget.
   *
   * \param mode In which mode to start the trace recording.
   * \return false if already tracing, true otherwise.
   */
  bool startTracing(tracing::Mode mode);

  /**
   * Stops previously started trace recording.
   */
  tracing::TraceRecordingState stopTracing();

 private:
  HostTarget& target_;
  size_t pauseOverlayCounter_{0};
};

/**
 * The top-level Target in a React Native app. This is equivalent to the
 * "Host" in React Native's architecture - the entity that manages the
 * lifecycle of a React Instance.
 */
class JSINSPECTOR_EXPORT HostTarget
    : public EnableExecutorFromThis<HostTarget> {
 public:
  /**
   * Constructs a new HostTarget.
   * \param delegate The HostTargetDelegate that will
   * receive events from this HostTarget. The caller is responsible for ensuring
   * that the HostTargetDelegate outlives this object.
   * \param executor An executor that may be used to call methods on this
   * HostTarget while it exists. \c create additionally guarantees that the
   * executor will not be called after the HostTarget is destroyed.
   * \note Copies of the provided executor may be destroyed on arbitrary
   * threads, including after the HostTarget is destroyed. Callers must ensure
   * that such destructor calls are safe - e.g. if using a lambda as the
   * executor, all captured values must be safe to destroy from any thread.
   */
  static std::shared_ptr<HostTarget> create(
      HostTargetDelegate& delegate,
      VoidExecutor executor);

  HostTarget(const HostTarget&) = delete;
  HostTarget(HostTarget&&) = delete;
  HostTarget& operator=(const HostTarget&) = delete;
  HostTarget& operator=(HostTarget&&) = delete;
  ~HostTarget();

  /**
   * Creates a new Session connected to this HostTarget, wrapped in an
   * interface which is compatible with \c IInspector::addPage.
   * The caller is responsible for destroying the connection before HostTarget
   * is destroyed, on the same thread where HostTarget's constructor and
   * destructor execute.
   */
  std::unique_ptr<ILocalConnection> connect(
      std::unique_ptr<IRemoteConnection> connectionToFrontend);

  /**
   * Registers an instance with this HostTarget.
   * \param delegate The InstanceTargetDelegate that will receive events from
   * this InstanceTarget. The caller is responsible for ensuring that the
   * InstanceTargetDelegate outlives this object.
   * \return An InstanceTarget reference representing the newly created
   * instance. This reference is only valid until unregisterInstance is called
   * (or the HostTarget is destroyed). \pre There isn't currently an instance
   * registered with this HostTarget.
   */
  InstanceTarget& registerInstance(InstanceTargetDelegate& delegate);

  /**
   * Unregisters an instance from this HostTarget.
   * \param instance The InstanceTarget reference previously returned by
   * registerInstance.
   */
  void unregisterInstance(InstanceTarget& instance);

  /**
   * Sends an imperative command to the HostTarget. May be called from any
   * thread.
   */
  void sendCommand(HostCommand command);

  /**
   * Creates a new HostTracingAgent.
   * This Agent is not owned by the HostTarget. The Agent will be destroyed at
   * the end of the tracing session.
   *
   * \param state A reference to the state of the active trace recording.
   */
  std::shared_ptr<HostTracingAgent> createTracingAgent(
      tracing::TraceRecordingState& state);

  /**
   * Starts trace recording for this HostTarget.
   *
   * \param mode In which mode to start the trace recording.
   * \return false if already tracing, true otherwise.
   */
  bool startTracing(tracing::Mode mode);

  /**
   * Stops previously started trace recording.
   */
  tracing::TraceRecordingState stopTracing();

  /**
   * Returns the state of the background trace, running, stopped, or disabled
   */
  tracing::TracingState tracingState() const;

 private:
  /**
   * Constructs a new HostTarget.
   * The caller must call setExecutor immediately afterwards.
   * \param delegate The HostTargetDelegate that will
   * receive events from this HostTarget. The caller is responsible for ensuring
   * that the HostTargetDelegate outlives this object.
   */
  HostTarget(HostTargetDelegate& delegate);

  HostTargetDelegate& delegate_;
  WeakList<HostTargetSession> sessions_;
  HostTargetController controller_{*this};
  // executionContextManager_ is a shared_ptr to guarantee its validity while
  // the InstanceTarget is alive (just in case the InstanceTarget ends up
  // briefly outliving the HostTarget, which it generally shouldn't).
  std::shared_ptr<ExecutionContextManager> executionContextManager_;
  std::shared_ptr<InstanceTarget> currentInstance_{nullptr};
  std::unique_ptr<HostCommandSender> commandSender_;
  std::unique_ptr<PerfMonitorUpdateHandler> perfMonitorUpdateHandler_;
  std::unique_ptr<HostRuntimeBinding> perfMetricsBinding_;

  /**
   * Current pending trace recording, which encapsulates the configuration of
   * the tracing session and the state.
   *
   * Should only be allocated when there is an active tracing session.
   */
  std::unique_ptr<HostTargetTraceRecording> traceRecording_{nullptr};

  inline HostTargetDelegate& getDelegate() {
    return delegate_;
  }

  inline bool hasInstance() const {
    return currentInstance_ != nullptr;
  }

  /**
   * Install a runtime binding subscribing to the Interaction to Next Paint
   * (INP) live metric, which we broadcast to the V2 Perf Monitor overlay
   * via \ref HostTargetDelegate::unstable_onPerfMonitorUpdate.
   */
  void installPerfMetricsBinding();

  // Necessary to allow HostAgent to access HostTarget's internals in a
  // controlled way (i.e. only HostTargetController gets friend access, while
  // HostAgent itself doesn't).
  friend class HostTargetController;
};

folly::dynamic createHostMetadataPayload(const HostTargetMetadata& metadata);

} // namespace facebook::react::jsinspector_modern
