// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once
namespace facebook {
namespace react {
struct noncopyable {
  noncopyable(const noncopyable&) = delete;
  noncopyable& operator=(const noncopyable&) = delete;
 protected:
  noncopyable() = default;
};
}}
