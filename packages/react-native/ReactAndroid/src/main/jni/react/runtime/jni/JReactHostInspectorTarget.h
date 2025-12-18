/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>

#include <jsinspector-modern/HostTarget.h>
#include <react/jni/InspectorNetworkRequestListener.h>
#include <react/jni/JExecutor.h>

#include <mutex>
#include <optional>
#include <string>
#include <vector>

namespace facebook::react {

struct JTracingState : public jni::JavaClass<JTracingState> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/devsupport/inspector/TracingState;";
};

namespace {

enum class TracingState {
  Disabled,
  EnabledInBackgroundMode,
  EnabledInCDPMode,
};

jni::local_ref<JTracingState::javaobject> convertCPPTracingStateToJava(TracingState tracingState)
{
  auto tracingStateClass = jni::findClassLocal("com/facebook/react/devsupport/inspector/TracingState");
  auto valueOfMethod = tracingStateClass->getStaticMethod<JTracingState(jstring)>("valueOf");

  switch (tracingState) {
    case TracingState::Disabled:
      return valueOfMethod(tracingStateClass, jni::make_jstring("DISABLED").get());

    case TracingState::EnabledInBackgroundMode:
      return valueOfMethod(tracingStateClass, jni::make_jstring("ENABLED_IN_BACKGROUND_MODE").get());

    case TracingState::EnabledInCDPMode:
      return valueOfMethod(tracingStateClass, jni::make_jstring("ENABLED_IN_CDP_MODE").get());

    default:
      jni::throwNewJavaException("java/lang/IllegalStateException", "Unexpected new TracingState.");
  }
}

} // namespace

struct JTaskInterface : public jni::JavaClass<JTaskInterface> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/interfaces/TaskInterface;";
};

struct JTracingStateListener : public jni::JavaClass<JTracingStateListener> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/devsupport/inspector/TracingStateListener;";

  void onStateChanged(TracingState tracingState, bool screenshotsEnabled) const
  {
    static auto method =
        javaClassStatic()->getMethod<void(jni::local_ref<JTracingState::javaobject>, jboolean)>("onStateChanged");
    return method(self(), convertCPPTracingStateToJava(tracingState), static_cast<jboolean>(screenshotsEnabled));
  }
};

struct JFrameTimingSequence : public jni::JavaClass<JFrameTimingSequence> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/devsupport/inspector/FrameTimingSequence;";

  uint64_t getId() const
  {
    auto field = javaClassStatic()->getField<jint>("id");
    return static_cast<uint64_t>(getFieldValue(field));
  }

  uint64_t getThreadId() const
  {
    auto field = javaClassStatic()->getField<jint>("threadId");
    return static_cast<uint64_t>(getFieldValue(field));
  }

  HighResTimeStamp getBeginDrawingTimestamp() const
  {
    auto field = javaClassStatic()->getField<jlong>("beginDrawingTimestamp");
    return HighResTimeStamp::fromChronoSteadyClockTimePoint(
        std::chrono::steady_clock::time_point(std::chrono::nanoseconds(getFieldValue(field))));
  }

  HighResTimeStamp getCommitTimestamp() const
  {
    auto field = javaClassStatic()->getField<jlong>("commitTimestamp");
    return HighResTimeStamp::fromChronoSteadyClockTimePoint(
        std::chrono::steady_clock::time_point(std::chrono::nanoseconds(getFieldValue(field))));
  }

  HighResTimeStamp getEndDrawingTimestamp() const
  {
    auto field = javaClassStatic()->getField<jlong>("endDrawingTimestamp");
    return HighResTimeStamp::fromChronoSteadyClockTimePoint(
        std::chrono::steady_clock::time_point(std::chrono::nanoseconds(getFieldValue(field))));
  }

  std::optional<std::string> getScreenshot() const
  {
    auto field = javaClassStatic()->getField<jstring>("screenshot");
    auto javaScreenshot = getFieldValue(field);
    if (javaScreenshot) {
      auto jstring = jni::static_ref_cast<jni::JString>(javaScreenshot);
      return jstring->toStdString();
    }
    return std::nullopt;
  }
};

struct JReactHostImpl : public jni::JavaClass<JReactHostImpl> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/runtime/ReactHostImpl;";

  jni::local_ref<JTaskInterface::javaobject> reload(const std::string &reason)
  {
    static auto method = javaClassStatic()->getMethod<JTaskInterface::javaobject(std::string)>("reload");
    return method(self(), reason);
  }

  void setPausedInDebuggerMessage(std::optional<std::string> message)
  {
    static auto method = javaClassStatic()->getMethod<void(jni::local_ref<jni::JString>)>("setPausedInDebuggerMessage");
    method(self(), message ? jni::make_jstring(*message) : nullptr);
  }

  jni::local_ref<jni::JMap<jstring, jstring>> getHostMetadata() const
  {
    static auto method = javaClassStatic()->getMethod<jni::local_ref<jni::JMap<jstring, jstring>>()>("getHostMetadata");
    return method(self());
  }

  void loadNetworkResource(const std::string &url, jni::local_ref<InspectorNetworkRequestListener::javaobject> listener)
      const
  {
    auto method = javaClassStatic()
                      ->getMethod<void(
                          jni::local_ref<jni::JString>, jni::local_ref<InspectorNetworkRequestListener::javaobject>)>(
                          "loadNetworkResource");
    return method(self(), jni::make_jstring(url), listener);
  }
};

/**
 * A callback that will be invoked when tracing state has changed.
 */
using TracingStateListener = std::function<void(TracingState state, bool screenshotsCategoryEnabled)>;

class TracingDelegate : public jsinspector_modern::HostTargetTracingDelegate {
 public:
  void onTracingStarted(jsinspector_modern::tracing::Mode tracingMode, bool screenshotsCategoryEnabled) override;
  void onTracingStopped() override;

  /**
   * A synchronous way to get the current tracing state.
   * Could be called from any thread.
   */
  TracingState getTracingState();
  /**
   * Register a listener that will be notified when the tracing state changes.
   * Could be called from any thread.
   */
  size_t registerTracingStateListener(TracingStateListener listener);
  /**
   * Unregister previously registered listener with the id returned from
   * TracingDelegate::registerTracingStateListener().
   */
  void unregisterTracingStateListener(size_t subscriptionId);

 private:
  /**
   * Covers read / write operations on tracingState_ and subscriptions_.
   */
  std::mutex mutex_;
  /**
   * Since HostInspectorTarget creates HostTarget, the default value is Disabled.
   * However, the TracingDelegate is subscribed at the construction of HostTarget, so it will be notified as early as
   * possible.
   */
  TracingState tracingState_ = TracingState::Disabled;
  /**
   * Map of subscription ID to listener.
   */
  std::unordered_map<size_t, TracingStateListener> subscriptions_;
  /**
   * A counter for generating unique subscription IDs.
   */
  uint64_t nextSubscriptionId_ = 0;
  /**
   * Returns a collection of listeners that are subscribed at the time of the call.
   * Expected to be only called with mutex_ locked.
   */
  std::vector<TracingStateListener> copySubscribedListeners();
  /**
   * Notifies specified listeners about the state change.
   */
  void notifyListeners(
      const std::vector<TracingStateListener> &listeners,
      TracingState state,
      bool screenshotsCategoryEnabled);
};

class JReactHostInspectorTarget : public jni::HybridClass<JReactHostInspectorTarget>,
                                  public jsinspector_modern::HostTargetDelegate {
 public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/runtime/ReactHostInspectorTarget;";

  ~JReactHostInspectorTarget() override;

  static jni::local_ref<JReactHostInspectorTarget::jhybriddata> initHybrid(
      jni::alias_ref<JReactHostInspectorTarget::jhybridobject> jobj,
      jni::alias_ref<JReactHostImpl> reactHost,
      jni::alias_ref<JExecutor::javaobject> javaExecutor);

  static void registerNatives();
  void sendDebuggerResumeCommand();

  /**
   * Starts a background trace recording for this HostTarget.
   *
   * \return false if already tracing, true otherwise.
   */
  bool startBackgroundTrace();
  /**
   * Stops previously started trace recording and:
   *  - If there is an active CDP session with Fusebox client enabled, emits the
   * trace and returns true.
   *  - Otherwise, stashes the captured trace, that will be emitted when the CDP
   * session is initialized. Returns false.
   */
  jboolean stopAndMaybeEmitBackgroundTrace();
  /**
   * Stops previously started trace recording and discards the captured trace.
   */
  void stopAndDiscardBackgroundTrace();

  jsinspector_modern::HostTarget *getInspectorTarget();

  /**
   * Get the current tracing state. Could be called from any thread.
   */
  jni::local_ref<JTracingState::javaobject> getTracingState();

  /**
   * Register a listener that will be notified when the tracing state changes.
   * Could be called from any thread.
   *
   * \return A unique subscription ID to use for unregistering the listener.
   */
  jlong registerTracingStateListener(jni::alias_ref<JTracingStateListener::javaobject> listener);

  /**
   * Unregister a previously registered tracing state listener.
   *
   * \param subscriptionId The subscription ID returned from JReactHostInspectorTarget::registerTracingStateListener.
   */
  void unregisterTracingStateListener(jlong subscriptionId);

  /**
   * Propagate frame timings information to the Inspector's Tracing subsystem.
   */
  void recordFrameTimings(jni::alias_ref<JFrameTimingSequence::javaobject> frameTimingSequence);

  // HostTargetDelegate methods
  jsinspector_modern::HostTargetMetadata getMetadata() override;
  void onReload(const PageReloadRequest &request) override;
  void onSetPausedInDebuggerMessage(const OverlaySetPausedInDebuggerMessageRequest &request) override;
  void unstable_onPerfIssueAdded(const jsinspector_modern::PerfIssuePayload &issue) override;
  void loadNetworkResource(
      const jsinspector_modern::LoadNetworkResourceRequest &params,
      jsinspector_modern::ScopedExecutor<jsinspector_modern::NetworkRequestListener> executor) override;
  std::optional<jsinspector_modern::tracing::HostTracingProfile>
  unstable_getHostTracingProfileThatWillBeEmittedOnInitialization() override;
  jsinspector_modern::HostTargetTracingDelegate *getTracingDelegate() override;

 private:
  JReactHostInspectorTarget(
      jni::alias_ref<JReactHostInspectorTarget::javaobject> jobj,
      jni::alias_ref<JReactHostImpl> reactHostImpl,
      jni::alias_ref<JExecutor::javaobject> javaExecutor);
  jni::global_ref<JReactHostInspectorTarget::javaobject> jobj_;
  // This weak reference breaks the cycle between the C++ HostTarget and the
  // Java ReactHostImpl, preventing memory leaks in apps that create multiple
  // ReactHostImpls over time.
  jni::global_ref<jni::JWeakReference<JReactHostImpl>> javaReactHostImpl_;
  jsinspector_modern::VoidExecutor inspectorExecutor_;

  std::shared_ptr<jsinspector_modern::HostTarget> inspectorTarget_;
  std::optional<int> inspectorPageId_;

  /**
   * Stops previously started trace recording and returns the captured HostTracingProfile.
   */
  jsinspector_modern::tracing::HostTracingProfile stopTracing();
  /**
   * Stashes previously recorded HostTracingProfile that will be emitted when
   * CDP session is created. Once emitted, the value will be cleared from this
   * instance.
   */
  void stashTracingProfile(jsinspector_modern::tracing::HostTracingProfile &&hostTracingProfile);
  /**
   * Previously recorded HostTracingProfile that will be emitted when CDP session is created.
   */
  std::optional<jsinspector_modern::tracing::HostTracingProfile> stashedTracingProfile_;
  /**
   * Encapsulates the logic around tracing for this HostInspectorTarget.
   */
  std::unique_ptr<TracingDelegate> tracingDelegate_;

  friend HybridBase;
};
} // namespace facebook::react
