package com.facebook.react.views.logan;

import android.text.TextUtils;

import com.dianping.networklog.Logan;

/**
 * Created by gengyuanbo on 18/6/12.
 * Desc: 用于日志回捞
 */

public class RNLog {
    public static final String LOG_TAG = "REACT_NATIVE_LOG: ";

    public static void i(String msg) {
        i(LOG_TAG, msg);
    }

    public static void i(String tag, String msg) {
        // 打个线上包   不进行日志输出
//        if (true) {
//            return;
//        }
        if (TextUtils.isEmpty(msg) || TextUtils.isEmpty(tag)) {
            return;
        }
        Logan.w(String.format("%s%s", tag, msg), Logan.CODE_LOG);
    }
}
