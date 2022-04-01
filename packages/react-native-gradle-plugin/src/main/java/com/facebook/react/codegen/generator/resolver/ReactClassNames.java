/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.resolver;

import com.squareup.javapoet.ClassName;

/** Names of React-specific Java classes required by generated code. */
public class ReactClassNames {

  public static final ClassName REACT_APPLICATION_CONTEXT =
      ClassName.bestGuess("com.facebook.react.bridge.ReactApplicationContext");
  public static final ClassName REACT_CALLBACK =
      ClassName.bestGuess("com.facebook.react.bridge.Callback");
  public static final ClassName REACT_CONTEXT_BASE_JAVA_MODULE =
      ClassName.bestGuess("com.facebook.react.bridge.ReactContextBaseJavaModule");
  public static final ClassName REACT_METHOD =
      ClassName.bestGuess("com.facebook.react.bridge.ReactMethod");
  public static final ClassName REACT_MODULE_WITH_SPEC =
      ClassName.bestGuess("com.facebook.react.bridge.ReactModuleWithSpec");
  public static final ClassName REACT_PROMISE =
      ClassName.bestGuess("com.facebook.react.bridge.Promise");
  public static final ClassName REACT_READABLE_ARRAY =
      ClassName.bestGuess("com.facebook.react.bridge.ReadableArray");
  public static final ClassName REACT_READABLE_MAP =
      ClassName.bestGuess("com.facebook.react.bridge.ReadableMap");
  public static final ClassName REACT_WRITABLE_ARRAY =
      ClassName.bestGuess("com.facebook.react.bridge.WritableArray");
  public static final ClassName REACT_WRITABLE_MAP =
      ClassName.bestGuess("com.facebook.react.bridge.WritableMap");
  public static final ClassName REACT_BUILD_CONFIG =
      ClassName.bestGuess("com.facebook.react.common.build.ReactBuildConfig");
  public static final ClassName REACT_TURBOMODULE =
      ClassName.bestGuess("com.facebook.react.turbomodule.core.interfaces.TurboModule");
}
