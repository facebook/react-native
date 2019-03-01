#include <algorithm>
#include <condition_variable>
#include <mutex>
#include <sstream>
#include <string>
#include <folly/json.h>
#include <folly/Exception.h>
#include <folly/Memory.h>
#include <folly/String.h>
#include <folly/Conv.h>
#include <fcntl.h>
#include <sys/time.h>
#include <sys/socket.h>
#include <system_error>
#include <android/log.h>

#if defined(WITH_FB_JSC_TUNING) && defined(__ANDROID__)
#include <jsc_config_android.h>
#endif

#include "Instance.h"
#include "Platform.h"
#include "SystraceSection.h"
#include "JSModulesUnbundle.h"
#include "ModuleRegistry.h"
#include "V8Executor.h"
#include "V8NativeModules.h"
#include "v8.h"
#include "File.h"
#include "libplatform/libplatform.h"

using namespace rnv8;

const char* MODULE_PROLOGUE = "(function(module, exports, require, __filename, __dirname){ ";
const char* MODULE_EPILOGUE = "\n})";

namespace v8 {

#define THROW_RUNTIME_ERROR(INFO) do { \
  LOGW("THROW_RUNTIME_ERROR: %s", INFO); \
  std::throw_with_nested(std::runtime_error(INFO)); \
} while(false)

/*
 * This macro used for define scope for isolate which is created at the time initialization.
 */
#define _ISOLATE_CONTEXT_ENTER Isolate *isolate = GetIsolate(); \
  Isolate::Scope isolate_scope(isolate); \
  HandleScope handle_scope(isolate); \
  Local<Context> context = Local<Context>::New(isolate, m_context); \
  Context::Scope context_scope(context); \

static int s_NumberOfIsolates = 0;
static bool s_PlatformInitialized = false;

#if DEBUG
static void nativeInjectHMRUpdate(const FunctionCallbackInfo<Value> &args) {
  LOGV("V8Executor::nativeInjectHMRUpdate entry");
  SystraceSection s("V8Executor.nativeInjectHMRUpdate");
  if (args.Length() != 2) {
    throw std::invalid_argument("Got wrong number of args");
  }

  Local<String> execJSString = Local<String>::Cast(args[0]);
  Local<String> jsURL = Local<String>::Cast(args[1]);

  //executeScript(args.GetIsolate()->GetCurrentContext(), execJSString);
  LOGV("V8Executor::nativeInjectHMRUpdate exit");
}
#endif

/*
 * This function used to get time taken by native module.
 */
inline void nativePerformanceNow(const FunctionCallbackInfo<Value> &args) {
  LOGV("V8Executor::nativePerformanceNow entry");
  static const int64_t NANOSECONDS_IN_SECOND = 1000000000LL;
  static const int64_t NANOSECONDS_IN_MILLISECOND = 1000000LL;

  // This is equivalent to android.os.SystemClock.elapsedRealtime() in native
  struct timespec now;
  clock_gettime(CLOCK_MONOTONIC_RAW, &now);
  int64_t nano = now.tv_sec * NANOSECONDS_IN_SECOND + now.tv_nsec;
  args.GetReturnValue().Set((nano / (double) NANOSECONDS_IN_MILLISECOND));
  LOGV("V8Executor::nativePerformanceNow exit");
}

// Native JS Function Hooks
template<void (V8Executor::*method)(const FunctionCallbackInfo<Value> &args)>
void V8Executor::installNativeFunctionHook(Local<ObjectTemplate> global, const char *name) {
  LOGV("V8Executor::installNativeFunctionHook entry");
  struct funcWrapper {
    static void call(const v8::FunctionCallbackInfo<v8::Value> &args) {
      Isolate *isolate = args.GetIsolate();
      HandleScope handle_scope(isolate);
      Local<Context> context = isolate->GetCurrentContext();
      auto ptr = context->GetAlignedPointerFromEmbedderData(1);
      V8Executor *executor = static_cast<V8Executor *>(ptr);
      if (!executor) {
        THROW_RUNTIME_ERROR("Get Empty Context in installNativeHook!");
      }
      (executor->*method)(std::move(args));
    }
  };
  global->Set(toLocalString(GetIsolate(), name), FunctionTemplate::New(GetIsolate(), funcWrapper::call));
  LOGV("V8Executor::installNativeFunctionHook exit");
}

// Native Static JS Function Hooks
template<void(*method)(const v8::FunctionCallbackInfo<Value> &args)>
void installGlobalFunction(Isolate *isolate, Local<ObjectTemplate> global, const char *name) {
  LOGV("V8Executor::installGlobalFunction entry");
  global->Set(toLocalString(isolate, name), FunctionTemplate::New(isolate, method));
  LOGV("V8Executor::installGlobalFunction exit");
}

template<Global<Value>(V8Executor::*method)(Local<String> property, const PropertyCallbackInfo<Value> &callback)>
void V8Executor::installNativePropertyHook(Local<ObjectTemplate> global, const char *name) {
  LOGV("V8Executor::installNativePropertyHook entry");

  struct funcWrapper {
    static void call(Local<Name> localProperty, const PropertyCallbackInfo<Value> &info) {
      printType(localProperty, "installNativePropertyHook.localProperty");
      Local<Context> context = info.GetIsolate()->GetCurrentContext();
      auto ptr = context->GetAlignedPointerFromEmbedderData(1);
      V8Executor *executor = static_cast<V8Executor *>(ptr);
      if (!executor) {
        THROW_RUNTIME_ERROR("Get Empty Context in installNativePropertyHook!");
      }

      Global<Value> res = (executor->*method)(Local<String>::Cast(localProperty), std::move(info));
      info.GetReturnValue().Set(res);
    }
  };
  Isolate* isolate = GetIsolate();
  Local<ObjectTemplate> nativeModuleProxyTemplate = ObjectTemplate::New(isolate);
  nativeModuleProxyTemplate->SetHandler(NamedPropertyHandlerConfiguration(funcWrapper::call));
  global->Set(toLocalString(isolate, name), nativeModuleProxyTemplate);
  LOGV("V8Executor::installNativePropertyHook exit");
}

void V8Executor::ClearStartupData(StartupData* data) {
  LOGV("V8Executor::ClearStartupData entry");
  data->data = nullptr;
  data->raw_size = 0;
  LOGV("V8Executor::ClearStartupData exit");
}

StartupData* V8Executor::Load(const char* blob_file, void(*setter_fn)(v8::StartupData*)) {
  LOGV("V8Executor::Load entry");
  StartupData* startup_data = new StartupData;

  long length = 0;

  CHECK(blob_file);
  auto data = File::ReadBinary(blob_file, length);
  if (!data) {
    LOGW("compiled_script->Run error: %s", blob_file);
    return startup_data;
  }
  startup_data->raw_size = length;
  startup_data->data = new char[startup_data->raw_size];
  memcpy((void *) startup_data->data, (const void*) data, startup_data->raw_size);
  if (startup_data->raw_size == length) {
    (*setter_fn)(startup_data);
  } else {
    LOGW("Corrupted startup resource '%s'.\n", blob_file);
  }
  LOGV("V8Executor::Load exit");
  return startup_data;
}

// PlatformInit function will be called once per process.
// V8 platform is independent of V8 isolate/instance.
void V8Executor::PlatformInit() {
  if (!s_PlatformInitialized) {
    Platform *platform = platform::CreateDefaultPlatform();
    LOGV("V8Executor::PlatformInit CreateDefaultPlatform");

    V8::InitializePlatform(platform);
    LOGV("V8Executor::PlatformInit InitializePlatform");

    V8::Initialize();
    LOGV("V8Executor::PlatformInit Initialize");

    s_PlatformInitialized = true;
  }
}

Isolate *V8Executor::GetIsolate() {
  LOGV("V8Executor::GetIsolate entry");

  if (m_isolate) {
    LOGV("V8Executor::GetIsolate not NULL");
    return m_isolate;
  }

  PlatformInit();

  Isolate::CreateParams create_params;
  create_params.array_buffer_allocator = v8::ArrayBuffer::Allocator::NewDefaultAllocator();
  // In-case external Snapshot file want to load like RN Js snapshot
  //create_params.snapshot_blob = Load(fullPath.c_str(), V8::SetSnapshotDataBlob);

  // Create a new Isolate and make it the current one.
  Isolate *isolate = Isolate::New(create_params);
  LOGV("V8Executor::GetIsolate Isolate::New");

  m_isolate = isolate;
  LOGV("V8Executor::GetIsolate exit");
  s_NumberOfIsolates++;
  return isolate;
}

bool V8Executor::IsCacheEnabled() {
  if (m_jseConfigParams == nullptr || (m_jseConfigParams->cacheType == CachingType::NoCaching) || (m_jseConfigParams->cachePath.empty())) {
    return false;
  }

  if (!m_jseLocalPath.empty()) {
    return true;
  }

  m_jseLocalPath = m_jseConfigParams->cachePath;
  LOGV("V8Executor::IsCacheEnabled cachePath: %s", m_jseLocalPath.c_str());

  return true;
}

bool V8Executor::ShouldSetNoLazyFlag() {
  return (m_jseConfigParams != nullptr &&
    (m_jseConfigParams->cacheType == CachingType::PartialCachingWithNoLazy || m_jseConfigParams->cacheType == CachingType::FullCachingWithNoLazy));
}

bool V8Executor::ShouldProduceFullCache() {
  return (m_jseConfigParams != nullptr &&
    (m_jseConfigParams->cacheType == CachingType::FullCaching || m_jseConfigParams->cacheType == CachingType::FullCachingWithNoLazy));
}

V8Executor::V8Executor(std::shared_ptr<ExecutorDelegate> delegate,
                        std::shared_ptr<MessageQueueThread> messageQueueThread,
                        const folly::dynamic& jscConfig,
                        std::shared_ptr<JSEConfigParams> jseConfigParams) :
  m_delegate(delegate),
  m_messageQueueThread(messageQueueThread),
  m_nativeModules(delegate ? delegate->getModuleRegistry() : nullptr),
  m_jscConfig(jscConfig),
  m_jseConfigParams(std::move(jseConfigParams)) {
  LOGV("V8Executor::V8Executor entry");
  m_jseLocalPath = "";
  if (m_jseConfigParams != nullptr) {
    Logging::setLevel(Logging::forValue(m_jseConfigParams->loggingLevel));
  }
  initOnJSVMThread();
  LOGV("V8Executor::V8Executor exit");
}

V8Executor::~V8Executor() {
  LOGV("V8Executor::~V8Executor entry");
  CHECK(*m_isDestroyed) << "V8Executor::destroy() must be called before its destructor!";
  LOGV("V8Executor::~V8Executor exit");
}

void V8Executor::destroy() {
  LOGV("V8Executor::destroy entry");
  *m_isDestroyed = true;
  if (m_messageQueueThread.get()) {
    m_messageQueueThread->runOnQueueSync([this]() {
      terminateOnJSVMThread();
    });
  } else {
    terminateOnJSVMThread();
  }
  LOGV("V8Executor::destroy exit");
}

void V8Executor::setContextName(const std::string& name) {
  LOGV("V8Executor::setContextName name: %s", name.c_str());
}

/*static bool canUseInspector(JSContextRef context) {
#ifdef WITH_INSPECTOR
  LOGV("V8Executor::canUseInspector true");
  return true; // WITH_INSPECTOR && Android
#else
  LOGV("V8Executor::canUseInspector false");
  return false; // !WITH_INSPECTOR
#endif
}
*/
void V8Executor::initOnJSVMThread() {
  LOGV("V8Executor::initOnJSVMThread entry");
  //SystraceSection s("V8Executor.initOnJSVMThread");
  // TODO，not support Inspector now!
  Isolate *isolate = GetIsolate();
  Isolate::Scope isolate_scope(isolate);
  HandleScope handle_scope(isolate);
  Local<ObjectTemplate> global = ObjectTemplate::New(isolate);
  // Bind the global 'print' function to the C++ Print callback.
  installNativeFunctionHook<&V8Executor::nativeFlushQueueImmediate>(global, "nativeFlushQueueImmediate");
  installNativeFunctionHook<&V8Executor::nativeCallSyncHook>(global, "nativeCallSyncHook");
  installGlobalFunction<&nativeLog>(isolate, global, "nativeLoggingHook");
  installGlobalFunction<&nativePerformanceNow>(isolate, global, "nativePerformanceNow");
#if DEBUG
  installGlobalFunction<&nativeInjectHMRUpdate>(isolate, global, "nativeInjectHMRUpdate");
#endif
  // TODO, trace and log
  // native require
  installNativeFunctionHook<&V8Executor::nativeRequire>(global, "nativeRequire");
  {
    SystraceSection s("nativeModuleProxy object");
    installNativePropertyHook<&V8Executor::getNativeModule>(global, "nativeModuleProxy");
  }
  Local<Context> context = Context::New(isolate, NULL, global);
  Context::Scope context_scope(context);
  // Add a pointer to ourselves so we can retrieve it later in our hooks
  context->SetAlignedPointerInEmbedderData(1, this);
  m_context.Reset(isolate, context);

  LOGV("V8Executor::initOnJSVMThread exit jsclocalPath = %s", m_jseLocalPath.c_str());
}

void V8Executor::terminateOnJSVMThread() {
  LOGV("V8Executor::terminateOnJSVMThread entry");
  SystraceSection s("V8Executor::terminateOnJSVMThread");
  m_nativeModules.reset();
  m_invokeCallbackAndReturnFlushedQueueJS.Reset();
  m_callFunctionReturnFlushedQueueJS.Reset();
  m_flushedQueueJS.Reset();
  m_callFunctionReturnResultAndFlushedQueueJS.Reset();
  m_context.Reset();
  m_isolate->TerminateExecution();
  m_isolate->Dispose();
  m_isolate = NULL;
  s_NumberOfIsolates--;
  if (s_NumberOfIsolates == 0) {
    V8::ShutdownPlatform();
    s_PlatformInitialized = false;
  }
  LOGV("V8Executor::terminateOnJSVMThread exit");
}

// basename_r isn't in all android SDKs, so use this simple version instead.
static std::string simpleBasename(const std::string &path) {
  LOGV("V8Executor::simpleBasename entry");
  size_t pos = path.rfind("/");
  return (pos != std::string::npos) ? path.substr(pos) : path;
  LOGV("V8Executor::simpleBasename exit");
}

void V8Executor::loadApplicationScript(std::unique_ptr<const JSBigString> script, uint64_t /*scriptVersion*/, std::string sourceURL, std::string&& bytecodeFileName) {

  LOGV("V8Executor::loadApplicationScript entry sourceURL = %s, bytecodeFileName = %s", sourceURL.c_str(), bytecodeFileName.c_str());
  SystraceSection s("V8Executor::loadApplicationScript", "sourceURL", sourceURL);
  std::string scriptName = simpleBasename(sourceURL);
  ReactMarker::logTaggedMarker(ReactMarker::RUN_JS_BUNDLE_START, scriptName.c_str());
  _ISOLATE_CONTEXT_ENTER;
  TryCatch try_catch(isolate);
  Local<Script> compiled_script = LoadScript(std::move(toLocalString(isolate, std::move(script->c_str()))), scriptName, context);
  // 	LOGV("V8Executor::loadApplicationScript after LoadScript;");
 // Run the script!
  Local<Value> result;
  if (!compiled_script->Run(context).ToLocal(&result)) {
    // The TryCatch above is still in effect and will have caught the error.
    String::Utf8Value error(isolate, try_catch.Exception());
    LOGW("compiled_script->Run error: %s", *error);
    THROW_RUNTIME_ERROR("Error ExecuteScript while running script!");
  }

  flush();
  ReactMarker::logMarker(ReactMarker::CREATE_REACT_CONTEXT_STOP);
  ReactMarker::logTaggedMarker(ReactMarker::RUN_JS_BUNDLE_STOP, scriptName.c_str());
  LOGV("V8Executor::loadApplicationScript exit");
}

void V8Executor::registerBundle(uint32_t bundleId, const std::string& bundlePath) {
  // NYI
  std::terminate();
}

void V8Executor::SaveScriptCache(std::unique_ptr<ScriptCompiler::CachedData> cached_data, const std::string& path) {
  LOGV("V8Executor::SaveScriptCache entry");
  if (!cached_data) {
    ReactMarker::logMarker(ReactMarker::BYTECODE_CREATION_FAILED);
    LOGV("V8Executor::SaveScriptCache exit");
    return;
  }

  int length = cached_data->length;
  LOGV("V8Executor::SaveScriptCache entry %s ", path.c_str());

  bool result = File::WriteBinary(path, cached_data->data, length);

  if (!result) {
    ReactMarker::logMarker(ReactMarker::BYTECODE_WRITE_FAILED);
  }

  LOGV("V8Executor::SaveScriptCache exit");
}

ScriptCompiler::CachedData* V8Executor::TryLoadScriptCache(const std::string& path) {
  LOGV("V8Executor::TryLoadScriptCache entry");
  long length = 0;
  auto data = File::ReadBinary(path, length);
  if (!data) {
    return nullptr;
  }

  LOGV("V8Executor::TryLoadScriptCache exit");
  return new ScriptCompiler::CachedData(reinterpret_cast<uint8_t*>(data), length, ScriptCompiler::CachedData::BufferOwned);

}

Local<String> V8Executor::ConvertToV8String(Isolate* isolate, const string& s) {
  LOGV("V8Executor::ConvertToV8String entry");
  Local<String> str = String::NewFromUtf8(isolate, s.c_str(), NewStringType::kNormal, s.length()).ToLocalChecked();
  LOGV("V8Executor::ConvertToV8String exit");
  return str;
}

Local<String> V8Executor::WrapModuleContent(const string& path) {
  LOGV("V8Executor::WrapModuleContent entry");
  string content = File::ReadText(path);
  auto separatorIndex = path.find_last_of("/");
  // TODO: Use statically allocated buffer for better performance
  string result(MODULE_PROLOGUE);
  result.reserve(content.length() + 1024);
  result += content;
  result += MODULE_EPILOGUE;
  return ConvertToV8String(m_isolate, result);
  LOGV("V8Executor::WrapModuleContent exit");
}


Local<Script> V8Executor::createAndGetScript(const Local<String> &scriptData, const string& path, Local<Context> context) {
  string fullPath = m_jseLocalPath + string("/") + path + ".v8cache";
  auto cacheData = TryLoadScriptCache(fullPath);

  // No need to delete cacheData as ScriptCompiler::Source will take its ownership.
  ScriptCompiler::Source source(scriptData, cacheData);
  Local<Script> script;
  Isolate *isolate = GetIsolate();
  TryCatch tc(isolate);
  ScriptCompiler::CompileOptions option = ScriptCompiler::kNoCompileOptions;

  if (ShouldSetNoLazyFlag()) {
    const char* lazy = "--nolazy";
    V8::SetFlagsFromString(lazy, strlen(lazy));
  }

  if (cacheData != nullptr) {
    //SystraceSection s("V8Executor::LoadScript Compile, cached");
    LOGV("V8Executor::createAndGetScript cached");

    option = ScriptCompiler::kConsumeCodeCache;
    auto maybeScript = ScriptCompiler::Compile(context, &source, option);

    if (maybeScript.IsEmpty() || tc.HasCaught()) {
      THROW_RUNTIME_ERROR("Error ExecuteScript while compile script!");
    }

    if (cacheData->rejected) {
      int status = remove(fullPath.c_str());
      LOGI("V8Executor::createAndGetScript cache was rejected. Cache delete status: %d ", status);
    }

    script = maybeScript.ToLocalChecked();
  } else {
    //SystraceSection s("V8Executor::LoadScript Compile, no cached");
    LOGV("V8Executor::createAndGetScript no cached");

    if (ShouldProduceFullCache()) {
      option = ScriptCompiler::kProduceFullCodeCache;
    } else {
      option = ScriptCompiler::kProduceCodeCache;
    }

    auto maybeScript = ScriptCompiler::Compile(context, &source, option);
    LOGV("V8Executor::createAndGetScript, after compile");

    if (maybeScript.IsEmpty() || tc.HasCaught()) {
      THROW_RUNTIME_ERROR("Error ExecuteScript while compile script!");
    }

    script = maybeScript.ToLocalChecked();

    Local<UnboundScript> uScript = script->GetUnboundScript();

    // CreateCodeCache always create buffer with BufferPolicy::BufferOwned,
    // We need to just free CachedData and it will take care of deleting underlying buffer.
    std::unique_ptr<ScriptCompiler::CachedData> cacheData{ ScriptCompiler::CreateCodeCache(uScript) };

    LOGV("V8Executor::createAndGetScript, after ToLocalChecked");
    SaveScriptCache(std::move(cacheData), fullPath);
    LOGV("V8Executor::createAndGetScript, after save");
  }

  LOGV("V8Executor::createAndGetScript exit");
  return script;
}

Local<Script> V8Executor::LoadScript(const Local<String> &scriptData, const string& path, Local<Context> context) {
  LOGV("V8Executor::LoadScript entry %s", path.c_str());
  string frameName("LoadScript " + path);
  Isolate *isolate = GetIsolate();
  TryCatch tc(isolate);

  if (!IsCacheEnabled()) {
    ScriptCompiler::Source nonCachedSource(scriptData);

    auto maybeScript = ScriptCompiler::Compile(context, &nonCachedSource);
    LOGV("V8Executor::LoadScript, after compile");

    if (maybeScript.IsEmpty() || tc.HasCaught()) {
      THROW_RUNTIME_ERROR("Error ExecuteScript while compile script!");
    }

    return maybeScript.ToLocalChecked();
  }

  return createAndGetScript(scriptData, path, context);
}

void V8Executor::setBundleRegistry(std::unique_ptr<RAMBundleRegistry> bundleRegistry) {
  LOGV("V8Executor::setBundleRegistry entry");
  m_bundleRegistry = std::move(bundleRegistry);
  LOGV("V8Executor::setBundleRegistry exit");
}

void V8Executor::bindBridge() {
  LOGV("V8Executor::bindBridge entry");
  SystraceSection s("V8Executor::bindBridge");
  std::call_once(m_bindFlag, [this] {
    _ISOLATE_CONTEXT_ENTER;
    Local<Object> globalObj = context->Global();
    Local<Value> batchedBridgeValue; // batchedBridgeValue;
    if (!globalObj->Get(context, toLocalString(isolate, "__fbBatchedBridge")).ToLocal(&batchedBridgeValue)) {
      Local<Value> requireBatchedBridge; // batchedBridgeValue;
      if (globalObj->Get(context, toLocalString(isolate, "__fbRequireBatchedBridge")).ToLocal(&requireBatchedBridge)) {
        Local<Function> requireBatchedBridgeFunc = Local<Function>::Cast(requireBatchedBridge);
        if (!requireBatchedBridgeFunc->Call(context, context->Global(), 0, {}).ToLocal(&batchedBridgeValue)) {
          THROW_RUNTIME_ERROR("Could not get BatchedBridge, make sure your bundle is packaged correctly");
        }
      }
    }
    if (batchedBridgeValue.IsEmpty()) {
      THROW_RUNTIME_ERROR("Could not get BatchedBridge, make sure your bundle is packaged correctly");
    }
    Local<Object> batchedBridge = Local<Object>::Cast(batchedBridgeValue);
    auto funcSet = [&](const char *name, Global<Function> &globalFunc) mutable {
      Local<Function> localFunc = Local<Function>::Cast(batchedBridge->Get(toLocalString(isolate, name)));
      globalFunc.Reset(isolate, localFunc);
    };
    funcSet("callFunctionReturnFlushedQueue", m_callFunctionReturnFlushedQueueJS);
    funcSet("invokeCallbackAndReturnFlushedQueue", m_invokeCallbackAndReturnFlushedQueueJS);
    funcSet("flushedQueue", m_flushedQueueJS);
    funcSet("callFunctionReturnResultAndFlushedQueue", m_callFunctionReturnResultAndFlushedQueueJS);
  });
  LOGV("V8Executor::bindBridge exit");
}

void V8Executor::callNativeModules(Local<Context> context, Local<Value> value) {
  LOGV("V8Executor::callNativeModules entry");
  SystraceSection s("V8Executor::callNativeModules");
  CHECK(m_delegate) << "Attempting to use native modules without a delegate";
  try {
    if (!value.IsEmpty() && value->IsObject()) {
      Local<Object> obj = Local<Object>::Cast(value);
      const std::string &arg = toJsonStdString(context, std::move(obj));
      LOGV("callNativeModules arg: %s", arg.c_str());
      m_delegate->callNativeModules(*this, folly::parseJson(std::move(arg)), true);
    } else {
      m_delegate->callNativeModules(*this, folly::parseJson("null"), true);
    }
  } catch (...) {
    std::string message = "Error in callNativeModules()";
    std::throw_with_nested(std::runtime_error(message));
  }
  LOGV("V8Executor::callNativeModules exit");
}

void V8Executor::flush() {
  LOGV("V8Executor::flush entry");
  SystraceSection s("V8Executor::flush");
  if (!m_flushedQueueJS.IsEmpty()) {
    _ISOLATE_CONTEXT_ENTER;
    Local<Function> flushedQueueJS = Local<Function>::New(isolate, m_flushedQueueJS);
    callNativeModules(context, safeToLocal(flushedQueueJS->Call(context, context->Global(), 0, {})));
    return;
  }

  // When a native module is called from JS, BatchedBridge.enqueueNativeCall()
  // is invoked.  For that to work, require('BatchedBridge') has to be called,
  // and when that happens, __fbBatchedBridge is set as a side effect.
  _ISOLATE_CONTEXT_ENTER;
  Local<Object> globalObj = context->Global();
  Local<Value> batchedBridgeValue; // batchedBridgeValue;
  if (globalObj->Get(context, toLocalString(isolate, "__fbBatchedBridge")).ToLocal(&batchedBridgeValue)) {
    LOGV("V8Executor::flush obj __fbBatchedBridge is not empty");
    bindBridge();
    Local<Function> flushedQueueJS = Local<Function>::New(isolate, m_flushedQueueJS);
    callNativeModules(context, safeToLocal(flushedQueueJS->Call(context, context->Global(), 0, {})));
  } else if (m_delegate) {
    // If we have a delegate, we need to call it; we pass a null list to
    // callNativeModules, since we know there are no native calls, without
    // calling into JS again.  If no calls were made and there's no delegate,
    // nothing happens, which is correct.
    callNativeModules(context, Local<Value>());
  }
  LOGV("V8Executor::flush exit");
}

void V8Executor::callFunction(const std::string &moduleId, const std::string &methodId, const folly::dynamic &arguments) {
  SystraceSection s("V8Executor::callFunction");
  LOGV("V8Executor::callFunction entry moduleId: %s, methodId:%s", moduleId.c_str(), methodId.c_str());
  // TODO, lock context
  if (m_callFunctionReturnResultAndFlushedQueueJS.IsEmpty()) {
    bindBridge();
  }
  _ISOLATE_CONTEXT_ENTER;
  Local<Function> localFunc = Local<Function>::New(isolate, m_callFunctionReturnFlushedQueueJS);
  Local<String> localModuleId = toLocalString(isolate, moduleId);
  Local<String> localMethodId = toLocalString(isolate, methodId);
  const std::string &json = folly::toJson(arguments);
  Local<String> json_str = toLocalString(isolate, std::move(json));
  Local<Value> localArguments = safeToLocal(JSON::Parse(context, json_str));
  Local<Value> argv[3] = { localModuleId, localMethodId, localArguments };
  Local<Value> result = safeToLocal(localFunc->Call(context, context->Global(), 3, argv)); // TODO, catch exception
  callNativeModules(context, result);
  LOGV("V8Executor::callFunction exit");
}

void V8Executor::invokeCallback(const double callbackId, const folly::dynamic &arguments) {
  SystraceSection s("V8Executor::invokeCallback");
  // TODO, lock context
  if (m_invokeCallbackAndReturnFlushedQueueJS.IsEmpty()) {
    bindBridge();
  }
  _ISOLATE_CONTEXT_ENTER;
  Local<Function> invokeFunc = Local<Function>::New(isolate, m_invokeCallbackAndReturnFlushedQueueJS);
  Local<Number> localCallbackId = Number::New(isolate, callbackId);
  Local<Value> localArguments = fromDynamic(isolate, context, arguments);
  Local<Value> argv[2] = { localCallbackId, localArguments };
  Local<Value> result = safeToLocal(invokeFunc->Call(context, context->Global(), 2, argv));
  callNativeModules(context, result);
}

void V8Executor::setGlobalVariable(std::string propName, std::unique_ptr<const JSBigString> jsonValue) {
  try {
    SystraceSection s("V8Executor.setGlobalVariable", "propName", propName);
    _ISOLATE_CONTEXT_ENTER;
    Local<String> propNameString = toLocalString(isolate, propName);
    Local<Value> attribute = fromJsonString(isolate, context, jsonValue->c_str(), jsonValue->size());
    context->Global()->Set(propNameString, attribute);
  } catch (...) {
    std::throw_with_nested(std::runtime_error("Error setting global variable: " + propName));
  }
}

std::string V8Executor::getDescription() {
  return "v8";
}

void *V8Executor::getJavaScriptContext() {
  return this;
}

#ifdef WITH_JSC_MEMORY_PRESSURE
void V8Executor::handleMemoryPressure(int pressureLevel) {
  __android_log_print("V8Executor", "handle memory pressure");
  Isolate *isolate = GetIsolate();
  if (isolate) {
    isolate->MemoryPressureNotification(pressureLevel);
  }
}
#endif 

void V8Executor::loadModule(uint32_t bundleId, uint32_t moduleId) {
  if (!m_bundleRegistry) {
    return;
  }
  _ISOLATE_CONTEXT_ENTER;
  auto module = m_bundleRegistry->getModule(bundleId, moduleId);
  auto source = toLocalString(isolate, module.code);
  std::string path = module.name;
  // TODO
  //_ISOLATE_CONTEXT_ENTER;
  //executeScript(context, std::move(toLocalString(isolate, std::move(script->c_str()))));
  TryCatch try_catch(isolate);
  LOGV("V8Executor::loadModule before LoadScript");
  Local<Script> compiled_script = LoadScript(source, path, context);
  // Run the script!
  Local<Value> result;
  if (!compiled_script->Run(context).ToLocal(&result)) {
    // The TryCatch above is still in effect and will have caught the error.
    String::Utf8Value error(isolate, try_catch.Exception());
    LOGW("compiled_script->Run error: %s", *error);
    THROW_RUNTIME_ERROR("Error ExecuteScript while running script!");
  }
  //executeScript(context, source);
}

Global<Value> V8Executor::getNativeModule(Local<String> property, const PropertyCallbackInfo<Value> &info) {
  SystraceSection s("V8Executor.getNativeModule");
  _ISOLATE_CONTEXT_ENTER;
  const std::string prop = toStdString(property);
  LOGV("V8Executor::getNativeModule property length %d", prop.length());
  LOGV("V8Executor::getNativeModule property %s", prop.c_str());
  if ("name" == prop) {
    return Global<Value>(isolate, toLocalString(isolate, "NativeModules"));
  }
  return m_nativeModules.getModule(isolate, context, std::move(prop));
}

void V8Executor::nativeRequire(const v8::FunctionCallbackInfo<v8::Value> &args) {
  SystraceSection s("V8Executor.nativeRequire");
  if (args.Length() != 2) {
    throw std::invalid_argument("Got wrong number of args");
  }
  Local<Uint32> bundleId;
  Local<Uint32> moduleId;
  std::tie(bundleId, moduleId) = parseNativeRequireParameters(args);
  LOGV("V8Executor::nativeRequire bundleId %d, moduleId %d", bundleId->Value(), moduleId->Value());

  ReactMarker::logMarker(ReactMarker::NATIVE_REQUIRE_START);
  loadModule(bundleId->Value(), moduleId->Value());
  ReactMarker::logMarker(ReactMarker::NATIVE_REQUIRE_STOP);
}


void V8Executor::nativeFlushQueueImmediate(const v8::FunctionCallbackInfo<v8::Value> &args) {
  LOGV("V8Executor::nativeFlushQueueImmediate entry");

  SystraceSection s("V8Executor.nativeFlushQueueImmediate");
  if (args.Length() != 1) {
    throw std::invalid_argument("Got wrong number of args");
  }
  _ISOLATE_CONTEXT_ENTER;


  auto queueStr = toJsonStdString(context, Local<Object>::Cast(args[0]));
  LOGV("V8Executor::nativeFlushQueueImmediate %s", queueStr.c_str());
  m_delegate->callNativeModules(*this, folly::parseJson(queueStr), false);
}

void V8Executor::nativeCallSyncHook(const v8::FunctionCallbackInfo<v8::Value> &args) {
  SystraceSection s("V8Executor.nativeCallSyncHook");
  if (args.Length() != 3) {
    throw std::invalid_argument("Got wrong number of args");
  }

  Isolate* isolate = args.GetIsolate();
  Local<Context> context = Local<Context>::New(isolate, m_context);
  unsigned int moduleId = (unsigned int) Number::Cast(*(args[0]))->Value();
  unsigned int methodId = (unsigned int) Number::Cast(*(args[1]))->Value();
  LOGV("V8Executor::nativeCallSyncHook moduleId %d, methodId %d", moduleId, methodId);
  const std::string &argsJson = toJsonStdString(context, Local<Object>::Cast(args[2]));
  folly::dynamic dynamicArgs = folly::parseJson(std::move(argsJson));
  if (!dynamicArgs.isArray()) {
    throw std::invalid_argument(
      folly::to<std::string>("method parameters should be array, but are ", dynamicArgs.typeName()));
  }

  MethodCallResult result = m_delegate->callSerializableNativeHook(*this, moduleId, methodId, std::move(dynamicArgs));
  if (!result.hasValue()) {
    return;
  }

  args.GetReturnValue().Set(fromDynamic(isolate, context, std::move(result.value())));
}

std::unique_ptr<JSExecutor> V8ExecutorFactory::createJSExecutor(std::shared_ptr<ExecutorDelegate> delegate,
  std::shared_ptr<MessageQueueThread> jsQueue) {
  return folly::make_unique<v8::V8Executor>(delegate, jsQueue, std::move(m_jscConfig), nullptr);
}

std::unique_ptr<JSExecutor> V8ExecutorFactory::createJSExecutor(std::shared_ptr<ExecutorDelegate> delegate,
  std::shared_ptr<MessageQueueThread> jsQueue, std::shared_ptr<JSEConfigParams> jseConfigParams) {
  return folly::make_unique<v8::V8Executor>(delegate, jsQueue, std::move(m_jscConfig), std::move(jseConfigParams));
}
}
