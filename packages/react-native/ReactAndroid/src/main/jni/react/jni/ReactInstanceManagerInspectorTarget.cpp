/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ReactInstanceManagerInspectorTarget.h"
#include "SafeReleaseJniRef.h"

#include <fbjni/NativeRunnable.h>
#include <jsinspector-modern/InspectorFlags.h>

#include <optional>

using namespace facebook::jni;
using namespace facebook::react::jsinspector_modern;

namespace facebook::react {

void ReactInstanceManagerInspectorTarget::TargetDelegate::onReload() const {
  auto method = javaClassStatic()->getMethod<void()>("onReload");
  method(self());
}

void ReactInstanceManagerInspectorTarget::TargetDelegate::
    onSetPausedInDebuggerMessage(
        const OverlaySetPausedInDebuggerMessageRequest& request) const {
  auto method = javaClassStatic()->getMethod<void(local_ref<JString>)>(
      "onSetPausedInDebuggerMessage");
  method(self(), request.message ? make_jstring(*request.message) : nullptr);
}

jni::local_ref<jni::JMap<jstring, jstring>>
ReactInstanceManagerInspectorTarget::TargetDelegate::getMetadata() const {
  auto method = javaClassStatic()
                    ->getMethod<jni::local_ref<jni::JMap<jstring, jstring>>()>(
                        "getMetadata");
  return method(self());
}

void ReactInstanceManagerInspectorTarget::TargetDelegate::loadNetworkResource(
    const std::string& url,
    jni::local_ref<InspectorNetworkRequestListener::javaobject> listener)
    const {
  auto method =
      javaClassStatic()
          ->getMethod<void(
              jni::local_ref<JString>,
              jni::local_ref<InspectorNetworkRequestListener::javaobject>)>(
              "loadNetworkResource");
  return method(self(), make_jstring(url), listener);
}

ReactInstanceManagerInspectorTarget::ReactInstanceManagerInspectorTarget(
    jni::alias_ref<ReactInstanceManagerInspectorTarget::jhybridobject> /*jobj*/,
    jni::alias_ref<JExecutor::javaobject> javaExecutor,
    jni::alias_ref<ReactInstanceManagerInspectorTarget::TargetDelegate>
        delegate)
    : delegate_(make_global(delegate)),
      inspectorExecutor_([javaExecutor =
                              // Use a SafeReleaseJniRef because this lambda may
                              // be copied to arbitrary threads.
                          SafeReleaseJniRef(make_global(javaExecutor))](
                             auto callback) mutable {
        auto jrunnable = JNativeRunnable::newObjectCxxArgs(std::move(callback));
        javaExecutor->execute(jrunnable);
      }) {
  auto& inspectorFlags = InspectorFlags::getInstance();

  if (inspectorFlags.getFuseboxEnabled()) {
    inspectorTarget_ = HostTarget::create(*this, inspectorExecutor_);

    inspectorPageId_ = getInspectorInstance().addPage(
        "React Native Bridge",
        /* vm */ "",
        [inspectorTarget =
             inspectorTarget_](std::unique_ptr<IRemoteConnection> remote)
            -> std::unique_ptr<ILocalConnection> {
          return inspectorTarget->connect(std::move(remote));
        },
        {.nativePageReloads = true, .prefersFuseboxFrontend = true});
  }
}

ReactInstanceManagerInspectorTarget::~ReactInstanceManagerInspectorTarget() {
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

jni::local_ref<ReactInstanceManagerInspectorTarget::jhybriddata>
ReactInstanceManagerInspectorTarget::initHybrid(
    jni::alias_ref<jhybridobject> jobj,
    jni::alias_ref<JExecutor::javaobject> javaExecutor,
    jni::alias_ref<
        ReactInstanceManagerInspectorTarget::TargetDelegate::javaobject>
        delegate) {
  return makeCxxInstance(jobj, javaExecutor, delegate);
}

void ReactInstanceManagerInspectorTarget::sendDebuggerResumeCommand() {
  if (inspectorTarget_) {
    inspectorTarget_->sendCommand(HostCommand::DebuggerResume);
  } else {
    jni::throwNewJavaException(
        "java/lang/IllegalStateException",
        "Cannot send command while the Fusebox backend is not enabled");
  }
}

void ReactInstanceManagerInspectorTarget::registerNatives() {
  registerHybrid({
      makeNativeMethod(
          "initHybrid", ReactInstanceManagerInspectorTarget::initHybrid),
      makeNativeMethod(
          "sendDebuggerResumeCommand",
          ReactInstanceManagerInspectorTarget::sendDebuggerResumeCommand),
  });
}

jsinspector_modern::HostTargetMetadata
ReactInstanceManagerInspectorTarget::getMetadata() {
  auto getMethod = jni::JMap<jstring, jstring>::javaClassLocal()
                       ->getMethod<jobject(jobject)>("get");
  auto metadata = delegate_->getMetadata();

  auto getStringOptional = [&](const std::string& key) {
    auto result = getMethod(metadata, make_jstring(key).get());
    return result ? std::optional<std::string>(result->toString())
                  : std::nullopt;
  };

  return {
      .appDisplayName = getStringOptional("appDisplayName"),
      .appIdentifier = getStringOptional("appIdentifier"),
      .deviceName = getStringOptional("deviceName"),
      .integrationName = "Android Bridge (ReactInstanceManagerInspectorTarget)",
      .platform = getStringOptional("platform"),
      .reactNativeVersion = getStringOptional("reactNativeVersion"),
  };
}

void ReactInstanceManagerInspectorTarget::onReload(
    const PageReloadRequest& /*request*/) {
  delegate_->onReload();
}

void ReactInstanceManagerInspectorTarget::onSetPausedInDebuggerMessage(
    const OverlaySetPausedInDebuggerMessageRequest& request) {
  delegate_->onSetPausedInDebuggerMessage(request);
}

void ReactInstanceManagerInspectorTarget::loadNetworkResource(
    const jsinspector_modern::LoadNetworkResourceRequest& params,
    jsinspector_modern::ScopedExecutor<
        jsinspector_modern::NetworkRequestListener> executor) {
  // Construct InspectorNetworkRequestListener (hybrid class) from the C++ side
  // (holding the ScopedExecutor), pass to the delegate.
  auto listener = InspectorNetworkRequestListener::newObjectCxxArgs(executor);

  delegate_->loadNetworkResource(params.url, listener);
}

HostTarget* ReactInstanceManagerInspectorTarget::getInspectorTarget() {
  return inspectorTarget_.get();
}

} // namespace facebook::react
