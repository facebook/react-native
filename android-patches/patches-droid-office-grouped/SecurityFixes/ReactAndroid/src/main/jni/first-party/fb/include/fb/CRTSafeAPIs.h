--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\jni\\first-party\\fb\\include\\fb\\CRTSafeAPIs.h"	1969-12-31 16:00:00.000000000 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\jni\\first-party\\fb\\include\\fb\\CRTSafeAPIs.h"	2020-01-29 14:10:09.655890000 -0800
@@ -0,0 +1,8 @@
+// Copyright 2004-present Facebook. All Rights Reserved.
+
+#pragma once
+
+#include <stdarg.h>
+#include <stdio.h>
+
+int vsnprintf_safe(char *str, size_t str_len, const char *format, va_list args);
\ No newline at end of file
