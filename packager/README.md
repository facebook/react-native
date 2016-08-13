React Native Packager
--------------------

React Native Packager is a project similar in scope to browserify or
webpack, it provides a CommonJS-like module system, JavaScript
compilation (ES6, Flow, JSX), bundling, and asset loading.

The main difference is the Packager's focus on compilation and
bundling speed. We aim for a sub-second edit-reload
cycles. Additionally, we don't want users -- with large code bases --
to wait more than a few seconds after starting the packager.

The main deviation from the node module system is the support for our
proprietary module format known as `@providesModule`. However, we
discourage people from using this module format because going forward we
want to completely separate our infrastructure from React Native and
provide an experience most JavaScript developers are familiar with,
namely the node module format. We want to even go further, and let you
choose your own packager and asset pipeline or even integrate into
your existing infrastructure.

React Native users need not to understand how the packager work,
however, this documentation might be useful for advanced users and
people who want to fix bugs or add features to the packager (patches
welcome!).

## HTTP interface

The main way you'd interact with the packager is via the HTTP
interface. The following is the list of endpoints and their respective
functions.

### /path/to/moduleName.bundle

Does the following in order:

* parse out `path/to/moduleName`
* add a `.js` suffix to the path
* looks in your project root(s) for the file
* recursively collects all the dependencies from an in memory graph
* runs the modules through the transformer (might just be cached)
* concatenate the modules' content into a bundle
* responds to the client with the bundle (and a SourceMap URL)

### /path/to/moduleName.map

* if the package has been previously generated via the `.bundle`
  endpoint then the source map will be generated from that package
* if the package has not been previously asked for, this will go
  through the same steps outlined in the `.bundle` endpoint then
  generate the source map.

Note that source map generation currently assumes that the code has
been compiled with jstransform, which preserves line and column
numbers which allows us to generate source maps super fast.

### /path/to/moduleName.(map|bundle) query params

You can pass options for the bundle creation through the query params,
if the option is boolean `1/0` or `true/false` is accepted.

Here are the current options the packager accepts:

* `dev` boolean, defaults to true: sets a global `__DEV__` variable
  which will effect how the React Native core libraries behave.
* `minify` boolean, defaults to false: whether to minify the bundle.
* `runModule` boolean, defaults to true: whether to require your entry
  point module. So if you requested `moduleName`, this option will add
  a `require('moduleName')` the end of your bundle.
* `inlineSourceMap` boolean, defaults to false: whether to inline
  source maps.

### /debug

This is a page used for debugging, it offers a link to a single page :

* Cached Packages: which shows you the packages that's been already
  generated and cached

## Programmatic API

The packager is made of two things:

* The core packager (which we're calling ReactPackager)
* The scripts, devtools launcher, server run etc.

ReactPackager is how you mainly interact with the API.

```js
var ReactPackager = require('./react-packager');
```

### ReactPackager.middleware(options)

Returns a function that can be used in a connect-like
middleware. Takes the following options:

* `projectRoots` array (required): Is the roots where your JavaScript
  file will exist
* `blacklistRE` regexp: Is a patter to ignore certain paths from the
  packager
* `polyfillModuleName` array: Paths to polyfills you want to be
  included at the start of the bundle
* `cacheVersion` string: used in creating the cache file
* `resetCache` boolean, defaults to false: whether to use the cache on
  disk
* `transformModulePath` string: Path to the module used as a
  JavaScript transformer
* `nonPersistent` boolean, defaults to false: Whether the server
  should be used as a persistent deamon to watch files and update
  itself
* `assetRoots` array: Where should the packager look for assets
* `getTransformOptionsModulePath` string: Path to module that exports a function
  that acts as a middleware for generating options to pass to the transformer
  based on the bundle and module being transformed.

### ReactPackager.buildPackageFromUrl(options, url)

Build a package from a url (see the `.bundle` endpoint). `options` is
the same options that is passed to `ReactPackager.middleware`

### ReactPackager.getDependencies(options, main)

Given an entry point module. Recursively collect all the dependent
modules and return it as an array. `options` is the same options that
is passed to `ReactPackager.middleware`

## Debugging

To get verbose output when running the packager, define an environment variable:

    export DEBUG=ReactNativePackager:*

You can combine this with other values, e.g. `DEBUG=babel,ReactNativePackager:*`. Under the hood this uses the [`debug`](https://www.npmjs.com/package/debug) package, see its documentation for all the available options.

The `/debug` endpoint discussed above is also useful.

## FAQ

### Can I use this in my own non-React Native project?

Yes. It's not really tied to React Native, however feature development
is informed by React Native needs.

### Why didn't you use webpack?

We love webpack, however, when we tried on our codebase it was slower
than our developers would like it to be. You can find more discussion about
the subject [here](https://github.com/facebook/react-native/issues/5).
