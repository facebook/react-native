/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <vector>

#include <cxxreact/CxxModule.h>

namespace facebook {
namespace xplat {
namespace samples {

// In a less contrived example, Sample would be part of a traditional
// C++ library.

class Sample {
 public:
  std::string hello();
  double add(double a, double b);
  std::string concat(const std::string &a, const std::string &b);
  std::string repeat(int count, const std::string &str);
  void save(std::map<std::string, std::string> dict);
  std::map<std::string, std::string> load();
  void call_later(int msec, std::function<void()> f);
  void except();
  double twice(double n);

 private:
  std::map<std::string, std::string> state_;
};

class SampleCxxModule : public module::CxxModule {
 public:
  SampleCxxModule(std::unique_ptr<Sample> sample);

  std::string getName();

  virtual auto getConstants() -> std::map<std::string, folly::dynamic>;

  virtual auto getMethods() -> std::vector<Method>;

 private:
  void save(folly::dynamic args);
  void load(folly::dynamic args, Callback cb);

  std::unique_ptr<Sample> sample_;
};

} // namespace samples
} // namespace xplat
} // namespace facebook

extern "C" facebook::xplat::module::CxxModule *SampleCxxModule();
