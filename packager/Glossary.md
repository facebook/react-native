Glossary
===

Terminology commonly used in React Native Packager / Metro Bundler is explained
here. This document is work in progress, please help completing it.

## Build Root

Configuration files (`rn-cli.config.js`) support configuring one or more roots
that are watched for file changes during development. In the context of the
integration with the `js_*` rule family in [Buck][], there is only a single root,
the build root used by Buck.


## Local Path

A *local path* / `localPath` is the path to a file relative to a
[*build root*](#build-root).



[Buck]: http://buckbuild.com/
