// Copyright 2004-present Facebook. All Rights Reserved.

#include "LegacyInspectorEnvironment.h"

#include <JavaScriptCore/config.h>
#include <JavaScriptCore/Completion.h>
#include <JavaScriptCore/JSGlobalObject.h>
#include <JavaScriptCore/InjectedScriptManager.h>
#include <JavaScriptCore/InjectedScriptHost.h>

#include <folly/Memory.h>

namespace facebook {
namespace react {

using namespace Inspector;

LegacyInspectorEnvironment::LegacyInspectorEnvironment()
    : injectedScriptManager_(folly::make_unique<InjectedScriptManager>(*this, InjectedScriptHost::create())) {}

LegacyInspectorEnvironment::~LegacyInspectorEnvironment() {
  injectedScriptManager_->disconnect();
}

InspectorFunctionCallHandler LegacyInspectorEnvironment::functionCallHandler() const {
  return JSC::call;
}

InspectorEvaluateHandler LegacyInspectorEnvironment::evaluateHandler() const {
  return JSC::evaluate;
}

}
}
