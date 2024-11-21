/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>
#include <react/renderer/core/RawPropsKey.h>

namespace facebook::react {

class RawProps;

class RawPropsParserInterface {
public:
  virtual ~RawPropsParserInterface() = default;

//  virtual void prepare() noexcept = 0;
  
  virtual void preparse(const RawProps& rawProps) const noexcept = 0;
  virtual void postPrepare() noexcept = 0;
  // TODO: Why PropsKey? Would be simpler to just use a string here?
  virtual const RawValue* at(const RawProps& rawProps, const RawPropsKey& key) const noexcept = 0;
  
protected:
  // Any function that make private data from RawProps accessible to implementing classes:
  const jsi::Value& getJsiValue(const RawProps& rawProps) const noexcept;
  jsi::Runtime* getRuntime(const RawProps& rawProps) const noexcept;
};

}
