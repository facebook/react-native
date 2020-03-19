--- "e:\\github\\fb-react-native-forpatch-base\\ReactCommon\\jsi\\V8Runtime_droid.cpp"	1969-12-31 16:00:00.000000000 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactCommon\\jsi\\V8Runtime_droid.cpp"	2020-01-29 14:10:09.826890700 -0800
@@ -0,0 +1,157 @@
+//  Copyright (c) Facebook, Inc. and its affiliates.
+//
+// This source code is licensed under the MIT license found in the
+ // LICENSE file in the root directory of this source tree.
+
+#include "V8Runtime.h"
+#include "V8Runtime_impl.h"
+
+#include "FileUtils.h"
+#include "v8.h"
+#include "libplatform/libplatform.h"
+
+#include <cxxreact/ReactMarker.h>
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
+#include <folly/json.h>
+
+namespace facebook { namespace v8runtime {
+
+  namespace {
+    int GetCacheTypeAsInt(const folly::dynamic& v8Config) {
+      return v8Config.getDefault("CacheType", static_cast<int>(CacheType::NoCache)).getInt();
+    }
+
+    std::string GetCacheDirectoryPath(const folly::dynamic& v8Config) {
+      return v8Config.getDefault("CacheDirectory", "").getString();
+    }
+
+    bool IsCacheEnabled(const folly::dynamic& v8Config) {
+      return
+        !v8Config.isNull() &&
+        !GetCacheDirectoryPath(v8Config).empty() &&
+        GetCacheTypeAsInt(v8Config) != static_cast<int>(CacheType::NoCache);
+    }
+
+    bool ShouldProduceFullCache(const folly::dynamic& v8Config) {
+      return GetCacheTypeAsInt(v8Config) == static_cast<int>(CacheType::FullCodeCache);
+    }
+
+    bool ShouldSetNoLazyFlag(const folly::dynamic& v8Config) {
+      return !v8Config.isNull() && !v8Config.getDefault("UseLazyScriptCompilation", false).getBool();
+    }
+  }
+
+  V8Runtime::V8Runtime(const folly::dynamic& v8Config, const std::shared_ptr<Logger>& logger) : V8Runtime() {
+    logger_ = logger;
+    isCacheEnabled_  = IsCacheEnabled(v8Config);
+    shouldProduceFullCache_ = ShouldProduceFullCache(v8Config);
+    shouldSetNoLazyFlag_ = ShouldSetNoLazyFlag(v8Config);
+    cacheDirectory_ = GetCacheDirectoryPath(v8Config);
+    cacheType_ = static_cast<CacheType>(v8Config.getDefault("CacheType", static_cast<int>(CacheType::NoCache)).getInt());
+  }
+
+  v8::ScriptCompiler::CachedData* V8Runtime::TryLoadCachedData(const std::string& path) {
+    long length = 0;
+    auto data = facebook::react::FileUtils::ReadBinary(path, length);
+    if (!data) {
+      return nullptr;
+    }
+
+    return new v8::ScriptCompiler::CachedData(reinterpret_cast<uint8_t*>(data), length, v8::ScriptCompiler::CachedData::BufferOwned);
+  }
+
+  void V8Runtime::PersistCachedData(std::unique_ptr<v8::ScriptCompiler::CachedData> cachedData, const std::string& path) {
+    if (!cachedData) {
+      if (react::ReactMarker::logTaggedMarker) {
+        react::ReactMarker::logMarker(react::ReactMarker::BYTECODE_CREATION_FAILED);
+      }
+      return;
+    }
+
+    int length = cachedData->length;
+    bool result = facebook::react::FileUtils::WriteBinary(path, cachedData->data, length);
+
+    if (!result) {
+      if (react::ReactMarker::logTaggedMarker) {
+        react::ReactMarker::logMarker(react::ReactMarker::BYTECODE_WRITE_FAILED);
+      }
+    }
+  }
+
+  v8::Local<v8::Script> V8Runtime::GetCompiledScriptFromCache(const v8::Local<v8::String> &sourceString, const std::string& sourceURL) {
+    std::size_t found = sourceURL.find_last_of("/");
+    std::string cacheFilePath = cacheDirectory_ + std::string("/") + sourceURL.substr(found + 1) + ".v8cache";
+    auto cacheData = TryLoadCachedData(cacheFilePath);
+
+    // No need to delete cacheData as ScriptCompiler::Source will take its ownership.
+    v8::ScriptCompiler::Source source(sourceString, cacheData);
+
+    v8::Local<v8::Script> script;
+    v8::Isolate *isolate = GetIsolate();
+    v8::Local<v8::Context> context(isolate->GetCurrentContext());
+    v8::TryCatch tc(isolate);
+    v8::ScriptCompiler::CompileOptions option = v8::ScriptCompiler::kNoCompileOptions;
+
+    if (shouldSetNoLazyFlag_) {
+      const char* lazy = "--nolazy";
+      v8::V8::SetFlagsFromString(lazy, strlen(lazy));
+    }
+
+    if (cacheData != nullptr) {
+      option = v8::ScriptCompiler::kConsumeCodeCache;
+      auto maybeScript = v8::ScriptCompiler::Compile(context, &source, option);
+
+      if (maybeScript.IsEmpty() || tc.HasCaught()) {
+        ReportException(&tc);
+      }
+
+      if (cacheData->rejected) {
+        remove(cacheFilePath.c_str());
+      }
+
+      script = maybeScript.ToLocalChecked();
+    }
+    else {
+      if (shouldProduceFullCache_) {
+        option = v8::ScriptCompiler::kProduceFullCodeCache;
+      }
+      else {
+        option = v8::ScriptCompiler::kProduceCodeCache;
+      }
+      auto maybeScript = v8::ScriptCompiler::Compile(context, &source, option);
+
+      if (maybeScript.IsEmpty() || tc.HasCaught()) {
+        ReportException(&tc);
+      }
+
+      script = maybeScript.ToLocalChecked();
+
+      // Don't create cache if the bundle is getting reloaded from dev server.
+      if (sourceURL.find("http://localhost:8081") == 0) {
+        return script;
+      }
+      
+      v8::Local<v8::UnboundScript> unboundScript = script->GetUnboundScript();
+
+      // CreateCodeCache always create buffer with BufferPolicy::BufferOwned,
+      // We need to just free CachedData and it will take care of deleting underlying buffer.
+      std::unique_ptr<v8::ScriptCompiler::CachedData> cachedData{ v8::ScriptCompiler::CreateCodeCache(unboundScript) };
+      PersistCachedData(std::move(cachedData), cacheFilePath);
+    }
+
+    return script;
+  }
+
+  std::unique_ptr<jsi::Runtime> makeV8Runtime(const folly::dynamic& v8Config, const std::shared_ptr<Logger>& logger) {
+    return std::make_unique<V8Runtime>(v8Config, logger);
+  }
+}} // namespace facebook::v8runtime
\ No newline at end of file
