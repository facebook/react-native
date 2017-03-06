// Copyright 2004-present Facebook. All Rights Reserved.

#include "CxxModuleWrapper.h"

#include <fb/fbjni.h>
#include <fb/Environment.h>

#include <folly/ScopeGuard.h>

#include <cxxreact/CxxModule.h>

#include <dlfcn.h>

using namespace facebook::jni;
using namespace facebook::xplat::module;
using namespace facebook::react;

void CxxModuleWrapper::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", CxxModuleWrapper::initHybrid),
    makeNativeMethod("getName", CxxModuleWrapper::getName)
  });
}

CxxModuleWrapper::CxxModuleWrapper(const std::string& soPath, const std::string& fname) {
  // soPath is the path of a library which has already been loaded by
  // java SoLoader.loadLibrary().  So this returns the same handle,
  // and increments the reference counter.  We can't just use
  // dlsym(RTLD_DEFAULT, ...), because that crashes on 4.4.2 and
  // earlier: https://code.google.com/p/android/issues/detail?id=61799
  void* handle = dlopen(soPath.c_str(), RTLD_NOW);
  if (!handle) {
    throwNewJavaException(gJavaLangIllegalArgumentException,
                          "module shared library %s is not found", soPath.c_str());
  }
   // Now, arrange to close the handle so the counter is decremented.
   // The handle will remain valid until java closes it.  There's no
   // way to do this on Android, but that's no reason to be sloppy
   // here.
  auto guard = folly::makeGuard([&] { FBASSERT(dlclose(handle) == 0); });

  void* sym = dlsym(handle, fname.c_str());
  if (!sym) {
    throwNewJavaException(gJavaLangIllegalArgumentException,
                          "module function %s in shared library %s is not found",
                          fname.c_str(), soPath.c_str());
  }
  auto factory = reinterpret_cast<CxxModule* (*)()>(sym);
  module_.reset((*factory)());
}

std::string CxxModuleWrapper::getName() {
  return module_->getName();
}
