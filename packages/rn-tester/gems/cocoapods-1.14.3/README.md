![CocoaPods Logo](https://raw.github.com/CocoaPods/shared_resources/master/assets/cocoapods-banner-readme.png)

### CocoaPods: The Cocoa dependency manager

[![Build Status](https://github.com/CocoaPods/CocoaPods/workflows/Specs/badge.svg)](https://github.com/CocoaPods/CocoaPods/actions/workflows/Specs.yml)
[![Gem Version](https://img.shields.io/gem/v/cocoapods)](https://rubygems.org/gems/cocoapods)
[![Maintainability](https://api.codeclimate.com/v1/badges/8f0fe544baf2ae1acc2b/maintainability)](https://codeclimate.com/github/CocoaPods/CocoaPods/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/8f0fe544baf2ae1acc2b/test_coverage)](https://codeclimate.com/github/CocoaPods/CocoaPods/test_coverage)

CocoaPods manages dependencies for your Xcode projects.

You specify the dependencies for your project in a simple text file: your `Podfile`. 
CocoaPods recursively resolves dependencies between libraries, fetches 
source code for all dependencies, and creates and maintains an Xcode 
workspace to build your project. The latest released Xcode versions and the 
prior version are supported.

Installing and updating CocoaPods is very easy. Don't miss the [Installation
guide](https://guides.cocoapods.org/using/getting-started.html#installation) and the
[Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

## Project Goals

CocoaPods aims to improve the engagement with, and discoverability 
of, third party open-source Cocoa libraries. These
project goals influence and drive the design of CocoaPods:

- Create and share libraries, and use them in your own projects,
  without creating extra work for library authors. Integrate
  non-CocoaPods libraries and hack on your own fork of any
  CocoaPods library with a simple transparent `Podspec` standard.
- Allow library authors to structure their libraries however they like.
- Save time for library authors by automating a lot of Xcode work not 
  related to their libraries' functionality.
- Support any source management system. (Currently supported are `git`, 
  `svn`, `mercurial`, `bazaar`, and various types of archives downloaded over HTTP.)
- Promote a culture of distributed collaboration on pods, but also provide
  features only possible with a centralised solution to foster a community.
- Build tools on top of the core Cocoa development system, including those 
  typically deployed to other operating systems, such as web-services.
- Provide opinionated and automated integration, but make it completely
  optional. You may manually integrate your CocoaPods dependencies
  into your Xcode project as you see fit, with or without a workspace.
- Solve everyday problems for Cocoa and Xcode developers.

## Sponsors

Lovingly sponsored by a collection of companies, see the footer of [CocoaPods.org](https://cocoapods.org) for an up-to-date list. 

## Collaborate

All CocoaPods development happens on GitHub. Contributions make for good karma and
we [welcome new](https://blog.cocoapods.org/starting-open-source/) contributors with joy. We take contributors seriously, and thus have a 
contributor [code of conduct](CODE_OF_CONDUCT.md).

## Links

| Link | Description |
| :----- | :------ |
[CocoaPods.org](https://cocoapods.org/) | Homepage and search for Pods.
[@CocoaPods](https://twitter.com/CocoaPods) | Follow CocoaPods on Twitter to stay up to date.
[Blog](https://blog.cocoapods.org) | The CocoaPods blog.
[Mailing List](https://groups.google.com/group/cocoapods) | Feel free to ask any kind of question.
[Guides](https://guides.cocoapods.org) | Everything you want to know about CocoaPods.
[Changelog](https://github.com/CocoaPods/CocoaPods/blob/master/CHANGELOG.md) | See the changes introduced in each CocoaPods version.
[New Pods RSS](https://feeds.cocoapods.org/new-pods.rss) | Don't miss any new Pods.
[Code of Conduct](CODE_OF_CONDUCT.md) | Find out the standards we hold ourselves to.

## Projects

CocoaPods is composed of the following projects:

| Status    | Project | Description | Info |
| :-------- | :------ | :--- | :--- |
| [![Build Status](https://github.com/CocoaPods/CocoaPods/workflows/Specs/badge.svg)](https://github.com/CocoaPods/CocoaPods/actions/workflows/Specs.yml) | [CocoaPods](https://github.com/CocoaPods/CocoaPods) | The CocoaPods command line tool. | [guides](https://guides.cocoapods.org)
| [![Build Status](https://github.com/CocoaPods/Core/workflows/Specs/badge.svg)](https://github.com/CocoaPods/Core/actions/workflows/Specs.yml) | [CocoaPods Core](https://github.com/CocoaPods/Core) | Support for working with specifications and podfiles. | [docs](https://guides.cocoapods.org/contributing/components.html)
| [![Build Status](https://github.com/CocoaPods/cocoapods-downloader/workflows/Specs/badge.svg)](https://github.com/CocoaPods/cocoapods-downloader/actions/workflows/Specs.yml) |[CocoaPods Downloader](https://github.com/CocoaPods/cocoapods-downloader) |  Downloaders for various source types. |  [docs](https://www.rubydoc.info/gems/cocoapods-downloader)
| [![Build Status](https://github.com/CocoaPods/Xcodeproj/workflows/Specs/badge.svg)](https://github.com/CocoaPods/Xcodeproj/actions/workflows/Specs.yml) | [Xcodeproj](https://github.com/CocoaPods/Xcodeproj) | Create and modify Xcode projects from Ruby. |  [docs](https://www.rubydoc.info/gems/xcodeproj)
| [![Build Status](https://github.com/CocoaPods/CLAide/workflows/ci/badge.svg)](https://github.com/CocoaPods/CLAide/actions/workflows/ci.yml) | [CLAide](https://github.com/CocoaPods/CLAide) | A small command-line interface framework.  | [docs](https://www.rubydoc.info/gems/claide)
| [![Build Status](https://github.com/CocoaPods/Molinillo/workflows/test/badge.svg)](https://github.com/CocoaPods/Molinillo/actions/workflows/test.yml) | [Molinillo](https://github.com/CocoaPods/Molinillo) | A powerful generic dependency resolver.  | [docs](https://www.rubydoc.info/gems/molinillo)
|  | [Master Repo ](https://github.com/CocoaPods/Specs) | Master repository of specifications. | [guides](https://guides.cocoapods.org/making/specs-and-specs-repo.html)
