/*
 * Copyright 2017-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

#include <atomic>
#include <memory>
#include <mutex>

#include <folly/experimental/flat_combining/FlatCombining.h>
#include <folly/synchronization/Baton.h>

namespace folly {

struct alignas(hardware_destructive_interference_size) Line {
  uint64_t val_;
};

class Data { // Sequential data structure
 public:
  explicit Data(size_t size) : size_(size) {
    x_ = std::make_unique<Line[]>(size_);
  }

  uint64_t getVal() {
    uint64_t val = x_[0].val_;
    for (size_t i = 1; i < size_; ++i) {
      assert(x_[i].val_ == val);
    }
    return val;
  }

  // add

  void add(uint64_t val) {
    uint64_t oldval = x_[0].val_;
    for (size_t i = 0; i < size_; ++i) {
      assert(x_[i].val_ == oldval);
      x_[i].val_ = oldval + val;
    }
  }

  uint64_t fetchAdd(uint64_t val) {
    uint64_t res = x_[0].val_;
    for (size_t i = 0; i < size_; ++i) {
      assert(x_[i].val_ == res);
      x_[i].val_ += val;
    }
    return res;
  }

 private:
  size_t size_;
  std::unique_ptr<Line[]> x_;
};

// Example of FC concurrent data structure using simple interface

template <
    typename Mutex = std::mutex,
    template <typename> class Atom = std::atomic>
class FcSimpleExample
    : public FlatCombining<FcSimpleExample<Mutex, Atom>, Mutex, Atom> {
  using FC = FlatCombining<FcSimpleExample<Mutex, Atom>, Mutex, Atom>;
  using Rec = typename FC::Rec;

 public:
  explicit FcSimpleExample(
      size_t size,
      bool dedicated = true,
      uint32_t numRecs = 0,
      uint32_t maxOps = 0)
      : FC(dedicated, numRecs, maxOps), data_(size) {}

  uint64_t getVal() {
    return data_.getVal();
  }

  // add

  void addNoFC(uint64_t val) {
    this->requestNoFC([&] { data_.add(val); });
  }

  void add(uint64_t val, Rec* rec = nullptr) {
    auto opFn = [&, val] { // asynchronous -- capture val by value
      data_.add(val);
    };
    this->requestFC(opFn, rec, false);
  }

  // fetchAdd

  uint64_t fetchAddNoFC(uint64_t val) {
    uint64_t res;
    auto opFn = [&] { res = data_.fetchAdd(val); };
    this->requestNoFC(opFn);
    return res;
  }

  uint64_t fetchAdd(uint64_t val, Rec* rec = nullptr) {
    uint64_t res;
    auto opFn = [&] { res = data_.fetchAdd(val); };
    this->requestFC(opFn, rec);
    return res;
  }

 private:
  Data data_;
};

// Example of FC data structure using custom request processing

class Req {
 public:
  enum class Type { ADD, FETCHADD };

  void setType(Type type) {
    type_ = type;
  }

  Type getType() {
    return type_;
  }

  void setVal(uint64_t val) {
    val_ = val;
  }

  uint64_t getVal() {
    return val_;
  }

  void setRes(uint64_t res) {
    res_ = res;
  }

  uint64_t getRes() {
    return res_;
  }

 private:
  Type type_;
  uint64_t val_;
  uint64_t res_;
};

template <
    typename Req,
    typename Mutex = std::mutex,
    template <typename> class Atom = std::atomic>
class FcCustomExample : public FlatCombining<
                            FcCustomExample<Req, Mutex, Atom>,
                            Mutex,
                            Atom,
                            Req> {
  using FC = FlatCombining<FcCustomExample<Req, Mutex, Atom>, Mutex, Atom, Req>;
  using Rec = typename FC::Rec;

 public:
  explicit FcCustomExample(
      int size,
      bool dedicated = true,
      uint32_t numRecs = 0,
      uint32_t maxOps = 0)
      : FC(dedicated, numRecs, maxOps), data_(size) {}

  uint64_t getVal() {
    return data_.getVal();
  }

  // add

  void addNoFC(uint64_t val) {
    this->requestNoFC([&] { data_.add(val); });
  }

  void add(uint64_t val, Rec* rec = nullptr) {
    auto opFn = [&, val] { data_.add(val); };
    auto fillFn = [&](Req& req) {
      req.setType(Req::Type::ADD);
      req.setVal(val);
    };
    this->requestFC(opFn, fillFn, rec, false); // asynchronous
  }

  // fetchAdd

  uint64_t fetchAddNoFC(uint64_t val) {
    uint64_t res;
    auto opFn = [&] { res = data_.fetchAdd(val); };
    this->requestNoFC(opFn);
    return res;
  }

  uint64_t fetchAdd(uint64_t val, Rec* rec = nullptr) {
    uint64_t res;
    auto opFn = [&] { res = data_.fetchAdd(val); };
    auto fillFn = [&](Req& req) {
      req.setType(Req::Type::FETCHADD);
      req.setVal(val);
    };
    auto resFn = [&](Req& req) { res = req.getRes(); };
    this->requestFC(opFn, fillFn, resFn, rec);
    return res;
  }

  // custom combined op processing - overrides FlatCombining::combinedOp(Req&)
  void combinedOp(Req& req) {
    switch (req.getType()) {
      case Req::Type::ADD:
        data_.add(req.getVal());
        return;
      case Req::Type::FETCHADD:
        req.setRes(data_.fetchAdd(req.getVal()));
        return;
    }
    assume_unreachable();
  }

 private:
  Data data_;
};

} // namespace folly
