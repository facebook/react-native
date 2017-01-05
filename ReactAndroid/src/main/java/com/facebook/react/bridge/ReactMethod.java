/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import java.lang.annotation.Retention;

import static java.lang.annotation.RetentionPolicy.RUNTIME;

/**
 * Annotation which is used to mark methods that are exposed to
 * Catalyst. This applies to derived classes of {@link
 * BaseJavaModule}, which will generate a list of exported methods by
 * searching for those which are annotated with this annotation and
 * adding a JS callback for each.
 */
@Retention(RUNTIME)
public @interface ReactMethod {

}
