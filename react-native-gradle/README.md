# React Native Gradle plugin

This is a plugin for the default build system for Android applications, [gradle][0]. It hooks into the default Android build lifecycle and copies the JS bundle from the packager server to the `assets/` folder.

## Usage

To add this plugin to an existing Android project, first add this to your top-level `build.gradle` file, under `buildscript / dependencies`:

    classpath 'com.facebook.react:gradleplugin:1.0.+'

Then apply the plugin to your application module (usually `app/build.gradle`):

    apply plugin: 'com.facebook.react'

That's it! The plugin will now download the bundle from the default packager location (http://localhost:8081/index.android.js) and place it in the assets folder at build time.

## Configuration

The following shows all of the values that can be customized and their defaults. Configuration goes into your application module (`app/build.gradle`).

    react {
        bundleFileName "index.android.bundle"
        bundlePath "/index.android.bundle"
        jsRoot "../../"
        packagerHost "localhost:8082"
        packagerCommand "../node_modules/react-native/packager/launchAndroidPackager.command"
    
        devParams {
            dev true
            inlineSourceMap false
            minify false
            runModule true
            skip true
        }
        releaseParams {
            dev false
            inlineSourceMap false
            minify true
            runModule true
            skip false
        }
    }

Here's a breakdown of the various configurations:

* `bundleFileName` specifies the name of the asset file that is generated and bundled in the `.apk`
* `bundlePath` is the path to the bundle, as recognized by the packager server
* `jsRoot` is the root of your entire app; this is scanned for `.js` files to determine when the bundle needs to be re-fetched
* `packagerHost` is the packager server address
* `packagerCommand` specifies how to start the packager server if it's not running
* `devParams` and `releaseParams` specify what parameters to include in the request to the packager server when fetching the bundle; see below for more information
* `skip` in `devParams` and `releaseParams` specifies whether to skip requesting and bundling the JS for that configuration

The default config makes it so that the following bundles are added to the respective builds, as `assets/index.android.bundle`. The dev bundle is normally skipped as it is loaded from the packager at runtime, but you can change this behavior by setting `skip` to `false` under `devParams`:

| Build   | Packager URL                                                                                      |
|---------|---------------------------------------------------------------------------------------------------|
| dev     | http://localhost:8082/index.android.js?dev=true&inlineSourceMap=false&minify=false&runModule=true |
| release | http://localhost:8082/index.android.js?dev=false&inlineSourceMap=false&minify=true&runModule=true |

For more information regarding the URL parameters, check out the [packager documentation][1].

## Contributing

After you make changes to the plugin code, simply run `gradle build install` in this directory. Then, in your Android project, change the top-level buildscript classpath dependency to whatever version you just built, something like `1.2.3-SNAPSHOT`. This should be picked up and used from your local maven repository.

[0]: https://gradle.org/
[1]: https://github.com/facebook/react-native/blob/master/packager/README.md
