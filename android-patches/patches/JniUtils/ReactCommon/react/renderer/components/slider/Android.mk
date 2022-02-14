--- /dev/code/rnm-66-fresh/ReactCommon/react/renderer/components/slider/Android.mk	2022-02-13 19:54:48.619686978 -0800
+++ /dev/code/react-native-macos/ReactCommon/react/renderer/components/slider/Android.mk	2022-02-13 19:53:21.558788484 -0800
@@ -21,7 +21,7 @@
 
 LOCAL_STATIC_LIBRARIES :=
 
-LOCAL_SHARED_LIBRARIES := libfbjni libreact_codegen_rncore libreact_render_imagemanager libreactnativeutilsjni libreact_render_componentregistry libreact_render_uimanager librrc_image libyoga libfolly_futures glog libfolly_json libglog_init libreact_render_core libreact_render_debug libreact_render_graphics librrc_view libreact_debug libreact_render_mapbuffer
+LOCAL_SHARED_LIBRARIES := libfbjni libreact_codegen_rncore libreact_render_imagemanager libreactnativejni libreact_render_componentregistry libreact_render_uimanager librrc_image libyoga libfolly_futures glog libfolly_json libglog_init libreact_render_core libreact_render_debug libreact_render_graphics librrc_view libreact_debug libreact_render_mapbuffer
 
 include $(BUILD_SHARED_LIBRARY)
 
