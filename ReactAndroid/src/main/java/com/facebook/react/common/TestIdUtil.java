package com.facebook.react.common;

import android.view.View;

import com.facebook.react.common.annotations.VisibleForTesting;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Utility methods for managing testIDs.
 */
public class TestIdUtil {
    private static final ConcurrentHashMap<String, Integer> TEST_IDS = new ConcurrentHashMap<>();
    private static final int STARTING_INTERNAL_ID = 10;
    private static final AtomicInteger INTERNAL_ID = new AtomicInteger(STARTING_INTERNAL_ID);

    /**
     * Looks for defined resource IDs in R.class by the name of testId and if a matching resource ID is
     * found it is passed to the view's setId method.  If the given testId cannot be found in R.class,
     * an internal increment value is assigned instead.
     *
     * @param view
     * @param testId
     * @param <T>
     */
    public static <T extends View> void setTestId(T view, String testId) {
        int mappedTestId;
        if (!TEST_IDS.containsKey(testId)) {
            mappedTestId = view.getResources().getIdentifier(testId, "id", view.getContext().getPackageName());
            if (mappedTestId <= 0) {
              mappedTestId = INTERNAL_ID.getAndIncrement();
            }
            TEST_IDS.put(testId, mappedTestId);
        } else {
            mappedTestId = TEST_IDS.get(testId);
        }

        if (mappedTestId != 0 && view.getId() != mappedTestId) {
            view.setId(mappedTestId);
        }
    }

    /**
     * Used for internal e2e tests that do not yet have testIDs stored in ids.xml.  It is strongly
     * advised that you reference ids that have been generated in R.class to avoid collisions and
     * to properly support UIAutomatorViewer.
     *
     * @param testId
     * @return
     */
    @VisibleForTesting
    public static int getTestId(String testId) {
        return TEST_IDS.containsKey(testId) ? TEST_IDS.get(testId) : View.NO_ID;
    }

    /**
     * Used by tests to clear the static member Maps.
     */
    @VisibleForTesting
    public static void resetTestState() {
        TEST_IDS.clear();INTERNAL_ID.set(STARTING_INTERNAL_ID);
    }
}
