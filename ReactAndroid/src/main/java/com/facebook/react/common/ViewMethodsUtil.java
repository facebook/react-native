package com.facebook.react.common;

import android.view.View;

public class ViewMethodsUtil {

    /**
     * Returns the react tag for the view.  If no react tag has been set then {@link View#NO_ID} is
     * returned.
     */
    public static int reactTagFor(View view) {
        return view == null || view.getTag() == null ?
                View.NO_ID :
                (int) view.getTag();
    }
}
