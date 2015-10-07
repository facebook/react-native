HEADER_PATHS := `find download/JavaScriptCore -name '*.h' | xargs -I{} dirname {} | uniq | xargs -I{} echo "-I {}"`

XCODE_PATH ?= $(shell xcode-select -p)
SDK_PATH = $(XCODE_PATH)/Platforms/$1.platform/Developer/SDKs/$1.sdk

SDK_VERSION = $(shell plutil -convert json -o - $(call SDK_PATH,iPhoneOS)/SDKSettings.plist | awk -f parseSDKVersion.awk)

CERT ?= iPhone Developer

ARCHS = x86_64 arm64 armv7 i386

PLATFORM = \
	if [[ "$*" = "x86_64" || "$*" = "i386" ]]; then \
		PLATFORM=iPhoneSimulator; \
	else \
		PLATFORM=iPhoneOS; \
	fi;

SYSROOT = -isysroot $(call SDK_PATH,$${PLATFORM})

IOS8_LIBS = download/WebCore/WebCore-7600.1.25 download/WTF/WTF-7600.1.24 download/JavaScriptCore/JavaScriptCore-7600.1.17 download/JavaScriptCore/JavaScriptCore-7600.1.17/Bytecodes.h

ifneq ($(SDK_VERSION), 8)
all:
	$(error "Expected to be compiled with iOS SDK version 8, found $(SDK_VERSION)")
endif

ios8: RCTJSCProfiler.ios8.dylib /tmp/RCTJSCProfiler
	cp $^

/tmp/RCTJSCProfiler:
	mkdir -p $@

RCTJSCProfiler.ios8.dylib: RCTJSCProfiler_unsigned.ios8.dylib
	cp $< $@
	codesign -f -s "${CERT}" $@

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
		-DNDEBUG=1\
		-miphoneos-version-min=8.0 \
		$(SYSROOT) \
		$(HEADER_PATHS) \
		-undefined dynamic_lookup \
		JSCLegacyProfiler.mm

.PRECIOUS: %/Bytecodes.h
%/Bytecodes.h:
	python $*/generate-bytecode-files --bytecodes_h $@ $*/bytecode/BytecodeList.json

.PRECIOUS: download/%
download/%: download/%.tar.gz
	tar -zxvf $< -C `dirname $@` > /dev/null

.PRECIOUS: %.tar.gz
%.tar.gz:
	mkdir -p `dirname $@`
	curl -o $@ http://www.opensource.apple.com/tarballs/$(patsubst download/%,%,$@)

.PHONY: clean
clean:
	-rm -rf $(wildcard *.dylib)
	-rm -rf $(wildcard *.a)
	-rm -rf download
