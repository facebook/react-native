
COPYFILES_PASS0_SRCROOT = $(OPENSOURCE_REACTNATIVE)\OfficeISS

COPYFILES_PASS0_DESTROOT = $(TARGETDIR)\include

COPYFILES_PASS0 = \
	$(COPYFILES_PASS0) \
	Folly\folly\Bits.h, folly; \
	Folly\folly\ConstexprMath.h, folly; \
	Folly\folly\container\detail\F14Defaults.h, folly\container\detail; \
	Folly\folly\container\detail\F14IntrinsicsAvailability.h, folly\container\detail; \
	Folly\folly\container\detail\F14Policy.h, folly\container\detail; \
	Folly\folly\container\detail\F14Table.h, folly\container\detail; \
	Folly\folly\container\F14Map-fwd.h, folly\container; \
	Folly\folly\container\F14Map.h, folly\container; \
	Folly\folly\Conv.h, folly; \
	Folly\folly\CPortability.h, folly; \
	Folly\folly\CppAttributes.h, folly; \
	Folly\folly\CpuId.h, folly; \
	Folly\folly\Demangle.h, folly; \
	Folly\folly\detail\Iterators.h, folly\detail; \
	Folly\folly\detail\RangeCommon.h, folly\detail; \
	Folly\folly\detail\RangeSse42.h, folly\detail; \
	Folly\folly\dynamic-inl.h, folly; \
	Folly\folly\dynamic.h, folly; \
	Folly\folly\Exception.h, folly; \
	Folly\folly\ExceptionString.h, folly; \
	Folly\folly\Expected.h, folly; \
	Folly\folly\FBString.h, folly; \
	Folly\folly\FBVector.h, folly; \
	Folly\folly\Format-inl.h, folly; \
	Folly\folly\Format.h, folly; \
	Folly\folly\FormatArg.h, folly; \
	Folly\folly\FormatTraits.h, folly; \
	Folly\folly\functional\ApplyTuple.h, folly\functional; \
	Folly\folly\functional\Invoke.h, folly\functional; \
	Folly\folly\Hash.h, folly; \
	Folly\folly\hash\Hash.h, folly\hash; \
	Folly\folly\hash\SpookyHashV1.h, folly\hash; \
	Folly\folly\hash\SpookyHashV2.h, folly\hash; \
	Folly\folly\json_pointer.h, folly; \
	Folly\folly\json.h, folly; \
	Folly\folly\lang\Align.h, folly\lang; \
	Folly\folly\lang\Assume.h, folly\lang; \
	Folly\folly\lang\Bits.h, folly\lang; \
	Folly\folly\lang\ColdClass.h, folly\lang; \
	Folly\folly\lang\Exception.h, folly\lang; \
	Folly\folly\lang\Launder.h, folly\lang; \
	Folly\folly\lang\SafeAssert.h, folly\lang; \
	Folly\folly\lang\UncaughtExceptions.h, folly\lang; \
	Folly\folly\Likely.h, folly; \
	Folly\folly\MapUtil.h, folly; \
	Folly\folly\Memory.h, folly; \
	Folly\folly\memory\detail\MallocImpl.h, folly\memory\detail; \
	Folly\folly\memory\Malloc.h, folly\memory; \
	Folly\folly\Optional.h, folly; \
	Folly\folly\Portability.h, folly; \
	Folly\folly\portability\Builtins.h, folly\portability; \
	Folly\folly\portability\Config.h, folly\portability; \
	Folly\folly\portability\Constexpr.h, folly\portability; \
	Folly\folly\portability\Malloc.h, folly\portability; \
	Folly\folly\portability\Math.h, folly\portability; \
	Folly\folly\portability\String.h, folly\portability; \
	Folly\folly\portability\Windows.h, folly\portability; \
	Folly\folly\Preprocessor.h, folly; \
	Folly\folly\Range.h, folly; \
	Folly\folly\ScopeGuard.h, folly; \
	Folly\folly\String-inl.h, folly; \
	Folly\folly\String.h, folly; \
	Folly\folly\Traits.h, folly; \
	Folly\folly\Unit.h, folly; \
	Folly\folly\Utility.h, folly; \

COPYFILES_PASS0 = \
	$(COPYFILES_PASS0) \
	ReactCommon\cxxreact\CxxModule.h, cxxreact; \
	ReactCommon\cxxreact\CxxNativeModule.h, cxxreact; \
	ReactCommon\cxxreact\Instance.h, cxxreact; \
	ReactCommon\cxxreact\JsArgumentHelpers.h, cxxreact; \
	ReactCommon\cxxreact\JsArgumentHelpers-inl.h, cxxreact; \
	ReactCommon\cxxreact\JSBigString.h, cxxreact; \
	ReactCommon\cxxreact\JSExecutor.h, cxxreact; \
	ReactCommon\cxxreact\MessageQueueThread.h, cxxreact; \
	ReactCommon\cxxreact\ModuleRegistry.h, cxxreact; \
	ReactCommon\cxxreact\NativeToJsBridge.h, cxxreact; \
	ReactCommon\cxxreact\NativeModule.h, cxxreact; \
	ReactCommon\cxxreact\PlatformBundleInfo.h, cxxreact; \

COPYFILES_PASS0 = \
	$(COPYFILES_PASS0) \
	ReactCommon\privatedata\PrivateDataBase.h, privatedata; \

COPYFILES_PASS0 = \
	$(COPYFILES_PASS0) \
	double-conversion\double-conversion\double-conversion.h, double-conversion; \
	double-conversion\double-conversion\utils.h, double-conversion; \

COPYFILES_PASS0 = \
	$(COPYFILES_PASS0) \
	glog\src\windows\config.h, glog; \
	glog\src\windows\glog\logging.h, glog; \
	glog\src\windows\glog\raw_logging.h, glog; \
	glog\src\windows\glog\stl_logging.h, glog; \
	glog\src\windows\glog\vlog_is_on.h, glog; \
	glog\src\windows\glog\log_severity.h, glog; \

COPYFILES_PASS0 = \
	$(COPYFILES_PASS0) \
	ReactAndroid\includes\msoFolly\msoFolly.h, msoFolly; \

COPYFILES_PASS0 = \
	$(COPYFILES_PASS0) \
	jsc\jsc-headers\JavaScript.h, jsc\JavaScriptCore; \
	jsc\jsc-headers\JSBase.h, jsc\JavaScriptCore; \
	jsc\jsc-headers\JSContextRef.h, jsc\JavaScriptCore; \
	jsc\jsc-headers\JSObjectRef.h, jsc\JavaScriptCore; \
	jsc\jsc-headers\JSStringRef.h, jsc\JavaScriptCore; \
	jsc\jsc-headers\JSTypedArray.h, jsc\JavaScriptCore; \
	jsc\jsc-headers\JSValueRef.h, jsc\JavaScriptCore; \
	jsc\jsc-headers\WebKitAvailability.h, jsc\JavaScriptCore; \
