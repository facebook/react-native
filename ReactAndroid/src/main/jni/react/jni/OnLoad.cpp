// Copyright 2004-present Facebook. All Rights Reserved.

#include <android/asset_manager_jni.h>
#include <android/input.h>
#include <fb/log.h>
#include <fb/glog_init.h>
#include <folly/json.h>
#include <jni/Countable.h>
#include <jni/Environment.h>
#include <jni/fbjni.h>
#include <jni/LocalReference.h>
#include <jni/LocalString.h>
#include <jni/WeakReference.h>
#include <jni/fbjni/Exceptions.h>
#include <react/Bridge.h>
#include <react/Executor.h>
#include <react/JSCExecutor.h>
#include <react/JSModulesUnbundle.h>
#include <react/MethodCall.h>
#include <react/Platform.h>
#include "JExecutorToken.h"
#include "JExecutorTokenFactory.h"
#include "JNativeRunnable.h"
#include "JSLoader.h"
#include "ReadableNativeArray.h"
#include "ProxyExecutor.h"
#include "OnLoad.h"
#include "JMessageQueueThread.h"
#include "JniJSModulesUnbundle.h"
#include "JSLogging.h"
#include "JSCPerfLogging.h"
#include "WebWorkers.h"
#include <algorithm>

#ifdef WITH_FBSYSTRACE
#include <fbsystrace.h>
using fbsystrace::FbSystraceSection;
#endif

using namespace facebook::jni;

namespace facebook {
namespace react {

static jclass gReadableNativeMapClass;
static jmethodID gReadableNativeMapCtor;

namespace exceptions {

static const char *gUnexpectedNativeTypeExceptionClass =
  "com/facebook/react/bridge/UnexpectedNativeTypeException";

template <typename T>
void throwIfObjectAlreadyConsumed(const T& t, const char* msg) {
  if (t->isConsumed) {
    throwNewJavaException("com/facebook/react/bridge/ObjectAlreadyConsumedException", msg);
  }
}

}

struct NativeMap : public Countable {
  // Whether this map has been added to another array or map and no longer has a valid map value
  bool isConsumed = false;
  folly::dynamic map = folly::dynamic::object;
};

struct ReadableNativeMapKeySetIterator : public Countable {
  folly::dynamic::const_item_iterator iterator;
  RefPtr<NativeMap> mapRef;

  ReadableNativeMapKeySetIterator(folly::dynamic::const_item_iterator&& it,
                                  const RefPtr<NativeMap>& mapRef_)
    : iterator(std::move(it))
    , mapRef(mapRef_) {}
};

static jobject createReadableNativeMapWithContents(JNIEnv* env, folly::dynamic map) {
  if (map.isNull()) {
    return nullptr;
  }

  if (!map.isObject()) {
    throwNewJavaException(exceptions::gUnexpectedNativeTypeExceptionClass,
                          "expected Map, got a %s", map.typeName());
  }

  jobject jnewMap = env->NewObject(gReadableNativeMapClass, gReadableNativeMapCtor);
  if (env->ExceptionCheck()) {
    return nullptr;
  }
  auto nativeMap = extractRefPtr<NativeMap>(env, jnewMap);
  nativeMap->map = std::move(map);
  return jnewMap;
}

namespace type {

static jclass gReadableReactType;
static jobject gTypeNullValue;
static jobject gTypeBooleanValue;
static jobject gTypeNumberValue;
static jobject gTypeStringValue;
static jobject gTypeMapValue;
static jobject gTypeArrayValue;

static jobject getTypeValue(JNIEnv* env, const char* fieldName) {
  jfieldID fieldID = env->GetStaticFieldID(
    gReadableReactType, fieldName, "Lcom/facebook/react/bridge/ReadableType;");
  jobject typeValue = env->GetStaticObjectField(gReadableReactType, fieldID);
  return env->NewGlobalRef(typeValue);
}

static void initialize(JNIEnv* env) {
  gTypeNullValue = getTypeValue(env, "Null");
  gTypeBooleanValue = getTypeValue(env, "Boolean");
  gTypeNumberValue = getTypeValue(env, "Number");
  gTypeStringValue = getTypeValue(env, "String");
  gTypeMapValue = getTypeValue(env, "Map");
  gTypeArrayValue = getTypeValue(env, "Array");
}

static jobject getType(folly::dynamic::Type type) {
  switch (type) {
    case folly::dynamic::Type::NULLT:
      return type::gTypeNullValue;
    case folly::dynamic::Type::BOOL:
      return type::gTypeBooleanValue;
    case folly::dynamic::Type::DOUBLE:
    case folly::dynamic::Type::INT64:
      return type::gTypeNumberValue;
    case folly::dynamic::Type::STRING:
      return type::gTypeStringValue;
    case folly::dynamic::Type::OBJECT:
      return type::gTypeMapValue;
    case folly::dynamic::Type::ARRAY:
      return type::gTypeArrayValue;
    default:
      throwNewJavaException(exceptions::gUnexpectedNativeTypeExceptionClass, "Unknown type");
  }
}

}

// This attribute exports the ctor symbol, so ReadableNativeArray to be
// constructed from other DSOs.
__attribute__((visibility("default")))
ReadableNativeArray::ReadableNativeArray(folly::dynamic array)
    : HybridBase(std::move(array)) {}

void ReadableNativeArray::mapException(const std::exception& ex) {
  if (dynamic_cast<const folly::TypeError*>(&ex) != nullptr) {
    throwNewJavaException(exceptions::gUnexpectedNativeTypeExceptionClass, ex.what());
  }
}

jint ReadableNativeArray::getSize() {
  return array.size();
}

jboolean ReadableNativeArray::isNull(jint index) {
  return array.at(index).isNull() ? JNI_TRUE : JNI_FALSE;
}

jboolean ReadableNativeArray::getBoolean(jint index) {
  return array.at(index).getBool() ? JNI_TRUE : JNI_FALSE;
}

jdouble ReadableNativeArray::getDouble(jint index) {
  const folly::dynamic& val = array.at(index);
  if (val.isInt()) {
    return val.getInt();
  }
  return val.getDouble();
}

jint ReadableNativeArray::getInt(jint index) {
  auto integer = array.at(index).getInt();
  static_assert(std::is_same<decltype(integer), int64_t>::value,
                "folly::dynamic int is not int64_t");
  jint javaint = static_cast<jint>(integer);
  if (integer != javaint) {
    throwNewJavaException(
      exceptions::gUnexpectedNativeTypeExceptionClass,
      "Value '%lld' doesn't fit into a 32 bit signed int", integer);
  }
  return javaint;
}

const char* ReadableNativeArray::getString(jint index) {
  const folly::dynamic& dyn = array.at(index);
  if (dyn.isNull()) {
    return nullptr;
  }
  return dyn.getString().c_str();
}

jni::local_ref<ReadableNativeArray::jhybridobject> ReadableNativeArray::getArray(jint index) {
  auto& elem = array.at(index);
  if (elem.isNull()) {
    return jni::local_ref<ReadableNativeArray::jhybridobject>(nullptr);
  } else {
    return ReadableNativeArray::newObjectCxxArgs(elem);
  }
}

// Export getMap() so we can workaround constructing ReadableNativeMap
__attribute__((visibility("default")))
jobject ReadableNativeArray::getMap(jint index) {
  return createReadableNativeMapWithContents(Environment::current(), array.at(index));
}

jobject ReadableNativeArray::getType(jint index) {
  return type::getType(array.at(index).type());
}

void ReadableNativeArray::registerNatives() {
  jni::registerNatives("com/facebook/react/bridge/ReadableNativeArray", {
    makeNativeMethod("size", ReadableNativeArray::getSize),
    makeNativeMethod("isNull", ReadableNativeArray::isNull),
    makeNativeMethod("getBoolean", ReadableNativeArray::getBoolean),
    makeNativeMethod("getDouble", ReadableNativeArray::getDouble),
    makeNativeMethod("getInt", ReadableNativeArray::getInt),
    makeNativeMethod("getString", ReadableNativeArray::getString),
    makeNativeMethod("getArray", ReadableNativeArray::getArray),
    makeNativeMethod("getMap", "(I)Lcom/facebook/react/bridge/ReadableNativeMap;",
                     ReadableNativeArray::getMap),
    makeNativeMethod("getType", "(I)Lcom/facebook/react/bridge/ReadableType;",
                     ReadableNativeArray::getType),
  });
}

namespace {

struct WritableNativeArray
    : public jni::HybridClass<WritableNativeArray, ReadableNativeArray> {
  static constexpr const char* kJavaDescriptor = "Lcom/facebook/react/bridge/WritableNativeArray;";

  WritableNativeArray()
      : HybridBase(folly::dynamic::array()) {}

  static local_ref<jhybriddata> initHybrid(alias_ref<jclass>) {
    return makeCxxInstance();
  }

  void pushNull() {
    exceptions::throwIfObjectAlreadyConsumed(this, "Array already consumed");
    array.push_back(nullptr);
  }

  void pushBoolean(jboolean value) {
    exceptions::throwIfObjectAlreadyConsumed(this, "Array already consumed");
    array.push_back(value == JNI_TRUE);
  }

  void pushDouble(jdouble value) {
    exceptions::throwIfObjectAlreadyConsumed(this, "Receiving array already consumed");
    array.push_back(value);
  }

  void pushInt(jint value) {
    exceptions::throwIfObjectAlreadyConsumed(this, "Receiving array already consumed");
    array.push_back(value);
  }

  void pushString(jstring value) {
    if (value == NULL) {
      pushNull();
      return;
    }
    exceptions::throwIfObjectAlreadyConsumed(this, "Receiving array already consumed");
    array.push_back(wrap_alias(value)->toStdString());
  }

  void pushNativeArray(WritableNativeArray* otherArray) {
    if (otherArray == NULL) {
      pushNull();
      return;
    }
    exceptions::throwIfObjectAlreadyConsumed(this, "Receiving array already consumed");
    exceptions::throwIfObjectAlreadyConsumed(otherArray, "Array to push already consumed");
    array.push_back(std::move(otherArray->array));
    otherArray->isConsumed = true;
  }

  void pushNativeMap(jobject jmap) {
    if (jmap == NULL) {
      pushNull();
      return;
    }
    exceptions::throwIfObjectAlreadyConsumed(this, "Receiving array already consumed");
    auto map = extractRefPtr<NativeMap>(Environment::current(), jmap);
    exceptions::throwIfObjectAlreadyConsumed(map, "Map to push already consumed");
    array.push_back(std::move(map->map));
    map->isConsumed = true;
  }

  static void registerNatives() {
    jni::registerNatives("com/facebook/react/bridge/WritableNativeArray", {
        makeNativeMethod("initHybrid", WritableNativeArray::initHybrid),
        makeNativeMethod("pushNull", WritableNativeArray::pushNull),
        makeNativeMethod("pushBoolean", WritableNativeArray::pushBoolean),
        makeNativeMethod("pushDouble", WritableNativeArray::pushDouble),
        makeNativeMethod("pushInt", WritableNativeArray::pushInt),
        makeNativeMethod("pushString", WritableNativeArray::pushString),
        makeNativeMethod("pushNativeArray", WritableNativeArray::pushNativeArray),
        makeNativeMethod("pushNativeMap", "(Lcom/facebook/react/bridge/WritableNativeMap;)V",
                         WritableNativeArray::pushNativeMap),
    });
  }
};

}

namespace map {

static void initialize(JNIEnv* env, jobject obj) {
  auto map = createNew<NativeMap>();
  setCountableForJava(env, obj, std::move(map));
}

static jstring toString(JNIEnv* env, jobject obj) {
  auto nativeMap = extractRefPtr<NativeMap>(env, obj);
  exceptions::throwIfObjectAlreadyConsumed(nativeMap, "Map already consumed");
  LocalString string(
    ("{ NativeMap: " + folly::toJson(nativeMap->map) + " }").c_str());
  return static_cast<jstring>(env->NewLocalRef(string.string()));
}

namespace writable {

static void putNull(JNIEnv* env, jobject obj, jstring key) {
  auto map = extractRefPtr<NativeMap>(env, obj);
  exceptions::throwIfObjectAlreadyConsumed(map, "Receiving map already consumed");
  map->map.insert(fromJString(env, key), nullptr);
}

static void putBoolean(JNIEnv* env, jobject obj, jstring key, jboolean value) {
  auto map = extractRefPtr<NativeMap>(env, obj);
  exceptions::throwIfObjectAlreadyConsumed(map, "Receiving map already consumed");
  map->map.insert(fromJString(env, key), value == JNI_TRUE);
}

static void putDouble(JNIEnv* env, jobject obj, jstring key, jdouble value) {
  auto map = extractRefPtr<NativeMap>(env, obj);
  exceptions::throwIfObjectAlreadyConsumed(map, "Receiving map already consumed");
  map->map.insert(fromJString(env, key), value);
}

static void putInt(JNIEnv* env, jobject obj, jstring key, jint value) {
  auto map = extractRefPtr<NativeMap>(env, obj);
  exceptions::throwIfObjectAlreadyConsumed(map, "Receiving map already consumed");
  map->map.insert(fromJString(env, key), value);
}

static void putString(JNIEnv* env, jobject obj, jstring key, jstring value) {
  if (value == NULL) {
    putNull(env, obj, key);
    return;
  }
  auto map = extractRefPtr<NativeMap>(env, obj);
  exceptions::throwIfObjectAlreadyConsumed(map, "Receiving map already consumed");
  map->map.insert(fromJString(env, key), fromJString(env, value));
}

static void putArray(JNIEnv* env, jobject obj, jstring key,
                     WritableNativeArray::jhybridobject value) {
  if (value == NULL) {
    putNull(env, obj, key);
    return;
  }
  auto parentMap = extractRefPtr<NativeMap>(env, obj);
  exceptions::throwIfObjectAlreadyConsumed(parentMap, "Receiving map already consumed");
  auto arrayValue = cthis(wrap_alias(value));
  exceptions::throwIfObjectAlreadyConsumed(arrayValue, "Array to put already consumed");
  parentMap->map.insert(fromJString(env, key), std::move(arrayValue->array));
  arrayValue->isConsumed = true;
}

static void putMap(JNIEnv* env, jobject obj, jstring key, jobject value) {
  if (value == NULL) {
    putNull(env, obj, key);
    return;
  }
  auto parentMap = extractRefPtr<NativeMap>(env, obj);
  exceptions::throwIfObjectAlreadyConsumed(parentMap, "Receiving map already consumed");
  auto mapValue = extractRefPtr<NativeMap>(env, value);
  exceptions::throwIfObjectAlreadyConsumed(mapValue, "Map to put already consumed");
  parentMap->map.insert(fromJString(env, key), std::move(mapValue->map));
  mapValue->isConsumed = true;
}

static void mergeMap(JNIEnv* env, jobject obj, jobject source) {
  auto sourceMap = extractRefPtr<NativeMap>(env, source);
  exceptions::throwIfObjectAlreadyConsumed(sourceMap, "Source map already consumed");
  auto destMap = extractRefPtr<NativeMap>(env, obj);
  exceptions::throwIfObjectAlreadyConsumed(destMap, "Destination map already consumed");

  // std::map#insert doesn't overwrite the value, therefore we need to clean values for keys
  // that already exists before merging dest map into source map
  for (auto sourceIt : sourceMap->map.items()) {
    destMap->map.erase(sourceIt.first);
    destMap->map.insert(std::move(sourceIt.first), std::move(sourceIt.second));
  }
}

} // namespace writable

namespace readable {

static const char *gNoSuchKeyExceptionClass = "com/facebook/react/bridge/NoSuchKeyException";

static jboolean hasKey(JNIEnv* env, jobject obj, jstring keyName) {
  auto nativeMap = extractRefPtr<NativeMap>(env, obj);
  auto& map = nativeMap->map;
  bool found = map.find(fromJString(env, keyName)) != map.items().end();
  return found ? JNI_TRUE : JNI_FALSE;
}

static const folly::dynamic& getMapValue(JNIEnv* env, jobject obj, jstring keyName) {
  auto nativeMap = extractRefPtr<NativeMap>(env, obj);
  std::string key = fromJString(env, keyName);
  try {
    return nativeMap->map.at(key);
  } catch (const std::out_of_range& ex) {
    throwNewJavaException(gNoSuchKeyExceptionClass, ex.what());
  }
}

static jboolean isNull(JNIEnv* env, jobject obj, jstring keyName) {
  return getMapValue(env, obj, keyName).isNull() ? JNI_TRUE : JNI_FALSE;
}

static jboolean getBooleanKey(JNIEnv* env, jobject obj, jstring keyName) {
  try {
    return getMapValue(env, obj, keyName).getBool() ? JNI_TRUE : JNI_FALSE;
  } catch (const folly::TypeError& ex) {
    throwNewJavaException(exceptions::gUnexpectedNativeTypeExceptionClass, ex.what());
  }
}

static jdouble getDoubleKey(JNIEnv* env, jobject obj, jstring keyName) {
  const folly::dynamic& val = getMapValue(env, obj, keyName);
  if (val.isInt()) {
    return val.getInt();
  }
  try {
    return val.getDouble();
  } catch (const folly::TypeError& ex) {
    throwNewJavaException(exceptions::gUnexpectedNativeTypeExceptionClass, ex.what());
  }
}

static jint getIntKey(JNIEnv* env, jobject obj, jstring keyName) {
  try {
    auto integer = getMapValue(env, obj, keyName).getInt();
    jint javaint = static_cast<jint>(integer);
    if (integer != javaint) {
      throwNewJavaException(
        exceptions::gUnexpectedNativeTypeExceptionClass,
        "Value '%lld' doesn't fit into a 32 bit signed int", integer);
    }
    return javaint;
  } catch (const folly::TypeError& ex) {
    throwNewJavaException(exceptions::gUnexpectedNativeTypeExceptionClass, ex.what());
  }
}

static jstring getStringKey(JNIEnv* env, jobject obj, jstring keyName) {
  const folly::dynamic& val = getMapValue(env, obj, keyName);
  if (val.isNull()) {
    return nullptr;
  }
  try {
    LocalString value(val.getString().c_str());
    return static_cast<jstring>(env->NewLocalRef(value.string()));
  } catch (const folly::TypeError& ex) {
    throwNewJavaException(exceptions::gUnexpectedNativeTypeExceptionClass, ex.what());
  }
}

static jni::local_ref<ReadableNativeArray::jhybridobject> getArrayKey(
    jni::alias_ref<jobject> obj, jstring keyName) {
  auto& value = getMapValue(Environment::current(), obj.get(), keyName);
  if (value.isNull()) {
    return jni::local_ref<ReadableNativeArray::jhybridobject>(nullptr);
  } else {
    return ReadableNativeArray::newObjectCxxArgs(value);
  }
}

static jobject getMapKey(JNIEnv* env, jobject obj, jstring keyName) {
  return createReadableNativeMapWithContents(env, getMapValue(env, obj, keyName));
}

static jobject getValueType(JNIEnv* env, jobject obj, jstring keyName) {
  return type::getType(getMapValue(env, obj, keyName).type());
}

} // namespace readable

namespace iterator {

static void initialize(JNIEnv* env, jobject obj, jobject nativeMapObj) {
  auto nativeMap = extractRefPtr<NativeMap>(env, nativeMapObj);
  auto mapIterator = createNew<ReadableNativeMapKeySetIterator>(
    nativeMap->map.items().begin(), nativeMap);
  setCountableForJava(env, obj, std::move(mapIterator));
}

static jboolean hasNextKey(JNIEnv* env, jobject obj) {
  auto nativeIterator = extractRefPtr<ReadableNativeMapKeySetIterator>(env, obj);
  return ((nativeIterator->iterator != nativeIterator->mapRef.get()->map.items().end())
          ? JNI_TRUE : JNI_FALSE);
}

static jstring getNextKey(JNIEnv* env, jobject obj) {
  auto nativeIterator = extractRefPtr<ReadableNativeMapKeySetIterator>(env, obj);
  if (JNI_FALSE == hasNextKey(env, obj)) {
    throwNewJavaException("com/facebook/react/bridge/InvalidIteratorException",
                          "No such element exists");
  }
  LocalString value(nativeIterator->iterator->first.c_str());
  ++nativeIterator->iterator;
  return static_cast<jstring>(env->NewLocalRef(value.string()));
}

} // namespace iterator
} // namespace map

namespace {

namespace runnable {

struct NativeRunnable : public Countable {
  std::function<void()> callable;
};

static jclass gNativeRunnableClass;
static jmethodID gNativeRunnableCtor;

static LocalReference<jobject> createNativeRunnable(JNIEnv* env, decltype(NativeRunnable::callable)&& callable) {
  LocalReference<jobject> jRunnable{env->NewObject(gNativeRunnableClass, gNativeRunnableCtor)};
  if (env->ExceptionCheck()) {
    return nullptr;
  }
  auto nativeRunnable = createNew<NativeRunnable>();
  nativeRunnable->callable = std::move(callable);
  setCountableForJava(env, jRunnable.get(), std::move(nativeRunnable));
  return jRunnable;
}

static void run(JNIEnv* env, jobject jNativeRunnable) {
  auto nativeRunnable = extractRefPtr<NativeRunnable>(env, jNativeRunnable);
  nativeRunnable->callable();
}

} // namespace runnable

namespace queue {

static jmethodID gRunOnQueueThreadMethod;

static void enqueueNativeRunnableOnQueue(JNIEnv* env, jobject callbackQueueThread, jobject nativeRunnable) {
  env->CallVoidMethod(callbackQueueThread, gRunOnQueueThreadMethod, nativeRunnable);
}

} // namespace queue

namespace bridge {

static jmethodID gCallbackMethod;
static jmethodID gOnBatchCompleteMethod;
static jmethodID gOnExecutorUnregisteredMethod;
static jmethodID gLogMarkerMethod;

struct CountableBridge : Bridge, Countable {
  using Bridge::Bridge;
};

static void logMarker(const std::string& marker) {
  JNIEnv* env = Environment::current();
  jclass markerClass = env->FindClass("com/facebook/react/bridge/ReactMarker");
  jstring jmarker = env->NewStringUTF(marker.c_str());
  env->CallStaticVoidMethod(markerClass, gLogMarkerMethod, jmarker);
  env->DeleteLocalRef(markerClass);
  env->DeleteLocalRef(jmarker);
}

static void makeJavaCall(JNIEnv* env, ExecutorToken executorToken, jobject callback, const MethodCall& call) {
  if (call.arguments.isNull()) {
    return;
  }

  #ifdef WITH_FBSYSTRACE
  if (call.callId != -1) {
    fbsystrace_end_async_flow(TRACE_TAG_REACT_APPS, "native", call.callId);
  }
  #endif

  auto newArray = ReadableNativeArray::newObjectCxxArgs(std::move(call.arguments));
  env->CallVoidMethod(
      callback,
      gCallbackMethod,
      static_cast<JExecutorTokenHolder*>(executorToken.getPlatformExecutorToken().get())->getJobj(),
      call.moduleId,
      call.methodId,
      newArray.get());
}

static void signalBatchComplete(JNIEnv* env, jobject callback) {
  env->CallVoidMethod(callback, gOnBatchCompleteMethod);
}

class PlatformBridgeCallback : public BridgeCallback {
public:
  PlatformBridgeCallback(
      RefPtr<WeakReference> weakCallback_,
      RefPtr<WeakReference> weakCallbackQueueThread_) :
    weakCallback_(std::move(weakCallback_)),
    weakCallbackQueueThread_(std::move(weakCallbackQueueThread_)) {}

  void executeCallbackOnCallbackQueueThread(std::function<void(ResolvedWeakReference&)>&& runnable) {
    auto env = Environment::current();
    if (env->ExceptionCheck()) {
      FBLOGW("Dropped callback because of pending exception");
      return;
    }

    ResolvedWeakReference callbackQueueThread(weakCallbackQueueThread_);
    if (!callbackQueueThread) {
      FBLOGW("Dropped callback because callback queue thread went away");
      return;
    }

    auto runnableWrapper = std::bind([weakCallback=weakCallback_] (std::function<void(ResolvedWeakReference&)>& runnable) {
      auto env = Environment::current();
      if (env->ExceptionCheck()) {
        FBLOGW("Dropped calls because of pending exception");
        return;
      }
      ResolvedWeakReference callback(weakCallback);
      if (callback) {
        runnable(callback);
      }
    }, std::move(runnable));

    auto jNativeRunnable = runnable::createNativeRunnable(env, std::move(runnableWrapper));
    queue::enqueueNativeRunnableOnQueue(env, callbackQueueThread, jNativeRunnable.get());
  }

  virtual void onCallNativeModules(
      ExecutorToken executorToken,
      const std::string& callJSON,
      bool isEndOfBatch) override {
    executeCallbackOnCallbackQueueThread([executorToken, callJSON, isEndOfBatch] (ResolvedWeakReference& callback) {
      JNIEnv* env = Environment::current();
      for (auto& call : react::parseMethodCalls(callJSON)) {
        makeJavaCall(env, executorToken, callback, call);
        if (env->ExceptionCheck()) {
          return;
        }
      }
      if (isEndOfBatch) {
        signalBatchComplete(env, callback);
      }
    });
  }

  virtual void onExecutorUnregistered(ExecutorToken executorToken) override {
    executeCallbackOnCallbackQueueThread([executorToken] (ResolvedWeakReference& callback) {
      JNIEnv *env = Environment::current();
      env->CallVoidMethod(
          callback,
          gOnExecutorUnregisteredMethod,
          static_cast<JExecutorTokenHolder*>(executorToken.getPlatformExecutorToken().get())->getJobj());
    });
  }
private:
  RefPtr<WeakReference> weakCallback_;
  RefPtr<WeakReference> weakCallbackQueueThread_;
};

static void create(JNIEnv* env, jobject obj, jobject executor, jobject callback,
                   jobject callbackQueueThread) {
  auto weakCallback = createNew<WeakReference>(callback);
  auto weakCallbackQueueThread = createNew<WeakReference>(callbackQueueThread);
  auto bridgeCallback = folly::make_unique<PlatformBridgeCallback>(weakCallback, weakCallbackQueueThread);
  auto nativeExecutorFactory = extractRefPtr<CountableJSExecutorFactory>(env, executor);
  auto executorTokenFactory = folly::make_unique<JExecutorTokenFactory>();
  auto bridge = createNew<CountableBridge>(nativeExecutorFactory.get(), std::move(executorTokenFactory), std::move(bridgeCallback));
  setCountableForJava(env, obj, std::move(bridge));
}

static void destroy(JNIEnv* env, jobject jbridge) {
  auto bridge = extractRefPtr<CountableBridge>(env, jbridge);
  try {
    bridge->destroy();
  } catch (...) {
    translatePendingCppExceptionToJavaException();
  }
}

static void loadApplicationScript(
    const RefPtr<CountableBridge>& bridge,
    const std::string& script,
    const std::string& sourceUri) {
  try {
    bridge->loadApplicationScript(script, sourceUri);
  } catch (...) {
    translatePendingCppExceptionToJavaException();
  }
}

static void loadApplicationUnbundle(
    const RefPtr<CountableBridge>& bridge,
    AAssetManager *assetManager,
    const std::string& startupCode,
    const std::string& startupFileName) {
  try {
    bridge->loadApplicationUnbundle(
      std::unique_ptr<JSModulesUnbundle>(
        new JniJSModulesUnbundle(assetManager, startupFileName)),
      startupCode,
      startupFileName);
  } catch (...) {
    translatePendingCppExceptionToJavaException();
  }
}

static void loadScriptFromAssets(JNIEnv* env, jobject obj, jobject assetManager,
                                 jstring assetName) {
  jclass markerClass = env->FindClass("com/facebook/react/bridge/ReactMarker");
  auto manager = AAssetManager_fromJava(env, assetManager);
  auto bridge = extractRefPtr<CountableBridge>(env, obj);
  auto assetNameStr = fromJString(env, assetName);

  env->CallStaticVoidMethod(markerClass, gLogMarkerMethod, env->NewStringUTF("loadScriptFromAssets_start"));
  auto script = react::loadScriptFromAssets(manager, assetNameStr);
  #ifdef WITH_FBSYSTRACE
  FbSystraceSection s(TRACE_TAG_REACT_CXX_BRIDGE, "reactbridge_jni_"
    "loadApplicationScript",
    "assetName", assetNameStr);
  #endif

  env->CallStaticVoidMethod(markerClass, gLogMarkerMethod, env->NewStringUTF("loadScriptFromAssets_read"));
  if (JniJSModulesUnbundle::isUnbundle(manager, assetNameStr)) {
    loadApplicationUnbundle(bridge, manager, script, assetNameStr);
  } else {
    loadApplicationScript(bridge, script, "file://" + assetNameStr);
  }
  if (env->ExceptionCheck()) {
    return;
  }
  env->CallStaticVoidMethod(markerClass, gLogMarkerMethod, env->NewStringUTF("loadScriptFromAssets_done"));
}

static void loadScriptFromFile(JNIEnv* env, jobject obj, jstring fileName, jstring sourceURL) {
  jclass markerClass = env->FindClass("com/facebook/react/bridge/ReactMarker");

  auto bridge = jni::extractRefPtr<CountableBridge>(env, obj);
  auto fileNameStr = fileName == NULL ? "" : fromJString(env, fileName);
  env->CallStaticVoidMethod(markerClass, gLogMarkerMethod, env->NewStringUTF("loadScriptFromFile_start"));
  auto script = fileName == NULL ? "" : react::loadScriptFromFile(fileNameStr);
  #ifdef WITH_FBSYSTRACE
  auto sourceURLStr = sourceURL == NULL ? fileNameStr : fromJString(env, sourceURL);
  FbSystraceSection s(TRACE_TAG_REACT_CXX_BRIDGE, "reactbridge_jni_"
    "loadApplicationScript",
    "sourceURL", sourceURLStr);
  #endif
  env->CallStaticVoidMethod(markerClass, gLogMarkerMethod, env->NewStringUTF("loadScriptFromFile_read"));
  loadApplicationScript(bridge, script, jni::fromJString(env, sourceURL));
  if (env->ExceptionCheck()) {
    return;
  }
  env->CallStaticVoidMethod(markerClass, gLogMarkerMethod, env->NewStringUTF("loadScriptFromFile_exec"));
}

static void callFunction(JNIEnv* env, jobject obj, JExecutorToken::jhybridobject jExecutorToken, jint moduleId, jint methodId,
                         NativeArray::jhybridobject args, jstring tracingName) {
  auto bridge = extractRefPtr<CountableBridge>(env, obj);
  auto arguments = cthis(wrap_alias(args));
  try {
    bridge->callFunction(
      cthis(wrap_alias(jExecutorToken))->getExecutorToken(wrap_alias(jExecutorToken)),
      folly::to<std::string>(moduleId),
      folly::to<std::string>(methodId),
      std::move(arguments->array),
      fromJString(env, tracingName)
    );
  } catch (...) {
    translatePendingCppExceptionToJavaException();
  }
}

static void invokeCallback(JNIEnv* env, jobject obj, JExecutorToken::jhybridobject jExecutorToken, jint callbackId,
                           NativeArray::jhybridobject args) {
  auto bridge = extractRefPtr<CountableBridge>(env, obj);
  auto arguments = cthis(wrap_alias(args));
  try {
    bridge->invokeCallback(
      cthis(wrap_alias(jExecutorToken))->getExecutorToken(wrap_alias(jExecutorToken)),
      (double) callbackId,
      std::move(arguments->array)
    );
  } catch (...) {
    translatePendingCppExceptionToJavaException();
  }
}

static void setGlobalVariable(JNIEnv* env, jobject obj, jstring propName, jstring jsonValue) {
  auto bridge = extractRefPtr<CountableBridge>(env, obj);
  bridge->setGlobalVariable(fromJString(env, propName), fromJString(env, jsonValue));
}

static jlong getJavaScriptContext(JNIEnv *env, jobject obj) {
  auto bridge = extractRefPtr<CountableBridge>(env, obj);
  return (uintptr_t) bridge->getJavaScriptContext();
}

static jobject getMainExecutorToken(JNIEnv* env, jobject obj) {
  auto bridge = extractRefPtr<CountableBridge>(env, obj);
  auto token = bridge->getMainExecutorToken();
  return static_cast<JExecutorTokenHolder*>(token.getPlatformExecutorToken().get())->getJobj();
}

static jboolean supportsProfiling(JNIEnv* env, jobject obj) {
  auto bridge = extractRefPtr<CountableBridge>(env, obj);
  return bridge->supportsProfiling() ? JNI_TRUE : JNI_FALSE;
}

static void startProfiler(JNIEnv* env, jobject obj, jstring title) {
  auto bridge = extractRefPtr<CountableBridge>(env, obj);
  bridge->startProfiler(fromJString(env, title));
}

static void stopProfiler(JNIEnv* env, jobject obj, jstring title, jstring filename) {
  auto bridge = extractRefPtr<CountableBridge>(env, obj);
  bridge->stopProfiler(fromJString(env, title), fromJString(env, filename));
}

static void handleMemoryPressureModerate(JNIEnv* env, jobject obj) {
  auto bridge = extractRefPtr<CountableBridge>(env, obj);
  bridge->handleMemoryPressureModerate();
}

static void handleMemoryPressureCritical(JNIEnv* env, jobject obj) {
  auto bridge = extractRefPtr<CountableBridge>(env, obj);
  bridge->handleMemoryPressureCritical();
}

} // namespace bridge

namespace executors {

std::string getDeviceCacheDir() {
  // Get the Application Context object
  auto getApplicationClass = findClassLocal(
                              "com/facebook/react/common/ApplicationHolder");
  auto getApplicationMethod = getApplicationClass->getStaticMethod<jobject()>(
                              "getApplication",
                              "()Landroid/app/Application;"
                              );
  auto application = getApplicationMethod(getApplicationClass);

  // Get getCacheDir() from the context
  auto getCacheDirMethod = findClassLocal("android/app/Application")
                            ->getMethod<jobject()>("getCacheDir",
                                                   "()Ljava/io/File;"
                                                  );
  auto cacheDirObj = getCacheDirMethod(application);

  // Call getAbsolutePath() on the returned File object
  auto getAbsolutePathMethod = findClassLocal("java/io/File")
                                ->getMethod<jstring()>("getAbsolutePath");
  return getAbsolutePathMethod(cacheDirObj)->toStdString();
}

struct CountableJSCExecutorFactory : CountableJSExecutorFactory  {
public:
  CountableJSCExecutorFactory(folly::dynamic jscConfig) : m_jscConfig(jscConfig) {}
  virtual std::unique_ptr<JSExecutor> createJSExecutor(Bridge *bridge) override {
    return JSCExecutorFactory(getDeviceCacheDir(), m_jscConfig).createJSExecutor(bridge);
  }

private:
  folly::dynamic m_jscConfig;
};

static void createJSCExecutor(JNIEnv *env, jobject obj, jobject jscConfig) {
  auto nativeMap = extractRefPtr<NativeMap>(env, jscConfig);
  exceptions::throwIfObjectAlreadyConsumed(nativeMap, "Map to push already consumed");
  auto executor = createNew<CountableJSCExecutorFactory>(std::move(nativeMap->map));
  nativeMap->isConsumed = true;
  setCountableForJava(env, obj, std::move(executor));
}

static void createProxyExecutor(JNIEnv *env, jobject obj, jobject executorInstance) {
  auto executor =
    createNew<ProxyExecutorOneTimeFactory>(jni::make_global(jni::adopt_local(executorInstance)));
  setCountableForJava(env, obj, std::move(executor));
}

} // namespace executors

}

jmethodID getLogMarkerMethod() {
  return bridge::gLogMarkerMethod;
}

extern "C" JNIEXPORT jint JNI_OnLoad(JavaVM* vm, void* reserved) {
  return initialize(vm, [] {
    facebook::gloginit::initialize();
    // Inject some behavior into react/
    ReactMarker::logMarker = bridge::logMarker;
    WebWorkerUtil::createWebWorkerThread = WebWorkers::createWebWorkerThread;
    WebWorkerUtil::loadScriptFromAssets =
      [] (const std::string& assetName) {
        return loadScriptFromAssets(assetName);
      };
    WebWorkerUtil::loadScriptFromNetworkSync = WebWorkers::loadScriptFromNetworkSync;
    MessageQueues::getCurrentMessageQueueThread =
      [] {
        return std::unique_ptr<MessageQueueThread>(
            JMessageQueueThread::currentMessageQueueThread().release());
      };
    PerfLogging::installNativeHooks = addNativePerfLoggingHooks;
    JSLogging::nativeHook = nativeLoggingHook;

    // get the current env
    JNIEnv* env = Environment::current();

    auto readableTypeClass = findClassLocal("com/facebook/react/bridge/ReadableType");
    type::gReadableReactType = (jclass)env->NewGlobalRef(readableTypeClass.get());
    type::initialize(env);

    NativeArray::registerNatives();
    ReadableNativeArray::registerNatives();
    WritableNativeArray::registerNatives();
    JNativeRunnable::registerNatives();
    registerJSLoaderNatives();

    registerNatives("com/facebook/react/bridge/NativeMap", {
        makeNativeMethod("initialize", map::initialize),
        makeNativeMethod("toString", map::toString),
    });

    jclass readableMapClass = env->FindClass("com/facebook/react/bridge/ReadableNativeMap");
    gReadableNativeMapClass = (jclass)env->NewGlobalRef(readableMapClass);
    gReadableNativeMapCtor = env->GetMethodID(readableMapClass, "<init>", "()V");
    wrap_alias(readableMapClass)->registerNatives({
        makeNativeMethod("hasKey", map::readable::hasKey),
        makeNativeMethod("isNull", map::readable::isNull),
        makeNativeMethod("getBoolean", map::readable::getBooleanKey),
        makeNativeMethod("getDouble", map::readable::getDoubleKey),
        makeNativeMethod("getInt", map::readable::getIntKey),
        makeNativeMethod("getString", map::readable::getStringKey),
        makeNativeMethod("getArray", map::readable::getArrayKey),
        makeNativeMethod(
          "getMap", "(Ljava/lang/String;)Lcom/facebook/react/bridge/ReadableNativeMap;",
          map::readable::getMapKey),
        makeNativeMethod(
          "getType", "(Ljava/lang/String;)Lcom/facebook/react/bridge/ReadableType;",
          map::readable::getValueType),
    });

    registerNatives("com/facebook/react/bridge/WritableNativeMap", {
        makeNativeMethod("putNull", map::writable::putNull),
        makeNativeMethod("putBoolean", map::writable::putBoolean),
        makeNativeMethod("putDouble", map::writable::putDouble),
        makeNativeMethod("putInt", map::writable::putInt),
        makeNativeMethod("putString", map::writable::putString),
        makeNativeMethod("putNativeArray", map::writable::putArray),
        makeNativeMethod(
          "putNativeMap", "(Ljava/lang/String;Lcom/facebook/react/bridge/WritableNativeMap;)V",
          map::writable::putMap),
        makeNativeMethod(
          "mergeNativeMap", "(Lcom/facebook/react/bridge/ReadableNativeMap;)V",
          map::writable::mergeMap)
    });

    registerNatives("com/facebook/react/bridge/ReadableNativeMap$ReadableNativeMapKeySetIterator", {
      makeNativeMethod("initialize", "(Lcom/facebook/react/bridge/ReadableNativeMap;)V",
                       map::iterator::initialize),
      makeNativeMethod("hasNextKey", map::iterator::hasNextKey),
      makeNativeMethod("nextKey", map::iterator::getNextKey),
    });

    registerNatives("com/facebook/react/bridge/JSCJavaScriptExecutor", {
      makeNativeMethod("initialize", "(Lcom/facebook/react/bridge/WritableNativeMap;)V",
        executors::createJSCExecutor),
    });

    registerNatives("com/facebook/react/bridge/ProxyJavaScriptExecutor", {
        makeNativeMethod(
          "initialize", "(Lcom/facebook/react/bridge/JavaJSExecutor;)V",
          executors::createProxyExecutor),
    });

    jclass callbackClass = env->FindClass("com/facebook/react/bridge/ReactCallback");
    bridge::gCallbackMethod = env->GetMethodID(callbackClass, "call", "(Lcom/facebook/react/bridge/ExecutorToken;IILcom/facebook/react/bridge/ReadableNativeArray;)V");
    bridge::gOnBatchCompleteMethod = env->GetMethodID(callbackClass, "onBatchComplete", "()V");
    bridge::gOnExecutorUnregisteredMethod = env->GetMethodID(callbackClass, "onExecutorUnregistered", "(Lcom/facebook/react/bridge/ExecutorToken;)V");

    jclass markerClass = env->FindClass("com/facebook/react/bridge/ReactMarker");
    bridge::gLogMarkerMethod = env->GetStaticMethodID(markerClass, "logMarker", "(Ljava/lang/String;)V");

    registerNatives("com/facebook/react/bridge/ReactBridge", {
        makeNativeMethod("initialize", "(Lcom/facebook/react/bridge/JavaScriptExecutor;Lcom/facebook/react/bridge/ReactCallback;Lcom/facebook/react/bridge/queue/MessageQueueThread;)V", bridge::create),
        makeNativeMethod("destroy", bridge::destroy),
        makeNativeMethod(
          "loadScriptFromAssets", "(Landroid/content/res/AssetManager;Ljava/lang/String;)V",
          bridge::loadScriptFromAssets),
        makeNativeMethod("loadScriptFromFile", bridge::loadScriptFromFile),
        makeNativeMethod("callFunction", bridge::callFunction),
        makeNativeMethod("invokeCallback", bridge::invokeCallback),
        makeNativeMethod("setGlobalVariable", bridge::setGlobalVariable),
        makeNativeMethod("getMainExecutorToken", "()Lcom/facebook/react/bridge/ExecutorToken;", bridge::getMainExecutorToken),
        makeNativeMethod("supportsProfiling", bridge::supportsProfiling),
        makeNativeMethod("startProfiler", bridge::startProfiler),
        makeNativeMethod("stopProfiler", bridge::stopProfiler),
        makeNativeMethod("handleMemoryPressureModerate", bridge::handleMemoryPressureModerate),
        makeNativeMethod("handleMemoryPressureCritical", bridge::handleMemoryPressureCritical),
        makeNativeMethod("getJavaScriptContextNativePtrExperimental", bridge::getJavaScriptContext),
    });

    jclass nativeRunnableClass = env->FindClass("com/facebook/react/bridge/queue/NativeRunnableDeprecated");
    runnable::gNativeRunnableClass = (jclass)env->NewGlobalRef(nativeRunnableClass);
    runnable::gNativeRunnableCtor = env->GetMethodID(nativeRunnableClass, "<init>", "()V");
    wrap_alias(nativeRunnableClass)->registerNatives({
        makeNativeMethod("run", runnable::run),
    });

    jclass messageQueueThreadClass =
      env->FindClass("com/facebook/react/bridge/queue/MessageQueueThread");
    queue::gRunOnQueueThreadMethod =
      env->GetMethodID(messageQueueThreadClass, "runOnQueue", "(Ljava/lang/Runnable;)V");
  });
}

} }
