/*
 * Copyright 2014-present Facebook, Inc.
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

#include <boost/version.hpp>
#if BOOST_VERSION >= 106100
#include <boost/context/detail/fcontext.hpp>
#else
#include <boost/context/fcontext.hpp>
#endif
#include <glog/logging.h>

/**
 * Wrappers for different versions of boost::context library
 * API reference for different versions
 * Boost 1.51:
 * http://www.boost.org/doc/libs/1_51_0/libs/context/doc/html/context/context/boost_fcontext.html
 * Boost 1.52:
 * http://www.boost.org/doc/libs/1_52_0/libs/context/doc/html/context/context/boost_fcontext.html
 * Boost 1.56:
 * http://www.boost.org/doc/libs/1_56_0/libs/context/doc/html/context/context/boost_fcontext.html
 * Boost 1.61:
 * https://github.com/boostorg/context/blob/boost-1.61.0/include/boost/context/detail/fcontext.hpp
 */

#include <folly/Function.h>

namespace folly {
namespace fibers {

class FiberImpl {
#if BOOST_VERSION >= 106100
  using FiberContext = boost::context::detail::fcontext_t;
#elif BOOST_VERSION >= 105600
  using FiberContext = boost::context::fcontext_t;
#elif BOOST_VERSION >= 105200
  using FiberContext = boost::context::fcontext_t*;
#else
  using FiberContext = boost::ctx::fcontext_t;
#endif

#if BOOST_VERSION >= 106100
  using MainContext = boost::context::detail::fcontext_t;
#elif BOOST_VERSION >= 105600
  using MainContext = boost::context::fcontext_t;
#elif BOOST_VERSION >= 105200
  using MainContext = boost::context::fcontext_t;
#else
  using MainContext = boost::ctx::fcontext_t;
#endif

 public:
  FiberImpl(
      folly::Function<void()> func,
      unsigned char* stackLimit,
      size_t stackSize)
      : func_(std::move(func)) {
    auto stackBase = stackLimit + stackSize;
#if BOOST_VERSION >= 106100
    stackBase_ = stackBase;
    fiberContext_ =
        boost::context::detail::make_fcontext(stackBase, stackSize, &fiberFunc);
#elif BOOST_VERSION >= 105200
    fiberContext_ =
        boost::context::make_fcontext(stackBase, stackSize, &fiberFunc);
#else
    fiberContext_.fc_stack.limit = stackLimit;
    fiberContext_.fc_stack.base = stackBase;
    make_fcontext(&fiberContext_, &fiberFunc);
#endif
  }

  void activate() {
#if BOOST_VERSION >= 106100
    auto transfer = boost::context::detail::jump_fcontext(fiberContext_, this);
    fiberContext_ = transfer.fctx;
    auto context = reinterpret_cast<intptr_t>(transfer.data);
#elif BOOST_VERSION >= 105200
    auto context = boost::context::jump_fcontext(
        &mainContext_, fiberContext_, reinterpret_cast<intptr_t>(this));
#else
    auto context = jump_fcontext(
        &mainContext_, &fiberContext_, reinterpret_cast<intptr_t>(this));
#endif
    DCHECK_EQ(0, context);
  }

  void deactivate() {
#if BOOST_VERSION >= 106100
    auto transfer =
        boost::context::detail::jump_fcontext(mainContext_, nullptr);
    mainContext_ = transfer.fctx;
    fixStackUnwinding();
    auto context = reinterpret_cast<intptr_t>(transfer.data);
#elif BOOST_VERSION >= 105600
    auto context =
        boost::context::jump_fcontext(&fiberContext_, mainContext_, 0);
#elif BOOST_VERSION >= 105200
    auto context =
        boost::context::jump_fcontext(fiberContext_, &mainContext_, 0);
#else
    auto context = jump_fcontext(&fiberContext_, &mainContext_, 0);
#endif
    DCHECK_EQ(this, reinterpret_cast<FiberImpl*>(context));
  }

 private:
#if BOOST_VERSION >= 106100
  static void fiberFunc(boost::context::detail::transfer_t transfer) {
    auto fiberImpl = reinterpret_cast<FiberImpl*>(transfer.data);
    fiberImpl->mainContext_ = transfer.fctx;
    fiberImpl->fixStackUnwinding();
    fiberImpl->func_();
  }

  void fixStackUnwinding() {
    if (kIsArchAmd64 && kIsLinux) {
      // Extract RBP and RIP from main context to stitch main context stack and
      // fiber stack.
      auto stackBase = reinterpret_cast<void**>(stackBase_);
      auto mainContext = reinterpret_cast<void**>(mainContext_);
      stackBase[-2] = mainContext[6];
      stackBase[-1] = mainContext[7];
    }
  }

  unsigned char* stackBase_;
#else
  static void fiberFunc(intptr_t arg) {
    auto fiberImpl = reinterpret_cast<FiberImpl*>(arg);
    fiberImpl->func_();
  }
#endif

  folly::Function<void()> func_;
  FiberContext fiberContext_;
  MainContext mainContext_;
};
} // namespace fibers
} // namespace folly
