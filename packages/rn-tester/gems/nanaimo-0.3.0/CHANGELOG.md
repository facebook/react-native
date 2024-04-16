# Nanaimo Changelog

## 0.3.0 (2020-07-17)

##### Enhancements

* None.  

##### Bug Fixes

* None.  


## 0.2.6 (2018-07-01)

##### Enhancements

* None.  

##### Bug Fixes

* Fix parse errors crashing when attempting to show context when the error
  occurs on the first character in the plist.  
  [Samuel Giddins](https://github.com/segiddins)


## 0.2.5 (2018-04-04)

##### Enhancements

* None.  

##### Bug Fixes

* Fix parsing arrays that contain a comment after a trailing comma.  
  [Samuel Giddins](https://github.com/segiddins)
  [#26](https://github.com/CocoaPods/Nanaimo/issues/26)


## 0.2.4 (2018-03-22)

##### Enhancements

* Enable frozen string literals to improve performance.  
  [Samuel Giddins](https://github.com/segiddins)

##### Bug Fixes

* None.  


## 0.2.3 (2016-11-30)

##### Enhancements

* None.  

##### Bug Fixes

* Quote the empty string `nil` is implicitly written as in non-strict mode.  
  [Samuel Giddins](https://github.com/segiddins)
  [Xcodeproj#453](https://github.com/CocoaPods/Xcodeproj/issues/453)


## 0.2.2 (2016-11-04)

##### Enhancements

* None.  

##### Bug Fixes

* Fix extraneously escaping single quotes when writing quoted strings.  
  [Samuel Giddins](https://github.com/segiddins)

* Properly align the `^` in parse error messages when the line with the syntax
  error contains tabs.  
  [Samuel Giddins](https://github.com/segiddins)


## 0.2.1 (2016-11-03)

##### Enhancements

* None.  

##### Bug Fixes

* Fix reading all supported characters in unquoted strings.  
  [Samuel Giddins](https://github.com/segiddins)
  [#13](https://github.com/CocoaPods/Nanaimo/issues/13)


## 0.2.0 (2016-11-02)

##### Enhancements

* Add context to parse errors.  
  [Samuel Giddins](https://github.com/segiddins)
  [#5](https://github.com/CocoaPods/Nanaimo/issues/5)

* Allow disabling 'strict' mode when writing plists, allowing unknown object
  types to be serialized as their string representations.  
  [Samuel Giddins](https://github.com/segiddins)

##### Bug Fixes

* None.  


## 0.1.4 (2016-11-01)

##### Enhancements

* None.  

##### Bug Fixes

* Allow reading unquoted strings that contain `-`.  
  [Samuel Giddins](https://github.com/segiddins)
  [Xcodeproj#438](https://github.com/CocoaPods/Xcodeproj/issues/438)


## 0.1.3 (2016-11-01)

##### Enhancements

* None.  

##### Bug Fixes

* Fix unquoting a sequence of backslashes.  
  [Samuel Giddins](https://github.com/segiddins)
  [CocoaPods#6108](https://github.com/CocoaPods/CocoaPods/issues/6108)


## 0.1.2 (2016-10-29)

##### Enhancements

* None.  

##### Bug Fixes

* Add support for unquoted strings that contain a `$`.  
  [Danielle Tomlinson](https://github.com/dantoml)
  [CocoaPods#6101](https://github.com/CocoaPods/CocoaPods/issues/6101)


## 0.1.1 (2016-10-28)

##### Enhancements

* None.  

##### Bug Fixes

* Ensure all required classes are required before being used.  
  [Samuel Giddins](https://github.com/segiddins)
  [Xcodeproj#435](https://github.com/CocoaPods/Xcodeproj/issues/435)


## 0.1.0 (2016-10-21)

##### Enhancements

* Initial implementation.  
  [Samuel Giddins](https://github.com/segiddins)
