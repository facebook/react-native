# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
#
# This image builds upon the React Native Community Android image:
# https://github.com/react-native-community/docker-android
#
# The base image is expected to remain relatively stable, and only
# needs to be updated when major dependencies such as the Android
# SDK or NDK are updated.
#
# In this Android Test image, we download the latest dependencies
# and build a Android application that can be used to run the
# tests specified in the scripts/ directory.
#
FROM reactnativecommunity/react-native-android

LABEL Description="React Native Android Test Image"
LABEL maintainer="Héctor Ramos <hector@fb.com>"

# set default environment variables
ENV GRADLE_OPTS="-Dorg.gradle.daemon=false -Dorg.gradle.jvmargs=\"-Xmx512m -XX:+HeapDumpOnOutOfMemoryError\""
ENV JAVA_TOOL_OPTIONS="-Dfile.encoding=UTF8"

ADD .buckconfig /app/.buckconfig
ADD .buckjavaargs /app/.buckjavaargs
ADD tools /app/tools
ADD ReactAndroid /app/ReactAndroid
ADD ReactCommon /app/ReactCommon
ADD React /app/React
ADD keystores /app/keystores

WORKDIR /app

RUN buck fetch ReactAndroid/src/test/java/com/facebook/react/modules
RUN buck fetch ReactAndroid/src/main/java/com/facebook/react
RUN buck fetch ReactAndroid/src/main/java/com/facebook/react/shell
RUN buck fetch ReactAndroid/src/test/...
RUN buck fetch ReactAndroid/src/androidTest/...

RUN buck build ReactAndroid/src/main/java/com/facebook/react
RUN buck build ReactAndroid/src/main/java/com/facebook/react/shell

ADD . /app

RUN yarn

RUN ./gradlew :ReactAndroid:downloadBoost :ReactAndroid:downloadDoubleConversion :ReactAndroid:downloadFolly :ReactAndroid:downloadGlog

RUN ./gradlew :ReactAndroid:packageReactNdkLibsForBuck -Pjobs=1

