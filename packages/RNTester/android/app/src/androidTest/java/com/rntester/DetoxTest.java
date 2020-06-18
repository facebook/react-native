package com.rntester;

import com.wix.detox.Detox;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.filters.LargeTest;
import androidx.test.rule.ActivityTestRule;

@RunWith(AndroidJUnit4.class)
@LargeTest
public class DetoxTest {

    @Rule
    // Replace 'MainActivity' with the value of android:name entry in 
    // <activity> in AndroidManifest.xml
    public ActivityTestRule<MainActivity> mActivityRule = new ActivityTestRule<>(MainActivity.class, false, false);

    @Test
    public void runDetoxTests() {
        Detox.DetoxIdlePolicyConfig idlePolicyConfig = new Detox.DetoxIdlePolicyConfig();
        idlePolicyConfig.masterTimeoutSec = 60;
        idlePolicyConfig.idleResourceTimeoutSec = 30;

        Detox.runTests(mActivityRule, idlePolicyConfig);
    }
}