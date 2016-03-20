// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.bridge;

import java.lang.annotation.Retention;

import static java.lang.annotation.RetentionPolicy.RUNTIME;

/**
 * Annotation indicating that a JS module should be made available to web
 * workers spawned by the main JS executor.
 */
@Retention(RUNTIME)
public @interface SupportsWebWorkers {
}
