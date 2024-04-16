# Cocoapods plugins

[![Build Status](https://img.shields.io/travis/CocoaPods/cocoapods-plugins/master.svg?style=flat)](https://travis-ci.org/CocoaPods/cocoapods-plugins)
[![Coverage](https://img.shields.io/codeclimate/coverage/github/CocoaPods/cocoapods-plugins.svg?style=flat)](https://codeclimate.com/github/CocoaPods/cocoapods-plugins)
[![Code Climate](https://img.shields.io/codeclimate/github/CocoaPods/cocoapods-plugins.svg?style=flat)](https://codeclimate.com/github/CocoaPods/cocoapods-plugins)

CocoaPods plugin which shows info about available CocoaPods plugins or helps you get started developing a new plugin. Yeah, it's very meta.

## Installation

    $ gem install cocoapods-plugins

## Usage

##### List installed plugins

    $ pod plugins installed

List all installed CocoaPods plugins with their respective version (and pre_install/post_insall hooks if any)

##### List known plugins

    $ pod plugins list

List all known CocoaPods plugins (according to the list hosted on `http://github.com/CocoaPods/cocoapods-plugins`)

##### Search plugins

    $ pod plugins search QUERY

Search plugins whose name contains the given text (ignoring case). With --full, it searches by name but also by author and description.

##### Create a new plugin

    $ pod plugins create NAME [TEMPLATE_URL]

Create a scaffold for the development of a new plugin according to the CocoaPods best practices.
If a `TEMPLATE_URL`, pointing to a git repo containing a compatible template, is specified, it will be used in place of the default one.

## Get your plugin listed

    $ pod plugins publish

Create an issue in the `cocoapods-plugins` GitHub repository to ask for your plugin to be added to the official list (with the proper JSON fragment to be added to `plugins.json` so we just have to copy/paste it).
