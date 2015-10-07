/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import static java.lang.annotation.RetentionPolicy.RUNTIME;

/**
 * Annotation which is used to mark native UI properties that are exposed to
 * JS.  {@link ViewManager#getNativeProps} traverses the fields of its
 * subclasses and extracts the {@code UIProp} annotation data to generate the
 * {@code NativeProps} map. Example:
 *
 * {@code
 *   @UIProp(UIProp.Type.BOOLEAN) public static final String PROP_FOO = "foo";
 *   @UIProp(UIProp.Type.STRING) public static final String PROP_BAR = "bar";
 * }
 *
 * TODO(krzysztof): Kill this class once @ReactProp refactoring is done
 */
@Target(ElementType.FIELD)
@Retention(RUNTIME)
public @interface UIProp {
  Type value();

  public static enum Type {
    BOOLEAN("boolean"),
    NUMBER("number"),
    STRING("String"),
    MAP("Map"),
    ARRAY("Array"),
    COLOR("Color");

    private final String mType;

    Type(String type) {
      mType = type;
    }

    @Override
    public String toString() {
      return mType;
    }
  }
}
