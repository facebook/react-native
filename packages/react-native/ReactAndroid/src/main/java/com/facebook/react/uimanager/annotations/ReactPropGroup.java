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
 * Use this annotation to annotate group of properties of native views that should be exposed to JS.
 * This annotation should only be used for setter methods of subclasses of {@link
 * com.facebook.react.uimanager.ViewManager}. It's a batched version of {@link ReactProp} annotation
 * (please see documentation of {@link ReactProp} for more details about how this annotation can be
 * used).
 *
 * <p>This annotation is meant to be used for a group of similar properties. That's why it support
 * only a set of properties of the same type. A good example is supporting "border", where we have 7
 * variations of that property ("borderLeft", "borderHorizontal", etc.) and very similar code for
 * handling each of those.
 *
 * <p>Each annotated method should return {@code void} and take exactly three arguments: first being
 * a view instance to be updated, second should be of type int and will represent index in the group
 * of the property being updated. Last, third argument represent the value that should be set.
 *
 * <p>Currently only {@code int}, {@code float}, {@code double} and {@link String} value types are
 * supported.
 *
 * <p>In case when property has been removed from the corresponding react component annotated setter
 * will be called and default value will be provided as a value parameter. Default value can be
 * customize using {@link #defaultInt} or {@link #defaultFloat} in the case when property is of one
 * of primitive types. In case when {@link String} is the property type {@code null} value will be
 * provided as a default.
 */
@Retention(RUNTIME)
@DeprecatedInNewArchitecture
@Target(ElementType.METHOD)
public @interface ReactPropGroup {

  // Used as a default value for "customType" property as "null" is not allowed. Moreover, when this
  // const is used in annotation declaration compiler will actually create a copy of it, so
  // comparing it using "==" with this filed doesn't work either. We need to compare using "equals"
  // which means that this value needs to be unique.
  String USE_DEFAULT_TYPE = "__default_type__";

  /**
   * Array of names of properties exposed to JS that will be updated using setter method annotated
   * with the given instance of {@code ReactPropGroup} annotation
   */
  String[] names();

  /**
   * Type of property that will be send to JS. In most of the cases {@code customType} should not be
   * set in which case default type will be send to JS based on the type of value argument from the
   * setter method (e.g. for {@code int}, {@code float} default is "number"). Custom type may be
   * used when additional processing of the value needs to be done in JS before sending it over the
   * bridge. A good example of that would be backgroundColor property, which is expressed as a
   * {@code String} in JS, but we use {@code processColor} JS module to convert it to {@code int}
   * before sending over the bridge.
   */
  @Nullable
  String customType() default USE_DEFAULT_TYPE;

  /**
   * Default value for property of type {@code float}. This value will be provided to property
   * setter method annotated with {@link ReactPropGroup} if property with a given name gets removed
   * from the component description in JS
   */
  float defaultFloat() default 0.0f;

  /**
   * Default value for property of type {@code double}. This value will be provided to property
   * setter method annotated with {@link ReactPropGroup} if property with a given name gets removed
   * from the component description in JS
   */
  double defaultDouble() default 0.0;

  /**
   * Default value for property of type {@code int}. This value will be provided to property setter
   * method annotated with {@link ReactPropGroup} if property with a given name gets removed from
   * the component description in JS
   */
  int defaultInt() default 0;

  /**
   * Default value for property of type {@code long}. This value will be provided to property setter
   * method annotated with {@link ReactProp} if property with a given name gets removed from the
   * component description in JS
   */
  long defaultLong() default 0L;
}
