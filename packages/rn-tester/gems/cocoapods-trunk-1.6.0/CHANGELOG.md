## 1.6.0 (2021-09-01)

##### Enhancements

* None.  

##### Bug Fixes

* None.  


## 1.5.0 (2020-05-01)

##### Enhancements

* Add --synchronous option to `pod trunk push`.  
  [Paul Beusterien](https://github.com/paulb777)
  [#147](https://github.com/CocoaPods/cocoapods-trunk/pull/147)
  [CocoaPods#9497](https://github.com/CocoaPods/CocoaPods/issues/9497)

##### Bug Fixes

* None.  


## 1.4.1 (2019-09-26)

##### Enhancements

* None.  

##### Bug Fixes

* Use a more robust `Trunk` init when pushing.  
  [Igor Makarov](https://github.com/igor-makarov)
  [#135](https://github.com/CocoaPods/cocoapods-trunk/pull/135)


## 1.4.0 (2019-08-21)

##### Enhancements

* None.  

##### Bug Fixes

* Update to get the master spec repo from `Source::Manager` for validation - effectively 
  use the new CDN `TrunkSource` for podspec validation and not a hard-coded URL  
  [Igor Makarov](https://github.com/igor-makarov)
  [#132](https://github.com/CocoaPods/cocoapods-trunk/pull/132)
  [CocoaPods#9112](https://github.com/CocoaPods/CocoaPods/issues/9112)

## 1.3.1 (2018-08-16)

##### Enhancements

* None.  

##### Bug Fixes

* None.  


## 1.3.0 (2017-10-02)

##### Enhancements

* Add skip test option to trunk push  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#93](https://github.com/CocoaPods/cocoapods-trunk/pull/93)
  
* Loosen netrc requirement
  [jasl](https://github.com/jasl)
  [#93](https://github.com/CocoaPods/cocoapods-trunk/pull/95)
  
* Update development dependencies to support MRI 2.3+
  [jasl](https://github.com/jasl)
  [#93](https://github.com/CocoaPods/cocoapods-trunk/pull/95)

##### Bug Fixes

* None.  


## 1.2.0 (2017-04-11)

##### Enhancements

* None.  

##### Bug Fixes

* Properly display `pod trunk deprecate` command line options  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6486](https://github.com/CocoaPods/CocoaPods/issues/6486)

* Add `--skip-import-validation` to skip linking a pod during lint.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#86](https://github.com/CocoaPods/cocoapods-trunk/pull/86)


## 1.1.2 (2016-12-17)

##### Enhancements

* None.  

##### Bug Fixes

* Checks that `Pod::Validator` has `swift_version=` for CocoaPods <= 1.1.0 support.  
  [Danielle Tomlinson](https://github.com/dantoml)
  [#6209](https://github.com/CocoaPods/CocoaPods/issues/6209)


## 1.1.1 (2016-10-20)

##### Enhancements

* None.  

##### Bug Fixes

* Support submitting from multiple versions of CocoaPods.  
  [Samuel Giddins](https://github.com/segiddins)

## 1.1.0 (2016-10-19)

##### Enhancements

* Passes the pod's version of Swift used for deployment to the CocoaPods Specs repo  
  [Orta](https://github.com/orta)
  [#92](https://github.com/CocoaPods/cocoapods-trunk/pull/72)

* Prettier success message when successfully pushed a new version
  [Marin](https://github.com/icanzilb)
  [#76](https://github.com/CocoaPods/cocoapods-trunk/pull/76)

##### Bug Fixes

* None.  


## 1.1.0.beta.1 (2016-10-10)

##### Enhancements

* Pass --swift-version to the Validator during `pod lib lint`
  [Danielle Tomlinson](https://github.com/dantoml)
  [#92](https://github.com/CocoaPods/cocoapods-trunk/pull/72)

##### Bug Fixes

* None.  


## 1.0.0 (2016-05-10)

##### Enhancements

* None.  

##### Bug Fixes

* Don't print the invocation of `/bin/date`.  
  [Samuel Giddins](https://github.com/segiddins)


## 1.0.0.rc.1 (2016-04-30)

##### Enhancements

* Make the error loading a specification during `pod trunk push` more
  informative.  
  [Samuel Giddins](https://github.com/segiddins)
  [#63](https://github.com/CocoaPods/cocoapods-trunk/issues/63)

##### Bug Fixes

* None.  


## 1.0.0.beta.4 (2016-04-15)

##### Enhancements

* None.  

##### Bug Fixes

* Compatibility With CocoaPods 1.0.0.beta.8.  
  [Samuel Giddins](https://github.com/segiddins)
  [#61](https://github.com/CocoaPods/cocoapods-trunk/issues/61)


## 1.0.0.beta.3 (2016-04-14)

##### Enhancements

* The failure reason is printed when validation fails during `pod trunk push`.  
  [Samuel Giddins](https://github.com/segiddins)
  [CocoaPods#5073](https://github.com/CocoaPods/CocoaPods/issues/5073)

##### Bug Fixes

* None.  


## 1.0.0.beta.2 (2016-02-03)

##### Bug Fixes

* Send a body with the `PATCH` request to deprecate a pod.  
  [Samuel Giddins](https://github.com/segiddins)
  [#52](https://github.com/CocoaPods/cocoapods-trunk/issues/52)


## 1.0.0.beta.1 (2015-12-30)

##### Enhancements

* The `pod deprecate PODNAME` command has been added to deprecate all versions
  of a pod.  
  [Samuel Giddins](https://github.com/segiddins)
  [#31](https://github.com/CocoaPods/cocoapods-trunk/issues/31)

* The `pod delete PODNAME VERSION` command has been added to delete a single
  version of a pod.  
  [Samuel Giddins](https://github.com/segiddins)

##### Bug Fixes

* If the master repo has not been setup when pushing a spec, run `pod setup`
  instead of failing.  
  [Samuel Giddins](https://github.com/segiddins)
  [#48](https://github.com/CocoaPods/cocoapods-trunk/issues/48)


## 0.6.4 (2015-08-28)

##### Bug Fixes

* This release fixes installation compatibility issues when using the RubyGem
  due to an incompatible dependency on `nap`.  
  [Samuel Giddins](https://github.com/segiddins)


## 0.6.3 (2015-08-28)

##### Bug Fixes

* This release fixes a file permissions error when using the RubyGem.  
  [Samuel Giddins](https://github.com/segiddins)


## 0.6.2 (2015-08-26)

##### Enhancements

* The `--allow-warnings` flag to `pod trunk push` is now propagated to the trunk
  server.  
  [Samuel Giddins](https://github.com/segiddins)
  [CocoaPods#3855](https://github.com/CocoaPods/CocoaPods/issues/3855)


## 0.6.1 (2015-05-27)

##### Enhancements

* The `master` specs repo is updated before and after pushing a new spec to
  trunk.  
  [Samuel Giddins](https://github.com/segiddins)
  [#43](https://github.com/CocoaPods/cocoapods-trunk/issues/43)


## 0.6.0 (2015-03-11)

##### Enhancements

* Allow specifying a Trunk token via the `COCOAPODS_TRUNK_TOKEN` environment
  variable.  
  [Samuel Giddins](https://github.com/segiddins)
  [CocoaPods#3224](https://github.com/CocoaPods/CocoaPods/issues/3224)


## 0.5.1 (2015-02-25)

##### Enhancements

* Lint as a framework automatically. If needed, the `--use-libraries`
  option allows linting as a static library.  
  [Boris Bügling](https://github.com/neonichu)
  [#2912](https://github.com/CocoaPods/CocoaPods/issues/2912)

##### Bug Fixes

* Fix the detection of spec validation errors, and present the proper error
  (and messages) to the user.  
  [Orta Therox](https://github.com/orta)
  [#39](https://github.com/CocoaPods/cocoapods-trunk/issues/39)


## 0.5.0 (2014-12-25)

##### Enhancements

* Added `pod trunk remove-owner` command to remove an owner from a pod.  
  [Samuel Giddins](https://github.com/segiddins)
  [#35](https://github.com/CocoaPods/cocoapods-trunk/issues/35)

* Added `pod trunk info` command to get information for a pod, including the
  owners.  
  [Kyle Fuller](https://github.com/kylef)
  [#15](https://github.com/CocoaPods/cocoapods-trunk/issues/15)


## 0.4.1 (2014-11-19)

##### Enhancements

* Improved code readability and structure by splitting subcommands
  into individual files.  
  [Olivier Halligon](https://github.com/alisoftware)
  [#21](https://github.com/CocoaPods/CocoaPods/issues/21)

##### Bug Fixes

* Updates for changes in CocoaPods regarding `--allow-warnings`.  
  [Kyle Fuller](https://github.com/kylef)
  [Cocoapods#2831](https://github.com/CocoaPods/CocoaPods/pull/2831)


## 0.4.0 (2014-11-06)

##### Bug Fixes

* Fixes installation issues with the JSON dependency.  
  [Eloy Durán](https://github.com/alloy)
  [CocoaPods#2773](https://github.com/CocoaPods/CocoaPods/issues/2773)

## 0.3.1 (2014-10-15)

##### Bug Fixes

* Fixes an issue introduced with the release of `netrc 0.7.8`.  
  [Samuel Giddins](https://github.com/segiddins)
  [CocoaPods#2674](https://github.com/CocoaPods/CocoaPods/issues/2674)


## 0.3.0 (2014-10-07)

##### Enhancements

* When linting, only allow dependencies from the 'master' specs repository.  
  [Samuel Giddins](https://github.com/segiddins)
  [#28](https://github.com/CocoaPods/cocoapods-trunk/issues/28)

##### Bug Fixes

* Fixes an issue where `pod trunk push` doesn't show which validation errors
  and just stated it failed.  
  [Kyle Fuller](https://github.com/kylef)
  [#26](https://github.com/CocoaPods/cocoapods-trunk/issues/26)


## 0.2.0 (2014-09-11)

##### Enhancements

* Network errors are now gracefully handled.  
  [Samuel E. Giddins](https://github.com/segiddins)

* Adopted new argument format of CLAide.  
  [Olivier Halligon](https://github.com/AliSoftware)


## 0.1.0 (2014-05-19)

* Initial release.
