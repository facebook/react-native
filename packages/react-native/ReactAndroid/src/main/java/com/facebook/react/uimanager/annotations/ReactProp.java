/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.annotations;

import static java.lang.annotation.RetentionPolicy.RUNTIME;

import androidx.annotation.Nullable;
import com.facebook.react.common.annotations.DeprecatedInNewArchitecture;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

/**
 * Use this annotation to annotate properties of native views that should be exposed to JS. This
 * annotation should only be used for setter methods of subclasses of {@link
 * com.facebook.react.uimanager.ViewManager}.
 *
 * <p>Each annotated method should return {@code void} and take exactly two arguments: first being a
 * view instance to be updated and second a value that should be set.
 *
 * <p>Allowed types of values are:
 *
 * <ul>
 *   <li>primitives (int, boolean, double, float)
 *   <li>{@link String}
 *   <li>{@link Boolean}
 *   <li>{@link com.facebook.react.bridge.ReadableArray}
 *   <li>{@link com.facebook.react.bridge.ReadableMap}
 * </ul>
 *
 * <p>When property gets removed from the corresponding component in React, annotated setter will be
 * called with {@code null} in case of non-primitive value type or with a default value in case when
 * the value type is a primitive (use appropriate default field of this annotation to customize
 * default value that is going to be used: {@link #defaultBoolean}, {@link #defaultDouble}, etc.)
 *
 * <p>Since in case of property removal for non-primitive value type setter will be called with
 * value set to {@code null} it's required that value type is annotated with {@link Nullable}.
 *
 * <p>Note: Since boolean property type can be represented both as primitive and wrapped default
 * value set through {@link #defaultBoolean} is only respected for primitive type and for the
 * wrapped type {@code null} will be used as a default.
 */
@Retention(RUNTIME)
@Target(ElementType.METHOD)
@DeprecatedInNewArchitecture
public @interface ReactProp {

  // Used as a default value for "customType" property as "null" is not allowed. Moreover, when this
  // const is used in annotation declaration compiler will actually create a copy of it, so
  // comparing it using "==" with this filed doesn't work either. We need to compare using "equals"
  // which means that this value needs to be unique.
  String USE_DEFAULT_TYPE = "__default_type__";

  /**
   * Name of the property exposed to JS that will be updated using setter method annotated with the
   * given instance of {@code ReactProp} annotation
   */
  String name();

  /**
   * Type of property that will be send to JS. In most of the cases {@code customType} should not be
   * set in which case default type will be send to JS based on the type of value argument from the
   * setter method (e.g. for {@code int}, {@code double} default is "number", for {@code
   * ReadableArray} it's "Array"). Custom type may be used when additional processing of the value
   * needs to be done in JS before sending it over the bridge. A good example of that would be
   * backgroundColor property, which is expressed as a {@code String} in JS, but we use {@code
   * processColor} JS module to convert it to {@code int} before sending over the bridge.
   */
  @Nullable
  String customType() default USE_DEFAULT_TYPE;

  /**
   * Default value for property of type {@code double}. This value will be provided to property
   * setter method annotated with {@link ReactProp} if property with a given name gets removed from
   * the component description in JS
   */
  double defaultDouble() default 0.0;

  /**
   * Default value for property of type {@code float}. This value will be provided to property
   * setter method annotated with {@link ReactProp} if property with a given name gets removed from
   * the component description in JS
   */
  float defaultFloat() default 0.0f;

  /**
   * Default value for property of type {@code int}. This value will be provided to property setter
   * method annotated with {@link ReactProp} if property with a given name gets removed from the
   * component description in JS
   */
  int defaultInt() default 0;

  /**
   * Default value for property of type {@code long}. This value will be provided to property setter
   * method annotated with {@link ReactProp} if property with a given name gets removed from the
   * component description in JS
   */
  long defaultLong() default 0L;

  /**
   * Default value for property of type {@code boolean}. This value will be provided to property
   * setter method annotated with {@link ReactProp} if property with a given name gets removed from
   * the component description in JS
   */
  boolean defaultBoolean() default false;
}
