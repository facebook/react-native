package com.facebook.react.common;

import android.view.View;

import com.facebook.react.common.annotations.VisibleForTesting;

import java.util.concurrent.ConcurrentHashMap;

/**
 * Utility methods for managing testIDs.
 */
public class TestIdUtil {
    private static final ConcurrentHashMap<String, Integer> TEST_IDS = new ConcurrentHashMap<>();

    /**
     * Looks for defined resource IDs in R.class by the name of testId and if a matching resource ID is
     * found it is passed to the view's setId method.
     *
     * @param view
     * @param testId
     * @param <T>
     */
    public static <T extends View> void setTestId(T view, String testId) {
        int mappedTestId;
        if (!TEST_IDS.containsKey(testId)) {
            mappedTestId = view.getResources().getIdentifier(testId, "id", view.getContext().getPackageName());
            TEST_IDS.put(testId, mappedTestId);
        } else {
            mappedTestId = TEST_IDS.get(testId);
        }

        if (mappedTestId != 0 && view.getId() != mappedTestId) {
            view.setId(mappedTestId);
        }
    }

    /**
     * Used by tests to clear the static member Maps.
     */
    @VisibleForTesting
    public static void resetTestState() {
        TEST_IDS.clear();
    }
}
