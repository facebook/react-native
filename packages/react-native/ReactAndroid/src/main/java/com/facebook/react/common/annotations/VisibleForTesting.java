/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common.annotations;

/**
 * Annotates a method that should have restricted visibility but it's required to be public for use
 * in test code only.
 */
public @interface VisibleForTesting {}
