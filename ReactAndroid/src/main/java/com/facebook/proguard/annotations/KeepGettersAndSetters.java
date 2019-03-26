/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.proguard.annotations;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import static java.lang.annotation.RetentionPolicy.CLASS;

/**
 * Add this annotation to a class, to keep all "void set*(***)" and get* methods.
 *
 * <p>This is useful for classes that are controlled by animator-like classes that control
 * various properties with reflection.
 *
 * <p><b>NOTE:</b> This is <em>not</em> needed for Views because their getters and setters
 * are automatically kept by the default Android SDK ProGuard config.
 */
@Target({ElementType.TYPE})
@Retention(CLASS)
public @interface KeepGettersAndSetters {
}
