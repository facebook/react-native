--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\jni\\first-party\\fb\\CRTSafeAPIs.cpp"	1969-12-31 16:00:00.000000000 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\jni\\first-party\\fb\\CRTSafeAPIs.cpp"	2020-01-29 14:10:09.654914600 -0800
@@ -0,0 +1,37 @@
+#include <fb/CRTSafeAPIs.h>
+#include <memory.h>
+#include <string.h>
+#include<cstdlib>
+
+int vsnprintf_safe(char *str, size_t str_len, const char *format, va_list args)
+{
+  if (str == nullptr || str_len <= 0) {
+     return -1;
+  }
+  
+  char *buffer = nullptr;
+  int result = vasprintf(&buffer, format, args);
+  
+  if (buffer == nullptr) {
+    return -1;
+  }
+  
+  if (result < 0) {
+    std::free(buffer);
+    return -1;
+  }
+  
+  size_t buffer_len = strlen(buffer);
+ 
+  if (str_len > buffer_len) {
+     memcpy(str, buffer, buffer_len + 1);
+  } else {
+     memcpy(str, buffer, str_len - 1);
+     str[str_len - 1] = 0;
+  }
+  
+  std::free(buffer);
+  return buffer_len;
+}
+
+
