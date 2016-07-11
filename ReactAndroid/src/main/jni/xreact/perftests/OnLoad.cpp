// Copyright 2004-present Facebook. All Rights Reserved.

#include <fb/log.h>
#include <fb/fbjni.h>
#include <cxxreact/CxxModule.h>
#include <cxxreact/JsArgumentHelpers.h>

#include <mutex>
#include <condition_variable>

namespace facebook {
namespace react {

using facebook::jni::alias_ref;

namespace {

// This is a wrapper around the Java proxy to the javascript module. This
// allows us to call functions on the js module from c++.
class JavaJSModule : public jni::JavaClass<JavaJSModule> {
public:
  static constexpr auto kJavaDescriptor =
    "Lcom/facebook/react/CatalystBridgeBenchmarks$BridgeBenchmarkModule;";

  static void bounceCxx(alias_ref<javaobject> obj, int iters) {
    static auto method = javaClassLocal()->getMethod<void(jint)>("bounceCxx");
    method(obj, iters);
  }

  static void bounceArgsCxx(
      alias_ref<javaobject> obj,
      int iters,
      int a, int b,
      double x, double y,
      const std::string& s, const std::string& t) {
    static auto method =
      javaClassLocal()->getMethod<void(jint, jint, jint, jdouble, jdouble, jstring, jstring)>("bounceArgsCxx");
    method(obj, iters, a, b, x, y, jni::make_jstring(s).get(), jni::make_jstring(t).get());
  }
};

// This is just the test instance itself. Used only to countdown the latch.
class CatalystBridgeBenchmarks : public jni::JavaClass<CatalystBridgeBenchmarks> {
public:
  static constexpr auto kJavaDescriptor =
    "Lcom/facebook/react/CatalystBridgeBenchmarks;";

  static void countDown(alias_ref<javaobject> obj) {
    static auto method = javaClassLocal()->getMethod<void()>("countDown");
    method(obj);
  }
};

// This is the shared data for two cxx bounce threads.
struct Data {
  std::mutex m;
  std::condition_variable cv;
  bool leftActive;
  Data() : leftActive(true) {}
};
Data data;

void runBounce(jni::alias_ref<jclass>, bool isLeft, int iters) {
  for (int i = 0; i < iters; i++) {
    std::unique_lock<std::mutex> lk(data.m);
    data.cv.wait(lk, [&]{ return data.leftActive == isLeft; });
    data.leftActive = !isLeft;
    data.cv.notify_one();
  }
}

static jni::global_ref<JavaJSModule::javaobject> jsModule;
static jni::global_ref<CatalystBridgeBenchmarks::javaobject> javaTestInstance;

class CxxBenchmarkModule : public xplat::module::CxxModule {
public:
  virtual std::string getName() override {
    return "CxxBenchmarkModule";
  }

  virtual auto getConstants() -> std::map<std::string, folly::dynamic> override {
    return std::map<std::string, folly::dynamic>();
  }

  virtual auto getMethods() -> std::vector<Method> override {
    return std::vector<Method>{
      Method("bounce", [this] (folly::dynamic args) {
          this->bounce(xplat::jsArgAsInt(args, 0));
      }),
      Method("bounceArgs", [this] (folly::dynamic args) {
          this->bounceArgs(
            xplat::jsArgAsInt(args, 0),
            xplat::jsArgAsInt(args, 1),
            xplat::jsArgAsInt(args, 2),
            xplat::jsArgAsDouble(args, 3),
            xplat::jsArgAsDouble(args, 4),
            xplat::jsArgAsString(args, 5),
            xplat::jsArgAsString(args, 6));
      }),
    };
  }

  void bounce(int iters) {
    if (iters == 0) {
      CatalystBridgeBenchmarks::countDown(javaTestInstance);
    } else {
      JavaJSModule::bounceCxx(jsModule, iters - 1);
    }
  }

  void bounceArgs(
      int iters,
      int a, int b,
      double x, double y,
      const std::string& s, const std::string& t) {
    if (iters == 0) {
      CatalystBridgeBenchmarks::countDown(javaTestInstance);
    } else {
      JavaJSModule::bounceArgsCxx(jsModule, iters - 1, a, b, x, y, s, t);
    }
  }
};


void setUp(
    alias_ref<CatalystBridgeBenchmarks::javaobject> obj,
    alias_ref<JavaJSModule::javaobject> mod) {
  javaTestInstance = jni::make_global(obj);
  jsModule = jni::make_global(mod);
}

void tearDown(
    alias_ref<CatalystBridgeBenchmarks::javaobject>) {
  javaTestInstance.reset();
  jsModule.reset();
}

}
}
}

extern "C" facebook::xplat::module::CxxModule* CxxBenchmarkModule() {
  return new facebook::react::CxxBenchmarkModule();
}

extern "C" jint JNI_OnLoad(JavaVM* vm, void*) {
  return facebook::jni::initialize(vm, [] {
      facebook::jni::registerNatives(
        "com/facebook/react/CatalystBridgeBenchmarks", {
          makeNativeMethod("runNativeBounce", facebook::react::runBounce),
          makeNativeMethod("nativeSetUp", facebook::react::setUp),
          makeNativeMethod("nativeTearDown", facebook::react::tearDown),
        });
      });
}

