/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SampleCxxModule.h"
#include <cxxreact/JsArgumentHelpers.h>

#include <glog/logging.h>

#include <memory>
#include <thread>

using namespace folly;

namespace facebook {
namespace xplat {
namespace samples {

std::string Sample::hello() {
  LOG(WARNING) << "glog: hello, world";
  return "hello";
}

double Sample::add(double a, double b) {
  return a + b;
}

std::string Sample::concat(const std::string& a, const std::string& b) {
  return a + b;
}

std::string Sample::repeat(int count, const std::string& str) {
  std::string ret;
  for (int i = 0; i < count; i++) {
    ret += str;
  }

  return ret;
}

void Sample::save(std::map<std::string, std::string> dict) {
  state_ = std::move(dict);
}

std::map<std::string, std::string> Sample::load() {
  return state_;
}

void Sample::except() {
  // TODO mhorowitz #7128529: There's no way to automatically test this
  // right now.
  // throw std::runtime_error("oops");
}

void Sample::call_later(int msec, std::function<void()> f) {
  std::thread t([=] {
    std::this_thread::sleep_for(std::chrono::milliseconds(msec));
    f();
  });
  t.detach();
}

double Sample::twice(double n) {
  return n * 2;
}

SampleCxxModule::SampleCxxModule(std::unique_ptr<Sample> sample)
    : sample_(std::move(sample)) {}

std::string SampleCxxModule::getName() {
  return "Sample";
}

auto SampleCxxModule::getConstants() -> std::map<std::string, folly::dynamic> {
  return {
      {"one", 1},
      {"two", 2},
      {"animal", "fox"},
  };
}

auto SampleCxxModule::getMethods() -> std::vector<Method> {
  return {
      Method("hello", [this] { sample_->hello(); }),
      Method(
          "add",
          [this](dynamic args, Callback cb) {
            LOG(WARNING) << "Sample: add => "
                         << sample_->add(
                                jsArgAsDouble(args, 0), jsArgAsDouble(args, 1));
            cb({sample_->add(jsArgAsDouble(args, 0), jsArgAsDouble(args, 1))});
          }),
      Method(
          "concat",
          [this](dynamic args, Callback cb) {
            cb({sample_->concat(
                jsArgAsString(args, 0), jsArgAsString(args, 1))});
          }),
      Method(
          "repeat",
          [this](dynamic args, Callback cb) {
            cb({sample_->repeat(
                (int)jsArgAsInt(args, 0), jsArgAsString(args, 1))});
          }),
      Method("save", this, &SampleCxxModule::save),
      Method("load", this, &SampleCxxModule::load),
      Method(
          "call_later",
          [this](dynamic args, Callback cb) {
            sample_->call_later((int)jsArgAsInt(args, 0), [cb] { cb({}); });
          }),
      Method("except", [this] { sample_->except(); }),
      Method(
          "twice",
          [this](dynamic args) -> dynamic {
            return sample_->twice(jsArgAsDouble(args, 0));
          },
          SyncTag),
      Method(
          "syncHello",
          [this]() -> dynamic {
            sample_->hello();
            return nullptr;
          },
          SyncTag),
      Method(
          "addIfPositiveAsPromise",
          [](dynamic args, Callback cb, Callback cbError) {
            auto a = jsArgAsDouble(args, 0);
            auto b = jsArgAsDouble(args, 1);
            if (a < 0 || b < 0) {
              cbError({"Negative number!"});
            } else {
              cb({a + b});
            }
          }),
      Method(
          "addIfPositiveAsAsync",
          [](dynamic args, Callback cb, Callback cbError) {
            auto a = jsArgAsDouble(args, 0);
            auto b = jsArgAsDouble(args, 1);
            if (a < 0 || b < 0) {
              cbError({"Negative number!"});
            } else {
              cb({a + b});
            }
          },
          AsyncTag),

  };
}

void SampleCxxModule::save(folly::dynamic args) {
  std::map<std::string, std::string> m;
  for (const auto& p : jsArgN(args, 0, &dynamic::items)) {
    m.emplace(
        jsArg(p.first, &dynamic::asString, "map key"),
        jsArg(p.second, &dynamic::asString, "map value"));
  }
  sample_->save(std::move(m));
}

void SampleCxxModule::load([[maybe_unused]] folly::dynamic args, Callback cb) {
  dynamic d = dynamic::object;
  for (const auto& p : sample_->load()) {
    d.insert(p.first, p.second);
  }
  cb({d});
}

} // namespace samples
} // namespace xplat
} // namespace facebook

// By convention, the function name should be the same as the class name.
facebook::xplat::module::CxxModule* SampleCxxModule() {
  return new facebook::xplat::samples::SampleCxxModule(
      std::make_unique<facebook::xplat::samples::Sample>());
}
