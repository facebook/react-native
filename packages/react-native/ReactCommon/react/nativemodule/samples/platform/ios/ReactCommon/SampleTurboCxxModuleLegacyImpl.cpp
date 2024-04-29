/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SampleTurboCxxModuleLegacyImpl.h"

#include <cxxreact/JsArgumentHelpers.h>

using namespace facebook::xplat::module;

namespace facebook::react {

SampleTurboCxxModuleLegacyImpl::SampleTurboCxxModuleLegacyImpl() {}

std::string SampleTurboCxxModuleLegacyImpl::getName() {
  return "SampleTurboCxxModule_v2";
}

std::map<std::string, folly::dynamic>
SampleTurboCxxModuleLegacyImpl::getConstants() {
  return {
      {"const1", true},
      {"const2", 375},
      {"const3", "something"},
  };
};

std::vector<CxxModule::Method> SampleTurboCxxModuleLegacyImpl::getMethods() {
  return {
      CxxModule::Method(
          "voidFunc", [this](folly::dynamic args) { voidFunc(); }),
      CxxModule::Method(
          "getBool",
          [this](folly::dynamic args) {
            return getBool(xplat::jsArgAsBool(args, 0));
          },
          CxxModule::SyncTag),
      CxxModule::Method(
          "getEnum",
          [this](folly::dynamic args) {
            return getEnum(xplat::jsArgAsDouble(args, 0));
          },
          CxxModule::SyncTag),
      CxxModule::Method(
          "getNumber",
          [this](folly::dynamic args) {
            return getNumber(xplat::jsArgAsDouble(args, 0));
          },
          CxxModule::SyncTag),
      CxxModule::Method(
          "getString",
          [this](folly::dynamic args) {
            return getString(xplat::jsArgAsString(args, 0));
          },
          CxxModule::SyncTag),
      CxxModule::Method(
          "getString",
          [this](folly::dynamic args) {
            return getString(xplat::jsArgAsString(args, 0));
          },
          CxxModule::SyncTag),
      CxxModule::Method(
          "getArray",
          [this](folly::dynamic args) {
            return getArray(xplat::jsArgAsArray(args, 0));
          },
          CxxModule::SyncTag),
      CxxModule::Method(
          "getObject",
          [this](folly::dynamic args) {
            return getObject(xplat::jsArgAsObject(args, 0));
          },
          CxxModule::SyncTag),
      CxxModule::Method(
          "getUnsafeObject",
          [this](folly::dynamic args) {
            return getUnsafeObject(xplat::jsArgAsObject(args, 0));
          },
          CxxModule::SyncTag),
      CxxModule::Method(
          "getRootTag",
          [this](folly::dynamic args) {
            return getNumber(xplat::jsArgAsDouble(args, 0));
          },
          CxxModule::SyncTag),
      CxxModule::Method(
          "getValue",
          [this](folly::dynamic args) {
            return getValue(
                xplat::jsArgAsDouble(args, 0),
                xplat::jsArgAsString(args, 1),
                xplat::jsArgAsObject(args, 2));
          },
          CxxModule::SyncTag),
      CxxModule::Method(
          "getValueWithCallback",
          [this](folly::dynamic args, CxxModule::Callback callback) {
            getValueWithCallback(callback);
          }),
      CxxModule::Method(
          "getValueWithPromise",
          [this](
              folly::dynamic args,
              CxxModule::Callback resolve,
              CxxModule::Callback reject) {
            getValueWithPromise(xplat::jsArgAsBool(args, 0), resolve, reject);
          }),
  };
};

void SampleTurboCxxModuleLegacyImpl::voidFunc() {
  // Do nothing.
}

bool SampleTurboCxxModuleLegacyImpl::getBool(bool arg) {
  return arg;
}

double SampleTurboCxxModuleLegacyImpl::getEnum(double arg) {
  return arg;
}

double SampleTurboCxxModuleLegacyImpl::getNumber(double arg) {
  return arg;
}

std::string SampleTurboCxxModuleLegacyImpl::getString(const std::string& arg) {
  return arg;
}

folly::dynamic SampleTurboCxxModuleLegacyImpl::getArray(
    const folly::dynamic& arg) {
  return arg;
}

folly::dynamic SampleTurboCxxModuleLegacyImpl::getObject(
    const folly::dynamic& arg) {
  return arg;
}

folly::dynamic SampleTurboCxxModuleLegacyImpl::getUnsafeObject(
    const folly::dynamic& arg) {
  return arg;
}

double SampleTurboCxxModuleLegacyImpl::getRootTag(double arg) {
  return arg;
}

folly::dynamic SampleTurboCxxModuleLegacyImpl::getValue(
    double x,
    const std::string& y,
    const folly::dynamic& z) {
  return folly::dynamic::object("x", x)("y", y)("z", z);
}

void SampleTurboCxxModuleLegacyImpl::getValueWithCallback(
    const CxxModule::Callback& callback) {
  callback({"value from callback!"});
}

void SampleTurboCxxModuleLegacyImpl::getValueWithPromise(
    bool error,
    const CxxModule::Callback& resolve,
    const CxxModule::Callback& reject) {
  if (!error) {
    resolve({"result!"});
  } else {
    reject(
        {folly::dynamic::object("message", "intentional promise rejection")});
  }
}

} // namespace facebook::react
