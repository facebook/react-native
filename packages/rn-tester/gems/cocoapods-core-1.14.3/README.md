# CocoaPods Core

[![Build Status](https://github.com/CocoaPods/Core/workflows/Specs/badge.svg)](https://github.com/CocoaPods/Core/actions/workflows/Specs.yml)
[![Test Coverage](https://api.codeclimate.com/v1/badges/91a2d70b9ed977815c66/test_coverage)](https://codeclimate.com/github/CocoaPods/Core/test_coverage)
[![Maintainability](https://api.codeclimate.com/v1/badges/91a2d70b9ed977815c66/maintainability)](https://codeclimate.com/github/CocoaPods/Core/maintainability)

The CocoaPods-Core gem provides support to work with the models of CocoaPods.
It is intended to be used in place of the CocoaPods gem when the installation
of the dependencies is not needed. Therefore, it is suitable for web services.

Provides support for working with the following models:

- `Pod::Specification` - [Podspec Syntax Reference](https://guides.cocoapods.org/syntax/podspec.html).
- `Pod::Podfile` - [Podfile Syntax Reference](https://guides.cocoapods.org/syntax/podfile.html).
- `Pod::Source` - collections of podspec files like the [CocoaPods Spec repo](https://github.com/CocoaPods/Specs).

The gem also provides support for ancillary features like
`Pod::Specification::Set::Presenter` suitable for presetting descriptions of
Pods and the `Specification::Linter`, which ensures the validity of podspec
files.

## Installation

```
$ [sudo] gem install cocoapods-core
```

The `cocoapods-core` gem requires Ruby 2.6.0 or later.

## Collaborate

All CocoaPods development happens on GitHub, there is a repository for
[CocoaPods](https://github.com/CocoaPods/CocoaPods) and one for the [CocoaPods
specs](https://github.com/CocoaPods/Specs). Contributing patches or Pods is
really easy and gratifying.

Follow [@CocoaPods](http://twitter.com/CocoaPods) to get up to date
information about what's going on in the CocoaPods world.

## License

This gem and CocoaPods are available under the MIT license.
