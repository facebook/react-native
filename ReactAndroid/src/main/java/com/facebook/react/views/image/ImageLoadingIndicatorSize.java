/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.image;

public enum ImageLoadingIndicatorSize {
    SMALL("small"),
    LARGE("large");

    private static final ImageLoadingIndicatorSize DEFAULT = SMALL;

    private String value;
    ImageLoadingIndicatorSize(String value) {
        this.value = value;
    }

    public String getValue() {
        return this.value;
    }

    public static ImageLoadingIndicatorSize from(String value) {
        if (value == null) {
            return DEFAULT;
        }
        switch (value) {
            case "small": return SMALL;
            case "large": return LARGE;
            default: return DEFAULT;
        }
    }
}
