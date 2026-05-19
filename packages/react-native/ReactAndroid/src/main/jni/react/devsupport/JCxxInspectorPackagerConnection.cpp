/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JCxxInspectorPackagerConnection.h"

#include <fbjni/NativeRunnable.h>

using namespace facebook::jni;

namespace facebook::react::jsinspector_modern {

JCxxInspectorPackagerConnection::JCxxInspectorPackagerConnection(
    const std::string& url,
    const std::string& deviceName,
    const std::string& packageName,
    alias_ref<JDelegateImpl::javaobject> delegate)
    : cxxImpl_(url, deviceName, packageName, delegate->wrapInUniquePtr()) {}

local_ref<JCxxInspectorPackagerConnection::jhybriddata>
JCxxInspectorPackagerConnection::initHybrid(
    alias_ref<jclass> /*unused*/,
    const std::string& url,
    const std::string& deviceName,
    const std::string& packageName,
    alias_ref<JDelegateImpl::javaobject> delegate) {
  return makeCxxInstance(url, deviceName, packageName, delegate);
}

void JCxxInspectorPackagerConnection::connect() {
  cxxImpl_.connect();
}

void JCxxInspectorPackagerConnection::closeQuietly() {
  cxxImpl_.closeQuietly();
}

void JCxxInspectorPackagerConnection::sendEventToAllConnections(
    const std::string& event) {
  cxxImpl_.sendEventToAllConnections(event);
}

void JCxxInspectorPackagerConnection::registerNatives() {
  registerHybrid(
      {makeNativeMethod(
           "initHybrid", JCxxInspectorPackagerConnection::initHybrid),
       makeNativeMethod("connect", JCxxInspectorPackagerConnection::connect),
       makeNativeMethod(
           "closeQuietly", JCxxInspectorPackagerConnection::closeQuietly),
       makeNativeMethod(
           "sendEventToAllConnections",
           JCxxInspectorPackagerConnection::sendEventToAllConnections)});
}
} // namespace facebook::react::jsinspector_modern
