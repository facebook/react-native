/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.annotations

/**
 * Use this annotation to annotate group of properties of native views that should be exposed to JS.
 * This annotation should only be used for setter methods of subclasses of
 * [com.facebook.react.uimanager.ViewManager]. It's a batched version of [ReactProp] annotation
 * (please see documentation of [ReactProp] for more details about how this annotation can be used).
 *
 * This annotation is meant to be used for a group of similar properties. That's why it support only
 * a set of properties of the same type. A good example is supporting "border", where we have 7
 * variations of that property ("borderLeft", "borderHorizontal", etc.) and very similar code for
 * handling each of those.
 *
 * Each annotated method should return `void` and take exactly three arguments: first being a view
 * instance to be updated, second should be of type int and will represent index in the group of the
 * property being updated. Last, third argument represent the value that should be set.
 *
 * Currently only `int`, `float`, `double` and [String] value types are supported.
 *
 * In case when property has been removed from the corresponding react component annotated setter
 * will be called and default value will be provided as a value parameter. Default value can be
 * customize using [defaultInt] or [defaultFloat] in the case when property is of one of primitive
 * types. In case when [String] is the property type `null` value will be provided as a default.
 */
@Retention(AnnotationRetention.RUNTIME)
@Target(
    AnnotationTarget.FUNCTION, AnnotationTarget.PROPERTY_GETTER, AnnotationTarget.PROPERTY_SETTER)
public annotation class ReactPropGroup(

    /**
     * Array of names of properties exposed to JS that will be updated using setter method annotated
     * with the given instance of `ReactPropGroup` annotation
     */
    public val names: Array<String>,
    /**
     * Type of property that will be send to JS. In most of the cases `customType` should not be set
     * in which case default type will be send to JS based on the type of value argument from the
     * setter method (e.g. for `int`, `float` default is "number"). Custom type may be used when
     * additional processing of the value needs to be done in JS before sending it over the bridge.
     * A good example of that would be backgroundColor property, which is expressed as a `String` in
     * JS, but we use `processColor` JS module to convert it to `int` before sending over the
     * bridge.
     */
    public val customType: String = USE_DEFAULT_TYPE,
    /**
     * Default value for property of type `float`. This value will be provided to property setter
     * method annotated with [ReactPropGroup] if property with a given name gets removed from the
     * component description in JS
     */
    public val defaultFloat: Float = 0.0f,
    /**
     * Default value for property of type `double`. This value will be provided to property setter
     * method annotated with [ReactPropGroup] if property with a given name gets removed from the
     * component description in JS
     */
    public val defaultDouble: Double = 0.0,
    /**
     * Default value for property of type `int`. This value will be provided to property setter
     * method annotated with [ReactPropGroup] if property with a given name gets removed from the
     * component description in JS
     */
    public val defaultInt: Int = 0,
    /**
     * Default value for property of type `long`. This value will be provided to property setter
     * method annotated with [ReactProp] if property with a given name gets removed from the
     * component description in JS
     */
    public val defaultLong: Long = 0L
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
