HEADER_PATHS := `find ./tmp/JavaScriptCore -name '*.h' | xargs -I{} dirname {} | uniq | xargs -I{} echo "-I {}"`
CERT ?= "iPhone Developer"

ios8: prepare build generate

prepare: clean create download

build: x86_64 arm64 armv7

generate:	lipo codesign

clean:
	@rm -rf tmp/ /tmp/RCTJSCProfiler

lipo:
	lipo -create -output /tmp/RCTJSCProfiler/RCTJSCProfiler.ios8.dylib ./tmp/RCTJSCProfiler_x86_64 ./tmp/RCTJSCProfiler_arm64 ./tmp/RCTJSCProfiler_armv7

codesign:
	codesign -f -s ${CERT} /tmp/RCTJSCProfiler/RCTJSCProfiler.ios8.dylib

create:
	mkdir -p ./tmp /tmp/RCTJSCProfiler/ ./tmp/CoreFoundation ./tmp/Foundation
	for file in ./tmp/CoreFoundation/CFUserNotification.h ./tmp/CoreFoundation/CFXMLNode.h ./tmp/CoreFoundation/CFXMLParser.h ./tmp/Foundation/Foundation.h; do echo '' > "$$file"; done

download: wtf jsc webcore yajl

wtf:
	curl -o tmp/WTF.tar.gz http://www.opensource.apple.com/tarballs/WTF/WTF-7600.1.24.tar.gz
	tar -zxvf tmp/WTF.tar.gz -C tmp

jsc:
	curl -o tmp/JSC.tar.gz http://www.opensource.apple.com/tarballs/JavaScriptCore/JavaScriptCore-7600.1.17.tar.gz
	tar -zxvf tmp/JSC.tar.gz -C tmp
	mv ./tmp/JavaScriptCore-7600.1.17 ./tmp/JavaScriptCore
	python ./tmp/JavaScriptCore/generate-bytecode-files --bytecodes_h ./tmp/JavaScriptCore/Bytecodes.h ./tmp/JavaScriptCore/bytecode/BytecodeList.json

webcore:
	curl -o tmp/WebCore.tar.gz http://www.opensource.apple.com/tarballs/WebCore/WebCore-7600.1.25.tar.gz
	tar -zxvf tmp/WebCore.tar.gz -C tmp

yajl:
	curl -o tmp/yajl.tar.gz https://codeload.github.com/lloyd/yajl/tar.gz/2.1.0
	tar -zxvf tmp/yajl.tar.gz -C tmp
	mkdir -p ./tmp/yajl-2.1.0/build && cd ./tmp/yajl-2.1.0/build && cmake .. && make
	echo `find . -name '*.c'`
	cd ./tmp/yajl-2.1.0/src && \
		clang -arch arm64 -arch armv7 -std=c99 \
		-I /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS8.3.sdk/usr/include/ \
		-I /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS8.3.sdk/usr/include/machine \
		-I ../build/yajl-2.1.0/include \
		-c `find . -name '*.c'`
	libtool -static -o ./tmp/yajl.a `find ./tmp/yajl-2.1.0/src/ -name '*.o'`

x86_64:
	clang -w -dynamiclib -o ./tmp/RCTJSCProfiler_x86_64 -std=c++11 \
		-install_name RCTJSCProfiler.ios8.dylib \
		-include ./tmp/JavaScriptCore/config.h \
		-I ./tmp \
		-I ./tmp/WebCore-7600.1.25/icu \
		-I ./tmp/WTF-7600.1.24 \
		-I ./tmp/yajl-2.1.0/build/yajl-2.1.0/include \
		-DNDEBUG=1\
		-miphoneos-version-min=8.0 \
		-L /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator.sdk/usr/lib \
		-L /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator.sdk/usr/lib/system \
		${HEADER_PATHS} \
		-undefined dynamic_lookup \
		./JSCLegacyProfiler.mm ./tmp/yajl-2.1.0/build/yajl-2.1.0/lib/libyajl_s.a

arm64:
	echo $(HEADER_PATHS)
	clang -w -dynamiclib -o ./tmp/RCTJSCProfiler_arm64 -std=c++11 \
		-install_name RCTJSCProfiler.ios8.dylib \
		-arch arm64 \
		-include ./tmp/JavaScriptCore/config.h \
		-I ./tmp \
		-I ./tmp/WebCore-7600.1.25/icu \
		-I ./tmp/WTF-7600.1.24 \
		-I ./tmp/yajl-2.1.0/build/yajl-2.1.0/include \
		-I /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS8.3.sdk/usr/include \
		-I /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS8.3.sdk/usr/include/machine \
		-DNDEBUG=1\
		-miphoneos-version-min=8.0 \
		-L /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS8.3.sdk/usr/lib \
		-L /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS8.3.sdk/usr/lib/system \
		${HEADER_PATHS} \
		-undefined dynamic_lookup \
		./JSCLegacyProfiler.mm ./tmp/yajl.a

armv7:
	clang -w -dynamiclib -o ./tmp/RCTJSCProfiler_armv7 -std=c++11 \
		-install_name RCTJSCProfiler.ios8.dylib \
		-arch armv7 \
		-include ./tmp/JavaScriptCore/config.h \
		-I ./tmp \
		-I ./tmp/WebCore-7600.1.25/icu \
		-I ./tmp/WTF-7600.1.24 \
		-I ./tmp/yajl-2.1.0/build/yajl-2.1.0/include \
		-I /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS8.3.sdk/usr/include \
		-DNDEBUG=1\
		-miphoneos-version-min=8.0 \
		-L /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS8.3.sdk/usr/lib \
		-L /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS8.3.sdk/usr/lib/system \
		${HEADER_PATHS} \
		-undefined dynamic_lookup \
		./JSCLegacyProfiler.mm ./tmp/yajl.a

.PHONY: ios8
