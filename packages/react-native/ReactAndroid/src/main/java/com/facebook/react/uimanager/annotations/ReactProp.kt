/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.annotations

/**
 * Use this annotation to annotate properties of native views that should be exposed to JS. This
 * annotation should only be used for setter methods of subclasses of
 * [com.facebook.react.uimanager.ViewManager].
 *
 * Each annotated method should return `void` and take exactly two arguments: first being a view
 * instance to be updated and second a value that should be set.
 *
 * Allowed types of values are:
 * * primitives (int, boolean, double, float)
 * * [String]
 * * [Boolean]
 * * [com.facebook.react.bridge.ReadableArray]
 * * [com.facebook.react.bridge.ReadableMap]
 *
 * When property gets removed from the corresponding component in React, annotated setter will be
 * called with `null` in case of non-primitive value type or with a default value in case when the
 * value type is a primitive (use appropriate default field of this annotation to customize default
 * value that is going to be used: [defaultBoolean], [defaultDouble], etc.)
 *
 * Since in case of property removal for non-primitive value type setter will be called with value
 * set to `null` it's required that value type is annotated with [Nullable].
 *
 * Note: Since boolean property type can be represented both as primitive and wrapped default value
 * set through [defaultBoolean] is only respected for primitive type and for the wrapped type `null`
 * will be used as a default.
 */
@Retention(AnnotationRetention.RUNTIME)
@Target(
    AnnotationTarget.FUNCTION, AnnotationTarget.PROPERTY_GETTER, AnnotationTarget.PROPERTY_SETTER)
public annotation class ReactProp(
    /**
     * Name of the property exposed to JS that will be updated using setter method annotated with
     * the given instance of `ReactProp` annotation
     */
    public val name: String,

    /**
     * Type of property that will be send to JS. In most of the cases `customType` should not be set
     * in which case default type will be send to JS based on the type of value argument from the
     * setter method (e.g. for `int`, `double` default is "number", for `ReadableArray` it's
     * "Array"). Custom type may be used when additional processing of the value needs to be done in
     * JS before sending it over the bridge. A good example of that would be backgroundColor
     * property, which is expressed as a `String` in JS, but we use `processColor` JS module to
     * convert it to `int` before sending over the bridge.
     */
    public val customType: String = USE_DEFAULT_TYPE,
    /**
     * Default value for property of type `double`. This value will be provided to property setter
     * method annotated with [ReactProp] if property with a given name gets removed from the
     * component description in JS
     */
    public val defaultDouble: Double = 0.0,
    /**
     * Default value for property of type `float`. This value will be provided to property setter
     * method annotated with [ReactProp] if property with a given name gets removed from the
     * component description in JS
     */
    public val defaultFloat: Float = 0.0f,
    /**
     * Default value for property of type `int`. This value will be provided to property setter
     * method annotated with [ReactProp] if property with a given name gets removed from the
     * component description in JS
     */
    public val defaultInt: Int = 0,
    /**
     * Default value for property of type `long`. This value will be provided to property setter
     * method annotated with [ReactProp] if property with a given name gets removed from the
     * component description in JS
     */
    public val defaultLong: Long = 0L,
    /**
     * Default value for property of type `boolean`. This value will be provided to property setter
     * method annotated with [ReactProp] if property with a given name gets removed from the
     * component description in JS
     */
    public val defaultBoolean: Boolean = false
) {
  public companion object {
    // Used as a default value for "customType" property as "null" is not allowed. Moreover, when
    // this
    // const is used in annotation declaration compiler will actually create a copy of it, so
    // comparing it using "==" with this filed doesn't work either. We need to compare using
    // "equals"
    // which means that this value needs to be unique.
    public const val USE_DEFAULT_TYPE: String = "__default_type__"
  }
}
