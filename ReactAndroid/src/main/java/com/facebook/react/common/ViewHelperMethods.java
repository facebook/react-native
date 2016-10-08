package com.facebook.react.common;

import android.view.View;

/**
 * Various helper methods for {@link View}
 */
public class ViewHelperMethods {

    /**
     * Returns the react tag for the view.  If no react tag has been set then {@link View#NO_ID} is
     * returned.
     *
     * @param view
     * @return
     */
    public static int reactTagFrom(View view) {
        return view == null || view.getTag() == null ?
                View.NO_ID :
                (int) view.getTag();
    }
}
