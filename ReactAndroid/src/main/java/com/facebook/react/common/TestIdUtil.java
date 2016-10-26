package com.facebook.react.common;

import android.view.View;

import com.facebook.react.common.annotations.VisibleForTesting;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

public class TestIdUtil {
    private static final ConcurrentHashMap<String, Integer> mTestIds = new ConcurrentHashMap<>();
    // Integer values in R.class are typically large.  To avoid colliding with R.class we
    // use smaller values for ids when no resource id exists.
    private static final int mStartingInternalId = 1;
    private static final AtomicInteger mInternalId = new AtomicInteger(mStartingInternalId);

    /**
     * Looks for defined resource IDs in R.class by the name of testId and if a matching resource ID is
     * found it is passed to the view's setId method.  If the given testId cannot be found in R.class,
     * an increment value is assigned instead.
     */
    public static <T extends View> void setTestId(T view, String testId) {
        int mappedTestId;
        if (!mTestIds.containsKey(testId)) {
            mappedTestId = view.getResources().getIdentifier(testId, "id", view.getContext().getPackageName());
            final boolean idNotFoundInResources = mappedTestId <= 0;
            if (idNotFoundInResources) {
              mappedTestId = mInternalId.getAndIncrement();
            }
            mTestIds.put(testId, mappedTestId);
        } else {
            mappedTestId = mTestIds.get(testId);
        }

        if (mappedTestId != 0 && view.getId() != mappedTestId) {
            view.setId(mappedTestId);
        }
    }

    /**
     * Used for e2e tests that do not yet have testIDs stored in ids.xml.  It is strongly
     * advised that you reference ids that have been generated in R.class to avoid collisions and
     * to properly support UIAutomatorViewer.
     */
    @VisibleForTesting
    public static int getTestId(String testId) {
        return mTestIds.containsKey(testId) ? mTestIds.get(testId) : View.NO_ID;
    }

    @VisibleForTesting
    public static void resetStateInTest() {
        mTestIds.clear();
        mInternalId.set(mStartingInternalId);
    }
}
