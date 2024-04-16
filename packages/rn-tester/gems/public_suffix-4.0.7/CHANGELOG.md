# Changelog

This project uses [Semantic Versioning 2.0.0](https://semver.org/).


## 4.0.7

### Fixes

- Fixed YARD rake task (GH-179)

### Changed

- Updated definitions.


## 4.0.6

### Changed

- Updated definitions.


## 4.0.5

### Changed

- Updated definitions.


## 4.0.4

### Changed

- Updated definitions.


## 4.0.3

### Fixed

- Fixed 2.7 deprecations and warnings (GH-167). [Thanks @BrianHawley]


## 4.0.2

### Changed

- Updated definitions.


## 4.0.1

### Changed

- Updated definitions.


## 4.0.0

### Changed

- Minimum Ruby version is 2.3


## Release 3.1.1

- CHANGED: Updated definitions.
- CHANGED: Rolled back support for Ruby 2.3 (GH-161, GH-162)

IMPORTANT: 3.x is the latest version compatible with Ruby 2.1 and Ruby 2.2.


## Release 3.1.0

- CHANGED: Updated definitions.
- CHANGED: Minimum Ruby version is 2.3
- CHANGED: Upgraded to Bundler 2.x


## Release 3.0.3

- CHANGED: Updated definitions.


## Release 3.0.2

- CHANGED: Updated definitions.


## Release 3.0.1

- CHANGED: Updated definitions.
- CHANGED: Improve performance and avoid allocation (GH-146). [Thanks @robholland]


## Release 3.0.0

This new version includes a major redesign of the library internals, with the goal to drastically
improve the lookup time while reducing storage space.

For this reason, several public methods that are no longer applicable have been deprecated
and/or removed. You can find more information at GH-133.

- CHANGED: Updated definitions.
- CHANGED: Dropped support for Ruby < 2.1
- CHANGED: `PublicSuffix::List#rules` is now protected. You should not rely on it as the internal rule representation is subject to change to optimize performances.
- CHANGED: Removed `PublicSuffix::List.clear`, it was an unnecessary accessor method. Use `PublicSuffix::List.default = nil` if you **really** need to reset the default list. You shouldn't.
- CHANGED: `PublicSuffix::List#select` is now private. You should not use it, instead use `PublicSuffix::List#find`.
- CHANGED: `PublicSuffix::List` no longer implements Enumerable. Instead, use `#each` to loop over, or get an Enumerator.
- CHANGED: Redesigned internal list storage and lookup algorithm to achieve O(1) lookup time (see GH-133).


## Release 2.0.5

- CHANGED: Updated definitions.
- CHANGED: Initialization performance improvements (GH-128). [Thanks @casperisfine]


## Release 2.0.4

- FIXED: Fix a bug that caused the GEM to be published with the wrong version number in the gemspec (GH-121).

- CHANGED: Updated definitions.


## Release 2.0.3

- CHANGED: Updated definitions.


## Release 2.0.2

- CHANGED: Updated definitions.


## Release 2.0.1

- FIXED: Fix bug that prevented .valid? to reset the default rule


## Release 2.0.0

- NEW: Added PublicSuffix.domain # => sld.tld
- NEW: Added the ability to disable the use of private domains either at runtime, in addition to the ability to not load the private domains section when reading the list (`private_domains: false`). This feature also superseded the `private_domains` class-level attribute, that is no longer available.

- CHANGED: Considerable performance improvements (GH-92)
- CHANGED: Updated definitions.
- CHANGED: Removed deprecated PublicSuffix::InvalidDomain exception
- CHANGED: If the suffix is now listed, then the prevaling rule is "*" as defined by the PSL algorithm (GH-91)
- CHANGED: Input validation is performed only if you call `PublicSuffix.parse` or `PublicSuffix.list`
- CHANGED: Input with leading dot is invalid per PSL acceptance tests
- CHANGED: Removed `private_domains` class-level attribute. It is replaced by the `private_domains: false` option in the list parse method.
- CHANGED: The default list now assumes you use UTF-8 for reading the input (GH-94),

- REMOVED: Removed futile utility helpers such as `Domain#rule`, `Domain#is_a_domain?`, `Domain#is_a_subdomain?`, `Domain#valid?`. You can easily obtain the same result by having a custom method that reconstructs the logic, and/or calling `PublicSuffix.{domain|parse}(domain.to_s)`.


## Release 1.5.3

- FIXED: Don't duplicate rule indices when creating index (GH-77). [Thanks @ags]

- CHANGED: Updated definitions.


## Release 1.5.2

- CHANGED: Updated definitions.


## Release 1.5.1

- FIXED: Ignore case for parsing and validating (GH-62)

- CHANGED: Updated definitions.


## Release 1.5.0

- CHANGED: Dropped support for Ruby < 2.0

- CHANGED: Updated definitions.


## Release 1.4.6

- CHANGED: Updated definitions.


## Release 1.4.5

- CHANGED: Updated definitions.


## Release 1.4.4

- CHANGED: Updated definitions.


## Release 1.4.3

- CHANGED: Updated definitions.


## Release 1.4.2

- CHANGED: Updated definitions.


## Release 1.4.1

- CHANGED: Updated definitions.


## Release 1.4.0

- CHANGED: Moved the definitions in the lib folder.

- CHANGED: Updated definitions.


## Release 1.3.3

- CHANGED: Updated definitions.


## Release 1.3.2

- CHANGED: Updated definitions.


## Release 1.3.1

- CHANGED: Updated definitions.


## Release 1.3.0

- NEW: Ability to skip Private Domains (GH-28). [Thanks @rb2k]

- CHANGED: Updated definitions.


## Release 1.2.1

- CHANGED: Updated definitions.


## Release 1.2.0

- NEW: Allow a custom List on `PublicSuffix.parse` (GH-26). [Thanks @itspriddle]

- FIXED: PublicSuffix.parse and PublicSuffix.valid? crashes when input is nil (GH-20).

- CHANGED: Updated definitions.


## Release 1.1.3

- CHANGED: Updated definitions.


## Release 1.1.2

- CHANGED: Updated definitions.


## Release 1.1.1

- CHANGED: Updated definitions.


## Release 1.1.0

- FIXED: #valid? and #parse consider URIs as valid domains (GH-15)

- CHANGED: Updated definitions.

- CHANGED: Removed deprecatd PublicSuffixService::RuleList.


## Release 1.0.0

- CHANGED: Updated definitions.


## Release 1.0.0.rc1

The library is now known as PublicSuffix.


## Release 0.9.1

- CHANGED: Renamed PublicSuffixService::RuleList to PublicSuffixService::List.

- CHANGED: Renamed PublicSuffixService::List#list to PublicSuffixService::List#rules.

- CHANGED: Renamed PublicSuffixService to PublicSuffix.

- CHANGED: Updated definitions.


## Release 0.9.0

- CHANGED: Minimum Ruby version increased to Ruby 1.8.7.

- CHANGED: rake/gempackagetask is deprecated.  Use rubygems/package_task instead.


## Release 0.8.4

- FIXED: Reverted bugfix for issue #12 for Ruby 1.8.6.
  This is the latest version compatible with Ruby 1.8.6.


## Release 0.8.3

- FIXED: Fixed ArgumentError: invalid byte sequence in US-ASCII with Ruby 1.9.2 (#12).

- CHANGED: Updated definitions (#11).

- CHANGED: Renamed definitions.txt to definitions.dat.


## Release 0.8.2

- NEW: Added support for rubygems-test.

- CHANGED: Integrated Bundler.

- CHANGED: Updated definitions.


## Release 0.8.1

- FIXED: The files in the release 0.8.0 have wrong permission 600 and can't be loaded (#10).


## Release 0.8.0

- CHANGED: Update public suffix list to d1a5599b49fa 2010-10-25 15:10 +0100 (#9)

- NEW: Add support for Fully Qualified Domain Names (#7)


## Release 0.7.0

- CHANGED: Using YARD to document the code instead of RDoc.

- FIXED: RuleList cache is not recreated when a new rule is appended to the list (#6)

- FIXED: PublicSuffixService.valid? should return false if the domain is not defined or not allowed (#4, #5)


## Release 0.6.0

- NEW:  PublicSuffixService.parse raises DomainNotAllowed when trying to parse a domain name
  which exists, but is not allowed by the current definition list (#3)

        PublicSuffixService.parse("nic.do")
        # => PublicSuffixService::DomainNotAllowed

- CHANGED: Renamed PublicSuffixService::InvalidDomain to PublicSuffixService::DomainInvalid


## Release 0.5.2

- CHANGED: Update public suffix list to 248ea690d671 2010-09-16 18:02 +0100


## Release 0.5.1

- CHANGED: Update public suffix list to 14dc66dd53c1 2010-09-15 17:09 +0100


## Release 0.5.0

- CHANGED: Improve documentation for Domain#domain and Domain#subdomain (#1).

- CHANGED: Performance improvements (#2).


## Release 0.4.0

- CHANGED: Rename library from DomainName to PublicSuffixService to reduce the probability of name conflicts.


## Release 0.3.1

- Deprecated DomainName library.


## Release 0.3.0

- CHANGED: DomainName#domain and DomainName#subdomain are no longer alias of Domain#sld and Domain#tld.

- CHANGED: Removed DomainName#labels and decoupled Rule from DomainName.

- CHANGED: DomainName#valid? no longer instantiates new DomainName objects. This means less overhead.

- CHANGED: Refactoring the entire DomainName API. Removed the internal on-the-fly parsing. Added a bunch of new methods to check and validate the DomainName.


## Release 0.2.0

- NEW: DomainName#valid?

- NEW: DomainName#parse and DomainName#parse!

- NEW: DomainName#valid_domain? and DomainName#valid_subdomain?

- CHANGED: Make sure RuleList lookup is only performed once.


## Release 0.1.0

- Initial version
