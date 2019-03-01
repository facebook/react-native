//  Copyright (c) Facebook, Inc. and its affiliates.
//
// This source code is licensed under the MIT license found in the
 // LICENSE file in the root directory of this source tree.

#include "V8Runtime.h"
#include "V8Runtime_impl.h"

#include "FileUtils.h"
#include "v8.h"
#include "libplatform/libplatform.h"

#include <cxxreact/ReactMarker.h>

#include "V8Platform.h"

#include <cstdlib>
#include <iostream>
#include <mutex>
#include <atomic>
#include <list>
#include <sstream>

#include <folly/json.h>

namespace facebook { namespace v8runtime {

  namespace {
    int GetCacheTypeAsInt(const folly::dynamic& v8Config) {
      return v8Config.getDefault("CacheType", static_cast<int>(CacheType::NoCache)).getInt();
    }

    std::string GetCacheDirectoryPath(const folly::dynamic& v8Config) {
      return v8Config.getDefault("CacheDirectory", "").getString();
    }

    bool IsCacheEnabled(const folly::dynamic& v8Config) {
      return
        !v8Config.isNull() &&
        !GetCacheDirectoryPath(v8Config).empty() &&
        GetCacheTypeAsInt(v8Config) != static_cast<int>(CacheType::NoCache);
    }

    bool ShouldProduceFullCache(const folly::dynamic& v8Config) {
      return GetCacheTypeAsInt(v8Config) == static_cast<int>(CacheType::FullCodeCache);
    }

    bool ShouldSetNoLazyFlag(const folly::dynamic& v8Config) {
      return !v8Config.isNull() && !v8Config.getDefault("UseLazyScriptCompilation", false).getBool();
    }

    // Extracts a C string from a V8 Utf8Value.
    const char* ToCString(const v8::String::Utf8Value& value) {
      return *value ? *value : "<string conversion failed>";
    }
  }

  V8Runtime::V8Runtime() {
    // NewDefaultPlatform is causing linking error on droid.
    // The issue is similar to what is mentioned here https://groups.google.com/forum/#!topic/v8-users/Jb1VSouy2Z0
    // We are trying to figure out solution but using it's deprecated cousin CreateDefaultPlatform for now.

    // platform_ = v8::platform::NewDefaultPlatform();
    // v8::V8::InitializePlatform(platform_.get());
    {
      std::lock_guard<std::mutex> lock(sMutex_);
      if (!sIsPlatformCreated_) {
        v8::Platform *platform = v8::platform::CreateDefaultPlatform();
        v8::V8::InitializePlatform(platform);
        v8::V8::Initialize();
        sIsPlatformCreated_ = true;
      }

      create_params_.array_buffer_allocator = v8::ArrayBuffer::Allocator::NewDefaultAllocator();
      isolate_ = v8::Isolate::New(create_params_);
      ++sCurrentIsolateCount_;
    }

    isolate_->Enter();

    v8::HandleScope handleScope(isolate_);
    context_.Reset(GetIsolate(), CreateContext(isolate_));

    v8::Context::Scope context_scope(context_.Get(GetIsolate()));

    // Create and keep the constuctor for creating Host objects.
    v8::Local<v8::FunctionTemplate> constructorForHostObjectTemplate = v8::FunctionTemplate::New(isolate_);
    v8::Local<v8::ObjectTemplate> hostObjectTemplate = constructorForHostObjectTemplate->InstanceTemplate();
    hostObjectTemplate->SetHandler(v8::NamedPropertyHandlerConfiguration(HostObjectProxy::Get, HostObjectProxy::Set, nullptr, nullptr, HostObjectProxy::Enumerator));
    hostObjectTemplate->SetInternalFieldCount(1);
    hostObjectConstructor_.Reset(isolate_, constructorForHostObjectTemplate->GetFunction());
  }

  V8Runtime::V8Runtime(const folly::dynamic& v8Config) : V8Runtime() {
    isCacheEnabled_  = IsCacheEnabled(v8Config);
    shouldProduceFullCache_ = ShouldProduceFullCache(v8Config);
    shouldSetNoLazyFlag_ = ShouldSetNoLazyFlag(v8Config);
    cacheDirectory_ = GetCacheDirectoryPath(v8Config);
    cacheType_ = static_cast<CacheType>(v8Config.getDefault("CacheType", static_cast<int>(CacheType::NoCache)).getInt());
  }

  v8::ScriptCompiler::CachedData* V8Runtime::TryLoadCachedData(const std::string& path) {
    long length = 0;
    auto data = facebook::react::FileUtils::ReadBinary(path, length);
    if (!data) {
      return nullptr;
    }

    return new v8::ScriptCompiler::CachedData(reinterpret_cast<uint8_t*>(data), length, v8::ScriptCompiler::CachedData::BufferOwned);
  }

  void V8Runtime::PersistCachedData(std::unique_ptr<v8::ScriptCompiler::CachedData> cachedData, const std::string& path) {
    if (!cachedData) {
      if (react::ReactMarker::logTaggedMarker) {
        react::ReactMarker::logMarker(react::ReactMarker::BYTECODE_CREATION_FAILED);
      }
      return;
    }

    int length = cachedData->length;
    bool result = facebook::react::FileUtils::WriteBinary(path, cachedData->data, length);

    if (!result) {
      if (react::ReactMarker::logTaggedMarker) {
        react::ReactMarker::logMarker(react::ReactMarker::BYTECODE_WRITE_FAILED);
      }
    }
  }

  v8::Local<v8::Script> V8Runtime::GetCompiledScriptFromCache(const v8::Local<v8::String> &sourceString, const std::string& sourceURL) {
    std::size_t found = sourceURL.find_last_of("/");
    std::string cacheFilePath = cacheDirectory_ + std::string("/") + sourceURL.substr(found + 1) + ".v8cache";
    auto cacheData = TryLoadCachedData(cacheFilePath);

    // No need to delete cacheData as ScriptCompiler::Source will take its ownership.
    v8::ScriptCompiler::Source source(sourceString, cacheData);

    v8::Local<v8::Script> script;
    v8::Isolate *isolate = GetIsolate();
    v8::Local<v8::Context> context(isolate->GetCurrentContext());
    v8::TryCatch tc(isolate);
    v8::ScriptCompiler::CompileOptions option = v8::ScriptCompiler::kNoCompileOptions;

    if (shouldSetNoLazyFlag_) {
      const char* lazy = "--nolazy";
      v8::V8::SetFlagsFromString(lazy, strlen(lazy));
    }

    if (cacheData != nullptr) {
      option = v8::ScriptCompiler::kConsumeCodeCache;
      auto maybeScript = v8::ScriptCompiler::Compile(context, &source, option);

      if (maybeScript.IsEmpty() || tc.HasCaught()) {
        ReportException(&tc);
      }

      if (cacheData->rejected) {
        int status = remove(cacheFilePath.c_str());
      }

      script = maybeScript.ToLocalChecked();
    }
    else {
      if (shouldProduceFullCache_) {
        option = v8::ScriptCompiler::kProduceFullCodeCache;
      }
      else {
        option = v8::ScriptCompiler::kProduceCodeCache;
      }
      auto maybeScript = v8::ScriptCompiler::Compile(context, &source, option);

      if (maybeScript.IsEmpty() || tc.HasCaught()) {
        ReportException(&tc);
      }

      script = maybeScript.ToLocalChecked();

      // Don't create cache if the bundle is getting reloaded from dev server.
      if (sourceURL.find("http://localhost:8081") == 0) {
        return script;
      }
      
      v8::Local<v8::UnboundScript> unboundScript = script->GetUnboundScript();

      // CreateCodeCache always create buffer with BufferPolicy::BufferOwned,
      // We need to just free CachedData and it will take care of deleting underlying buffer.
      std::unique_ptr<v8::ScriptCompiler::CachedData> cachedData{ v8::ScriptCompiler::CreateCodeCache(unboundScript) };
      PersistCachedData(std::move(cachedData), cacheFilePath);
    }

    return script;
  }

  v8::Local<v8::Script> V8Runtime::GetCompiledScript(const v8::Local<v8::String> &source, const std::string& sourceURL) {
    v8::Isolate *isolate = GetIsolate();
    v8::TryCatch try_catch(isolate);
    v8::MaybeLocal<v8::String> name = v8::String::NewFromUtf8(isolate, reinterpret_cast<const char*>(sourceURL.c_str()));
    v8::ScriptOrigin origin(name.ToLocalChecked());
    v8::Local<v8::Context> context(isolate->GetCurrentContext());

    if (!isCacheEnabled_) {
      v8::Local<v8::Script> script;
      if (!v8::Script::Compile(context, source, &origin).ToLocal(&script)) {
        ReportException(&try_catch);
      }
      return script;
    }

    return GetCompiledScriptFromCache(source, sourceURL);
  }


  bool V8Runtime::ExecuteString(const v8::Local<v8::String>& source, const std::string& sourceURL) {
    _ISOLATE_CONTEXT_ENTER
    v8::TryCatch try_catch(isolate);
    v8::Local<v8::Context> context(isolate->GetCurrentContext());
    v8::Local<v8::Script> script = GetCompiledScript(source, sourceURL);

    v8::Local<v8::Value> result;
    if (!script->Run(context).ToLocal(&result)) {
      assert(try_catch.HasCaught());
      // Print errors that happened during execution.
      ReportException(&try_catch);
      return false;
    }
    else {
      assert(!try_catch.HasCaught());
      if (printResult_ && !result->IsUndefined()) {
        // If all went well and the result wasn't undefined then print
        // the returned value.
        v8::String::Utf8Value str(isolate, result);
        const char* cstr = ToCString(str);
        printf("%s\n", cstr);
      }
      return true;
    }
  }
}} // namespace facebook::v8runtime
