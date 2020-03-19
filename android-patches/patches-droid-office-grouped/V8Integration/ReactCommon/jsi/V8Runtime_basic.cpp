--- "e:\\github\\fb-react-native-forpatch-base\\ReactCommon\\jsi\\V8Runtime_basic.cpp"	1969-12-31 16:00:00.000000000 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactCommon\\jsi\\V8Runtime_basic.cpp"	2020-01-29 14:10:09.826890700 -0800
@@ -0,0 +1,101 @@
+//  Copyright (c) Facebook, Inc. and its affiliates.
+//
+// This source code is licensed under the MIT license found in the
+ // LICENSE file in the root directory of this source tree.
+
+#include "V8Runtime.h"
+#include "V8Runtime_impl.h"
+
+#include <mutex>
+
+namespace facebook { namespace v8runtime {
+
+  namespace {
+    // Extracts a C string from a V8 Utf8Value.
+    const char* ToCString(const v8::String::Utf8Value& value) {
+      return *value ? *value : "<string conversion failed>";
+    }
+  }
+
+  V8Runtime::V8Runtime() {
+    // NewDefaultPlatform is causing linking error on droid.
+    // The issue is similar to what is mentioned here https://groups.google.com/forum/#!topic/v8-users/Jb1VSouy2Z0
+    // We are trying to figure out solution but using it's deprecated cousin CreateDefaultPlatform for now.
+
+    // platform_ = v8::platform::NewDefaultPlatform();
+    // v8::V8::InitializePlatform(platform_.get());
+    {
+      std::lock_guard<std::mutex> lock(sMutex_);
+      if (!sIsPlatformCreated_) {
+        v8::Platform *platform = v8::platform::CreateDefaultPlatform();
+        v8::V8::InitializePlatform(platform);
+        v8::V8::Initialize();
+        sIsPlatformCreated_ = true;
+      }
+
+      create_params_.array_buffer_allocator = v8::ArrayBuffer::Allocator::NewDefaultAllocator();
+      isolate_ = v8::Isolate::New(create_params_);
+      ++sCurrentIsolateCount_;
+    }
+
+    isolate_->Enter();
+
+    v8::HandleScope handleScope(isolate_);
+    context_.Reset(GetIsolate(), CreateContext(isolate_));
+
+    v8::Context::Scope context_scope(context_.Get(GetIsolate()));
+
+    // Create and keep the constuctor for creating Host objects.
+    v8::Local<v8::FunctionTemplate> constructorForHostObjectTemplate = v8::FunctionTemplate::New(isolate_);
+    v8::Local<v8::ObjectTemplate> hostObjectTemplate = constructorForHostObjectTemplate->InstanceTemplate();
+    hostObjectTemplate->SetHandler(v8::NamedPropertyHandlerConfiguration(HostObjectProxy::Get, HostObjectProxy::Set, nullptr, nullptr, HostObjectProxy::Enumerator));
+    hostObjectTemplate->SetInternalFieldCount(1);
+    hostObjectConstructor_.Reset(isolate_, constructorForHostObjectTemplate->GetFunction());
+  }
+
+  v8::Local<v8::Script> V8Runtime::GetCompiledScript(const v8::Local<v8::String> &source, const std::string& sourceURL) {
+    v8::Isolate *isolate = GetIsolate();
+    v8::TryCatch try_catch(isolate);
+    v8::MaybeLocal<v8::String> name = v8::String::NewFromUtf8(isolate, reinterpret_cast<const char*>(sourceURL.c_str()));
+    v8::ScriptOrigin origin(name.ToLocalChecked());
+    v8::Local<v8::Context> context(isolate->GetCurrentContext());
+
+#ifndef JSI_CORE
+    if (isCacheEnabled_) {
+      return GetCompiledScriptFromCache(source, sourceURL);
+    }
+#endif //JSI_CORE
+
+    v8::Local<v8::Script> script;
+    if (!v8::Script::Compile(context, source, &origin).ToLocal(&script)) {
+      ReportException(&try_catch);
+    }
+    return script;
+  }
+
+  jsi::Value V8Runtime::ExecuteString(const v8::Local<v8::String>& source, const std::string& sourceURL) {
+    _ISOLATE_CONTEXT_ENTER
+    v8::TryCatch try_catch(isolate);
+    v8::Local<v8::Context> context(isolate->GetCurrentContext());
+    v8::Local<v8::Script> script = GetCompiledScript(source, sourceURL);
+
+    v8::Local<v8::Value> result;
+    if (!script->Run(context).ToLocal(&result)) {
+      assert(try_catch.HasCaught());
+      // Print errors that happened during execution.
+      ReportException(&try_catch);
+      return false;
+    }
+    else {
+      assert(!try_catch.HasCaught());
+      if (printResult_ && !result->IsUndefined()) {
+        // If all went well and the result wasn't undefined then print
+        // the returned value.
+        v8::String::Utf8Value str(isolate, result);
+        const char* cstr = ToCString(str);
+        printf("%s\n", cstr);
+      }
+      return true;
+    }
+  }
+}} // namespace facebook::v8runtime
