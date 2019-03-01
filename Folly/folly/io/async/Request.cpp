/*
 * Copyright 2017 Facebook, Inc.
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

#include <folly/io/async/Request.h>
#include <folly/tracing/StaticTracepoint.h>

#include <glog/logging.h>

#include <folly/MapUtil.h>
#include <folly/SingletonThreadLocal.h>

namespace folly {

void RequestContext::setContextData(
    const std::string& val,
    std::unique_ptr<RequestData> data) {
  auto wlock = data_.wlock();
  if (wlock->count(val)) {
    LOG_FIRST_N(WARNING, 1)
        << "Called RequestContext::setContextData with data already set";

    (*wlock)[val] = nullptr;
  } else {
    (*wlock)[val] = std::move(data);
  }
}

bool RequestContext::setContextDataIfAbsent(
    const std::string& val,
    std::unique_ptr<RequestData> data) {
  auto ulock = data_.ulock();
  if (ulock->count(val)) {
    return false;
  }

  auto wlock = ulock.moveFromUpgradeToWrite();
  (*wlock)[val] = std::move(data);
  return true;
}

bool RequestContext::hasContextData(const std::string& val) const {
  return data_.rlock()->count(val);
}

RequestData* RequestContext::getContextData(const std::string& val) {
  return get_ref_default(*data_.rlock(), val, nullptr).get();
}

const RequestData* RequestContext::getContextData(
    const std::string& val) const {
  return get_ref_default(*data_.rlock(), val, nullptr).get();
}

void RequestContext::onSet() {
  auto rlock = data_.rlock();
  for (auto const& ent : *rlock) {
    if (auto& data = ent.second) {
      data->onSet();
    }
  }
}

void RequestContext::onUnset() {
  auto rlock = data_.rlock();
  for (auto const& ent : *rlock) {
    if (auto& data = ent.second) {
      data->onUnset();
    }
  }
}

void RequestContext::clearContextData(const std::string& val) {
  std::unique_ptr<RequestData> requestData;
  // Delete the RequestData after giving up the wlock just in case one of the
  // RequestData destructors will try to grab the lock again.
  {
    auto wlock = data_.wlock();
    auto it = wlock->find(val);
    if (it != wlock->end()) {
      requestData = std::move(it->second);
      wlock->erase(it);
    }
  }
}

std::shared_ptr<RequestContext> RequestContext::setContext(
    std::shared_ptr<RequestContext> ctx) {
  auto& curCtx = getStaticContext();
  if (ctx != curCtx) {
    FOLLY_SDT(folly, request_context_switch_before, curCtx.get(), ctx.get());
    using std::swap;
    if (curCtx) {
      curCtx->onUnset();
    }
    swap(ctx, curCtx);
    if (curCtx) {
      curCtx->onSet();
    }
  }
  return ctx;
}

std::shared_ptr<RequestContext>& RequestContext::getStaticContext() {
  using SingletonT = SingletonThreadLocal<std::shared_ptr<RequestContext>>;
  static SingletonT singleton;

  return singleton.get();
}

RequestContext* RequestContext::get() {
  auto context = getStaticContext();
  if (!context) {
    static RequestContext defaultContext;
    return std::addressof(defaultContext);
  }
  return context.get();
}
}
