--- /home/mganandraj/code/rnm-66-fresh/ReactCommon/react/renderer/components/switch/Android.mk	2022-02-13 19:54:48.619686978 -0800
+++ /home/mganandraj/code/react-native-macos/ReactCommon/react/renderer/components/switch/Android.mk	2022-02-13 19:53:25.274826242 -0800
@@ -21,7 +21,7 @@
 
 LOCAL_STATIC_LIBRARIES :=
 
-LOCAL_SHARED_LIBRARIES := libfbjni libreact_codegen_rncore libreactnativeutilsjni libreact_render_componentregistry libreact_render_uimanager libyoga libfolly_futures glog libfolly_json libglog_init libreact_render_core libreact_render_debug libreact_render_graphics librrc_view libreact_debug
+LOCAL_SHARED_LIBRARIES := libfbjni libreact_codegen_rncore libreactnativejni libreact_render_componentregistry libreact_render_uimanager libyoga libfolly_futures glog libfolly_json libglog_init libreact_render_core libreact_render_debug libreact_render_graphics librrc_view libreact_debug
 
 include $(BUILD_SHARED_LIBRARY)
 
