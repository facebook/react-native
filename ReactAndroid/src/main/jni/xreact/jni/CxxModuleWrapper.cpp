// Copyright 2004-present Facebook. All Rights Reserved.

#include "CxxModuleWrapper.h"

#include <fb/fbjni.h>
#include <fb/Environment.h>
#include <jni/LocalString.h>
#include <jni/Registration.h>

#include <android/log.h>

#include <folly/json.h>
#include <folly/ScopeGuard.h>

#include <iterator>
#include <unordered_set>
#include <dlfcn.h>

#include <cxxreact/JsArgumentHelpers.h>

#include "ReadableNativeArray.h"


using namespace facebook::jni;
using namespace facebook::xplat::module;
using namespace facebook::react;

namespace {

class ExecutorToken : public HybridClass<ExecutorToken> {
public:
  constexpr static const char *const kJavaDescriptor = "Lcom/facebook/react/bridge/ExecutorToken;";
};

class CxxMethodWrapper : public HybridClass<CxxMethodWrapper> {
public:
  constexpr static const char *const kJavaDescriptor =
    "Lcom/facebook/react/cxxbridge/CxxModuleWrapper$MethodWrapper;";

  static local_ref<jhybriddata> initHybrid(alias_ref<jhybridobject>) {
    return makeCxxInstance();
  }

  static void registerNatives() {
    registerHybrid({
      makeNativeMethod("initHybrid", CxxMethodWrapper::initHybrid),
      makeNativeMethod("getType", CxxMethodWrapper::getType),
      makeNativeMethod("invoke",
                       "(Lcom/facebook/react/bridge/CatalystInstance;Lcom/facebook/react/bridge/ExecutorToken;Lcom/facebook/react/bridge/ReadableNativeArray;)V",
                       CxxMethodWrapper::invoke),
    });
  }

  std::string getType() {
    if (method_->func) {
      return "async";
    } else {
      return "sync";
    }
  }

  void invoke(jobject catalystinstance, ExecutorToken::jhybridobject executorToken, NativeArray* args);

  const CxxModule::Method* method_;
};

void CxxMethodWrapper::invoke(jobject jCatalystInstance, ExecutorToken::jhybridobject jExecutorToken, NativeArray* arguments) {
  CxxModule::Callback first;
  CxxModule::Callback second;

  if (!method_->func) {
    throw std::runtime_error(
      folly::to<std::string>("Method ", method_->name,
                             " is synchronous but invoked asynchronously"));
  }

  if (method_->callbacks >= 1) {
    auto catalystInstance = make_global(adopt_local(jCatalystInstance));
    global_ref<ExecutorToken::jhybridobject> executorToken = make_global(jExecutorToken);
    // TODO(10184774): Support ExecutorToken in CxxModules
    static auto sCatalystInstanceInvokeCallback =
      catalystInstance->getClass()->getMethod<void(ExecutorToken::jhybridobject, jint, NativeArray::jhybridobject)>(
        "invokeCallback");

    int id1;

    if (!arguments->array[arguments->array.size() - 1].isInt()) {
      throwNewJavaException(gJavaLangIllegalArgumentException,
                            "Expected callback as last argument");
    }

    if (method_->callbacks == 2) {
        if (!arguments->array[arguments->array.size() - 2].isInt()) {
        throwNewJavaException(gJavaLangIllegalArgumentException,
                              "Expected callback as penultimate argument");
        return;
      }

      id1 = arguments->array[arguments->array.size() - 2].getInt();
      int id2 = arguments->array[arguments->array.size() - 1].getInt();
      second = [catalystInstance, executorToken, id2](std::vector<folly::dynamic> args) mutable {
        folly::dynamic argsArray(std::make_move_iterator(args.begin()),
                                 std::make_move_iterator(args.end()));
        ThreadScope guard;
        sCatalystInstanceInvokeCallback(
          catalystInstance.get(), executorToken.get(), id2,
          ReadableNativeArray::newObjectCxxArgs(std::move(argsArray)).get());
        catalystInstance.reset();
        executorToken.reset();
      };
    } else {
      id1 = arguments->array[arguments->array.size() - 1].getInt();
    }

    first = [catalystInstance, executorToken, id1](std::vector<folly::dynamic> args) mutable {
      folly::dynamic argsArray(std::make_move_iterator(args.begin()),
                               std::make_move_iterator(args.end()));
      ThreadScope guard;
      sCatalystInstanceInvokeCallback(
        catalystInstance.get(), executorToken.get(), id1,
        ReadableNativeArray::newObjectCxxArgs(std::move(argsArray)).get());
      // This is necessary because by the time the lambda's dtor runs,
      // the guard has been destroyed, and it may not be possible to
      // get a JNIEnv* to clean up the captured global_ref.
      catalystInstance.reset();
      executorToken.reset();
    };
  }

  // I've got a few flawed options here.  I can catch C++ exceptions
  // here, and log/convert them to java exceptions.  This lets all the
  // java handling work ok, but the only info I can capture about the
  // C++ exception is the what() string, not the stack.  I can let the
  // C++ exception escape, crashing the app.  This causes the full,
  // accurate C++ stack trace to be added to logcat by debuggerd.  The
  // java state is lost, but in practice, the java stack is always the
  // same in this case since the javascript stack is not visible.  The
  // what() value is also lost.  Finally, I can catch, log the java
  // stack, then rethrow the C++ exception.  In this case I get java
  // and C++ stack data, but the C++ stack is as of the rethrow, not
  // the original throw, both the C++ and java stacks always look the
  // same.
  //
  // I am going with option 2, since that seems like the most useful
  // choice.  It would be nice to be able to get what() and the C++
  // stack.  I'm told that will be possible in the future.  TODO
  // mhorowitz #7128529: convert C++ exceptions to Java

  folly::dynamic dargs = arguments->array;
  dargs.resize(arguments->array.size() - method_->callbacks);

  try {
    method_->func(dargs, first, second);
  } catch (const facebook::xplat::JsArgumentException& ex) {
    throwNewJavaException(gJavaLangIllegalArgumentException, ex.what());
  }
}

}

// CxxModuleWrapper

void CxxModuleWrapper::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", CxxModuleWrapper::initHybrid),
    makeNativeMethod("getName", CxxModuleWrapper::getName),
    makeNativeMethod("getConstantsJson", CxxModuleWrapper::getConstantsJson),
    makeNativeMethod("getMethods", "()Ljava/util/Map;", CxxModuleWrapper::getMethods),
  });

  CxxMethodWrapper::registerNatives();
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
  methods_ = module_->getMethods();
}

std::string CxxModuleWrapper::getName() {
  return module_->getName();
}

std::string CxxModuleWrapper::getConstantsJson() {
  std::map<std::string, folly::dynamic> constants = module_->getConstants();
  folly::dynamic constsobject = folly::dynamic::object;

  for (auto& c : constants) {
    constsobject.insert(std::move(c.first), std::move(c.second));
  }

  return folly::toJson(constsobject);
}

jobject CxxModuleWrapper::getMethods() {
  static auto hashmap = findClassStatic("java/util/HashMap");
  static auto hashmap_put = hashmap->getMethod<jobject(jobject, jobject)>("put");

  auto methods = hashmap->newObject(hashmap->getConstructor<jobject()>());

  std::unordered_set<std::string> names;
  for (const auto& m : methods_) {
    if (names.find(m.name) != names.end()) {
      throwNewJavaException(gJavaLangIllegalArgumentException,
                            "C++ Module %s method name already registered: %s",
                            module_->getName().c_str(), m.name.c_str());
    }
    names.insert(m.name);
    auto name = make_jstring(m.name);
    static auto ctor =
      CxxMethodWrapper::javaClassStatic()->getConstructor<CxxMethodWrapper::jhybridobject()>();
    auto method = CxxMethodWrapper::javaClassStatic()->newObject(ctor);
    cthis(method)->method_ = &m;
    hashmap_put(methods.get(), name.get(), method.get());
  }

  return methods.release();
}
