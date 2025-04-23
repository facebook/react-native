/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <string>

#include <glog/logging.h>

#include <fb/glog_init.h>
#include <fbjni/fbjni.h>

#include "CatalystInstanceImpl.h"
#include "CxxModuleWrapperBase.h"
#include "InspectorNetworkRequestListener.h"
#include "JInspector.h"
#include "JavaScriptExecutorHolder.h"
#include "ReactInstanceManagerInspectorTarget.h"

#ifndef WITH_GLOGINIT
#define WITH_GLOGINIT 1
#endif

#ifdef WITH_XPLATINIT
#include <fb/xplat_init.h>
#endif

namespace facebook::react {

extern "C" JNIEXPORT jint JNI_OnLoad(JavaVM* vm, void* reserved) {
#ifdef WITH_XPLATINIT
  return facebook::xplat::initialize(vm, [] {
#else
  return jni::initialize(vm, [] {
#endif
#if WITH_GLOGINIT
    gloginit::initialize();
    FLAGS_minloglevel = 0;
#endif
    CatalystInstanceImpl::registerNatives();
    CxxModuleWrapperBase::registerNatives();
    JInspector::registerNatives();
    ReactInstanceManagerInspectorTarget::registerNatives();
    InspectorNetworkRequestListener::registerNatives();
  });
}

} // namespace facebook::react
