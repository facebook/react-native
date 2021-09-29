#!/bin/bash
set -ex

# This script replicates the CI steps on the vsto Mac build agent
# Useful to run locally when doing 'git bisect'
# NOTE: needs xcpretty installed (gem install xcpretty)

OUTPUTDIR=$(mktemp -d)

# cleanup the node_modules cache
rm -rf node_modules

# Begin VSTO build agent tasks

# yarn install
yarn install

# Setup packager and WebSocket test server
. ./scripts/vsto-test-setup.sh

# Xcode macOS test
xcodebuild -sdk macosx -configuration Debug -project ./RNTester/RNTester.xcodeproj -scheme RNTester-macOS build test DSTROOT=$OUTPUTDIR/macosx/Debug/build.dst OBJROOT=$OUTPUTDIR/macosx/Debug/build.obj SYMROOT=$OUTPUTDIR/macosx/Debug/build.sym SHARED_PRECOMPS_DIR=$OUTPUTDIR/macosx/Debug/build.pch -destination platform=macOS,arch=x86_64 ONLY_ACTIVE_ARCH=NO DEVELOPMENT_TEAM=UBF8T346G9 | /usr/local/bin/xcpretty -r junit --no-color

if [ $? -ne 0 ]; then
  echo "Xcode macOS test FAILED"
  exit 1
else

  # Xcode iOS test
  xcodebuild -sdk iphonesimulator -configuration Debug -project ./RNTester/RNTester.xcodeproj -scheme RNTester build test DSTROOT=$OUTPUTDIR/iphonesimulator/Debug/build.dst OBJROOT=$OUTPUTDIR/iphonesimulator/Debug/build.obj SYMROOT=$OUTPUTDIR/iphonesimulator/Debug/build.sym SHARED_PRECOMPS_DIR=$OUTPUTDIR/iphonesimulator/Debug/build.pch -destination platform="iOS Simulator,OS=latest,name=iPhone 5s" ONLY_ACTIVE_ARCH=NO DEVELOPMENT_TEAM=UBF8T346G9 | /usr/local/bin/xcpretty -r junit --no-color

  if [ $? -ne 0 ]; then
    echo "Xcode iOS test FAILED"
    exit 1
  else

    # Xcode tvOS test
    xcodebuild -configuration Debug -project ./RNTester/RNTester.xcodeproj -scheme RNTester-tvOS build test DSTROOT=$OUTPUTDIR/iphoneos/Debug/build.dst OBJROOT=$OUTPUTDIR/iphoneos/Debug/build.obj SYMROOT=$OUTPUTDIR/iphoneos/Debug/build.sym SHARED_PRECOMPS_DIR=$OUTPUTDIR/iphoneos/Debug/build.pch -destination platform="tvOS Simulator,OS=latest,name=Apple TV" ONLY_ACTIVE_ARCH=NO DEVELOPMENT_TEAM=UBF8T346G9 | /usr/local/bin/xcpretty -r junit --no-color

    if [ $? -ne 0 ]; then
      echo "Xcode tvOS test FAILED"
      exit 1
    fi
  fi
fi

# Cleanup packager and WebSocket test server
. ./scripts/vsto-test-cleanup.sh

# End VSTO build agent tasks

echo "SUCEEDED."
echo "The output directory was $OUTPUTDIR"
