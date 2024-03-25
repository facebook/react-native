/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ExecutionContextManager.h"
#include "ScopedExecutor.h"
#include "WeakList.h"

#include <jsinspector-modern/InspectorInterfaces.h>
#include <jsinspector-modern/InstanceTarget.h>

#include <optional>
#include <string>

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
class HostTarget;

/**
 * Receives events from a HostTarget. This is a shared interface that each
 * React Native platform needs to implement in order to integrate with the
 * debugging stack.
 */
class HostTargetDelegate {
 public:
  HostTargetDelegate() = default;
  HostTargetDelegate(const HostTargetDelegate&) = delete;
  HostTargetDelegate(HostTargetDelegate&&) = default;
  HostTargetDelegate& operator=(const HostTargetDelegate&) = delete;
  HostTargetDelegate& operator=(HostTargetDelegate&&) = default;

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

  virtual ~HostTargetDelegate();

  /**
   * Called when the debugger requests a reload of the page. This is called on
   * the thread on which messages are dispatched to the session (that is, where
   * ILocalConnection::sendMessage was called).
   */
  virtual void onReload(const PageReloadRequest& request) = 0;
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

 private:
  HostTarget& target_;
};

/**
 * The top-level Target in a React Native app. This is equivalent to the
 * "Host" in React Native's architecture - the entity that manages the
 * lifecycle of a React Instance.
 */
class JSINSPECTOR_EXPORT HostTarget
    : public EnableExecutorFromThis<HostTarget> {
 public:
  struct SessionMetadata {
    std::optional<std::string> integrationName;
  };

  /**
   * Constructs a new HostTarget.
   * \param delegate The HostTargetDelegate that will
   * receive events from this HostTarget. The caller is responsible for ensuring
   * that the HostTargetDelegate outlives this object.
   * \param executor An executor that may be used to call methods on this
   * HostTarget while it exists. \c create additionally guarantees that the
   * executor will not be called after the HostTarget is destroyed.
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
      std::unique_ptr<IRemoteConnection> connectionToFrontend,
      SessionMetadata sessionMetadata = {});

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

  inline HostTargetDelegate& getDelegate() {
    return delegate_;
  }

  inline bool hasInstance() const {
    return currentInstance_ != nullptr;
  }

  // Necessary to allow HostAgent to access HostTarget's internals in a
  // controlled way (i.e. only HostTargetController gets friend access, while
  // HostAgent itself doesn't).
  friend class HostTargetController;
};

} // namespace facebook::react::jsinspector_modern
