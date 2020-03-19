--- "e:\\github\\fb-react-native-forpatch-base\\ReactCommon\\jsi\\FileUtils.cpp"	1969-12-31 16:00:00.000000000 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactCommon\\jsi\\FileUtils.cpp"	2020-01-29 14:10:09.824892300 -0800
@@ -0,0 +1,108 @@
+#include "FileUtils.h"
+#include <cstring>
+#include <sstream>
+#include <fstream>
+#include <sys/mman.h>
+#include <assert.h>
+#include <errno.h>
+#include <cxxreact/ReactMarker.h>
+
+namespace facebook { namespace react {
+
+bool FileUtils::Exists(const std::string& path) {
+  std::ifstream infile(path.c_str());
+  return infile.good();
+}
+
+std::string FileUtils::ReadText(const std::string& filePath) {
+  long len;
+  bool isNew;
+  const char* content = ReadText(filePath, len, isNew);
+
+  std::string s(content, len);
+
+  if (isNew) {
+      delete[] content;
+  }
+
+  return s;
+}
+
+void* FileUtils::ReadBinary(const std::string& filePath, long& length) {
+  length = 0;
+  if (!FileUtils::Exists(filePath)) {
+    return nullptr;
+  }
+
+  bool isFailed{ true };
+  uint8_t* data{ nullptr };
+
+  auto file = fopen(filePath.c_str(), READ_BINARY);
+  if (file) {
+    if (fseek(file, 0, SEEK_END) != -1) {
+      length = ftell(file);
+      if (length != -1) {
+        rewind(file);
+        data = new uint8_t[length];
+        int readBytes = fread(data, sizeof(uint8_t), length, file);
+        if (readBytes == length) {
+          isFailed = false;
+        }
+      }
+    }
+  }
+
+  if (file) {
+    fclose(file);
+  }
+
+  if (isFailed) {
+    length = 0;
+    if (data != nullptr) {
+      delete[] data;
+    }
+    if (ReactMarker::logTaggedMarker) {
+      ReactMarker::logTaggedMarker(ReactMarker::BYTECODE_READ_FAILED, std::strerror(errno));
+    }
+  }
+
+  return data;
+}
+
+bool FileUtils::WriteBinary(const std::string& filePath, const void* data, long length) {
+  auto file = fopen(filePath.c_str(), WRITE_BINARY);
+  if (!file) {
+    return false;
+  }
+  long writtenBytes = fwrite(data, sizeof(uint8_t), length, file);
+  fclose(file);
+  return writtenBytes == length;
+}
+
+const char* FileUtils::ReadText(const std::string& filePath, long& charLength, bool& isNew) {
+  FILE* file = fopen(filePath.c_str(), "rb");
+  fseek(file, 0, SEEK_END);
+
+  charLength = ftell(file);
+  isNew = charLength > BUFFER_SIZE;
+
+  rewind(file);
+
+  if (isNew) {
+    char* newBuffer = new char[charLength];
+    fread(newBuffer, 1, charLength, file);
+    fclose(file);
+
+    return newBuffer;
+  }
+
+  fread(Buffer, 1, charLength, file);
+  fclose(file);
+
+  return Buffer;
+}
+
+char* FileUtils::Buffer = new char[BUFFER_SIZE];
+const char* FileUtils::WRITE_BINARY = "wb";
+const char* FileUtils::READ_BINARY = "rb";
+}}
