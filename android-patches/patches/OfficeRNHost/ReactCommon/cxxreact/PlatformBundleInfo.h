diff --git a/ReactCommon/cxxreact/PlatformBundleInfo.h b/ReactCommon/cxxreact/PlatformBundleInfo.h
new file mode 100644
index 0000000000..84fb4a2aa6
--- /dev/null
+++ b/ReactCommon/cxxreact/PlatformBundleInfo.h
@@ -0,0 +1,15 @@
+#pragma once
+
+#include <cxxreact/JSBigString.h>
+
+namespace facebook { namespace react {
+
+struct PlatformBundleInfo
+{
+	std::unique_ptr<const JSBigString> Bundle;
+	std::string BundleUrl;
+	std::string BytecodePath;
+	uint64_t Version;
+};
+
+}}//namespace facebook::react
\ No newline at end of file
