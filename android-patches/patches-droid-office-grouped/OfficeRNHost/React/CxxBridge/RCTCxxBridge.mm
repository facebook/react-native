--- "e:\\github\\fb-react-native-forpatch-base\\React\\CxxBridge\\RCTCxxBridge.mm"	2020-01-30 13:55:48.476581100 -0800
+++ "e:\\github\\ms-react-native-forpatch\\React\\CxxBridge\\RCTCxxBridge.mm"	2020-02-14 10:59:16.805390300 -0800
@@ -596,6 +596,7 @@
     // This is async, but any calls into JS are blocked by the m_syncReady CV in Instance
   _reactInstance->initializeBridge(
       std::make_unique<RCTInstanceCallback>(self),
+      nullptr, // Use default executor delegate
       executorFactory,
       _jsMessageThread,
       [self _buildModuleRegistryUnlocked]);
