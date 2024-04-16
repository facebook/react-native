
## 2.3.1 (2019-06-18)

##### Enhancements

* None.  

##### Bug Fixes

* Fixed crash with very long devices list/slow computers.  
  [Martin Fiebig](https://github.com/mfiebig)
  [#17](https://github.com/CocoaPods/fourflusher/issues/17)


## 2.3.0 (2019-06-05)

##### Enhancements

* Update simctl interface for Xcode 11.  
  [Colin Humber](https://github.com/colinhumber)
  [#22](https://github.com/CocoaPods/fourflusher/pull/22)

##### Bug Fixes

* None.  


## 2.2.0 (2019-01-28)

##### Enhancements

* Update simctl interface for Xcode 10.2.  
  [Jeff Kelley](https://github.com/SlaunchaMan)
  [CocoaPods#8458](https://github.com/CocoaPods/CocoaPods/issues/8458)

##### Bug Fixes

* None.  


## 2.1.0 (2018-10-17)

##### Enhancements

* Support Xcode 10.1.  

##### Bug Fixes

* None.  


## 2.0.1 (2016-10-16)

##### Enhancements

* None.  

##### Bug Fixes

* Fixed crash with simulators comparison, when device model is undefined
  [Roman Truba](https://github.com/dreddik)
  [#9](https://github.com/CocoaPods/fourflusher/pull/9)


## v2.0.0 (2016-10-02)

##### Breaking

* Use JSON output from `xcrun simctl list`. Drop support for Xcode 6 (doesn't support JSON output)  
  [Ben Asher](https://github.com/benasher44)
  [#6](https://github.com/CocoaPods/fourflusher/pull/6)

##### Enhancements

* Update simulator count for Travis  
  [Boris Bügling](https://github.com/neonichu)
  [#5](https://github.com/CocoaPods/fourflusher/pull/5)

* A more helpful error message for missing simulators  
  [Radek Pietruszewski](https://github.com/radex)
  [#4](https://github.com/CocoaPods/fourflusher/pull/4)

##### Bug Fixes

* None

## v1.0.1 (2016-06-25)

##### Enhancements

* Show better error for `:oldest` simulator search  
  [Boris Bügling](https://github.com/neonichu)

## v1.0.0 (2016-06-24)

##### Enhancements

* Improve finding simulators  
  [Boris Bügling](https://github.com/neonichu)

## v0.3.2 (2016-06-16)

##### Enhancements

* Support for parsing iOS 10.0 and tvOS 10.0  
  [Boris Bügling](https://github.com/neonichu)

##### Bug Fixes

* Rubocop fixes  
  [Boris Bügling](https://github.com/neonichu)

## v0.3.1 (2016-05-30)

##### Enhancements

* Travis CI improvements  
  [Boris Bügling](https://github.com/neonichu)
  [#1](https://github.com/CocoaPods/fourflusher/pull/1)

* Handle missing Xcode more gracefully  
  [Boris Bügling](https://github.com/neonichu)

## v0.3.0 (2015-12-29)

##### Enhancements

* Allow specifying constraints for `destination()`  
  [Boris Bügling](https://github.com/neonichu)

## v0.2.0 (2015-12-29)

##### Enhancements

* Allow constraining simulators by OS version  
  [Boris Bügling](https://github.com/neonichu)

## v0.1.0 (2015-12-18)

* List usable simulators. Find simulators by name. Get the destination setting for the simulator to pass to Xcodebuild  
  [Boris Bügling](https://github.com/neonichu)

