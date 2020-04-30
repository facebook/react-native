--- "D:\\code\\work\\rn-62-db\\ReactCommon\\jsi\\FileUtils.h"	1969-12-31 16:00:00.000000000 -0800
+++ "D:\\code\\work\\rn-62-d\\ReactCommon\\jsi\\FileUtils.h"	2020-04-30 15:30:04.611425000 -0700
@@ -0,0 +1,21 @@
+#pragma once
+
+#include <string>
+
+namespace facebook { namespace react {
+
+class FileUtils {
+  public:
+      static const char* ReadText(const std::string& filePath, long& length, bool& isNew);
+      static std::string ReadText(const std::string& filePath);
+      static bool Exists(const std::string& filePath);
+      static bool WriteBinary(const std::string& filePath, const void* inData, long length);
+      static void* ReadBinary(const std::string& filePath, long& length);
+  private:
+      static const int BUFFER_SIZE = 1024 * 1024;
+      static char* Buffer;
+      static const char* WRITE_BINARY;
+      static const char* READ_BINARY;
+};
+
+}}
