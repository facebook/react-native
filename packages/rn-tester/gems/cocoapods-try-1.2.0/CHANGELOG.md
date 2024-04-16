# CocoaPods::Try CHANGELOG

## 1.2.0 (2020-04-20)

##### Enhancements

* None.  

##### Bug Fixes

* Fix a crash when using `pod try` with CocoaPods 1.8.0 or higher.  
  [@arielpollack](https://github.com/arielpollack)
  [#63](https://github.com/CocoaPods/cocoapods-try/issues/63)
  [#65](https://github.com/CocoaPods/cocoapods-try/pull/65)


## 1.1.0 (2016-07-10)

##### Enhancements

* Added a command line option for specifying the podspec file from Git URL  
  [@rockwotj](https://github.com/rockwotj)
  [59](https://github.com/CocoaPods/CocoaPods-try/issues/59)

##### Bug Fixes

* None.  


## 1.0.0 (2016-05-10)

##### Enhancements

* None.  

##### Bug Fixes

* None.  


## 1.0.0.rc.1 (2016-04-30)

##### Enhancements

* None.  

##### Bug Fixes

* None.  


## 1.0.0.beta.4 (2016-04-15)

##### Enhancements

* None.  

##### Bug Fixes

* Compatibility With CocoaPods 1.0.0.beta.8.  
  [Samuel Giddins](https://github.com/segiddins)
  [CocoaPods#5159](https://github.com/CocoaPods/CocoaPods/issues/5159)


## 1.0.0.beta.3 (2016-03-15)

##### Bug Fixes

* Compatibility with CocoaPods 1.0.0.beta.6.  
  [Marius Rackwitz](https://github.com/mrackwitz)


## 1.0.0.beta.2 (2016-01-05)

##### Bug Fixes

* Ensure that the pod's source is re-downloaded, instead of pulling from the
  cache, which only holds cleaned sources.  
  [Samuel Giddins](https://github.com/segiddins)
  [#43](https://github.com/CocoaPods/cocoapods-try/issues/43)


## 1.0.0.beta.1 (2015-12-30)

##### Bug Fixes

* Ensure commands in the `.cocoapods` file are strings, and uses the pods folder when executing commands.  
  [Samuel Giddins](https://github.com/segiddins)
  [CocoaPods-Try#40](https://github.com/CocoaPods/cocoapods-try/issues/40)


## 0.5.1 (2015-08-28)

##### Bug Fixes

* This release fixes a file permissions error when using the RubyGem.  
  [Samuel Giddins](https://github.com/segiddins)


## 0.5.0 (2015-08-26)

##### Enhancements

* Any CocoaPod / GitHub repo can now declare their own pre-install commands, and prefer a
  project. To use this, add a `.cocoapods.yml` file to the root of your repo. The yaml file
  should have a structure like:

  ``` yaml
  try:
    install:
      pre:
        - pod install
        - git submodule init
    project: 'ORStackView.xcworkspace'
  ```

  [Orta Therox](https://github.com/orta)
  [#33](https://github.com/CocoaPods/cocoapods-try/issues/33)


## 0.4.5 (2015-05-27)

##### Bug Fixes

* Use `Dir.tmpdir` instead of explicit `/tmp`.  
  [Boris Bügling](https://github.com/neonichu)
  [#34](https://github.com/CocoaPods/cocoapods-try/pull/34)

* Automatically detect JSON podspecs.  
  [Samuel Giddins](https://github.com/segiddins)
  [#35](https://github.com/CocoaPods/cocoapods-try/issues/35)


## 0.4.4 (2015-05-06)

##### Bug Fixes

* Fix working with the CocoaPods download cache introduced in 0.37.  
  [Samuel Giddins](https://github.com/)
  [#30](https://github.com/CocoaPods/cocoapods-try/issues/30)


## 0.4.3 (2014-12-25)

##### Bug Fixes

* Ensure that the master repo is setup on try.  
  [Daniel Tomlinson](https://github.com/DanielTomlinson)
  [CocoaPods/CocoaPods#2563](https://github.com/CocoaPods/CocoaPods/pull/2563)

## 0.4.2 (2014-10-29)

* Prefer projects or workspaces with the name including Sample over others.  
  [Kyle Fuller](https://github.com/kylef)

## 0.4.1 (2014-09-26)

* Add `--no-repo-update` option.  
  [Eloy Durán](https://github.com/alloy)

## 0.4.0 (2014-09-11)

### Enhancements

* Adopted new argument format of CLAide.  
  [Olivier Halligon](https://github.com/AliSoftware)

## 0.3.0 (2014-05-19)

### Enhancements

* Adopted new CLAide release.  
  [Fabio Pelosin](https://github.com/irrationalfab)

## 0.2.0 (2014-03-28)

### Enhancements

* Added support for the specification of an URL instead of the name of a Pod.  
  [David Grandinetti](https://github.com/dbgrandi)
  [Fabio Pelosin](https://github.com/irrationalfab)

## 0.1.2

### Enhancements

* Prefer workspaces over projects.  
  [Kyle Fuller](https://github.com/kylef)

* Open workspaces if available.  
  [Kyle Fuller](https://github.com/kylef)

### Fixes

* Don't consider workspaces in bundles.  
  [Eloy Durán](https://github.com/alloy)

* Typo fixes.  
  [Mark Townsend](https://github.com/markltownsend)

## 0.1.0 (2013-12-02)

* Initial implementation.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
