/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JReactHostInspectorTarget.h"

#include <fbjni/NativeRunnable.h>
#include <jsinspector-modern/InspectorFlags.h>
#include <react/jni/JWeakRefUtils.h>
#include <react/jni/SafeReleaseJniRef.h>

using namespace facebook::jni;
using namespace facebook::react::jsinspector_modern;

namespace facebook::react {
JReactHostInspectorTarget::JReactHostInspectorTarget(
    alias_ref<JReactHostInspectorTarget::javaobject> jobj,
    alias_ref<JReactHostImpl> reactHostImpl,
    alias_ref<JExecutor::javaobject> executor)
    : jobj_(make_global(jobj)),
      javaReactHostImpl_(make_global(makeJWeakReference(reactHostImpl))),
      inspectorExecutor_([javaExecutor =
                              // Use a SafeReleaseJniRef because this lambda may
                              // be copied to arbitrary threads.
                          SafeReleaseJniRef(make_global(executor))](
                             std::function<void()>&& callback) mutable {
        auto jrunnable = JNativeRunnable::newObjectCxxArgs(std::move(callback));
        javaExecutor->execute(jrunnable);
      }) {
  auto& inspectorFlags = InspectorFlags::getInstance();
  if (inspectorFlags.getFuseboxEnabled()) {
    inspectorTarget_ = HostTarget::create(*this, inspectorExecutor_);

    inspectorPageId_ = getInspectorInstance().addPage(
        "React Native Bridgeless",
        /* vm */ "",
        [inspectorTargetWeak = std::weak_ptr(inspectorTarget_)](
            std::unique_ptr<IRemoteConnection> remote)
            -> std::unique_ptr<ILocalConnection> {
          if (auto inspectorTarget = inspectorTargetWeak.lock()) {
            return inspectorTarget->connect(std::move(remote));
          }
          // Reject the connection.
          return nullptr;
        },
        {.nativePageReloads = true, .prefersFuseboxFrontend = true});
  }
}

JReactHostInspectorTarget::~JReactHostInspectorTarget() {
  if (inspectorPageId_.has_value()) {
    // Remove the page (terminating all sessions) and destroy the target, both
    // on the inspector queue.
    inspectorExecutor_([inspectorPageId = *inspectorPageId_,
                        inspectorTarget = std::move(inspectorTarget_)]() {
      getInspectorInstance().removePage(inspectorPageId);
      (void)inspectorTarget;
    });
  }
}

local_ref<JReactHostInspectorTarget::jhybriddata>
JReactHostInspectorTarget::initHybrid(
    alias_ref<JReactHostInspectorTarget::jhybridobject> jobj,
    jni::alias_ref<JReactHostImpl> reactHostImpl,
    jni::alias_ref<JExecutor::javaobject> javaExecutor) {
  return makeCxxInstance(jobj, reactHostImpl, javaExecutor);
}

void JReactHostInspectorTarget::sendDebuggerResumeCommand() {
  if (inspectorTarget_) {
    inspectorTarget_->sendCommand(HostCommand::DebuggerResume);
  } else {
    jni::throwNewJavaException(
        "java/lang/IllegalStateException",
        "Cannot send command while the Fusebox backend is not enabled");
  }
}

jsinspector_modern::HostTargetMetadata
JReactHostInspectorTarget::getMetadata() {
  jsinspector_modern::HostTargetMetadata metadata = {
      .integrationName = "Android Bridgeless (ReactHostImpl)",
  };

  if (auto javaReactHostImplStrong = javaReactHostImpl_->get()) {
    auto javaMetadata = javaReactHostImplStrong->getHostMetadata();
    auto getMethod = jni::JMap<jstring, jstring>::javaClassLocal()
                         ->getMethod<jobject(jobject)>("get");

    auto getStringOptional = [&](const std::string& key) {
      auto result = getMethod(javaMetadata, make_jstring(key).get());
      return result ? std::optional<std::string>(result->toString())
                    : std::nullopt;
    };

    metadata.appDisplayName = getStringOptional("appDisplayName");
    metadata.appIdentifier = getStringOptional("appIdentifier");
    metadata.deviceName = getStringOptional("deviceName");
    metadata.platform = getStringOptional("platform");
    metadata.reactNativeVersion = getStringOptional("reactNativeVersion");
  }

  return metadata;
}

void JReactHostInspectorTarget::onReload(const PageReloadRequest& /*request*/) {
  if (auto javaReactHostImplStrong = javaReactHostImpl_->get()) {
    javaReactHostImplStrong->reload("CDP Page.reload");
  }
}

void JReactHostInspectorTarget::onSetPausedInDebuggerMessage(
    const OverlaySetPausedInDebuggerMessageRequest& request) {
  if (auto javaReactHostImplStrong = javaReactHostImpl_->get()) {
    javaReactHostImplStrong->setPausedInDebuggerMessage(request.message);
  }
}

void JReactHostInspectorTarget::unstable_onPerfIssueAdded(
    const PerfIssuePayload& issue) {
  static auto method = javaClassStatic()->getMethod<void(local_ref<jstring>)>(
      "handleNativePerfIssueAdded");
  method(jobj_, make_jstring(issue.name));
}

void JReactHostInspectorTarget::loadNetworkResource(
    const jsinspector_modern::LoadNetworkResourceRequest& params,
    jsinspector_modern::ScopedExecutor<
        jsinspector_modern::NetworkRequestListener> executor) {
  // Construct InspectorNetworkRequestListener (hybrid class) from the C++ side
  // (holding the ScopedExecutor), pass to the delegate.
  auto listener = InspectorNetworkRequestListener::newObjectCxxArgs(executor);

  if (auto javaReactHostImplStrong = javaReactHostImpl_->get()) {
    javaReactHostImplStrong->loadNetworkResource(params.url, listener);
  }
}

HostTarget* JReactHostInspectorTarget::getInspectorTarget() {
  return inspectorTarget_ ? inspectorTarget_.get() : nullptr;
}

bool JReactHostInspectorTarget::startBackgroundTrace() {
  if (inspectorTarget_) {
    return inspectorTarget_->startTracing(tracing::Mode::Background);
  } else {
    jni::throwNewJavaException(
        "java/lang/IllegalStateException",
        "Cannot start Tracing session while the Fusebox backend is not enabled.");
  }
}

tracing::TraceRecordingState JReactHostInspectorTarget::stopTracing() {
  if (inspectorTarget_) {
    return inspectorTarget_->stopTracing();
  } else {
    jni::throwNewJavaException(
        "java/lang/IllegalStateException",
        "Cannot stop Tracing session while the Fusebox backend is not enabled.");
  }
}

jboolean JReactHostInspectorTarget::stopAndMaybeEmitBackgroundTrace() {
  auto capturedTrace = inspectorTarget_->stopTracing();
  if (inspectorTarget_->hasActiveSessionWithFuseboxClient()) {
    inspectorTarget_->emitTraceRecordingForFirstFuseboxClient(
        std::move(capturedTrace));
    return jboolean(true);
  }

  stashTraceRecordingState(std::move(capturedTrace));
  return jboolean(false);
}

void JReactHostInspectorTarget::stopAndDiscardBackgroundTrace() {
  inspectorTarget_->stopTracing();
}

void JReactHostInspectorTarget::stashTraceRecordingState(
    tracing::TraceRecordingState&& state) {
  stashedTraceRecordingState_ = std::move(state);
}

std::optional<tracing::TraceRecordingState> JReactHostInspectorTarget::
    unstable_getTraceRecordingThatWillBeEmittedOnInitialization() {
  auto state = std::move(stashedTraceRecordingState_);
  stashedTraceRecordingState_.reset();
  return state;
}

void JReactHostInspectorTarget::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", JReactHostInspectorTarget::initHybrid),
      makeNativeMethod(
          "sendDebuggerResumeCommand",
          JReactHostInspectorTarget::sendDebuggerResumeCommand),
      makeNativeMethod(
          "startBackgroundTrace",
          JReactHostInspectorTarget::startBackgroundTrace),
      makeNativeMethod(
          "stopAndMaybeEmitBackgroundTrace",
          JReactHostInspectorTarget::stopAndMaybeEmitBackgroundTrace),
      makeNativeMethod(
          "stopAndDiscardBackgroundTrace",
          JReactHostInspectorTarget::stopAndDiscardBackgroundTrace),
      makeNativeMethod(
          "tracingStateAsInt", JReactHostInspectorTarget::tracingState),
  });
}

jint JReactHostInspectorTarget::tracingState() {
  auto state = inspectorTarget_->tracingState();
  return static_cast<jint>(state);
}

} // namespace facebook::react
