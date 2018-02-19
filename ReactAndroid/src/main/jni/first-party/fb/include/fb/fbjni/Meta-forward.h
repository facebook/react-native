/*
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace facebook {
namespace jni {

template<typename F>
class JMethod;
template<typename F>
class JStaticMethod;
template<typename F>
class JNonvirtualMethod;
template<typename F>
struct JConstructor;
template<typename F>
class JField;
template<typename F>
class JStaticField;

/// Type traits for Java types (currently providing Java type descriptors)
template<typename T>
struct jtype_traits;

/// Type traits for Java methods (currently providing Java type descriptors)
template<typename F>
struct jmethod_traits;

}}
