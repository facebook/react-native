--- "e:\\github\\fb-react-native-forpatch-base\\ReactCommon\\jsi\\V8Runtime_shared.cpp"	1969-12-31 16:00:00.000000000 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactCommon\\jsi\\V8Runtime_shared.cpp"	2020-01-29 14:10:09.826890700 -0800
@@ -0,0 +1,767 @@
+//  Copyright (c) Facebook, Inc. and its affiliates.
+//
+// This source code is licensed under the MIT license found in the
+ // LICENSE file in the root directory of this source tree.
+
+#include "V8Runtime.h"
+#include "V8Runtime_impl.h"
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
+#define _ISOLATE_CONTEXT_ENTER v8::Isolate *isolate = v8::Isolate::GetCurrent(); \
+    v8::Isolate::Scope isolate_scope(isolate); \
+    v8::HandleScope handle_scope(isolate); \
+    v8::Context::Scope context_scope(context_.Get(isolate));
+
+namespace facebook { namespace v8runtime {
+
+  std::mutex V8Runtime::sMutex_;
+  bool V8Runtime::sIsPlatformCreated_{ false };
+  unsigned int V8Runtime::sCurrentIsolateCount_{ 0 };
+
+  // String utilities
+  namespace {
+    std::string JSStringToSTLString(v8::Isolate* isolate, v8::Local<v8::String> string) {
+      int utfLen = string->Utf8Length(isolate);
+      std::string result;
+      result.resize(utfLen);
+      string->WriteUtf8(isolate, &result[0], utfLen);
+      return result;
+    }
+
+    // Extracts a C string from a V8 Utf8Value.
+    const char* ToCString(const v8::String::Utf8Value& value) {
+      return *value ? *value : "<string conversion failed>";
+    }
+  } // namespace
+
+  void V8Runtime::AddHostObjectLifetimeTracker(std::shared_ptr<HostObjectLifetimeTracker> hostObjectLifetimeTracker) {
+    // Note that we are letting the list grow in definitely as of now.. The list gets cleaned up when the runtime is teared down.
+    // TODO :: We should remove entries from the list as the objects are garbage collected.
+    hostObjectLifetimeTrackerList_.push_back(hostObjectLifetimeTracker);
+  }
+
+  /*static */void V8Runtime::OnMessage(v8::Local<v8::Message> message, v8::Local<v8::Value> error) {
+    v8::Isolate* isolate = v8::Isolate::GetCurrent();
+    IsolateData* isolateData = reinterpret_cast<IsolateData*>(isolate->GetData(ISOLATE_DATA_SLOT));
+    V8Runtime* runtime = isolateData->runtimeimpl_;
+
+    v8::String::Utf8Value filename(isolate, message->GetScriptOrigin().ResourceName());
+    // (filename):(line) (message)
+    std::stringstream warning;
+    warning << *filename;
+    warning << ":";
+    warning << message->GetLineNumber(isolate->GetCurrentContext()).FromMaybe(-1);
+    warning << " ";
+    v8::String::Utf8Value msg(isolate, message->Get());
+    warning << *msg;
+
+    // Note :: The log levels don't match with react native definitions.
+    (*(runtime->logger_))(warning.str(), message->ErrorLevel());
+
+    if(message->ErrorLevel() == v8::Isolate::MessageErrorLevel::kMessageError) {
+      std::abort();
+    }
+  }
+
+  V8Runtime::V8Runtime(const v8::Platform* platform, std::shared_ptr<Logger>&& logger,
+    std::shared_ptr<facebook::react::MessageQueueThread>&& jsQueue, std::shared_ptr<CacheProvider>&& cacheProvider,
+    std::unique_ptr<InspectorInterface> inspector, std::unique_ptr<const jsi::Buffer> default_snapshot_blob,
+    std::unique_ptr<const jsi::Buffer> default_natives_blob, std::unique_ptr<const jsi::Buffer> custom_snapshot)
+    : platform_(platform), logger_(std::move(logger)), cacheProvider_(std::move(cacheProvider)), inspector_(std::move(inspector)), default_snapshot_blob_(std::move(default_snapshot_blob)), default_natives_blob_(std::move(default_natives_blob)), custom_snapshot_blob_(std::move(custom_snapshot)) {
+
+    if (!platform_) {
+      platform_ = &V8Platform::Get();
+      v8::V8::InitializePlatform(const_cast<v8::Platform*>(platform_));
+    }
+
+    // This can be called multiple times in process.
+    v8::V8::Initialize();
+
+    if (default_snapshot_blob_) {
+      default_snapshot_startup_data_ = { reinterpret_cast<const char*> (default_snapshot_blob_->data()), static_cast<int>(default_snapshot_blob_->size()) };
+      v8::V8::SetSnapshotDataBlob(&default_snapshot_startup_data_);
+    }
+
+    if (default_natives_blob_) {
+      default_natives_startup_data_ = { reinterpret_cast<const char*> (default_natives_blob_->data()), static_cast<int>(default_natives_blob_->size()) };
+      v8::V8::SetNativesDataBlob(&default_natives_startup_data_);
+    }
+
+    if (custom_snapshot_blob_) {
+      custom_snapshot_startup_data_ = { reinterpret_cast<const char*> (custom_snapshot_blob_->data()), static_cast<int>(custom_snapshot_blob_->size()) };
+      create_params_.snapshot_blob = &custom_snapshot_startup_data_;
+    }
+
+    // One per each runtime.
+    create_params_.array_buffer_allocator = v8::ArrayBuffer::Allocator::NewDefaultAllocator();
+
+    isolate_ = v8::Isolate::Allocate();
+    if (isolate_ == nullptr)
+      std::abort();
+
+    isolate_data_ = std::make_unique<IsolateData>(jsQueue, this);
+    isolate_->SetData(ISOLATE_DATA_SLOT, isolate_data_.get());
+
+    v8::Isolate::Initialize(isolate_, create_params_);
+
+    // isolate_->AddMessageListenerWithErrorLevel(OnMessage, v8::Isolate::MessageErrorLevel::kMessageAll);
+    isolate_->AddMessageListenerWithErrorLevel(OnMessage, v8::Isolate::MessageErrorLevel::kMessageError | v8::Isolate::MessageErrorLevel::kMessageWarning);
+
+    // TODO :: Toggle for ship builds.
+    isolate_->SetAbortOnUncaughtExceptionCallback([](v8::Isolate*) {return true; });
+
+    isolate_->Enter();
+
+    v8::HandleScope handleScope(isolate_);
+    context_.Reset(GetIsolate(), CreateContext(isolate_));
+
+    v8::Context::Scope context_scope(context_.Get(GetIsolate()));
+
+    if (inspector_) {
+      inspector_->initialize(isolate_, isolate_->GetCurrentContext(), "JSIRuntime context");
+      inspector_->waitForDebugger();
+    }
+
+    // Create and keep the constuctor for creating Host objects.
+    v8::Local<v8::FunctionTemplate> constructorForHostObjectTemplate = v8::FunctionTemplate::New(isolate_);
+    v8::Local<v8::ObjectTemplate> hostObjectTemplate = constructorForHostObjectTemplate->InstanceTemplate();
+    hostObjectTemplate->SetHandler(v8::NamedPropertyHandlerConfiguration(HostObjectProxy::Get, HostObjectProxy::Set, nullptr, nullptr, HostObjectProxy::Enumerator));
+    hostObjectTemplate->SetInternalFieldCount(1);
+    hostObjectConstructor_.Reset(isolate_, constructorForHostObjectTemplate->GetFunction());
+  }
+
+  V8Runtime::~V8Runtime() {
+
+    hostObjectConstructor_.Reset();
+    context_.Reset();
+
+    for (std::shared_ptr<HostObjectLifetimeTracker> hostObjectLifetimeTracker : hostObjectLifetimeTrackerList_) {
+      hostObjectLifetimeTracker->ResetHostObject(false /*isGC*/);
+    }
+
+    isolate_->Exit();
+    isolate_->Dispose();
+
+    delete create_params_.array_buffer_allocator;
+
+    {
+      std::lock_guard<std::mutex> lock(sMutex_);
+      if (sIsPlatformCreated_ && 0 == --sCurrentIsolateCount_) {
+        v8::V8::ShutdownPlatform();
+        sIsPlatformCreated_ = false;
+      }
+    }
+  }
+
+  jsi::Value V8Runtime::evaluateJavaScript(
+    const std::shared_ptr<const jsi::Buffer>& buffer,
+    const std::string& sourceURL) {
+
+    _ISOLATE_CONTEXT_ENTER
+
+    // TODO :: assert if not one byte.
+    ExternalOwningOneByteStringResource* external_string_resource = new ExternalOwningOneByteStringResource(buffer);
+    v8::Local<v8::String> sourceV8String;
+    if (!v8::String::NewExternalOneByte(isolate, external_string_resource).ToLocal(&sourceV8String)) {
+      // fallback.
+      if (!v8::String::NewFromUtf8(isolate, reinterpret_cast<const char*>(external_string_resource->data()), v8::NewStringType::kNormal, static_cast<int>(external_string_resource->length())).ToLocal(&sourceV8String)) {
+        std::abort();
+      }
+
+      delete external_string_resource;
+    }
+
+    if (cacheProvider_) {
+      v8::Local<v8::String> urlV8String = v8::String::NewFromUtf8(isolate, reinterpret_cast<const char*>(sourceURL.c_str()));
+      std::unique_ptr<const jsi::Buffer> cache{ (*cacheProvider_)(sourceURL) };
+      return ExecuteString(sourceV8String, cache.get(), urlV8String, true);
+    } else {
+      return ExecuteString(sourceV8String, sourceURL);
+    }
+  }
+
+  v8::Local<v8::Context> V8Runtime::CreateContext(v8::Isolate* isolate) {
+    // Create a template for the global object.
+    v8::Local<v8::ObjectTemplate> global = v8::ObjectTemplate::New(isolate);
+
+    v8::Local<v8::Context> context = v8::Context::New(isolate, NULL, global);
+    context->SetAlignedPointerInEmbedderData(1, this);
+    return context;
+  }
+
+  jsi::Value V8Runtime::ExecuteString(v8::Local<v8::String> source, const jsi::Buffer* cache, v8::Local<v8::Value> name, bool report_exceptions) {
+    _ISOLATE_CONTEXT_ENTER
+    v8::TryCatch try_catch(isolate);
+    v8::ScriptOrigin origin(name);
+    v8::Local<v8::Context> context(isolate->GetCurrentContext());
+    v8::Local<v8::Script> script;
+
+    v8::ScriptCompiler::CompileOptions options = v8::ScriptCompiler::CompileOptions::kNoCompileOptions;
+    v8::ScriptCompiler::CachedData* cached_data = nullptr;
+    if (cache) {
+      cached_data = new v8::ScriptCompiler::CachedData(cache->data(), static_cast<int>(cache->size()));
+      options = v8::ScriptCompiler::CompileOptions::kConsumeCodeCache;
+    }
+
+    v8::ScriptCompiler::Source script_source(source, origin, cached_data);
+
+    if (!v8::ScriptCompiler::Compile(context, &script_source, options).ToLocal(&script)) {
+      // Print errors that happened during compilation.
+      if (report_exceptions)
+        ReportException(&try_catch);
+      return createValue(v8::Undefined(GetIsolate()));
+    }
+    else {
+      v8::Local<v8::Value> result;
+      if (!script->Run(context).ToLocal(&result)) {
+        assert(try_catch.HasCaught());
+        // Print errors that happened during execution.
+        if (report_exceptions) {
+          ReportException(&try_catch);
+        }
+        return createValue(v8::Undefined(GetIsolate()));
+      }
+      else {
+        assert(!try_catch.HasCaught());
+        return createValue(result);
+      }
+    }
+  }
+
+  std::shared_ptr<const facebook::jsi::PreparedJavaScript>V8Runtime::prepareJavaScript(const std::shared_ptr<const facebook::jsi::Buffer> &, std::string) {
+    throw jsi::JSINativeException("V8Runtime::prepareJavaScript is not implemented!");
+  }
+
+  facebook::jsi::Value V8Runtime::evaluatePreparedJavaScript(const std::shared_ptr<const facebook::jsi::PreparedJavaScript> &) {
+    throw jsi::JSINativeException("V8Runtime::evaluatePreparedJavaScript is not implemented!");
+  }
+
+  void V8Runtime::ReportException(v8::TryCatch* try_catch) {
+    _ISOLATE_CONTEXT_ENTER
+    v8::String::Utf8Value exception(isolate, try_catch->Exception());
+    const char* exception_string = ToCString(exception);
+    v8::Local<v8::Message> message = try_catch->Message();
+    if (message.IsEmpty()) {
+      // V8 didn't provide any extra information about this error; just
+      // throw the exception.
+      std::string errorMessage{ "<Unknown exception>" };
+      Log(errorMessage, 3 /*logLevel error*/);
+      throw jsi::JSError(*this, errorMessage);
+    }
+    else {
+      // Print (filename):(line number): (message).
+
+      std::stringstream sstr;
+
+      v8::String::Utf8Value filename(isolate, message->GetScriptOrigin().ResourceName());
+      v8::Local<v8::Context> context(isolate->GetCurrentContext());
+      const char* filename_string = ToCString(filename);
+      int linenum = message->GetLineNumber(context).FromJust();
+      sstr << filename_string << ":" << linenum << ": " << exception_string << std::endl;
+
+      // Print line of source code.
+      v8::String::Utf8Value sourceline(isolate, message->GetSourceLine(context).ToLocalChecked());
+      const char* sourceline_string = ToCString(sourceline);
+      sstr << sourceline_string << std::endl;
+
+      // Print wavy underline (GetUnderline is deprecated).
+      int start = message->GetStartColumn(context).FromJust();
+      for (int i = 0; i < start; i++) {
+        sstr << " ";
+      }
+      int end = message->GetEndColumn(context).FromJust();
+      for (int i = start; i < end; i++) {
+        sstr << "^";
+      }
+      sstr << std::endl;
+
+      v8::Local<v8::Value> stack_trace_string;
+      if (try_catch->StackTrace(context).ToLocal(&stack_trace_string) && stack_trace_string->IsString() && v8::Local<v8::String>::Cast(stack_trace_string)->Length() > 0) {
+        v8::String::Utf8Value stack_trace(isolate, stack_trace_string);
+        const char* stack_trace_string2 = ToCString(stack_trace);
+        sstr << stack_trace_string2 << std::endl;
+      }
+
+      std::string errorMessage{ sstr.str() };
+      Log(errorMessage, 3 /*logLevel error*/);
+
+      throw jsi::JSError(*this, errorMessage);
+    }
+  }
+
+  jsi::Object V8Runtime::global() {
+    _ISOLATE_CONTEXT_ENTER
+    return createObject(context_.Get(isolate)->Global());
+  }
+
+  std::string V8Runtime::description() {
+    if (desc_.empty()) {
+      desc_ = std::string("<V8Runtime>");
+    }
+    return desc_;
+  }
+
+  bool V8Runtime::isInspectable() {
+    return false;
+  }
+
+  V8Runtime::V8StringValue::V8StringValue(v8::Local<v8::String> str)
+    : v8String_(v8::Isolate::GetCurrent(), str)
+  {
+  }
+
+  void V8Runtime::V8StringValue::invalidate() {
+    delete this;
+  }
+
+  V8Runtime::V8StringValue::~V8StringValue() {
+    v8String_.Reset();
+  }
+
+  V8Runtime::V8ObjectValue::V8ObjectValue(v8::Local<v8::Object> obj)
+    : v8Object_(v8::Isolate::GetCurrent(), obj) {}
+
+  void V8Runtime::V8ObjectValue::invalidate() {
+      delete this;
+  }
+
+  V8Runtime::V8ObjectValue::~V8ObjectValue() {
+    v8Object_.Reset();
+  }
+
+  // Shallow clone
+  jsi::Runtime::PointerValue* V8Runtime::cloneString(const jsi::Runtime::PointerValue* pv) {
+    if (!pv) {
+      return nullptr;
+    }
+
+    _ISOLATE_CONTEXT_ENTER
+    const V8StringValue* string = static_cast<const V8StringValue*>(pv);
+    return makeStringValue(string->v8String_.Get(GetIsolate()));
+  }
+
+  jsi::Runtime::PointerValue* V8Runtime::cloneObject(const jsi::Runtime::PointerValue* pv) {
+    if (!pv) {
+      return nullptr;
+    }
+
+    _ISOLATE_CONTEXT_ENTER
+    const V8ObjectValue* object = static_cast<const V8ObjectValue*>(pv);
+    return makeObjectValue(object->v8Object_.Get(GetIsolate()));
+  }
+
+  jsi::Runtime::PointerValue* V8Runtime::clonePropNameID(const jsi::Runtime::PointerValue* pv) {
+    if (!pv) {
+      return nullptr;
+    }
+
+    _ISOLATE_CONTEXT_ENTER
+    const V8StringValue* string = static_cast<const V8StringValue*>(pv);
+    return makeStringValue(string->v8String_.Get(GetIsolate()));
+  }
+
+  jsi::Runtime::PointerValue *V8Runtime::cloneSymbol(const jsi::Runtime::PointerValue*) {
+    throw jsi::JSINativeException("V8Runtime::cloneSymbol is not implemented!");
+  }
+
+  std::string V8Runtime::symbolToString(const jsi::Symbol &) {
+    throw jsi::JSINativeException("V8Runtime::symbolToString is not implemented!");
+  }
+
+  jsi::PropNameID V8Runtime::createPropNameIDFromAscii(const char* str, size_t length) {
+    _ISOLATE_CONTEXT_ENTER
+    v8::Local<v8::String> v8String;
+    if (!v8::String::NewFromOneByte(GetIsolate(), reinterpret_cast<uint8_t*>(const_cast<char*>(str)), v8::NewStringType::kNormal, static_cast<int>(length)).ToLocal(&v8String)) {
+      std::stringstream strstream;
+      strstream << "Unable to create property id: " << str;
+      throw jsi::JSError(*this, strstream.str());
+    }
+
+    auto res = createPropNameID(v8String);
+    return res;
+  }
+
+  jsi::PropNameID V8Runtime::createPropNameIDFromUtf8(const uint8_t* utf8, size_t length) {
+    _ISOLATE_CONTEXT_ENTER
+    v8::Local<v8::String> v8String;
+    if (!v8::String::NewFromUtf8(GetIsolate(), reinterpret_cast<const char*>(utf8), v8::NewStringType::kNormal, static_cast<int>(length)).ToLocal(&v8String)) {
+      std::stringstream strstream;
+      strstream << "Unable to create property id: " << utf8;
+      throw jsi::JSError(*this, strstream.str());
+    }
+
+    auto res = createPropNameID(v8String);
+    return res;
+  }
+
+  jsi::PropNameID V8Runtime::createPropNameIDFromString(const jsi::String& str) {
+    _ISOLATE_CONTEXT_ENTER
+    return createPropNameID(stringRef(str));
+  }
+
+  std::string V8Runtime::utf8(const jsi::PropNameID& sym) {
+    _ISOLATE_CONTEXT_ENTER
+    return JSStringToSTLString(GetIsolate(), v8::Local<v8::String>::Cast(valueRef(sym)));
+  }
+
+  bool V8Runtime::compare(const jsi::PropNameID& a, const jsi::PropNameID& b) {
+    _ISOLATE_CONTEXT_ENTER
+    return valueRef(a)->Equals(GetIsolate()->GetCurrentContext(), valueRef(b)).ToChecked();
+  }
+
+  jsi::String V8Runtime::createStringFromAscii(const char* str, size_t length) {
+    return this->createStringFromUtf8(reinterpret_cast<const uint8_t*>(str), length);
+  }
+
+  jsi::String V8Runtime::createStringFromUtf8(const uint8_t* str, size_t length) {
+    _ISOLATE_CONTEXT_ENTER
+    v8::Local<v8::String> v8string;
+    if (!v8::String::NewFromUtf8(v8::Isolate::GetCurrent(), reinterpret_cast<const char*>(str), v8::NewStringType::kNormal, static_cast<int>(length)).ToLocal(&v8string)) {
+      throw jsi::JSError(*this, "V8 string creation failed.");
+    }
+
+    jsi::String jsistr = createString(v8string);
+    return jsistr;
+  }
+
+  std::string V8Runtime::utf8(const jsi::String& str) {
+    _ISOLATE_CONTEXT_ENTER
+    return JSStringToSTLString(GetIsolate(), stringRef(str));
+  }
+
+  jsi::Object V8Runtime::createObject() {
+    _ISOLATE_CONTEXT_ENTER
+    return createObject(v8::Object::New(GetIsolate()));
+  }
+
+  jsi::Object V8Runtime::createObject(std::shared_ptr<jsi::HostObject> hostobject) {
+    _ISOLATE_CONTEXT_ENTER
+    HostObjectProxy* hostObjectProxy = new HostObjectProxy(*this, hostobject);
+    v8::Local<v8::Object> newObject;
+    if (!hostObjectConstructor_.Get(isolate_)->NewInstance(isolate_->GetCurrentContext()).ToLocal(&newObject)) {
+      throw jsi::JSError(*this, "HostObject construction failed!!");
+    }
+
+    newObject->SetInternalField(0, v8::Local<v8::External>::New(GetIsolate(), v8::External::New(GetIsolate(), hostObjectProxy)));
+
+   AddHostObjectLifetimeTracker(std::make_shared<HostObjectLifetimeTracker>(*this, newObject, hostObjectProxy));
+
+  return createObject(newObject);
+  }
+
+  std::shared_ptr<jsi::HostObject> V8Runtime::getHostObject(const jsi::Object& obj) {
+    _ISOLATE_CONTEXT_ENTER
+    v8::Local<v8::External> internalField = v8::Local<v8::External>::Cast(objectRef(obj)->GetInternalField(0));
+    HostObjectProxy* hostObjectProxy = reinterpret_cast<HostObjectProxy*>(internalField->Value());
+    return hostObjectProxy->getHostObject();
+  }
+
+  jsi::Value V8Runtime::getProperty(const jsi::Object& obj, const jsi::String& name) {
+    _ISOLATE_CONTEXT_ENTER
+    return createValue(objectRef(obj)->Get(stringRef(name)));
+
+    v8::MaybeLocal<v8::Value> result = objectRef(obj)->Get(isolate_->GetCurrentContext(), stringRef(name));
+    if (result.IsEmpty()) throw jsi::JSError(*this, "V8Runtime::getProperty failed.");
+    return createValue(result.ToLocalChecked());
+  }
+
+  jsi::Value V8Runtime::getProperty(const jsi::Object& obj, const jsi::PropNameID& name) {
+    _ISOLATE_CONTEXT_ENTER
+    v8::MaybeLocal<v8::Value> result = objectRef(obj)->Get(isolate_->GetCurrentContext(), valueRef(name));
+    if (result.IsEmpty()) throw jsi::JSError(*this, "V8Runtime::getProperty failed.");
+    return createValue(result.ToLocalChecked());
+  }
+
+  bool V8Runtime::hasProperty(const jsi::Object& obj, const jsi::String& name) {
+    _ISOLATE_CONTEXT_ENTER
+    v8::Maybe<bool> result = objectRef(obj)->Has(isolate_->GetCurrentContext(), stringRef(name));
+    if (result.IsNothing()) throw jsi::JSError(*this, "V8Runtime::setPropertyValue failed.");
+    return result.FromJust();
+  }
+
+  bool V8Runtime::hasProperty(const jsi::Object& obj, const jsi::PropNameID& name) {
+    _ISOLATE_CONTEXT_ENTER
+    v8::Maybe<bool> result = objectRef(obj)->Has(isolate_->GetCurrentContext(), valueRef(name));
+    if (result.IsNothing()) throw jsi::JSError(*this, "V8Runtime::setPropertyValue failed.");
+    return result.FromJust();
+  }
+
+  void V8Runtime::setPropertyValue(jsi::Object& object, const jsi::PropNameID& name, const jsi::Value& value) {
+    _ISOLATE_CONTEXT_ENTER
+    v8::Maybe<bool> result = objectRef(object)->Set(isolate_->GetCurrentContext(), valueRef(name), valueRef(value));
+    if (!result.FromMaybe(false)) throw jsi::JSError(*this, "V8Runtime::setPropertyValue failed.");
+  }
+
+  void V8Runtime::setPropertyValue(jsi::Object& object, const jsi::String& name, const jsi::Value& value) {
+    _ISOLATE_CONTEXT_ENTER
+    v8::Maybe<bool> result = objectRef(object)->Set(isolate_->GetCurrentContext(), stringRef(name), valueRef(value));
+    if (!result.FromMaybe(false)) throw jsi::JSError(*this, "V8Runtime::setPropertyValue failed.");
+  }
+
+  bool V8Runtime::isArray(const jsi::Object& obj) const {
+    _ISOLATE_CONTEXT_ENTER
+    return objectRef(obj)->IsArray();
+  }
+
+  bool V8Runtime::isArrayBuffer(const jsi::Object& /*obj*/) const {
+    throw std::runtime_error("Unsupported");
+  }
+
+  uint8_t* V8Runtime::data(const jsi::ArrayBuffer& obj) {
+    throw std::runtime_error("Unsupported");
+  }
+
+  size_t V8Runtime::size(const jsi::ArrayBuffer& /*obj*/) {
+    throw std::runtime_error("Unsupported");
+  }
+
+  bool V8Runtime::isFunction(const jsi::Object& obj) const {
+    _ISOLATE_CONTEXT_ENTER
+      return objectRef(obj)->IsFunction();
+  }
+
+  bool V8Runtime::isHostObject(const jsi::Object& obj) const {
+    _ISOLATE_CONTEXT_ENTER
+      std::abort();
+  }
+
+  // Very expensive
+  jsi::Array V8Runtime::getPropertyNames(const jsi::Object& obj) {
+    _ISOLATE_CONTEXT_ENTER
+    v8::Local<v8::Array> propNames = objectRef(obj)->GetPropertyNames();
+    return createObject(propNames).getArray(*this);
+  }
+
+  jsi::WeakObject V8Runtime::createWeakObject(const jsi::Object&) {
+    throw std::logic_error("Not implemented");
+  }
+
+  jsi::Value V8Runtime::lockWeakObject(const jsi::WeakObject&) {
+    throw std::logic_error("Not implemented");
+  }
+
+  jsi::Array V8Runtime::createArray(size_t length) {
+    _ISOLATE_CONTEXT_ENTER
+    return createObject(v8::Array::New(GetIsolate(), static_cast<int>(length))).getArray(*this);
+  }
+
+  size_t V8Runtime::size(const jsi::Array& arr) {
+    _ISOLATE_CONTEXT_ENTER
+    v8::Local<v8::Array> array = v8::Local<v8::Array>::Cast(objectRef(arr));
+    return array->Length();
+  }
+
+  jsi::Value V8Runtime::getValueAtIndex(const jsi::Array& arr, size_t i) {
+    _ISOLATE_CONTEXT_ENTER
+    v8::Local<v8::Array> array = v8::Local<v8::Array>::Cast(objectRef(arr));
+    return createValue(array->Get(static_cast<uint32_t>(i)));
+  }
+
+  void V8Runtime::setValueAtIndexImpl(jsi::Array& arr, size_t i, const jsi::Value& value) {
+    _ISOLATE_CONTEXT_ENTER
+    v8::Local<v8::Array> array = v8::Local<v8::Array>::Cast(objectRef(arr));
+    array->Set(static_cast<uint32_t>(i), valueRef(value));
+  }
+
+  jsi::Function V8Runtime::createFunctionFromHostFunction(const jsi::PropNameID& name, unsigned int paramCount, jsi::HostFunctionType func) {
+    _ISOLATE_CONTEXT_ENTER
+
+    HostFunctionProxy* hostFunctionProxy = new HostFunctionProxy(*this, func);
+
+    v8::Local<v8::Function> newFunction;
+    if (!v8::Function::New(isolate_->GetCurrentContext(), HostFunctionProxy::HostFunctionCallback,
+      v8::Local<v8::External>::New(GetIsolate(), v8::External::New(GetIsolate(), hostFunctionProxy))).ToLocal(&newFunction)) {
+      throw jsi::JSError(*this, "Creation of HostFunction failed.");
+    }
+
+  AddHostObjectLifetimeTracker(std::make_shared<HostObjectLifetimeTracker>(*this, newFunction, hostFunctionProxy));
+
+  return createObject(newFunction).getFunction(*this);
+  }
+
+  bool V8Runtime::isHostFunction(const jsi::Function& obj) const {
+    std::abort();
+    return false;
+  }
+
+  jsi::HostFunctionType& V8Runtime::getHostFunction(const jsi::Function& obj) {
+    std::abort();
+  }
+
+  jsi::Value V8Runtime::call(const jsi::Function& jsiFunc, const jsi::Value& jsThis, const jsi::Value* args, size_t count) {
+    _ISOLATE_CONTEXT_ENTER
+    v8::Local<v8::Function> func = v8::Local<v8::Function>::Cast(objectRef(jsiFunc));
+    std::vector<v8::Local<v8::Value>> argv;
+    for (size_t i = 0; i < count; i++)
+    {
+      argv.push_back(valueRef(args[i]));
+    }
+
+    v8::MaybeLocal<v8::Value> result = func->Call(isolate_->GetCurrentContext(), valueRef(jsThis), static_cast<int>(count), argv.data());
+
+    // Call can return
+    if (result.IsEmpty()) {
+      return createValue(v8::Undefined(GetIsolate()));
+    }
+    else {
+      return createValue(result.ToLocalChecked());
+    }
+  }
+
+  jsi::Value V8Runtime::callAsConstructor(const jsi::Function& jsiFunc, const jsi::Value* args, size_t count) {
+    _ISOLATE_CONTEXT_ENTER
+    v8::Local<v8::Function> func = v8::Local<v8::Function>::Cast(objectRef(jsiFunc));
+    std::vector<v8::Local<v8::Value>> argv;
+    for (size_t i = 0; i < count; i++)
+    {
+      argv.push_back(valueRef(args[i]));
+    }
+
+    v8::Local<v8::Object> newObject;
+    if (!func->NewInstance(GetIsolate()->GetCurrentContext(), static_cast<int>(count), argv.data()).ToLocal(&newObject)) {
+      new jsi::JSError(*this, "Object construction failed!!");
+    }
+
+    return createValue(newObject);
+  }
+
+  bool V8Runtime::strictEquals(const jsi::String& a, const jsi::String& b) const {
+    _ISOLATE_CONTEXT_ENTER
+    return stringRef(a)->StrictEquals(stringRef(b));
+  }
+
+  bool V8Runtime::strictEquals(const jsi::Object& a, const jsi::Object& b) const {
+    _ISOLATE_CONTEXT_ENTER
+    return objectRef(a)->StrictEquals(objectRef(b));
+  }
+
+  bool V8Runtime::strictEquals(const jsi::Symbol &, const jsi::Symbol &) const {
+    throw jsi::JSINativeException("Not implemented!");
+  }
+
+  bool V8Runtime::instanceOf(const jsi::Object& o, const jsi::Function& f) {
+    _ISOLATE_CONTEXT_ENTER
+    return objectRef(o)->InstanceOf(GetIsolate()->GetCurrentContext(), objectRef(f)).ToChecked();
+  }
+
+  jsi::Runtime::PointerValue* V8Runtime::makeStringValue(v8::Local<v8::String> string) const {
+    return new V8StringValue(string);
+  }
+
+  jsi::String V8Runtime::createString(v8::Local<v8::String> str) const {
+    return make<jsi::String>(makeStringValue(str));
+  }
+
+  jsi::PropNameID V8Runtime::createPropNameID(v8::Local<v8::Value> str) {
+    _ISOLATE_CONTEXT_ENTER
+    return make<jsi::PropNameID>(makeStringValue(v8::Local<v8::String>::Cast(str)));
+  }
+
+  jsi::Runtime::PointerValue* V8Runtime::makeObjectValue(v8::Local<v8::Object> objectRef) const {
+    _ISOLATE_CONTEXT_ENTER
+    return new V8ObjectValue(objectRef);
+  }
+
+  jsi::Object V8Runtime::createObject(v8::Local<v8::Object> obj) const {
+    _ISOLATE_CONTEXT_ENTER
+    return make<jsi::Object>(makeObjectValue(obj));
+  }
+
+  jsi::Value V8Runtime::createValue(v8::Local<v8::Value> value) const {
+    _ISOLATE_CONTEXT_ENTER
+    if (value->IsInt32()) {
+      return jsi::Value(value->Int32Value(GetIsolate()->GetCurrentContext()).ToChecked());
+    } if (value->IsNumber()) {
+      return jsi::Value(value->NumberValue(GetIsolate()->GetCurrentContext()).ToChecked());
+    }
+    else if (value->IsBoolean()) {
+      return jsi::Value(value->BooleanValue(GetIsolate()->GetCurrentContext()).ToChecked());
+    }
+    else if (value.IsEmpty() || value->IsNull()) {
+      return jsi::Value(nullptr);
+    }
+    else if (value->IsUndefined()) {
+      return jsi::Value();
+    }
+    else if (value->IsString()) {
+      // Note :: Non copy create
+      return createString(v8::Local<v8::String>::Cast(value));
+    }
+    else if (value->IsObject()) {
+      return createObject(v8::Local<v8::Object>::Cast(value));
+    }
+    else {
+      // WHAT ARE YOU
+      std::abort();
+    }
+  }
+
+  v8::Local<v8::Value> V8Runtime::valueRef(const jsi::Value& value) {
+
+    v8::EscapableHandleScope handle_scope(v8::Isolate::GetCurrent());
+
+    if (value.isUndefined()) {
+      return handle_scope.Escape(v8::Undefined(GetIsolate()));
+    }
+    else if (value.isNull()) {
+      return handle_scope.Escape(v8::Null(GetIsolate()));
+    }
+    else if (value.isBool()) {
+      return handle_scope.Escape(v8::Boolean::New(GetIsolate(), value.getBool()));
+    }
+    else if (value.isNumber()) {
+      return handle_scope.Escape(v8::Number::New(GetIsolate(), value.getNumber()));
+    }
+    else if (value.isString()) {
+      return handle_scope.Escape(stringRef(value.asString(*this)));
+    }
+    else if (value.isObject()) {
+      return handle_scope.Escape(objectRef(value.getObject(*this)));
+    }
+    else {
+      // What are you?
+      std::abort();
+    }
+  }
+
+  v8::Local<v8::String> V8Runtime::stringRef(const jsi::String& str) {
+    v8::EscapableHandleScope handle_scope(v8::Isolate::GetCurrent());
+    const V8StringValue* v8StringValue = static_cast<const V8StringValue*>(getPointerValue(str));
+    return handle_scope.Escape(v8StringValue->v8String_.Get(v8::Isolate::GetCurrent()));
+  }
+
+  v8::Local<v8::Value> V8Runtime::valueRef(const jsi::PropNameID& sym) {
+    v8::EscapableHandleScope handle_scope(v8::Isolate::GetCurrent());
+    const V8StringValue* v8StringValue = static_cast<const V8StringValue*>(getPointerValue(sym));
+    return handle_scope.Escape(v8StringValue->v8String_.Get(v8::Isolate::GetCurrent()));
+  }
+
+  v8::Local<v8::Object> V8Runtime::objectRef(const jsi::Object& obj) {
+    v8::EscapableHandleScope handle_scope(v8::Isolate::GetCurrent());
+    const V8ObjectValue* v8ObjectValue = static_cast<const V8ObjectValue*>(getPointerValue(obj));
+    return handle_scope.Escape(v8ObjectValue->v8Object_.Get(v8::Isolate::GetCurrent()));
+  }
+
+  std::unique_ptr<jsi::Runtime> makeV8Runtime(const v8::Platform* platform, std::shared_ptr<Logger>&& logger,
+    std::shared_ptr<facebook::react::MessageQueueThread>&& jsQueue, std::shared_ptr<CacheProvider>&& cacheProvider,
+    std::unique_ptr<InspectorInterface> inspector, std::unique_ptr<const jsi::Buffer> default_snapshot_blob,
+    std::unique_ptr<const jsi::Buffer> default_natives_blob, std::unique_ptr<const jsi::Buffer> custom_snapshot) {
+    return std::make_unique<V8Runtime>(platform, std::move(logger), std::move(jsQueue), std::move(cacheProvider), std::move(inspector)
+      , std::move(default_snapshot_blob), std::move(default_natives_blob), std::move(custom_snapshot));
+  }
+
+  std::unique_ptr<jsi::Runtime> makeV8Runtime() {
+    return std::make_unique<V8Runtime>();
+  }
+}} // namespace facebook::v8runtime
\ No newline at end of file
