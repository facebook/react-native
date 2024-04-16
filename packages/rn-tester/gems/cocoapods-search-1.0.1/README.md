# cocoapods-search

[![Build Status](https://travis-ci.org/CocoaPods/cocoapods-search.svg)](https://travis-ci.org/CocoaPods/cocoapods-search)

A CocoaPods plugin that allows you to search multiple pod spec repositories for specific pods matching a query. cocoapods-search is by default included in CocoaPods.
 
## Installation

If you have CocoaPods, you already have cocoapods-search installed by default. If not, you can also install it as a seperate gem as followed.

    $ gem install cocoapods-search

## Usage

Search for pods by using the pod search command as followed.

    $ pod search QUERY

e.g.

	$ pod search networkin

	-> ACSNetworking (0.0.1)
	On the basis of AFNetworking encapsulation.
	pod 'ACSNetworking', '~> 0.0.1'
	- Homepage: https://github.com/Hyosung/ACSNetworking
	- Source:   https://github.com/Hyosung/ACSNetworking.git
	- Versions: 0.0.1 [master repo]


	-> AFNetworking (2.5.4)
	   A delightful iOS and OS X networking framework.
	   pod 'AFNetworking', '~> 2.5.4'
	   - Homepage: https://github.com/AFNetworking/AFNetworking
	   - Source:   https://github.com/AFNetworking/AFNetworking.git
	   - Versions: 2.5.4, 2.5.3, 2.5.2, 2.5.1, 2.5.0, 2.4.1, 2.4.0, 2.3.1, 2.3.0, 2.2.4, 2.2.3, 2.2.2, 2.2.1, 2.2.0, 2.1.0, 2.0.3, 2.0.2, 2.0.1, 2.0.0, 2.0.0-RC3,
	   2.0.0-RC2, 2.0.0-RC1, 1.3.4, 1.3.3, 1.3.2, 1.3.1, 1.3.0, 1.2.1, 1.2.0, 1.1.0, 1.0.1, 1.0, 1.0RC3, 1.0RC2, 1.0RC1, 0.10.1, 0.10.0, 0.9.2, 0.9.1, 0.9.0, 0.7.0,
	   0.5.1 [master repo]
	   - Subspecs:
	     - AFNetworking/Serialization (2.5.4)
	     - AFNetworking/Security (2.5.4)
	     - AFNetworking/Reachability (2.5.4)
	     - AFNetworking/NSURLConnection (2.5.4)
	     - AFNetworking/NSURLSession (2.5.4)
	     - AFNetworking/UIKit (2.5.4)


	-> AFNetworking+AutoRetry (0.0.5)
	   Auto Retries for AFNetworking requests
	   pod 'AFNetworking+AutoRetry', '~> 0.0.5'
	   - Homepage: https://github.com/shaioz/AFNetworking-AutoRetry
	   - Source:   https://github.com/shaioz/AFNetworking-AutoRetry.git
	   - Versions: 0.0.5, 0.0.4, 0.0.3, 0.0.2, 0.0.1 [master repo]

	   ...


### Options

You can use the following options with the search command.

| Flag          | Description |
|-----------    |-------------|
| `--regex`     | Interpret the `QUERY` as a regular expression |
| `--full`      | Search by name, summary, and description |
| `--stats`     | Show additional stats (like GitHub watchers and forks) |
| `--ios`       | Restricts the search to Pods supported on iOS |
| `--osx`       | Restricts the search to Pods supported on OS X |
| `--watchos`   | Restricts the seach to Pods supported on Watch OS |
| `--web`       | Opens a new search on cocoapods.org |


e.g.

	$ pod search video --osx

	-> AMCoreAudio (2.0.7)
	AMCoreAudio is a Swift wrapper for Apple's CoreAudio framework
	pod 'AMCoreAudio', '~> 2.0.7'
	- Homepage: https://github.com/rnine/AMCoreAudio
	- Source:   https://github.com/rnine/AMCoreAudio.git
	- Versions: 2.0.7, 2.0.6, 2.0.5, 2.0.4, 2.0.3, 2.0.2, 2.0.1, 2.0, 1.5, 1.4.3, 1.4.2, 1.4.1, 1.4, 1.3.2, 1.3.1, 1.3, 1.2, 1.1, 1.0.1, 1.0 [master repo]


	-> AppleCoreAudioUtilityClasses@thehtb (2013.09.17)
	A git mirror of Apple's Core Audio Utility Classes for better versioning and with clang/llvm fixes.
	pod 'AppleCoreAudioUtilityClasses@thehtb', '~> 2013.09.17'
	- Homepage: https://github.com/thehtb/AppleCoreAudioUtilityClasses
	- Source:   https://github.com/thehtb/AppleCoreAudioUtilityClasses.git
	- Versions: 2013.09.17, 2013.2.18, 2013.1.2 [master repo]
	- Subspecs:
	- AppleCoreAudioUtilityClasses@thehtb/PublicUtility (2013.09.17)
	- AppleCoreAudioUtilityClasses@thehtb/PublicUtility/CAProcess (2013.09.17)
	- AppleCoreAudioUtilityClasses@thehtb/PublicUtility/CAAutoDisposer (2013.09.17)
	- AppleCoreAudioUtilityClasses@thehtb/PublicUtility/CABitOperations (2013.09.17)
	- AppleCoreAudioUtilityClasses@thehtb/PublicUtility/CASpectralProcessor (2013.09.17)


	-> AudioKit (2.1.1)
	Open-source audio synthesis, processing, & analysis platform.
	pod 'AudioKit', '~> 2.1.1'
	- Homepage: http://audiokit.io/
	- Source:   https://github.com/audiokit/AudioKit.git
	- Versions: 2.1.1, 2.0.1, 2.0, 1.3, 1.2-01, 1.2 [master repo]

	...
