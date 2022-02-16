--- /home/mganandraj/code/rnm-66-fresh/ReactCommon/react/renderer/textlayoutmanager/Android.mk	2022-02-13 19:54:48.631687103 -0800
+++ /home/mganandraj/code/react-native-macos/ReactCommon/react/renderer/textlayoutmanager/Android.mk	2022-02-13 19:53:28.338857418 -0800
@@ -11,7 +11,7 @@
 
 LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp $(LOCAL_PATH)/platform/android/react/renderer/textlayoutmanager/*.cpp)
 
-LOCAL_SHARED_LIBRARIES := libfolly_futures libreactnativeutilsjni libreact_utils libfb libfbjni libreact_render_uimanager libreact_render_componentregistry libreact_render_attributedstring libreact_render_mounting glog libfolly_json libglog_init libyoga libreact_render_core libreact_render_debug libreact_render_graphics libreact_debug libreact_render_mapbuffer libmapbufferjni libreact_render_telemetry
+LOCAL_SHARED_LIBRARIES := libfolly_futures libreactnativejni libreact_utils libfb libfbjni libreact_render_uimanager libreact_render_componentregistry libreact_render_attributedstring libreact_render_mounting glog libfolly_json libglog_init libyoga libreact_render_core libreact_render_debug libreact_render_graphics libreact_debug libreact_render_mapbuffer libmapbufferjni libreact_render_telemetry
 
 LOCAL_STATIC_LIBRARIES :=
 
