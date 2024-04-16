# Addressable 2.8.6 <a name="v2.8.6">
- Memoize regexps for common character classes ([#524])

[#524]: https://github.com/sporkmonger/addressable/pull/524

# Addressable 2.8.5 <a name="v2.8.5">
- Fix thread safety issue with encoding tables ([#515])
- Define URI::NONE as a module to avoid serialization issues ([#509])
- Fix YAML serialization ([#508])

[#508]: https://github.com/sporkmonger/addressable/pull/508
[#509]: https://github.com/sporkmonger/addressable/pull/509
[#515]: https://github.com/sporkmonger/addressable/pull/515

# Addressable 2.8.4 <a name="v2.8.4">
- Restore `Addressable::IDNA.unicode_normalize_kc` as a deprecated method ([#504])

[#504]: https://github.com/sporkmonger/addressable/pull/504

# Addressable 2.8.3 <a name="v2.8.3">
- Fix template expand level 2 hash support for non-string objects ([#499], [#498])

[#499]: https://github.com/sporkmonger/addressable/pull/499
[#498]: https://github.com/sporkmonger/addressable/pull/498

# Addressable 2.8.2 <a name="v2.8.2">
- Improve cache hits and JIT friendliness ([#486](https://github.com/sporkmonger/addressable/pull/486))
- Improve code style and test coverage ([#482](https://github.com/sporkmonger/addressable/pull/482))
- Ensure reset of deferred validation ([#481](https://github.com/sporkmonger/addressable/pull/481))
- Resolve normalization differences between `IDNA::Native` and `IDNA::Pure` ([#408](https://github.com/sporkmonger/addressable/issues/408), [#492])
- Remove redundant colon in `Addressable::URI::CharacterClasses::AUTHORITY` regex ([#438](https://github.com/sporkmonger/addressable/pull/438)) (accidentally reverted by [#449] merge but [added back](https://github.com/sporkmonger/addressable/pull/492#discussion_r1105125280) in [#492])

[#492]: https://github.com/sporkmonger/addressable/pull/492

# Addressable 2.8.1 <a name="v2.8.1">
- refactor `Addressable::URI.normalize_path` to address linter offenses ([#430](https://github.com/sporkmonger/addressable/pull/430))
- update gemspec to reflect supported Ruby versions ([#466], [#464], [#463])
- compatibility w/ public_suffix 5.x ([#466], [#465], [#460])
- fixes "invalid byte sequence in UTF-8" exception when unencoding URLs containing non UTF-8 characters ([#459](https://github.com/sporkmonger/addressable/pull/459))
- `Ractor` compatibility ([#449])
- use the whole string instead of a single line for template match ([#431](https://github.com/sporkmonger/addressable/pull/431))
- force UTF-8 encoding only if needed ([#341](https://github.com/sporkmonger/addressable/pull/341))

[#449]: https://github.com/sporkmonger/addressable/pull/449
[#460]: https://github.com/sporkmonger/addressable/pull/460
[#463]: https://github.com/sporkmonger/addressable/pull/463
[#464]: https://github.com/sporkmonger/addressable/pull/464
[#465]: https://github.com/sporkmonger/addressable/pull/465
[#466]: https://github.com/sporkmonger/addressable/pull/466

# Addressable 2.8.0 <a name="v2.8.0">
- fixes ReDoS vulnerability in Addressable::Template#match
- no longer replaces `+` with spaces in queries for non-http(s) schemes
- fixed encoding ipv6 literals
- the `:compacted` flag for `normalized_query` now dedupes parameters
- fix broken `escape_component` alias
- dropping support for Ruby 2.0 and 2.1
- adding Ruby 3.0 compatibility for development tasks
- drop support for `rack-mount` and remove Addressable::Template#generate
- performance improvements
- switch CI/CD to GitHub Actions

# Addressable 2.7.0 <a name="v2.7.0">
- added `:compacted` flag to `normalized_query`
- `heuristic_parse` handles `mailto:` more intuitively
- dropped explicit support for JRuby 9.0.5.0
- compatibility w/ public_suffix 4.x
- performance improvements

# Addressable 2.6.0 <a name="v2.6.0">
- added `tld=` method to allow assignment to the public suffix
- most `heuristic_parse` patterns are now case-insensitive
- `heuristic_parse` handles more `file://` URI variations
- fixes bug in `heuristic_parse` when uri starts with digit
- fixes bug in `request_uri=` with query strings
- fixes template issues with `nil` and `?` operator
- `frozen_string_literal` pragmas added
- minor performance improvements in regexps
- fixes to eliminate warnings

# Addressable 2.5.2 <a name="v2.5.2">
- better support for frozen string literals
- fixed bug w/ uppercase characters in scheme
- IDNA errors w/ emoji URLs
- compatibility w/ public_suffix 3.x

# Addressable 2.5.1 <a name="v2.5.1">
- allow unicode normalization to be disabled for URI Template expansion
- removed duplicate test

# Addressable 2.5.0 <a name="v2.5.0">
- dropping support for Ruby 1.9
- adding support for Ruby 2.4 preview
- add support for public suffixes and tld; first runtime dependency
- hostname escaping should match RFC; underscores in hostnames no longer escaped
- paths beginning with // and missing an authority are now considered invalid
- validation now also takes place after setting a path
- handle backslashes in authority more like a browser for `heuristic_parse`
- unescaped backslashes in host now raise an `InvalidURIError`
- `merge!`, `join!`, `omit!` and `normalize!` don't disable deferred validation
- `heuristic_parse` now trims whitespace before parsing
- host parts longer than 63 bytes will be ignored and not passed to libidn
- normalized values always encoded as UTF-8

# Addressable 2.4.0 <a name="v2.4.0">
- support for 1.8.x dropped
- double quotes in a host now raises an error
- newlines in host will no longer get unescaped during normalization
- stricter handling of bogus scheme values
- stricter handling of encoded port values
- calling `require 'addressable'` will now load both the URI and Template files
- assigning to the `hostname` component with an `IPAddr` object is now supported
- assigning to the `origin` component is now supported
- fixed minor bug where an exception would be thrown for a missing ACE suffix
- better partial expansion of URI templates

# Addressable 2.3.8 <a name="v2.3.8">
- fix warnings
- update dependency gems
- support for 1.8.x officially deprecated

# Addressable 2.3.7 <a name="v2.3.7">
- fix scenario in which invalid URIs don't get an exception until inspected
- handle hostnames with two adjacent periods correctly
- upgrade of RSpec

# Addressable 2.3.6 <a name="v2.3.6">
- normalization drops empty query string
- better handling in template extract for missing values
- template modifier for `'?'` now treated as optional
- fixed issue where character class parameters were modified
- templates can now be tested for equality
- added `:sorted` option to normalization of query strings
- fixed issue with normalization of hosts given in `'example.com.'` form

# Addressable 2.3.5 <a name="v2.3.5">
- added Addressable::URI#empty? method
- Addressable::URI#hostname methods now strip square brackets from IPv6 hosts
- compatibility with Net::HTTP in Ruby 2.0.0
- Addressable::URI#route_from should always give relative URIs

# Addressable 2.3.4 <a name="v2.3.4">
- fixed issue with encoding altering its inputs
- query string normalization now leaves ';' characters alone
- FakeFS is detected before attempting to load unicode tables
- additional testing to ensure frozen objects don't cause problems

# Addressable 2.3.3 <a name="v2.3.3">
- fixed issue with converting common primitives during template expansion
- fixed port encoding issue
- removed a few warnings
- normalize should now ignore %2B in query strings
- the IDNA logic should now be handled by libidn in Ruby 1.9
- no template match should now result in nil instead of an empty MatchData
- added license information to gemspec

# Addressable 2.3.2 <a name="v2.3.2">
- added Addressable::URI#default_port method
- fixed issue with Marshalling Unicode data on Windows
- improved heuristic parsing to better handle IPv4 addresses

# Addressable 2.3.1 <a name="v2.3.1">
- fixed missing unicode data file

# Addressable 2.3.0 <a name="v2.3.0">
- updated Addressable::Template to use RFC 6570, level 4
- fixed compatibility problems with some versions of Ruby
- moved unicode tables into a data file for performance reasons
- removing support for multiple query value notations

# Addressable 2.2.8 <a name="v2.2.8">
- fixed issues with dot segment removal code
- form encoding can now handle multiple values per key
- updated development environment

# Addressable 2.2.7 <a name="v2.2.7">
- fixed issues related to Addressable::URI#query_values=
- the Addressable::URI.parse method is now polymorphic

# Addressable 2.2.6 <a name="v2.2.6">
- changed the way ambiguous paths are handled
- fixed bug with frozen URIs
- https supported in heuristic parsing

# Addressable 2.2.5 <a name="v2.2.5">
- 'parsing' a pre-parsed URI object is now a dup operation
- introduced conditional support for libidn
- fixed normalization issue on ampersands in query strings
- added additional tests around handling of query strings

# Addressable 2.2.4 <a name="v2.2.4">
- added origin support from draft-ietf-websec-origin-00
- resolved issue with attempting to navigate below root
- fixed bug with string splitting in query strings

# Addressable 2.2.3 <a name="v2.2.3">
- added :flat_array notation for query strings

# Addressable 2.2.2 <a name="v2.2.2">
- fixed issue with percent escaping of '+' character in query strings

# Addressable 2.2.1 <a name="v2.2.1">
- added support for application/x-www-form-urlencoded.

# Addressable 2.2.0 <a name="v2.2.0">
- added site methods
- improved documentation

# Addressable 2.1.2 <a name="v2.1.2">
- added HTTP request URI methods
- better handling of Windows file paths
- validation_deferred boolean replaced with defer_validation block
- normalization of percent-encoded paths should now be correct
- fixed issue with constructing URIs with relative paths
- fixed warnings

# Addressable 2.1.1 <a name="v2.1.1">
- more type checking changes
- fixed issue with unicode normalization
- added method to find template defaults
- symbolic keys are now allowed in template mappings
- numeric values and symbolic values are now allowed in template mappings

# Addressable 2.1.0 <a name="v2.1.0">
- refactored URI template support out into its own class
- removed extract method due to being useless and unreliable
- removed Addressable::URI.expand_template
- removed Addressable::URI#extract_mapping
- added partial template expansion
- fixed minor bugs in the parse and heuristic_parse methods
- fixed incompatibility with Ruby 1.9.1
- fixed bottleneck in Addressable::URI#hash and Addressable::URI#to_s
- fixed unicode normalization exception
- updated query_values methods to better handle subscript notation
- worked around issue with freezing URIs
- improved specs

# Addressable 2.0.2 <a name="v2.0.2">
- fixed issue with URI template expansion
- fixed issue with percent escaping characters 0-15

# Addressable 2.0.1 <a name="v2.0.1">
- fixed issue with query string assignment
- fixed issue with improperly encoded components

# Addressable 2.0.0 <a name="v2.0.0">
- the initialize method now takes an options hash as its only parameter
- added query_values method to URI class
- completely replaced IDNA implementation with pure Ruby
- renamed Addressable::ADDRESSABLE_VERSION to Addressable::VERSION
- completely reworked the Rakefile
- changed the behavior of the port method significantly
- Addressable::URI.encode_segment, Addressable::URI.unencode_segment renamed
- documentation is now in YARD format
- more rigorous type checking
- to_str method implemented, implicit conversion to Strings now allowed
- Addressable::URI#omit method added, Addressable::URI#merge method replaced
- updated URI Template code to match v 03 of the draft spec
- added a bunch of new specifications

# Addressable 1.0.4 <a name="v1.0.4">
- switched to using RSpec's pending system for specs that rely on IDN
- fixed issue with creating URIs with paths that are not prefixed with '/'

# Addressable 1.0.3 <a name="v1.0.3">
- implemented a hash method

# Addressable 1.0.2 <a name="v1.0.2">
- fixed minor bug with the extract_mapping method

# Addressable 1.0.1 <a name="v1.0.1">
- fixed minor bug with the extract_mapping method

# Addressable 1.0.0 <a name="v1.0.0">
- heuristic parse method added
- parsing is slightly more strict
- replaced to_h with to_hash
- fixed routing methods
- improved specifications
- improved heckle rake task
- no surviving heckle mutations

# Addressable 0.1.2 <a name="v0.1.2">
- improved normalization
- fixed bug in joining algorithm
- updated specifications

# Addressable 0.1.1 <a name="v0.1.1">
- updated documentation
- added URI Template variable extraction

# Addressable 0.1.0 <a name="v0.1.0">
- initial release
- implementation based on RFC 3986, 3987
- support for IRIs via libidn
- support for the URI Template draft spec
