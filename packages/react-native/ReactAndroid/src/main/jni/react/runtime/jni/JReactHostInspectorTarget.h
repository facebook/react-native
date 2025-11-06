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
#include <string>

namespace facebook::react {

struct JTaskInterface : public jni::JavaClass<JTaskInterface> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/interfaces/TaskInterface;";
};

struct JTracingState : public jni::JavaClass<JTracingState> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/devsupport/TracingState;";
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
   * Get the state of the background trace: running, stopped, or disabled
   * Background tracing will be disabled if there is no metro connection or if
   * there is a CDP initiate trace in progress.
   *
   * \return the background trace state
   */
  jint tracingState();
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

  // HostTargetDelegate methods
  jsinspector_modern::HostTargetMetadata getMetadata() override;
  void onReload(const PageReloadRequest &request) override;
  void onSetPausedInDebuggerMessage(const OverlaySetPausedInDebuggerMessageRequest &request) override;
  void unstable_onPerfIssueAdded(const jsinspector_modern::PerfIssuePayload &issue) override;
  void loadNetworkResource(
      const jsinspector_modern::LoadNetworkResourceRequest &params,
      jsinspector_modern::ScopedExecutor<jsinspector_modern::NetworkRequestListener> executor) override;
  std::optional<jsinspector_modern::tracing::TraceRecordingState>
  unstable_getTraceRecordingThatWillBeEmittedOnInitialization() override;

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
   * Stops previously started trace recording and returns the captured trace.
   */
  jsinspector_modern::tracing::TraceRecordingState stopTracing();
  /**
   * Stashes previously recorded trace recording state that will be emitted when
   * CDP session is created. Once emitted, the value will be cleared from this
   * instance.
   */
  void stashTraceRecordingState(jsinspector_modern::tracing::TraceRecordingState &&state);
  /**
   * Previously recorded trace recording state that will be emitted when
   * CDP session is created.
   */
  std::optional<jsinspector_modern::tracing::TraceRecordingState> stashedTraceRecordingState_;

  friend HybridBase;
};
} // namespace facebook::react
