# Changes

## Version 2.0.6 - 28-Jan-2023

* Eliminate `Object#untaint` deprecation warnings on JRuby 9.4.0.0. #145.


## Version 2.0.5 - 19-Jul-2022

* Changed `DateTime` results to always use the proleptic Gregorian calendar.
  This affects `DateTime` results prior to 1582-10-15 and any arithmetic
  performed on the results that would produce a secondary result prior to
  1582-10-15.
* Added support for eager loading all the time zone and country data by calling
  either `TZInfo::DataSource#eager_load!` or `TZInfo.eager_load!`. Compatible
  with Ruby On Rails' `eager_load_namespaces`. #129.
* Ignore the SECURITY file from Arch Linux's tzdata package. #134.


## Version 2.0.4 - 16-Dec-2020

* Fixed an incorrect `InvalidTimezoneIdentifier` exception raised when loading a
  zoneinfo file that includes rules specifying an additional transition to the
  final defined offset (for example, Africa/Casablanca in version 2018e of the
  Time Zone Database). #123.


## Version 2.0.3 - 8-Nov-2020

* Added support for handling "slim" format zoneinfo files that are produced by
  default by zic version 2020b and later. The POSIX-style TZ string is now used
  calculate DST transition times after the final defined transition in the file.
  #120.
* Fixed `TimeWithOffset#getlocal` returning a `TimeWithOffset` with the
  `timezone_offset` still assigned when called with an offset argument on JRuby
  9.3.
* Rubinius is no longer supported.


## Version 2.0.2 - 2-Apr-2020

* Fixed 'wrong number of arguments' errors when running on JRuby 9.0. #114.
* Fixed warnings when running on Ruby 2.8. #113.


## Version 2.0.1 - 24-Dec-2019

* Fixed "SecurityError: Insecure operation - require" exceptions when loading
  data with recent Ruby releases in safe mode. #100.
* Fixed warnings when running on Ruby 2.7. #109.
* Added a `TZInfo::Timezone#=~` method that performs a regex match on the time
  zone identifier. #99.
* Added a `TZInfo::Country#=~` method that performs a regex match on the country
  code.


## Version 2.0.0 - 26-Dec-2018

### Added

* `to_local` and `period_for` instance methods have been added to
  `TZInfo::Timezone`. These are similar to `utc_to_local` and `period_for_utc`,
  but take the UTC offset of the given time into account.
* `abbreviation`, `dst?`, `base_utc_offset` and `observed_utc_offset` instance
  methods have been added to `TZInfo::Timezone`, returning the abbreviation,
  whether daylight savings time is in effect and the UTC offset of the time zone
  at a specified time.
* A `TZInfo::Timestamp` class has been added. It can be used with
  `TZInfo::Timezone` in place of a `Time` or `DateTime`.
* `local_time`, `local_datetime` and `local_timestamp` instance methods have
  been added to `TZInfo::Timezone`. These methods construct local `Time`,
  `DateTime` and `TZInfo::Timestamp` instances with the correct UTC offset and
  abbreviation for the time zone.
* Support for a (yet to be released) version 2 of tzinfo-data has been added, in
  addition to support for version 1. The new version will remove the (no longer
  needed) `DateTime` parameters from transition times, reduce memory consumption
  and improve the efficiency of loading timezone and country indexes.
* A `TZInfo::VERSION` constant has been added, indicating the TZInfo version
  number.

### Changed

* The minimum supported Ruby versions are now Ruby MRI 1.9.3, JRuby 1.7 (in 1.9
  or later mode) and Rubinius 3.
* Local times are now returned using the correct UTC offset (instead of using
  UTC). #49 and #52.
* Local times are returned as instances of `TimeWithOffset`,
  `DateTimeWithOffset` or `TZInfo::TimestampWithOffset`. These classes subclass
  `Time`, `DateTime` and `TZInfo::Timestamp` respectively. They override the
  default behaviour of the base classes to return information about the observed
  offset at the indicated time. For example, the zone abbreviation is returned
  when using the `%Z` directive with `strftime`.
* The `transitions_up_to`, `offsets_up_to` and `strftime` instance methods of
  `TZInfo::Timezone` now take the UTC offsets of given times into account
  (instead of ignoring them as was previously the case).
* The `TZInfo::TimezonePeriod` class has been split into two subclasses:
  `TZInfo::OffsetTimezonePeriod` and `TZInfo::TransitionsTimezonePeriod`.
  `TZInfo::OffsetTimezonePeriod` is returned for time zones that only have a
  single offset. `TZInfo::TransitionsTimezonePeriod` is returned for periods
  that start or end with a transition.
* `TZInfo::TimezoneOffset#abbreviation`, `TZInfo::TimezonePeriod#abbreviation`
  and `TZInfo::TimezonePeriod#zone_identifier` now return frozen `String`
  instances instead of instances of `Symbol`.
* The `utc_offset` and `utc_total_offset` attributes of `TZInfo::TimezonePeriod`
  and `TZInfo::TimezoneOffset` have been renamed `base_utc_offset` and
  `observed_utc_offset` respectively. The former names have been retained as
  aliases.
* `TZInfo::Timezone.get`, `TZInfo::Timezone.get_proxy` and `TZInfo::Country.get`
  can now be used with strings having any encoding. Previously, only encodings
  that are directly comparable with UTF-8 were supported.
* The requested identifier is included in `TZInfo::InvalidTimezoneIdentifier`
  exception messages.
* The requested country code is included in `TZInfo::InvalidCountryCode`
  exception messages.
* The full range of transitions is now loaded from zoneinfo files. Zoneinfo
  files produced with version 2014c of the `zic` tool contain an initial
  transition `2**63` seconds before the epoch. Zoneinfo files produced with
  version 2014d or later of `zic` contain an initial transition `2**59` seconds
  before the epoch. These transitions would previously have been ignored, but
  are now returned in methods such as `TZInfo::Timezone#transitions_up_to`.
* The `TZInfo::RubyDataSource` and `TZInfo::ZoneinfoDataSource` classes have
  been moved into a new `TZInfo::DataSources` module. Code that is setting
  `TZInfo::ZoneinfoDataSource.search_path` or
  `TZInfo::ZoneinfoDataSource.alternate_iso3166_tab_search_path` will need to be
  updated accordingly.
* The `TZInfo::InvalidZoneinfoDirectory` and `TZInfo::ZoneinfoDirectoryNotFound`
  exception classes raised by `TZInfo::DataSources::ZoneinfoDataSource` have
  been moved into the `TZInfo::DataSources` module.
* Setting the data source to `:ruby` or instantiating
  `TZInfo::DataSources::RubyDataSource` will now immediately raise a
  `TZInfo::DataSources::TZInfoDataNotFound` exception if `require 'tzinfo/data'`
  fails. Previously, a failure would only occur later when accessing an index or
  loading a timezone or country.
* The `DEFAULT_SEARCH_PATH` and `DEFAULT_ALTERNATE_ISO3166_TAB_SEARCH_PATH`
  constants of `TZInfo::DataSources::ZoneinfoDataSource` have been made private.
* The `TZInfo::Country.data_source`,
  `TZInfo::DataSource.create_default_data_source`,
  `TZInfo::DataSources::ZoneinfoDataSource.process_search_path`,
  `TZInfo::Timezone.get_proxies` and `TZInfo::Timezone.data_source` methods have
  been made private.
* The performance of loading zoneinfo files and the associated indexes has been
  improved.
* Memory use has been decreased by deduplicating `String` instances when loading
  country and time zone data.
* The dependency on the deprecated thread_safe gem as been removed and replaced
  by concurrent-ruby.
* The Info classes used to return time zone and country information from
  `TZInfo::DataSource` implementations have been moved into the
  `TZInfo::DataSources` module.
* The `TZInfo::TransitionDataTimezoneInfo` class has been removed and replaced
  with `TZInfo::DataSources::TransitionsDataTimezoneInfo` and
  `TZInfo::DataSources::ConstantOffsetDataTimezoneInfo`.
  `TZInfo::DataSources::TransitionsDataTimezoneInfo` is constructed with an
  `Array` of `TZInfo::TimezoneTransition` instances representing times when the
  offset changes. `TZInfo::DataSources::ConstantOffsetDataTimezoneInfo` is
  constructed with a `TZInfo::TimezoneOffset` instance representing the offset
  constantly observed in a time zone.
* The `TZInfo::DataSource#timezone_identifiers` method should no longer be
  overridden in custom data source implementations. The implementation in the
  base class now calculates a result from
  `TZInfo::DataSource#data_timezone_identifiers` and
  `TZInfo::DataSource#linked_timezone_identifiers`.
* The results of the `TZInfo::DataSources::RubyDataSource` `to_s` and `inspect`
  methods now include the time zone database and tzinfo-data versions.


### Removed

* Methods of `TZInfo::Timezone` that accept time arguments no longer allow
  `Integer` timestamp values. `Time`, `DateTime` or `TZInfo::Timestamp` values
  or objects that respond to `to_i`, `subsec` and optionally `utc_offset` must
  be used instead.
* The `%:::z` format directive can now only be used with
  `TZInfo::Timezone#strftime` if it is supported by `Time#strftime` on the
  runtime platform.
* Using `TZInfo::Timezone.new(identifier)` and `TZInfo::Country.new(code)` to
  obtain a specific `TZInfo::Timezone` or `TZInfo::Country` will no longer work.
  `TZInfo::Timezone.get(identifier)` and `TZInfo::Country.get(code)` should be
  used instead.
* The `TZInfo::TimeOrDateTime` class has been removed.
* The `valid_for_utc?`, `utc_after_start?`, `utc_before_end?`,
  `valid_for_local?`, `local_after_start?` and `local_before_end?` instance
  methods of `TZInfo::TimezonePeriod` have been removed. Comparisons can be
  performed with the results of the `starts_at`, `ends_at`, `local_starts_at`
  and `local_ends_at` methods instead.
* The `to_local` and `to_utc` instance methods of `TZInfo::TimezonePeriod` and
  `TZInfo::TimezoneOffset` have been removed. Conversions should be performed
  using the `TZInfo::Timezone` class instead.
* The `TZInfo::TimezonePeriod#utc_total_offset_rational` method has been
  removed. Equivalent information can be obtained using the
  `TZInfo::TimezonePeriod#observed_utc_offset` method.
* The `datetime`, `time`, `local_end`, `local_end_time`, `local_start` and
  `local_start_time` instance methods of `TZInfo::TimezoneTransition` have been
  removed. The `at`, `local_end_at` and `local_start_at` methods should be used
  instead and the result (a `TZInfo::TimestampWithOffset`) converted to either a
  `DateTime` or `Time` by calling `to_datetime` or `to_time` on the result.
* The `us_zones` and `us_zone_identifiers` class methods of `TZInfo::Timezone`
  have been removed. `TZInfo::Country.get('US').zones` and
  `TZInfo::Country.get('US').zone_identifiers` should be used instead.


## Version 1.2.11 - 28-Jan-2023

* Eliminate `Object#untaint` deprecation warnings on JRuby 9.4.0.0. #145.


## Version 1.2.10 - 19-Jul-2022

* Fixed a relative path traversal bug that could cause arbitrary files to be
  loaded with `require` when used with `RubyDataSource`. Please refer to
  <https://github.com/tzinfo/tzinfo/security/advisories/GHSA-5cm2-9h8c-rvfx> for
  details. CVE-2022-31163.
* Ignore the SECURITY file from Arch Linux's tzdata package. #134.


## Version 1.2.9 - 16-Dec-2020

* Fixed an incorrect `InvalidTimezoneIdentifier` exception raised when loading a
  zoneinfo file that includes rules specifying an additional transition to the
  final defined offset (for example, Africa/Casablanca in version 2018e of the
  Time Zone Database). #123.


## Version 1.2.8 - 8-Nov-2020

* Added support for handling "slim" format zoneinfo files that are produced by
  default by zic version 2020b and later. The POSIX-style TZ string is now used
  calculate DST transition times after the final defined transition in the file.
  The 64-bit section is now always used regardless of whether Time has support
  for 64-bit times. #120.
* Rubinius is no longer supported.


## Version 1.2.7 - 2-Apr-2020

* Fixed 'wrong number of arguments' errors when running on JRuby 9.0. #114.
* Fixed warnings when running on Ruby 2.8. #112.


## Version 1.2.6 - 24-Dec-2019

* `Timezone#strftime('%s', time)` will now return the correct number of seconds
  since the epoch. #91.
* Removed the unused `TZInfo::RubyDataSource::REQUIRE_PATH` constant.
* Fixed "SecurityError: Insecure operation - require" exceptions when loading
  data with recent Ruby releases in safe mode.
* Fixed warnings when running on Ruby 2.7. #106 and #111.


## Version 1.2.5 - 4-Feb-2018

* Support recursively (deep) freezing `Country` and `Timezone` instances. #80.
* Allow negative daylight savings time offsets to be derived when reading from
  zoneinfo files. The utc_offset and std_offset are now derived correctly for
  Europe/Dublin in the 2018a and 2018b releases of the Time Zone Database.


## Version 1.2.4 - 26-Oct-2017

* Ignore the leapseconds file that is included in zoneinfo directories installed
  with version 2017c and later of the Time Zone Database.


## Version 1.2.3 - 25-Mar-2017

* Reduce the number of `String` objects allocated when loading zoneinfo files.
  #54.
* Make `Timezone#friendly_identifier` compatible with frozen string literals.
* Improve the algorithm for deriving the `utc_offset` from zoneinfo files. This
  now correctly handles Pacific/Apia switching from one side of the
  International Date Line to the other whilst observing daylight savings time.
  #66.
* Fix an `UnknownTimezone` exception when calling transitions_up_to or
  offsets_up_to on a `TimezoneProxy` instance obtained from
  `Timezone.get_proxy`.
* Allow the Factory zone to be obtained from the Zoneinfo data source.
* Ignore the /usr/share/zoneinfo/timeconfig symlink included in Slackware
  distributions. #64.
* Fix `Timezone#strftime` handling of `%Z` expansion when `%Z` is prefixed with
  more than one percent. #31.
* Support expansion of `%z`, `%:z`, `%::z` and `%:::z` to the UTC offset of the
  time zone in `Timezone#strftime`. #31 and #67.


## Version 1.2.2 - 8-Aug-2014

* Fix an error with duplicates being returned by `Timezone#all_country_zones`
  and `Timezone#all_country_zone_identifiers` when used with tzinfo-data
  v1.2014.6 or later.
* Use the zone1970.tab file for country timezone data if it is found in the
  zoneinfo directory (and fallback to zone.tab if not). zone1970.tab was added
  in tzdata 2014f. zone.tab is now deprecated.


## Version 1.2.1 - 1-Jun-2014

* Support zoneinfo files generated with zic version 2014c and later.
* On platforms that only support positive 32-bit timestamps, ensure that
  conversions are accurate from the epoch instead of just from the first
  transition after the epoch.
* Minor documentation improvements.


## Version 1.2.0 - 26-May-2014

* Raise the minimum supported Ruby version to 1.8.7.
* Support loading system zoneinfo data on FreeBSD, OpenBSD and Solaris.
  Resolves #15.
* Add `canonical_identifier` and `canonical_zone` methods to `Timezone`.
  Resolves #16.
* Add a link to a `DataSourceNotFound` help page in the
  `TZInfo::DataSourceNotFound` exception message.
* Load iso3166.tab and zone.tab files as UTF-8.
* Fix `Timezone#local_to_utc` returning local `Time` instances on systems using
  UTC as the local time zone. Resolves #13.
* Fix `==` methods raising an exception when passed an instance of a different
  class by making `<=>` return `nil` if passed a non-comparable argument.
* Eliminate `require 'rational'` warnings. Resolves #10.
* Eliminate "assigned but unused variable - info" warnings. Resolves #11.
* Switch to minitest v5 for unit tests. Resolves #18.


## Version 1.1.0 - 25-Sep-2013

* TZInfo is now thread safe. `ThreadSafe::Cache` is now used instead of `Hash`
  to cache `Timezone` and `Country` instances returned by `Timezone.get` and
  `Country.get`. The tzinfo gem now depends on thread_safe ~> 0.1.
* Added a `transitions_up_to` method to `Timezone` that returns a list of the
  times where the UTC offset of the timezone changes.
* Added an `offsets_up_to` method to `Timezone` that returns the set of offsets
  that have been observed in a defined timezone.
* Fixed a "can't modify frozen String" error when loading a `Timezone` from a
  zoneinfo file using an identifier `String` that is both tainted and frozen.
  Resolves #3.
* Support TZif3 format zoneinfo files (now produced by zic from tzcode version
  2013e onwards).
* Support using YARD to generate documentation (added a .yardopts file).
* Ignore the +VERSION file included in the zoneinfo directory on Mac OS X.
* Added a note to the documentation concerning 32-bit zoneinfo files (as
  included with Mac OS X).


## Version 1.0.1 - 22-Jun-2013

* Fix a test case failure when tests are run from a directory that contains a
  dot in the path (issue #29751).


## Version 1.0.0 - 2-Jun-2013

* Allow TZInfo to be used with different data sources instead of just the
  built-in Ruby module data files.
* Include a data source that allows TZInfo to load data from the binary
  zoneinfo files produced by zic and included with many Linux and Unix-like
  distributions.
* Remove the definition and index Ruby modules from TZInfo and move them into
  a separate TZInfo::Data library (available as the tzinfo-data gem).
* Default to using the TZInfo::Data library as the data source if it is
  installed, otherwise use zoneinfo files instead.
* Preserve the nanoseconds of local timezone Time objects when performing
  conversions (issue #29705).
* Don't add the tzinfo lib directory to the search path when requiring 'tzinfo'.
  The tzinfo lib directory must now be in the search path before 'tzinfo' is
  required.
* Add `utc_start_time`, `utc_end_time`, `local_start_time` and `local_end_time`
  instance methods to `TimezonePeriod`. These return an identical value as the
  existing `utc_start`, `utc_end`, `local_start` and `local_end` methods, but
  return `Time` instances instead of `DateTime`.
* Make the `start_transition`, `end_transition` and `offset` properties of
  `TimezonePeriod` protected. To access properties of the period, callers should
  use other `TimezonePeriod` instance methods instead (issue #7655).


## Version 0.3.61 (tzdata v2022a) - 19-Jul-2022

* Fixed a relative path traversal bug that could cause arbitrary files to be
  loaded with `require` from the Ruby load path. Please refer to
  <https://github.com/tzinfo/tzinfo/security/advisories/GHSA-5cm2-9h8c-rvfx> for
  details. CVE-2022-31163.
* Updated to tzdata version 2022a
  (<https://mm.icann.org/pipermail/tz-announce/2022-March/000070.html>).


## Version 0.3.60 (tzdata v2021a) - 6-Feb-2021

* Updated to tzdata version 2021a
  (<https://mm.icann.org/pipermail/tz-announce/2021-January/000065.html>).


## Version 0.3.59 (tzdata v2020e) - 24-Dec-2020

* Updated to tzdata version 2020e
  (<https://mm.icann.org/pipermail/tz-announce/2020-December/000063.html>).


## Version 0.3.58 (tzdata v2020d) - 8-Nov-2020

* Updated to tzdata version 2020d
  (<https://mm.icann.org/pipermail/tz-announce/2020-October/000062.html>).


## Version 0.3.57 (tzdata v2020a) - 17-May-2020

* Updated to tzdata version 2020a
  (<https://mm.icann.org/pipermail/tz-announce/2020-April/000058.html>).


## Version 0.3.56 (tzdata v2019c) - 1-Nov-2019

* Updated to tzdata version 2019c
  (<https://mm.icann.org/pipermail/tz-announce/2019-September/000057.html>).


## Version 0.3.55 (tzdata v2018g) - 27-Oct-2018

* Updated to tzdata version 2018g
  (<https://mm.icann.org/pipermail/tz-announce/2018-October/000052.html>).


## Version 0.3.54 (tzdata v2018d) - 25-Mar-2018

* Updated to tzdata version 2018d
  (<https://mm.icann.org/pipermail/tz-announce/2018-March/000049.html>).


## Version 0.3.53 (tzdata v2017b) - 23-Mar-2017

* Updated to tzdata version 2017b
  (<https://mm.icann.org/pipermail/tz-announce/2017-March/000046.html>).


## Version 0.3.52 (tzdata v2016h) - 28-Oct-2016

* Updated to tzdata version 2016h
  (<https://mm.icann.org/pipermail/tz-announce/2016-October/000042.html>).


## Version 0.3.51 (tzdata v2016f) - 5-Jul-2016

* Updated to tzdata version 2016f
  (<https://mm.icann.org/pipermail/tz-announce/2016-July/000040.html>).


## Version 0.3.50 (tzdata v2016e) - 14-Jun-2016

* Updated to tzdata version 2016e
  (<https://mm.icann.org/pipermail/tz-announce/2016-June/000039.html>).


## Version 0.3.49 (tzdata v2016d) - 18-Apr-2016

* Updated to tzdata version 2016d
  (<https://mm.icann.org/pipermail/tz-announce/2016-April/000038.html>).


## Version 0.3.48 (tzdata v2016c) - 23-Mar-2016

* Updated to tzdata version 2016c
  (<https://mm.icann.org/pipermail/tz-announce/2016-March/000037.html>).


## Version 0.3.47 (tzdata v2016b) - 15-Mar-2016

* Updated to tzdata version 2016b
  (<https://mm.icann.org/pipermail/tz-announce/2016-March/000036.html>).


## Version 0.3.46 (tzdata v2015g) - 2-Dec-2015

* From version 2015e, the IANA time zone database uses non-ASCII characters in
  country names. Backport the encoding handling from TZInfo::Data to allow
  TZInfo 0.3.x to support Ruby 1.9 (which would otherwise fail with an invalid
  byte sequence error when loading the countries index). Resolves #41.


## Version 0.3.45 (tzdata v2015g) - 3-Oct-2015

* Updated to tzdata version 2015g
  (<https://mm.icann.org/pipermail/tz-announce/2015-October/000034.html>).


## Version 0.3.44 (tzdata v2015d) - 24-Apr-2015

* Updated to tzdata version 2015d
  (<https://mm.icann.org/pipermail/tz-announce/2015-April/000031.html>).


## Version 0.3.43 (tzdata v2015a) - 31-Jan-2015

* Updated to tzdata version 2015a
  (<https://mm.icann.org/pipermail/tz-announce/2015-January/000028.html>).


## Version 0.3.42 (tzdata v2014i) - 23-Oct-2014

* Updated to tzdata version 2014i
  (<https://mm.icann.org/pipermail/tz-announce/2014-October/000026.html>).


## Version 0.3.41 (tzdata v2014f) - 8-Aug-2014

* Updated to tzdata version 2014f
  (<https://mm.icann.org/pipermail/tz-announce/2014-August/000023.html>).


## Version 0.3.40 (tzdata v2014e) - 10-Jul-2014

* Updated to tzdata version 2014e
  (<https://mm.icann.org/pipermail/tz-announce/2014-June/000022.html>).


## Version 0.3.39 (tzdata v2014a) - 9-Mar-2014

* Updated to tzdata version 2014a
  (<https://mm.icann.org/pipermail/tz-announce/2014-March/000018.html>).


## Version 0.3.38 (tzdata v2013g) - 8-Oct-2013

* Updated to tzdata version 2013g
  (<https://mm.icann.org/pipermail/tz-announce/2013-October/000015.html>).


## Version 0.3.37 (tzdata v2013b) - 11-Mar-2013

* Updated to tzdata version 2013b
  (<https://mm.icann.org/pipermail/tz-announce/2013-March/000010.html>).


## Version 0.3.36 (tzdata v2013a) - 3-Mar-2013

* Updated to tzdata version 2013a
  (<https://mm.icann.org/pipermail/tz-announce/2013-March/000009.html>).
* Fix `TimezoneTransitionInfo#eql?` incorrectly returning false when running on
  Ruby 2.0.
* Change `eql?` and `==` implementations to test the class of the passed in
  object instead of checking individual properties with `respond_to?`.


## Version 0.3.35 (tzdata v2012i) - 4-Nov-2012

* Updated to tzdata version 2012i
  (<https://mm.icann.org/pipermail/tz-announce/2012-November/000007.html>).


## Version 0.3.34 (tzdata v2012h) - 27-Oct-2012

* Updated to tzdata version 2012h
  (<https://mm.icann.org/pipermail/tz-announce/2012-October/000006.html>).


## Version 0.3.33 (tzdata v2012c) - 8-Apr-2012

* Updated to tzdata version 2012c
  (<https://mm.icann.org/pipermail/tz/2012-April/017627.html>).


## Version 0.3.32 (tzdata v2012b) - 4-Mar-2012

* Updated to tzdata version 2012b
  (<https://mm.icann.org/pipermail/tz/2012-March/017524.html>).


## Version 0.3.31 (tzdata v2011n) - 6-Nov-2011

* Updated to tzdata version 2011n
  (<https://mm.icann.org/pipermail/tz/2011-October/017201.html>).


## Version 0.3.30 (tzdata v2011k) - 29-Sep-2011

* Updated to tzdata version 2011k
  (<https://mm.icann.org/pipermail/tz/2011-September/008889.html>).


## Version 0.3.29 (tzdata v2011h) - 27-Jun-2011

* Updated to tzdata version 2011h
  (<https://mm.icann.org/pipermail/tz/2011-June/008576.html>).
* Allow the default value of the `local_to_utc` and `period_for_local` `dst`
  parameter to be specified globally with a `Timezone.default_dst` attribute.
  Thanks to Kurt Werle for the suggestion and patch.


## Version 0.3.28 (tzdata v2011g) - 13-Jun-2011

* Add support for Ruby 1.9.3 (trunk revision 31668 and later). Thanks to
  Aaron Patterson for reporting the problems running on the new version.
  Closes #29233.


## Version 0.3.27 (tzdata v2011g) - 26-Apr-2011

* Updated to tzdata version 2011g
  (<https://mm.icann.org/pipermail/tz/2011-April/016875.html>).


## Version 0.3.26 (tzdata v2011e) - 2-Apr-2011

* Updated to tzdata version 2011e
  (<https://mm.icann.org/pipermail/tz/2011-April/016809.html>).


## Version 0.3.25 (tzdata v2011d) - 14-Mar-2011

* Updated to tzdata version 2011d
  (<https://mm.icann.org/pipermail/tz/2011-March/016746.html>).


## Version 0.3.24 (tzdata v2010o) - 15-Jan-2011

* Updated to tzdata version 2010o
  (<https://mm.icann.org/pipermail/tz/2010-November/016517.html>).


## Version 0.3.23 (tzdata v2010l) - 19-Aug-2010

* Updated to tzdata version 2010l
  (<https://mm.icann.org/pipermail/tz/2010-August/016360.html>).


## Version 0.3.22 (tzdata v2010j) - 29-May-2010

* Corrected file permissions issue with 0.3.21 release.


## Version 0.3.21 (tzdata v2010j) - 28-May-2010

* Updated to tzdata version 2010j
  (<https://mm.icann.org/pipermail/tz/2010-May/016211.html>).
* Change invalid timezone check to exclude characters not used in timezone
  identifiers and avoid 'character class has duplicated range' warnings with
  Ruby 1.9.2.
* Ruby 1.9.2 has deprecated `require 'rational'`, but older versions of
  Ruby need rational to be required. Require rational only when the Rational
  module has not already been loaded.
* Remove circular requires (now a warning in Ruby 1.9.2). Instead of using
  requires in each file for dependencies, `tzinfo.rb` now requires all tzinfo
  files. If you were previously requiring files within the tzinfo directory
  (e.g. `require 'tzinfo/timezone'`), then you will now have to
  `require 'tzinfo'` instead.


## Version 0.3.20 (tzdata v2010i) - 19-Apr-2010

* Updated to tzdata version 2010i
  (<https://mm.icann.org/pipermail/tz/2010-April/016184.html>).


## Version 0.3.19 (tzdata v2010h) - 5-Apr-2010

* Updated to tzdata version 2010h
  (<https://mm.icann.org/pipermail/tz/2010-April/016161.html>).


## Version 0.3.18 (tzdata v2010g) - 29-Mar-2010

* Updated to tzdata version 2010g
  (<https://mm.icann.org/pipermail/tz/2010-March/016140.html>).


## Version 0.3.17 (tzdata v2010e) - 8-Mar-2010

* Updated to tzdata version 2010e
  (<https://mm.icann.org/pipermail/tz/2010-March/016088.html>).


## Version 0.3.16 (tzdata v2009u) - 5-Jan-2010

* Support the use of '-' to denote '0' as an offset in the tz data files.
  Used for the first time in the SAVE field in tzdata v2009u.
* Updated to tzdata version 2009u
  (<https://mm.icann.org/pipermail/tz/2009-December/016001.html>).


## Version 0.3.15 (tzdata v2009p) - 26-Oct-2009

* Updated to tzdata version 2009p
  (<https://mm.icann.org/pipermail/tz/2009-October/015889.html>).
* Added a description to the gem spec.
* List test files in test_files instead of files in the gem spec.


## Version 0.3.14 (tzdata v2009l) - 19-Aug-2009

* Updated to tzdata version 2009l
  (<https://mm.icann.org/pipermail/tz/2009-August/015729.html>).
* Include current directory in load path to allow running tests on
  Ruby 1.9.2, which doesn't include it by default any more.


## Version 0.3.13 (tzdata v2009f) - 15-Apr-2009

* Updated to tzdata version 2009f
  (<https://mm.icann.org/pipermail/tz/2009-April/015544.html>).
* Untaint the timezone module filename after validation to allow use
  with `$SAFE == 1` (e.g. under mod_ruby). Thanks to Dmitry Borodaenko for
  the suggestion. Closes #25349.


## Version 0.3.12 (tzdata v2008i) - 12-Nov-2008

* Updated to tzdata version 2008i
  (<https://mm.icann.org/pipermail/tz/2008-October/015260.html>).


## Version 0.3.11 (tzdata v2008g) - 7-Oct-2008

* Updated to tzdata version 2008g
  (<https://mm.icann.org/pipermail/tz/2008-October/015139.html>).
* Support Ruby 1.9.0-5. `Rational.new!` has now been removed in Ruby 1.9.
  Only use `Rational.new!` if it is available (it is preferable in Ruby 1.8
  for performance reasons). Thanks to Jeremy Kemper and Pratik Naik for
  reporting this. Closes #22312.
* Apply a patch from Pratik Naik to replace assert calls that have been
  deprecated in the Ruby svn trunk. Closes #22308.


## Version 0.3.10 (tzdata v2008f) - 16-Sep-2008

* Updated to tzdata version 2008f
  (<https://mm.icann.org/pipermail/tz/2008-September/015090.html>).


## Version 0.3.9 (tzdata v2008c) - 27-May-2008

* Updated to tzdata version 2008c
  (<https://mm.icann.org/pipermail/tz/2008-May/014956.html>).
* Support loading timezone data in the latest trunk versions of Ruby 1.9.
  `Rational.new!` is now private, so call it using `Rational.send :new!`
  instead. Thanks to Jeremy Kemper and Pratik Naik for spotting this. Closes
  #19184.
* Prevent warnings from being output when running Ruby with the -v or -w
  command line options. Thanks to Paul McMahon for the patch. Closes #19719.


## Version 0.3.8 (tzdata v2008b) - 24-Mar-2008

* Updated to tzdata version 2008b
  (<https://mm.icann.org/pipermail/tz/2008-March/014910.html>).
* Support loading timezone data in Ruby 1.9.0. Use `DateTime.new!` if it is
  available instead of `DateTime.new0` when constructing transition times.
  `DateTime.new!` was added in Ruby 1.8.6. `DateTime.new0` was removed in
  Ruby 1.9.0. Thanks to Joshua Peek for reporting this. Closes #17606.
* Modify some of the equality test cases to cope with the differences
  between Ruby 1.8.6 and Ruby 1.9.0.


## Version 0.3.7 (tzdata v2008a) - 10-Mar-2008

* Updated to tzdata version 2008a
  (<https://mm.icann.org/pipermail/tz/2008-March/014851.html>).


## Version 0.3.6 (tzdata v2007k) - 1-Jan-2008

* Updated to tzdata version 2007k
  (<https://mm.icann.org/pipermail/tz/2007-December/014765.html>).
* Removed deprecated RubyGems autorequire option.


## Version 0.3.5 (tzdata v2007h) - 1-Oct-2007

* Updated to tzdata version 2007h
  (<https://mm.icann.org/pipermail/tz/2007-October/014585.html>).


## Version 0.3.4 (tzdata v2007g) - 21-Aug-2007

* Updated to tzdata version 2007g
  (<https://mm.icann.org/pipermail/tz/2007-August/014499.html>).


## Version 0.3.3 (tzdata v2006p) - 27-Nov-2006

* Updated to tzdata version 2006p
  (<https://mm.icann.org/pipermail/tz/2006-November/013999.html>).


## Version 0.3.2 (tzdata v2006n) - 11-Oct-2006

* Updated to tzdata version 2006n
  (<https://mm.icann.org/pipermail/tz/2006-October/013911.html>). Note that this
  release of tzdata removes the country Serbia and Montenegro (CS) and replaces
  it with separate Serbia (RS) and Montenegro (ME) entries.


## Version 0.3.1 (tzdata v2006j) - 21-Aug-2006

* Remove colon from case statements to avoid warning in Ruby 1.8.5. #5198.
* Use temporary variable to avoid dynamic string warning from rdoc.
* Updated to tzdata version 2006j
  (<https://mm.icann.org/pipermail/tz/2006-August/013767.html>).


## Version 0.3.0 (tzdata v2006g) - 17-Jul-2006

* New timezone data format. Timezone data now occupies less space on disk and
  takes less memory once loaded. #4142, #4144.
* Timezone data is defined in modules rather than classes. `Timezone` instances
  returned by `Timezone.get` are no longer instances of data classes, but are
  instead instances of new `DataTimezone` and `LinkedTimezone` classes.
* `Timezone` instances can now be used with `Marshal.dump` and `Marshal.load`.
  #4240.
* Added a `Timezone.get_proxy` method that returns a `TimezoneProxy` object for
  a given identifier.
* Country index data is now defined in a single module that is independent
  of the `Country` class implementation.
* `Country` instances can now be used with `Marshal.dump` and `Marshal.load`.
  #4240.
* `Country` has a new `zone_info` method that returns `CountryTimezone` objects
  containing additional information (latitude, longitude and a description)
  relating to each `Timezone`. #4140.
* Time zones within a `Country` are now returned in an order that makes
  geographic sense.
* The zdumptest utility now checks local to utc conversions in addition to
  utc to local conversions.
* `eql?` method defined on `Country` and `Timezone` that is equivalent to `==`.
* The `==` method of `Timezone` no longer raises an exception when passed an
  object with no identifier method.
* The `==` method of `Country` no longer raises an exception when passed an
  object with no code method.
* `hash` method defined on `Country` that returns the hash of the code.
* `hash` method defined on `Timezone` that returns the hash of the identifier.
* Miscellaneous API documentation corrections and improvements.
* Timezone definition and indexes are now excluded from rdoc (the contents were
  previously ignored with `#:nodoc:` anyway).
* Removed no longer needed `#:nodoc:` directives from timezone data files (which
  are now excluded from the rdoc build).
* Installation of the gem now causes rdoc API documentation to be generated.
  #4905.
* When optimizing transitions to generate zone definitions, check the
  UTC and standard offsets separately rather than just the total offset to UTC.
  Fixes an incorrect abbreviation issue with Europe/London, Europe/Dublin and
  Pacific/Auckland.
* Eliminated unnecessary `.nil?` calls to give a minor performance gain.
* `Timezone.all` and `Timezone.all_identifiers` now return all the
  `Timezone` instances/identifiers rather than just those associated with
  countries. #4146.
* Added `all_data_zones`, `all_data_zone_identifiers`, `all_linked_zones` and
  `all_linked_zone_identifiers` class methods to `Timezone`.
* Added a `strftime` method to `Timezone` that converts a time in UTC to local
  time and then returns it formatted. `%Z` is replaced with the timezone
  abbreviation for the given time (for example, EST or EDT). #4143.
* Fix escaping of quotes in `TZDataParser`. This affected country names and
  descriptions of time zones within countries.


## Version 0.2.2 (tzdata v2006g) - 17-May-2006

* Use class-scoped instance variables to store the Timezone identifier and
  singleton instance. Loading a linked zone no longer causes the parent
  zone's identifier to be changed. The instance method of a linked zone class
  also now returns an instance of the linked zone class rather than the parent
  class. #4502.
* The zdumptest utility now compares the TZInfo zone identifier with the zdump
  zone identifier.
* The zdumptestall utility now exits if not supplied with enough parameters.
* Updated to tzdata version 2006g
  (<https://mm.icann.org/pipermail/tz/2006-May/013590.html>).


## Version 0.2.1 (tzdata v2006d) - 17-Apr-2006

* Fix a performance issue caused in 0.2.0 with `Timezone.local_to_utc`.
  Conversions performed on `TimeOrDateTime` instances passed to `<=>` are now
  cached as originally intended. Thanks to Michael Smedberg for spotting this.
* Fix a performance issue with the `local_to_utc` period search algorithm
  originally implemented in 0.1.0. The condition that was supposed to cause
  the search to terminate when enough periods had been found was only being
  evaluated in a small subset of cases. Thanks to Michael Smedberg and
  Jamis Buck for reporting this.
* Added abbreviation as an alias for `TimezonePeriod.zone_identifier`.
* Updated to tzdata version 2006d
  (<https://mm.icann.org/pipermail/tz/2006-April/013517.html>).
* Ignore any offset in `DateTime` instances passed in (as is already done for
  `Time` instances). All of the following now refer to the same UTC time (15:40 on 17 April 2006). Previously, the `DateTime` in the second line would have been interpreted as 20:40.

    ```ruby
    tz.utc_to_local(DateTime.new(2006, 4, 17, 15, 40, 0))
    tz.utc_to_local(DateTime.new(2006, 4, 17, 15, 40, 0).new_offset(Rational(5, 24)))
    tz.utc_to_local(Time.utc(2006, 4, 17, 15, 40, 0))
    tz.utc_to_local(Time.local(2006, 4, 17, 15, 40, 0))
    ```


## Version 0.2.0 (tzdata v2006c) - 3-Apr-2006

* Use timestamps rather than `DateTime` objects in zone files for times between
  1970 and 2037 (the range of `Time`).
* Don't convert passed in `Time` objects to `DateTime` in most cases (provides
  a substantial performance improvement).
* Allow integer timestamps (time in seconds since 1970-1-1) to be used as well
  as `Time` and `DateTime` objects in all public methods that take times as
  parameters.
* Tool to compare TZInfo conversions with output from zdump.
* `TZDataParser` zone generation algorithm rewritten. Now based on the zic code.
  TZInfo is now 100% compatible with zic/zdump output.
* Riyadh Solar Time zones now included again (generation time has been reduced
  with `TZDataParser` changes).
* Use binary mode when writing zone and country files to get Unix (\n) new
  lines.
* Omit unnecessary quotes in zone identifier symbols.
* Omit the final transition to DST if there is a prior transition in the last
  year processed to standard time.
* Updated to tzdata version 2006c
  (<https://mm.icann.org/pipermail/tz/2006-April/013500.html>).


## Version 0.1.2 (tzdata v2006a) - 5-Feb-2006

* Add lib directory to the load path when tzinfo is required. Makes it easier
  to use tzinfo gem when unpacked to vendor directory in rails.
* Updated to tzdata version 2006a
  (<https://mm.icann.org/pipermail/tz/2006-January/013311.html>).
* `build_tz_classes` rake task now handles running svn add and svn delete as new
  time zones and countries are added and old ones are removed.
* Return a better error when attempting to use a `Timezone` instance that was
  constructed with `Timezone.new(nil)`. This will occur when using Rails'
  `composed_of`. When the timezone identifier in the database is null,
  attempting to use the `Timezone` will now result in an `UnknownTimezone`
  exception rather than a `NameError`.


## Version 0.1.1 (tzdata v2005q) - 18-Dec-2005

* Time zones that are defined by a single unbounded period (e.g. UTC) now
  work again.
* Updated to tzdata version 2005q.


## Version 0.1.0 (tzdata v2005n) - 27-Nov-2005

* `period_for_local` and `local_to_utc` now allow resolution of ambiguous
  times (e.g. when switching from daylight savings to standard time).
  The behaviour of these methods when faced with an ambiguous local time
  has now changed. If you are using these methods you should check
  the documentation. Thanks to Cliff Matthews for suggesting this change.
* Added `require 'date'` to `timezone.rb` (date isn't loaded by default in all
  environments).
* Use rake to build packages and documentation.
* License file is now included in gem distribution.
* Dates in definitions stored as Astronomical Julian Day numbers rather than
  as civil dates (improves performance creating `DateTime` instances).
* Added options to `TZDataParser` to allow generation of specific zones and
  countries.
* Moved `TimezonePeriod` class to `timezone_period.rb`.
* New `TimezonePeriodList` class to store `TimezonePeriod` instances for a
  timezone and perform searches for periods.
* Time zones are now defined using blocks. `TimezonePeriod` instances are only
  created when they are needed. Thanks to Jamis Buck for the suggestion.
* Add options to `TZDataParser` to allow exclusion of specific zones and
  countries.
* Exclude the Riyadh Solar Time zones. The rules are only for 1987 to 1989 and
  take a long time to generate and process. Riyadh Solar Time is no longer
  observed.
* The last `TimezonePeriod` for each `Timezone` is now written out with an
  unbounded rather than arbitrary end time.
* Construct the `Rational` offset in `TimezonePeriod` once when the
  `TimezonePeriod` is constructed rather than each time it is needed.
* `Timezone` and `Country` now keep a cache of loaded instances to avoid running
  `require` which can be slow on some platforms.
* Updated to tzdata version 2005n.


## Version 0.0.4 (tzdata v2005m) - 18-Sep-2005

* Removed debug output accidentally included in the previous release.
* Fixed a bug in the generation of friendly zone identifiers (was inserting
  apostrophes into UTC, GMT, etc).
* Fixed `Country` `<=>` operator (was comparing non-existent attribute)
* Fixed `Timezone.period_for_local` error when period not found.
* Added test cases for `Timezone`, `TimezoneProxy`, `TimezonePeriod`, `Country`
  and some selected time zones.


## Version 0.0.3 (tzdata v2005m) - 17-Sep-2005

* Reduced visibility of some methods added in `Timezone#setup` and
  `Country#setup`.
* Added `name` method to `Timezone` (returns the identifier).
* Added `friendly_identifier` method to `Timezone`. Returns a more friendly
  version of the identifier.
* Added `to_s` method to `Timezone`. Returns the friendly identifier.
* Added `==` and `<=>` operators to `Timezone` (compares identifiers).
* `Timezone` now includes `Comparable`.
* Added `to_s` method to `Country`.
* Added `==` and `<=>` operators to `Country` (compares ISO 3166 country codes).
* `Country` now includes `Comparable`.
* New `TimezoneProxy` class that behaves the same as a `Timezone` but doesn't
  actually load in its definition until it is actually required.
* Modified `Timezone` and `Country` methods that return `Timezone` instances to
  return `TimezoneProxy` instances instead. This makes these methods much
  quicker.

In Ruby on Rails, you can now show a drop-down list of all time zones using the
Rails `time_zone_select` helper method:

```ruby
<%= time_zone_select 'user', 'time_zone', TZInfo::Timezone.all.sort, :model => TZInfo::Timezone %>
```


## Version 0.0.2 (tzdata v2005m) - 13-Sep-2005

* `Country` and `Timezone` data is now loaded into class rather than instance
  variables. This makes `Timezone` links more efficient and saves memory if
  creating specific `Timezone` and `Country` classes directly.
* `TimezonePeriod` `zone_identifier` is now defined as a symbol to save memory
  (was previously a string).
* `TimezonePeriod` `zone_identifier`s that were previously `''` are now
  `:Unknown`.
* `Timezone` and `Country` instances can now be returned using
  `Timezone.new(identifier)` and `Country.new(identifier)`. When passed an
  identifier, the `new` method calls `get` to return an instance of the
  specified timezone or country.
* Added new class methods to `Timezone` to return sets of zones and identifiers.

Thanks to Scott Barron of Lunchbox Software for the suggestions in his
article about using TZInfo with Rails
(<https://web.archive.org/web/20060425190845/http://lunchroom.lunchboxsoftware.com/pages/tzinfo_rails>)


## Version 0.0.1 (tzdata v2005m) - 29-Aug-2005

* First release.
