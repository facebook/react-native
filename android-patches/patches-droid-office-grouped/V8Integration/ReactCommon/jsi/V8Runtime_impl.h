--- "e:\\github\\fb-react-native-forpatch-base\\ReactCommon\\jsi\\V8Runtime_impl.h"	1969-12-31 16:00:00.000000000 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactCommon\\jsi\\V8Runtime_impl.h"	2020-01-29 14:10:09.826890700 -0800
@@ -0,0 +1,458 @@
+//  Copyright (c) Facebook, Inc. and its affiliates.
+//
+// This source code is licensed under the MIT license found in the
+ // LICENSE file in the root directory of this source tree.
+
+#pragma once
+
+#include "V8Runtime.h"
+
+#include "v8.h"
+#include "libplatform/libplatform.h"
+
+#include "V8Platform.h"
+
+#include <cstdlib>
+#include <iostream>
+#include <mutex>
+#include <atomic>
+#include <list>
+#include <sstream>
+
+#include <cstdlib>
+
+#if defined(_MSC_VER)
+#define CDECL __cdecl
+#else
+#define CDECL
+#endif
+
+#define _ISOLATE_CONTEXT_ENTER v8::Isolate *isolate = v8::Isolate::GetCurrent(); \
+    v8::Isolate::Scope isolate_scope(isolate); \
+    v8::HandleScope handle_scope(isolate); \
+    v8::Context::Scope context_scope(context_.Get(isolate));
+
+namespace facebook { namespace v8runtime {
+
+  enum class CacheType {
+    NoCache,
+    CodeCache,
+    FullCodeCache
+  };
+
+  class V8Runtime : public jsi::Runtime {
+  public:
+    V8Runtime();
+    V8Runtime(const folly::dynamic& v8Config, const std::shared_ptr<Logger>& logger);
+
+    V8Runtime(const v8::Platform* platform, std::shared_ptr<Logger>&& logger,
+      std::shared_ptr<facebook::react::MessageQueueThread>&& jsQueue, std::shared_ptr<CacheProvider>&& cacheProvider,
+      std::unique_ptr<InspectorInterface> inspector, std::unique_ptr<const jsi::Buffer> default_snapshot_blob,
+      std::unique_ptr<const jsi::Buffer> default_natives_blob, std::unique_ptr<const jsi::Buffer> custom_snapshot);
+
+    ~V8Runtime();
+
+    jsi::Value evaluateJavaScript(const std::shared_ptr<const jsi::Buffer>& buffer, const std::string& sourceURL) override;
+
+    jsi::Object global() override;
+
+    std::string description() override;
+
+    bool isInspectable() override;
+
+  private:
+
+    struct IHostProxy {
+      virtual void destroy() = 0;
+    };
+
+    class HostObjectLifetimeTracker {
+    public:
+      void ResetHostObject(bool isGC /*whether the call is coming from GC*/) {
+        assert(!isGC || !isReset_);
+        if (!isReset_) {
+          isReset_ = true;
+          hostProxy_->destroy();
+          objectTracker_.Reset();
+        }
+      }
+
+      HostObjectLifetimeTracker(V8Runtime& runtime, v8::Local<v8::Object> obj, IHostProxy* hostProxy) : hostProxy_(hostProxy) {
+        objectTracker_.Reset(runtime.GetIsolate(), obj);
+        objectTracker_.SetWeak(this, HostObjectLifetimeTracker::Destroyed, v8::WeakCallbackType::kParameter);
+      }
+
+      // Useful for debugging.
+      ~HostObjectLifetimeTracker() {
+        assert(isReset_);
+        std::cout << "~HostObjectLifetimeTracker" << std::endl;
+      }
+
+    private:
+      v8::Global<v8::Object> objectTracker_;
+      std::atomic<bool> isReset_{ false };
+      IHostProxy* hostProxy_;
+
+      static void CDECL Destroyed(const v8::WeakCallbackInfo<HostObjectLifetimeTracker>& data) {
+        v8::HandleScope handle_scope(v8::Isolate::GetCurrent());
+        data.GetParameter()->ResetHostObject(true /*isGC*/);
+      }
+
+    };
+
+    class HostObjectProxy : public IHostProxy {
+    public:
+      static void Get(v8::Local<v8::Name> v8PropName, const v8::PropertyCallbackInfo<v8::Value>& info)
+      {
+        v8::Local<v8::External> data = v8::Local<v8::External>::Cast(info.This()->GetInternalField(0));
+        HostObjectProxy* hostObjectProxy = reinterpret_cast<HostObjectProxy*>(data->Value());
+
+        if (hostObjectProxy == nullptr)
+          std::abort();
+
+        V8Runtime& runtime = hostObjectProxy->runtime_;
+        std::shared_ptr<jsi::HostObject> hostObject = hostObjectProxy->hostObject_;
+
+        v8::Local<v8::String> propNameStr = v8::Local<v8::String>::Cast(v8PropName);
+        std::string propName;
+        propName.resize(propNameStr->Utf8Length(info.GetIsolate()));
+        propNameStr->WriteUtf8(info.GetIsolate(), &propName[0]);
+
+        jsi::PropNameID propNameId = runtime.createPropNameIDFromUtf8(reinterpret_cast<uint8_t*>(&propName[0]), propName.length());
+        info.GetReturnValue().Set(runtime.valueRef(hostObject->get(runtime, propNameId)));
+      }
+
+      static void Set(v8::Local<v8::Name> v8PropName, v8::Local<v8::Value> value, const v8::PropertyCallbackInfo<v8::Value>& info)
+      {
+        v8::Local<v8::External> data = v8::Local<v8::External>::Cast(info.This()->GetInternalField(0));
+        HostObjectProxy* hostObjectProxy = reinterpret_cast<HostObjectProxy*>(data->Value());
+
+        if (hostObjectProxy == nullptr)
+          std::abort();
+
+        V8Runtime& runtime = hostObjectProxy->runtime_;
+        std::shared_ptr<jsi::HostObject> hostObject = hostObjectProxy->hostObject_;
+
+        v8::Local<v8::String> propNameStr = v8::Local<v8::String>::Cast(v8PropName);
+
+        std::string propName;
+        propName.resize(propNameStr->Utf8Length(info.GetIsolate()));
+        propNameStr->WriteUtf8(info.GetIsolate(), &propName[0]);
+
+        hostObject->set(runtime, runtime.createPropNameIDFromUtf8(reinterpret_cast<uint8_t*>(&propName[0]), propName.length()), runtime.createValue(value));
+      }
+
+      static void Enumerator(const v8::PropertyCallbackInfo<v8::Array>& info)
+      {
+        v8::Local<v8::External> data = v8::Local<v8::External>::Cast(info.Data());
+        HostObjectProxy* hostObjectProxy = reinterpret_cast<HostObjectProxy*>(data->Value());
+
+        if (hostObjectProxy != nullptr) {
+
+          V8Runtime& runtime = hostObjectProxy->runtime_;
+          std::shared_ptr<jsi::HostObject> hostObject = hostObjectProxy->hostObject_;
+
+          std::vector<jsi::PropNameID> propIds = hostObject->getPropertyNames(runtime);
+
+          v8::Local<v8::Array> result = v8::Array::New(info.GetIsolate(), static_cast<int>(propIds.size()));
+          v8::Local<v8::Context> context = info.GetIsolate()->GetCurrentContext();
+
+          for (uint32_t i = 0; i < result->Length(); i++)
+          {
+            v8::Local<v8::Value> propIdValue = runtime.valueRef(propIds[i]);
+            if (!result->Set(context, i, propIdValue).FromJust()) { std::terminate(); };
+          }
+
+          info.GetReturnValue().Set(result);
+        }
+        else {
+          info.GetReturnValue().Set(v8::Array::New(info.GetIsolate()));
+        }
+      }
+
+      HostObjectProxy(V8Runtime& rt, const std::shared_ptr<jsi::HostObject>& hostObject) : runtime_(rt), hostObject_(hostObject) {}
+      std::shared_ptr<jsi::HostObject> getHostObject() { return hostObject_; }
+    private:
+      friend class HostObjectLifetimeTracker;
+      void destroy() override {
+        hostObject_.reset();
+      }
+
+      V8Runtime& runtime_;
+      std::shared_ptr<jsi::HostObject> hostObject_;
+    };
+
+    class HostFunctionProxy : public IHostProxy {
+    public:
+      static void call(HostFunctionProxy& hostFunctionProxy, const v8::FunctionCallbackInfo<v8::Value>& callbackInfo) {
+        V8Runtime& runtime = const_cast<V8Runtime&>(hostFunctionProxy.runtime_);
+        v8::Isolate* isolate = callbackInfo.GetIsolate();
+
+        std::vector<jsi::Value> argsVector;
+        for (int i = 0; i < callbackInfo.Length(); i++)
+        {
+          argsVector.push_back(hostFunctionProxy.runtime_.createValue(callbackInfo[i]));
+        }
+
+        const jsi::Value& thisVal = runtime.createValue(callbackInfo.This());
+
+        jsi::Value result;
+        try {
+          result = hostFunctionProxy.func_(runtime, thisVal, argsVector.data(), callbackInfo.Length());
+        }
+        catch (const jsi::JSError& error) {
+          callbackInfo.GetReturnValue().Set(v8::Undefined(isolate));
+
+          // Schedule to throw the exception back to JS.
+          isolate->ThrowException(runtime.valueRef(error.value()));
+          return;
+        }
+        catch (const std::exception& ex) {
+          callbackInfo.GetReturnValue().Set(v8::Undefined(isolate));
+
+          // Schedule to throw the exception back to JS.
+          v8::Local<v8::String> message = v8::String::NewFromUtf8(isolate, ex.what(), v8::NewStringType::kNormal).ToLocalChecked();
+          isolate->ThrowException(v8::Exception::Error(message));
+          return;
+        }
+        catch (...) {
+          callbackInfo.GetReturnValue().Set(v8::Undefined(isolate));
+
+          // Schedule to throw the exception back to JS.
+          v8::Local<v8::String> message = v8::String::NewFromOneByte(isolate, reinterpret_cast<const uint8_t*>("<Unknown exception in host function callback>"), v8::NewStringType::kNormal).ToLocalChecked();
+          isolate->ThrowException(v8::Exception::Error(message));
+          return;
+        }
+
+        callbackInfo.GetReturnValue().Set(runtime.valueRef(result));
+      }
+
+    public:
+      static void CDECL HostFunctionCallback(const v8::FunctionCallbackInfo<v8::Value>& info)
+      {
+        v8::HandleScope handle_scope(v8::Isolate::GetCurrent());
+        v8::Local<v8::External> data = v8::Local<v8::External>::Cast(info.Data());
+        HostFunctionProxy* hostFunctionProxy = reinterpret_cast<HostFunctionProxy*> (data->Value());
+        hostFunctionProxy->call(*hostFunctionProxy, info);
+      }
+
+      HostFunctionProxy(facebook::v8runtime::V8Runtime& runtime, jsi::HostFunctionType func)
+        : func_(std::move(func)), runtime_(runtime) {};
+
+    private:
+      friend class HostObjectLifetimeTracker;
+      void destroy() override {
+        func_ = [](Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {return jsi::Value::undefined(); };
+      }
+
+      jsi::HostFunctionType func_;
+      facebook::v8runtime::V8Runtime& runtime_;
+    };
+
+    class V8StringValue final : public PointerValue {
+      V8StringValue(v8::Local<v8::String> str);
+      ~V8StringValue();
+
+      void invalidate() override;
+
+      v8::Persistent<v8::String> v8String_;
+    protected:
+      friend class V8Runtime;
+    };
+
+    class V8ObjectValue final : public PointerValue {
+      V8ObjectValue(v8::Local<v8::Object> obj);
+
+      ~V8ObjectValue();
+
+      void invalidate() override;
+
+      v8::Persistent<v8::Object> v8Object_;
+
+    protected:
+      friend class V8Runtime;
+    };
+
+    class ExternalOwningOneByteStringResource
+      : public v8::String::ExternalOneByteStringResource {
+    public:
+      explicit ExternalOwningOneByteStringResource(const std::shared_ptr<const jsi::Buffer>& buffer)
+        : buffer_(buffer) /*create a copy of shared_ptr*/ {}
+      const char* data() const override { return reinterpret_cast<const char*>(buffer_->data()); }
+      size_t length() const override { return buffer_->size(); }
+
+    private:
+      std::shared_ptr<const jsi::Buffer> buffer_;
+    };
+
+    std::shared_ptr<const facebook::jsi::PreparedJavaScript> prepareJavaScript(const std::shared_ptr<const facebook::jsi::Buffer> &, std::string) override;
+    facebook::jsi::Value evaluatePreparedJavaScript(const std::shared_ptr<const facebook::jsi::PreparedJavaScript> &) override;
+
+    std::string symbolToString(const facebook::jsi::Symbol &) override;
+    
+    PointerValue* cloneString(const Runtime::PointerValue* pv) override;
+    PointerValue *cloneSymbol(const PointerValue *) override;
+    PointerValue* cloneObject(const Runtime::PointerValue* pv) override;
+    PointerValue* clonePropNameID(const Runtime::PointerValue* pv) override;
+
+    jsi::PropNameID createPropNameIDFromAscii(const char* str, size_t length)
+      override;
+    jsi::PropNameID createPropNameIDFromUtf8(const uint8_t* utf8, size_t length)
+      override;
+    jsi::PropNameID createPropNameIDFromString(const jsi::String& str) override;
+    std::string utf8(const jsi::PropNameID&) override;
+    bool compare(const jsi::PropNameID&, const jsi::PropNameID&) override;
+
+    jsi::String createStringFromAscii(const char* str, size_t length) override;
+    jsi::String createStringFromUtf8(const uint8_t* utf8, size_t length) override;
+    std::string utf8(const jsi::String&) override;
+
+    jsi::Object createObject() override;
+    jsi::Object createObject(std::shared_ptr<jsi::HostObject> ho) override;
+    virtual std::shared_ptr<jsi::HostObject> getHostObject(
+      const jsi::Object&) override;
+    jsi::HostFunctionType& getHostFunction(const jsi::Function&) override;
+
+    jsi::Value getProperty(const jsi::Object&, const jsi::String& name) override;
+    jsi::Value getProperty(const jsi::Object&, const jsi::PropNameID& name)
+      override;
+    bool hasProperty(const jsi::Object&, const jsi::String& name) override;
+    bool hasProperty(const jsi::Object&, const jsi::PropNameID& name) override;
+    void setPropertyValue(
+      jsi::Object&,
+      const jsi::String& name,
+      const jsi::Value& value) override;
+    void setPropertyValue(
+      jsi::Object&,
+      const jsi::PropNameID& name,
+      const jsi::Value& value) override;
+    bool isArray(const jsi::Object&) const override;
+    bool isArrayBuffer(const jsi::Object&) const override;
+    bool isFunction(const jsi::Object&) const override;
+    bool isHostObject(const jsi::Object&) const override;
+    bool isHostFunction(const jsi::Function&) const override;
+    jsi::Array getPropertyNames(const jsi::Object&) override;
+
+    jsi::WeakObject createWeakObject(const jsi::Object&) override;
+    jsi::Value lockWeakObject(const jsi::WeakObject&) override;
+
+    jsi::Array createArray(size_t length) override;
+    size_t size(const jsi::Array&) override;
+    size_t size(const jsi::ArrayBuffer&) override;
+    uint8_t* data(const jsi::ArrayBuffer&) override;
+    jsi::Value getValueAtIndex(const jsi::Array&, size_t i) override;
+    void setValueAtIndexImpl(jsi::Array&, size_t i, const jsi::Value& value)
+      override;
+
+    jsi::Function createFunctionFromHostFunction(
+      const jsi::PropNameID& name,
+      unsigned int paramCount,
+      jsi::HostFunctionType func) override;
+    jsi::Value call(
+      const jsi::Function&,
+      const jsi::Value& jsThis,
+      const jsi::Value* args,
+      size_t count) override;
+    jsi::Value callAsConstructor(
+      const jsi::Function&,
+      const jsi::Value* args,
+      size_t count) override;
+
+    bool strictEquals(const jsi::String& a, const jsi::String& b) const override;
+    bool strictEquals(const jsi::Object& a, const jsi::Object& b) const override;
+    bool strictEquals(const jsi::Symbol& a, const jsi::Symbol& b) const override;
+
+    bool instanceOf(const jsi::Object& o, const jsi::Function& f) override;
+
+  void AddHostObjectLifetimeTracker(std::shared_ptr<HostObjectLifetimeTracker> hostObjectLifetimeTracker);
+
+  static void CDECL OnMessage(v8::Local<v8::Message> message, v8::Local<v8::Value> error);
+
+  private:
+
+    v8::Local<v8::Context> CreateContext(v8::Isolate* isolate);
+
+    // Methods to compile and execute JS script.
+    v8::ScriptCompiler::CachedData* TryLoadCachedData(const std::string& path);
+    void PersistCachedData(std::unique_ptr<v8::ScriptCompiler::CachedData> cachedData, const std::string& path);
+    v8::Local<v8::Script> GetCompiledScriptFromCache(const v8::Local<v8::String> &source, const std::string& sourceURL);
+    v8::Local<v8::Script> GetCompiledScript(const v8::Local<v8::String> &source, const std::string& sourceURL);
+
+    jsi::Value ExecuteString(v8::Local<v8::String> source, const jsi::Buffer* cache, v8::Local<v8::Value> name, bool report_exceptions);
+    jsi::Value ExecuteString(const v8::Local<v8::String>& source, const std::string& sourceURL);
+
+    void Log(const std::string& message, const unsigned int logLevel) {
+      if (logger_) {
+        (*logger_)("V8Runtime:: " + message, logLevel);
+      }
+    }
+
+    void ReportException(v8::TryCatch* try_catch);
+
+    v8::Isolate* GetIsolate() const { return isolate_; }
+
+    // Basically convenience casts
+    static v8::Local<v8::String> stringRef(const jsi::String& str);
+    static v8::Local<v8::Value> valueRef(const jsi::PropNameID& sym);
+    static v8::Local<v8::Object> objectRef(const jsi::Object& obj);
+
+    v8::Local<v8::Value> valueRef(const jsi::Value& value);
+    jsi::Value createValue(v8::Local<v8::Value> value) const;
+
+    // Factory methods for creating String/Object
+    jsi::String createString(v8::Local<v8::String> stringRef) const;
+    jsi::PropNameID createPropNameID(v8::Local<v8::Value> propValRef);
+    jsi::Object createObject(v8::Local<v8::Object> objectRef) const;
+
+    // Used by factory methods and clone methods
+    jsi::Runtime::PointerValue* makeStringValue(v8::Local<v8::String> str) const;
+    jsi::Runtime::PointerValue* makeObjectValue(v8::Local<v8::Object> obj) const;
+
+    v8::Isolate* isolate_;
+    std::unique_ptr<IsolateData> isolate_data_;
+
+    v8::Global<v8::Context> context_;
+
+    v8::StartupData startup_data_;
+    v8::Isolate::CreateParams create_params_;
+
+    v8::Persistent<v8::FunctionTemplate> hostFunctionTemplate_;
+    v8::Persistent<v8::Function> hostObjectConstructor_;
+
+    std::list<std::shared_ptr<HostObjectLifetimeTracker>> hostObjectLifetimeTrackerList_;
+
+    // These are a few configuration parameter used only on Android now.
+    bool isCacheEnabled_ {false};
+    bool shouldProduceFullCache_ {false};
+    bool shouldSetNoLazyFlag_ {false};
+    std::string cacheDirectory_;
+    CacheType cacheType_;
+
+    bool reportException_{ true };
+    bool printResult_{ false };
+    std::string desc_;
+
+    const v8::Platform* platform_;
+    std::shared_ptr<Logger> logger_;
+
+    std::shared_ptr<CacheProvider> cacheProvider_;
+    std::unique_ptr<InspectorInterface> inspector_{nullptr};
+
+    std::unique_ptr<const jsi::Buffer> default_snapshot_blob_;
+    std::unique_ptr<const jsi::Buffer> default_natives_blob_;
+    std::unique_ptr<const jsi::Buffer> custom_snapshot_blob_;
+
+    v8::StartupData default_snapshot_startup_data_;
+    v8::StartupData default_natives_startup_data_;
+    v8::StartupData custom_snapshot_startup_data_;
+
+    std::vector<std::unique_ptr<ExternalOwningOneByteStringResource>> owned_external_string_resources_;
+
+    // v8::Platform is shared between isolates. It will be kept alive till there is an isolate using it.
+    // It will be shutdown when isolate count drops to zero.
+    // Following statics are used to manage the liftime of the v8::Platform.
+    static std::mutex sMutex_;
+    static bool sIsPlatformCreated_;
+    static unsigned int sCurrentIsolateCount_;
+  };
+}} // namespace facebook::v8runtime
\ No newline at end of file
