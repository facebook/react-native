# To learn about Buck see [Docs](https://buckbuild.com/).
# To run your application with Buck:
# - install Buck
# - `npm start` - to start the packager
# - `cd android`
# - `keytool -genkey -v -keystore keystores/debug.keystore -storepass android -alias androiddebugkey -keypass android -dname "CN=Android Debug,O=Android,C=US"`
# - `./gradlew :app:copyDownloadableDepsToLibs` - make all Gradle compile dependencies available to Buck
# - `buck install -r android/app` - compile, install and run application
#

load(":build_defs.bzl", "create_aar_targets", "create_jar_targets")

lib_deps = []

create_aar_targets(glob(["libs/*.aar"]))

create_jar_targets(glob(["libs/*.jar"]))

android_library(
    name = "all-libs",
    exported_deps = lib_deps,
)

android_library(
    name = "app-code",
    srcs = glob([
        "src/main/java/**/*.java",
    ]),
    deps = [
        ":all-libs",
        ":build_config",
        ":res",
    ],
)

android_build_config(
    name = "build_config",
    package = "com.helloworld",
)

android_resource(
    name = "res",
    package = "com.helloworld",
    res = "src/main/res",
)

android_binary(
    name = "app",
    keystore = "//android/keystores:debug",
    manifest = "src/main/AndroidManifest.xml",
    package_type = "debug",
    deps = [
        ":app-code",
    ],
)
