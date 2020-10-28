--- "E:\\github\\rnm-63-fresh\\ReactCommon\\cxxreact\\PlatformBundleInfo.h"	1969-12-31 16:00:00.000000000 -0800
+++ "E:\\github\\rnm-63\\ReactCommon\\cxxreact\\PlatformBundleInfo.h"	2020-10-13 21:56:36.835848700 -0700
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
