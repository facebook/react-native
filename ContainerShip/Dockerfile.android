# React Native Android Unit Tests
#
# This image builds upon the React Native Base Android Development Environment
# image. Ideally, this image would be rebuilt with any new commit to the master
# branch. Doing so will catch issues such as BUCK failing to fetch dependencies
# or run tests, as well as unit test failures.
FROM reactnativeci/android-base:latest

LABEL Description="This image prepares and runs React Native's Android tests."
LABEL maintainer="Héctor Ramos <hector@fb.com>"

# set default environment variables
ENV GRADLE_OPTS="-Dorg.gradle.daemon=false -Dorg.gradle.jvmargs=\"-Xmx512m -XX:+HeapDumpOnOutOfMemoryError\""
ENV JAVA_TOOL_OPTIONS="-Dfile.encoding=UTF8"

# add ReactAndroid directory
ADD .buckconfig /app/.buckconfig
ADD .buckjavaargs /app/.buckjavaargs
ADD ReactAndroid /app/ReactAndroid
ADD ReactCommon /app/ReactCommon
ADD ReactNative /app/ReactNative
ADD keystores /app/keystores

# set workdir
WORKDIR /app

# run buck fetches
RUN buck fetch ReactAndroid/src/test/java/com/facebook/react/modules
RUN buck fetch ReactAndroid/src/main/java/com/facebook/react
RUN buck fetch ReactAndroid/src/main/java/com/facebook/react/shell
RUN buck fetch ReactAndroid/src/test/...
RUN buck fetch ReactAndroid/src/androidTest/...

# build app
RUN buck build ReactAndroid/src/main/java/com/facebook/react
RUN buck build ReactAndroid/src/main/java/com/facebook/react/shell

ADD gradle /app/gradle
ADD gradlew /app/gradlew
ADD settings.gradle /app/settings.gradle
ADD build.gradle /app/build.gradle
ADD react.gradle /app/react.gradle

# run gradle downloads
RUN ./gradlew :ReactAndroid:downloadBoost :ReactAndroid:downloadDoubleConversion :ReactAndroid:downloadFolly :ReactAndroid:downloadGlog :ReactAndroid:downloadJSCHeaders

# compile native libs with Gradle script, we need bridge for unit and integration tests
RUN ./gradlew :ReactAndroid:packageReactNdkLibsForBuck -Pjobs=1 -Pcom.android.build.threadPoolSize=1

# add all react-native code
ADD . /app
WORKDIR /app

# build node dependencies
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get install apt-transport-https
RUN apt-get update
RUN apt-get install yarn
RUN yarn

WORKDIR /app
