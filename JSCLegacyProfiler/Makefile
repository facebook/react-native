HEADER_PATHS := `find download/JavaScriptCore -name '*.h' | xargs -I{} dirname {} | uniq | xargs -I{} echo "-I {}"`

SDK_PATH = /Applications/Xcode.app/Contents/Developer/Platforms/$1.platform/Developer/SDKs/$1.sdk

SDK_VERSION = $(shell plutil -convert json -o - $(call SDK_PATH,iPhoneOS)/SDKSettings.plist | awk -f parseSDKVersion.awk)

CERT ?= "iPhone Developer"

ARCHS = x86_64 arm64 armv7 i386

PLATFORM = \
	if [[ "$*" = "x86_64" || "$*" = "i386" ]]; then \
		PLATFORM=iPhoneSimulator; \
	else \
		PLATFORM=iPhoneOS; \
	fi;

SYSROOT = -isysroot $(call SDK_PATH,$${PLATFORM})

IOS8_LIBS = download/WebCore/WebCore-7600.1.25 download/WTF/WTF-7600.1.24 download/JavaScriptCore/JavaScriptCore-7600.1.17 download/JavaScriptCore/JavaScriptCore-7600.1.17/Bytecodes.h libyajl.a

ios8: RCTJSCProfiler.ios8.dylib /tmp/RCTJSCProfiler
ifneq ($(SDK_VERSION), 8)
	$(error "Expected to be compiled with iOS SDK version 8, found $(SDK_VERSION)")
else
	cp $^
endif

/tmp/RCTJSCProfiler:
	mkdir -p $@

.PRECIOUS: RCTJSCProfiler.ios8.dylib
RCTJSCProfiler.ios8.dylib: RCTJSCProfiler_unsigned.ios8.dylib
	cp $< $@
	codesign -f -s "${CERT}" $@ || rm $@

.PRECIOUS: RCTJSCProfiler_unsigned.ios8.dylib
RCTJSCProfiler_unsigned.ios8.dylib: $(patsubst %,RCTJSCProfiler_%.ios8.dylib,$(ARCHS))
	lipo -create -output $@ $^

.PRECIOUS: RCTJSCProfiler_%.ios8.dylib
RCTJSCProfiler_%.ios8.dylib: $(IOS8_LIBS)
	$(PLATFORM) \
	clang -w -dynamiclib -o RCTJSCProfiler_$*.ios8.dylib -std=c++11 \
		-arch $* \
		-install_name RCTJSCProfiler.ios8.dylib \
		-include ./download/JavaScriptCore/JavaScriptCore-7600.1.17/config.h \
		-I download \
		-I download/WebCore/WebCore-7600.1.25/icu \
		-I download/WTF/WTF-7600.1.24 \
		-I download/yajl-2.1.0/build/yajl-2.1.0/include \
		-DNDEBUG=1\
		-miphoneos-version-min=8.0 \
		$(SYSROOT) \
		$(HEADER_PATHS) \
		-undefined dynamic_lookup \
		JSCLegacyProfiler.mm libyajl.a

.PRECIOUS: %/Bytecodes.h
%/Bytecodes.h:
	python $*/generate-bytecode-files --bytecodes_h $@ $*/bytecode/BytecodeList.json

.PRECIOUS: libyajl.a
libyajl.a: $(patsubst %,libyajl_%.a,$(ARCHS))
	lipo -create $^ -output $@

.PRECIOUS: libyajl_%.a
libyajl_%.a: download/yajl-2.1.0
	$(PLATFORM) \
	cd download/yajl-2.1.0/src; \
	clang -arch $(*F) -std=c99 \
		-miphoneos-version-min=8.0 \
		$(SYSROOT) \
		-I ../build/yajl-2.1.0/include \
		-c `find . -name '*.c'`
	find download/yajl-2.1.0/src/ -name '*.o' -exec libtool -static -o $@ {} +

.PRECIOUS: download/yajl-2.1.0
download/yajl-2.1.0: download/yajl-2.1.0.tar.gz
	tar -zxvf $< -C download
	mkdir -p download/yajl-2.1.0/build && cd download/yajl-2.1.0/build && cmake ..

.PRECIOUS: download/yajl-2.1.0.tar.gz
download/yajl-2.1.0.tar.gz:
	mkdir -p `dirname $@`
	curl -o $@ https://codeload.github.com/lloyd/yajl/tar.gz/2.1.0

.PRECIOUS: download/%
download/%: download/%.tar.gz
	tar -zxvf $< -C `dirname $@`

.PRECIOUS: %.tar.gz
%.tar.gz:
	mkdir -p `dirname $@`
	curl -o $@ http://www.opensource.apple.com/tarballs/$(patsubst download/%,%,$@)

.PHONY: clean
clean:
	@rm -rf $(wildcard *.dylib)
	@rm -rf $(wildcard *.a)
	@rm -rf download
