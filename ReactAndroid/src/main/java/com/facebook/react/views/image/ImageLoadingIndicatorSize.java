package com.facebook.react.views.image;

/**
 * Created by quang on 1/11/17.
 */
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
