// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "CxxModuleWrapper.h"

#include <folly/ScopeGuard.h>

#include <dlfcn.h>

using namespace facebook::jni;
using namespace facebook::xplat::module;

namespace facebook {
namespace react {

jni::local_ref<CxxModuleWrapper::javaobject> CxxModuleWrapper::makeDsoNative(
    jni::alias_ref<jclass>, const std::string& soPath, const std::string& fname) {
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
  auto guard = folly::makeGuard([&] { CHECK(dlclose(handle) == 0); });

  void* sym = dlsym(handle, fname.c_str());
  if (!sym) {
    throwNewJavaException(gJavaLangIllegalArgumentException,
                          "module function %s in shared library %s is not found",
                          fname.c_str(), soPath.c_str());
  }
  auto factory = reinterpret_cast<CxxModule* (*)()>(sym);

  return CxxModuleWrapper::newObjectCxxArgs(std::unique_ptr<CxxModule>((*factory)()));
}

}
}
