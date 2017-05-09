#!/bin/sh -x

exec "$(xcrun -find -sdk iphoneos cc)" -arch armv7 -isysroot "$(xcrun -sdk iphoneos --show-sdk-path)" "$@"
