/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.text.style.SuperscriptSpan;

/**
 * Instances of this class are used to place reactTag information of nested text react nodes into
 * spannable text rendered by single {@link TextView}
 */
public class ReactSuperscriptSpan extends SuperscriptSpan implements ReactSpan {}
