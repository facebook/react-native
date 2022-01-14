--- /dev/null	2022-01-12 17:14:59.000000000 -0800
+++ /var/folders/vs/8_b205053dddbcv7btj0w0v80000gn/T/update-1h8V3n/merge/OfficeRNHost/ReactCommon/cxxreact/PlatformBundleInfo.h	2022-01-12 15:04:31.000000000 -0800
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
