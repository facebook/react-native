--- "e:\\github\\fb-react-native-forpatch-base\\ReactCommon\\cxxreact\\PlatformBundleInfo.h"	1969-12-31 16:00:00.000000000 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactCommon\\cxxreact\\PlatformBundleInfo.h"	2020-01-29 14:10:09.752895100 -0800
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
