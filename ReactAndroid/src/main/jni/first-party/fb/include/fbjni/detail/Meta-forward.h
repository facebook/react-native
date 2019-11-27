/**
 * Copyright 2018-present, Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
