# Cocoapods::Plugins Changelog

## 1.0.0 (2016-05-10)

##### Enhancements

* None.  

##### Bug Fixes

* None.  


## 1.0.0.rc.1 (2016-04-30)

This version contains no changes.  


## 1.0.0.beta.1 (2015-12-30)

This version contains no changes.  


## 0.4.2 (2015-04-03)


## 0.4.1 (2015-02-25)

* Added the `pod plugins installed` subcommand.  
  [Olivier Halligon](https://github.com/AliSoftware)

## 0.4.0 (2014-12-25)

* Added the `pod plugins publish` subcommand.  
  [Olivier Halligon](https://github.com/AliSoftware)

## 0.3.2 (2014-11-02)

* Switch to using cocoapods-plugins JSON file instead of from Cocoapods.org's repo.  
  [542919](https://github.com/CocoaPods/cocoapods-plugins/commit/542919902e611c33bb0e02848037474529ddd0f9)
  [Florian Hanke](https://github.com/floere)


## 0.3.1 (2014-09-12)

* Restore compatibility with Ruby 1.8.7.  
  [#30](https://github.com/CocoaPods/cocoapods-plugins/issues/30)
  [Fabio Pelosin](https://github.com/fabiopelosin)

## 0.3.0 (2014-09-11)

* Added a reminder to add plugin to `plugins.json` once released.  
  [#27](https://github.com/CocoaPods/cocoapods-plugins/issues/27)
  [Olivier Halligon](https://github.com/AliSoftware)

* Print out the version of plugins when invoked with `--verbose`.  
  [#16](https://github.com/CocoaPods/cocoapods-plugins/issues/16)
  [David Grandinetti](https://github.com/dbgrandi)

## 0.2.0 (2014-05-20)

* Migrating to new syntax of CLAide::Command#arguments.  
  [#23](https://github.com/CocoaPods/cocoapods-plugins/issues/23)
  [Olivier Halligon](https://github.com/AliSoftware)

* Printing URL of template used.  
  [#21](https://github.com/CocoaPods/cocoapods-plugins/issues/21)
  [Olivier Halligon](https://github.com/AliSoftware)

* `create` subcommand now prefixes the given name if not already.  
  [#20](https://github.com/CocoaPods/cocoapods-plugins/issues/20)
  [Olivier Halligon](https://github.com/AliSoftware)

## 0.1.1 (2014-05-02)

* Making `pod plugins` an abstract command, with `list` the default subcommand.  
  [#11](https://github.com/CocoaPods/cocoapods-plugins/issues/11)
  [#12](https://github.com/CocoaPods/cocoapods-plugins/issues/12)
  [Olivier Halligon](https://github.com/AliSoftware)

* Added `search` subcommand to search plugins by name, author and description.  
  [#6](https://github.com/CocoaPods/cocoapods-plugins/issues/6)
  [Olivier Halligon](https://github.com/AliSoftware)

* Refactoring and improved output formatting.  
  [#8](https://github.com/CocoaPods/cocoapods-plugins/issues/8)
  [#10](https://github.com/CocoaPods/cocoapods-plugins/issues/10)
  [#13](https://github.com/CocoaPods/cocoapods-plugins/issues/13)
  [Olivier Halligon](https://github.com/AliSoftware)

* Fixing coding conventions and RuboCop offenses.  
  [#17](https://github.com/CocoaPods/cocoapods-plugins/issues/17)
  [Olivier Halligon](https://github.com/AliSoftware)

## 0.1.0 (2014-04-22)

* Initial implementation.  
  [David Grandinetti](https://github.com/dbgrandi)

* Added `create` subcommand to create an empty project for a new plugin.  
  [#6](https://github.com/CocoaPods/cocoapods-plugins/issues/6)
  [Boris Bügling](https://github.com/neonichu)
