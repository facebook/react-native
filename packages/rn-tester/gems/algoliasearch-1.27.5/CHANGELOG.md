# ChangeLog

## Unreleased

## [1.27.4](https://github.com/algolia/algoliasearch-client-ruby/compare/1.27.3...1.27.4) (2020-09-16)

**Fixed**

* Retrieve all objects when using `copy_index` from `AccountClient` class ([399](https://github.com/algolia/algoliasearch-client-ruby/pull/399))

## [1.27.3](https://github.com/algolia/algoliasearch-client-ruby/compare/1.27.2...1.27.3) (2020-06-03)

**Fixed**

* Replace expired certificate within embedded certificate chain ([9087dd1](https://github.com/algolia/algoliasearch-client-ruby/commit/9087dd14a97bf77c9391a3360c4803edf686086d))

## [1.27.2](https://github.com/algolia/algoliasearch-client-ruby/compare/1.27.1...1.27.2) (2020-04-28)

**Fixed**

* In `search_user_id`, retrieve param `cluster` instead of `clusterName`. [368](https://github.com/algolia/algoliasearch-client-ruby/issues/368)

## [1.27.1](https://github.com/algolia/algoliasearch-client-ruby/compare/1.27.0...1.27.1) (2019-09-26)

**Fixed**

* Update `Algolia::Index.exists` method to `Algolia::Index.exists?`. [364](https://github.com/algolia/algoliasearch-client-ruby/issues/364)

## [1.27.0](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.27.0) (2019-09-16)

**Added**

* Introduce `Algolia::Index.exists` method. [358](https://github.com/algolia/algoliasearch-client-ruby/issues/358)

    Check whether an index exists or not.

* Introduce `Algolia::Index.find_object` method. [359](https://github.com/algolia/algoliasearch-client-ruby/issues/359)

    Find object by the given condition.

* Introduce `Algolia::Index.get_object_position` method. [359](https://github.com/algolia/algoliasearch-client-ruby/issues/359)

    Retrieve the given object position in a set of results.

* Introduce `Algolia.get_secured_api_key_remaining_validity` method. [361](https://github.com/algolia/algoliasearch-client-ruby/issues/361)

    Returns the remaining validity time for the given API key in seconds.


## [1.26.1](https://github.com/algolia/algoliasearch-client-ruby/compare/1.26.0...1.26.1) (2019-07-31)

### Chore

- stop using coveralls because of a GPL-licensed transitive dep ([d2fbe8c](https://github.com/algolia/algoliasearch-client-ruby/commit/d2fbe8c))


[1.26.0](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.26.0) (2019-02-12)

**Added**

* Introduce `Algolia.restore_api_key` method.
    
    If you delete your API key by mistake, you can now restore it via
    this new method. This especially useful if this key is used in a
    mobile app or somewhere you can't update easily.
    

## [1.25.2](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.25.2) (2018-12-19)

## [1.25.1](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.25.1) (2018-12-19)

**Fixed**

* Missing `insights.rb` in gemspec - [7d2f3ab](https://github.com/algolia/algoliasearch-client-ruby/commit/7d2f3abe6e4338f0f7364f6f52ac1d371f066464)

## [1.25.0](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.25.0) (2018-12-19)

**Added**

* Introduce Insights client to send events to Algolia Insights API - [326](https://github.com/algolia/algoliasearch-client-ruby/issues/326)

* Add `multiple_get_objects` to retrieve objects by objectID across multiple indices - [329](https://github.com/algolia/algoliasearch-client-ruby/issues/329)

**Modified**

* Use the correct `hitsPerPage` key when exporting index resources - [319](https://github.com/algolia/algoliasearch-client-ruby/issues/319)

## [1.24.0](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.24.0) (2018-11-28)

* Feat(adds-account-client-copy-index): adds `copy_index` to account client ([#324](https://github.com/algolia/algoliasearch-client-ruby/pull/324))
* Feat(replace-all-methods): adds `replace_all_rules`, `replace_all_objects` and `replace_all_synonyms` to search index ([#323](https://github.com/algolia/algoliasearch-client-ruby/pull/323))
* Feat(scoped-copy-methods): adds `copy_settings`, `copy_synonyms` and `copy_rules` to search client ([#322](https://github.com/algolia/algoliasearch-client-ruby/pull/322))

## [1.23.2](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.23.2) (2018-06-19)

* Fix(analytics): gem without new analytics class (#306)

## [1.23.0](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.23.0) (2018-06-19)

* Feat(analytics): introduce new analytics class
* Chore(rake): use unshift to keep compat with older ruby versions
* Ruby version must be after client version in ua
* Fix ua tests with new format
* Rewrite ua
* Feat(ua): add ruby version
* Fix(syntax): this isn't php
* Tests(mcm): use unique userid everytime
* Tests(mcm): introduce auto_retry for more stable tests
* Feat(client): expose waittask in the client (#302)
* Fix(travis): always test on the latest patches (#295)

## [1.22.0](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.22.0) (2018-05-30)

* Rename license file (#297)
* Fix release task (#294)
* Introduce multi cluster management (#285)
* Fix(browse): ensure cursor is passed in the body (#288)
* Chore(md): update contribution-related files (#293)

## [1.21.0](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.21.0) (2018-05-24)

* Fix(tests): fix warning for unspecified exception (#287)
* Fix release task missing github link (#291)
* Api review (#292)

## [1.20.1](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.20.1) (2018-05-15)

* Fix changelog link in gemspec (#290)
* Utils: move to changelog.md and add rake task for release (#289)

## [1.20.0](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.20.0) (2018-05-07)

* Feat: deprecate api keys methods on index in favor of client ones (#286)
* Chore(gemfile): remove useless dependencies (#280)
* Fix(env): adding default env var (#279)
* Chore(travis): test against Rubinius 3 (#281)
* Fix: prevent saving a rule with an empty `objectID` (#283)

## [1.19.2](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.19.2) (2018-04-03)

* Fix `Algolia.delete_index` wrong number of arguments (#277)

## [1.19.1](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.19.1) (2017-12-18)

* Fix hard dependency on `hashdiff` (#262)

## [1.19.0](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.19.0) (2017-12-15)

* Add request options to any method using API calls (#213)
* Add `export_synonyms` index method (#260)
* Add `export_rules` index method (#261)

## [1.18.5](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.18.5) (2017-12-07)

* Fix missing requirement

## [1.18.4](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.18.4) (2017-12-06)

* Remove remaining unnecessary requirements (#256)
* Remove Gemfile.lock (#257)

## [1.18.3](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.18.3) (2017-12-04)

* Remove Bundler and RubyGems requirements (#253)

## [1.18.2](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.18.2) (2017-11-28)

* Add (undocumented) gzip option to disable gzip (#240)

## [1.18.1](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.18.1) (2017-11-15)

* Fix `get_logs` always returning type `all` (#244)
* New scopes to `copy_index` method (#243)

## [1.18.0](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.18.0) (2017-11-02)

* Allow to reuse the webmocks using `Algolia::WebMock.mock!` (#256)

## [1.17.0](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.17.0) (2017-10-10)

* New `delete_by` method

## [1.16.0](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.16.0) (2017-09-14)

* New Query Rules API

## [1.15.1](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.15.1) (2017-08-17)

* Fixed regression introduced in 1.15.0

## [1.15.0](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.15.0) (2017-08-17)

* Make `delete_by_query` not `wait_task` by default (also, make it mockable)
* Add a new `delete_by_query!` doing the last `wait_task`

## [1.14.0](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.14.0) (2017-07-31)

* Ability to override the underlying user-agent

## [1.13.0](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.13.0) (2017-03-17)

* Add a `index.get_task_status(taskID)` method (#199)

## [1.12.7](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.12.7) (2017-03-01)

* Renamed all `*_user_key` methods to `*_api_key`

## [1.12.6](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.12.6) (2017-01-25)

* Upgraded `httpclient` to 2.8.3

## [1.12.5](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.12.5) (2016-12-07)

* Fixed retry strategy not keeping the `current_host` first (#163)

## [1.12.4](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.12.4) (2016-12-07)

* Fix DNS tests

## [1.12.3](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.12.3) (2016-12-06)

* Allow for multiple clients on different app ids on the same thread

## [1.12.2](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.12.2) (2016-12-05)

* Fix client scoped methods

## [1.12.1](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.12.1) (2016-11-25)

* Rename `search_facet` to `search_for_facet_values`

## [1.12.0](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.12.0) (2016-10-31)

* Add `search_facet`

## [1.11.0](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.11.0) (2016-08-21)

* Upgraded to httpclient 2.8.1 to avoid reseting the keep-alive while changing timeouts

## [1.10.0](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.10.0) (2016-07-11)

* `{get,set}_settings` now take optional custom query parameters

## [1.9.0](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.9.0) (2016-06-17)

* New synonyms API

## [1.8.1](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.8.1) (2016-04-14)

* Ensure we're using an absolute path for the `ca-bundle.crt` file (could fix some `OpenSSL::X509::StoreError: system lib` errors)

## [1.8.0](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.8.0) (2016-04-06)

* Upgraded to `httpclient` 2.7.1 (includes ruby 2.3.0 deprecation fixes)
* Upgraded WebMock URLs

## [1.7.0](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.7.0) (2016-01-09)

* New `generate_secured_api_key` embedding the filters in the resulting key

## [1.6.1](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.6.1) (2015-08-01)

* Search queries are now using POST requests

## [1.6.0](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.6.0) (2015-07-19)

* Ability to instantiate multiple API clients in the same process (was using a class variable before).

## [1.5.1](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.5.1) (2015-07-14)

* Ability to retrieve a single page from a cursor with `browse_from`

## [1.5.0](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.5.0) (2015-06-05)

* New cursor-based `browse()` implementation taking query parameters

## [1.4.3](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.4.3) (2015-05-27)

* Do not call `WebMock.disable!` in the helper

## [1.4.2](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.4,2) (2015-05-04)

* Add new methods to add/update api key
* Add batch method to target multiple indices
* Add strategy parameter for the multipleQueries
* Add new method to generate secured api key from query parameters

## [1.4.1](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.4.1) (2015-04-10)

* Force the default connect/read/write/search/batch timeouts to Algolia-specific values

## [1.4.0](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.4.0) (2015-03-17)

* High-available DNS: search queries are now targeting `APPID-DSN.algolia.net` first, then the main cluster using NSOne, then the main cluster using Route53.
* High-available DNS: Indexing queries are targeting `APPID.algolia.net` first, then the main cluster using NSOne, then the main cluster using Route53.

## [1.3.1](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.3.1) (2014-11-29)

* Fixed wrong deployed version (1.3.0 was based on 1.2.13 instead of 1.2.14)

## [1.3.0](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.3.0) (2014-11-29)

* Use `algolia.net` domain instead of `algolia.io`

## [1.2.14](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.2.14) (2014-11-10)

* Force the underlying `httpclient` dependency to be >= 2.4 in the gemspec as well
* Ability to force the SSL version

## [1.2.13](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.2.13) (2014-10-22)

* Fix the loop on hosts to retry when the http code is different than 200, 201, 400, 403, 404

## [1.2.12](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.2.12) (2014-10-08)

* Upgrade to `httpclient` 2.4
* Do not reset the timeout on each requests

## [1.2.11](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.2.11) (2014-09-14)

* Ability to update API keys

## [1.2.10](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.2.10) (2014-08-22)

* Using Digest to remove "Digest::Digest is deprecated; Use Digest" warning (author: @dglancy)

## [1.2.9](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.2.9) (2014-07-10)

* Expose `connect_timeout`, `receive_timeout` and `send_timeout`
* Add new `delete_by_query` method to delete all objects matching a specific query
* Add new `get_objects` method to retrieve a list of objects from a single API call
* Add a helper to perform disjunctive faceting

## [1.2.8](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.2.8) (2014-03-27)

* Catch all exceptions before retrying with another host

## [1.2.7](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.2.7) (2014-03-24)

* Ruby 1.8 compatibility

## [1.2.6](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.2.6) (2014-03-19)

* Raise an exception if no `APPLICATION_ID` is provided
* Ability to get last API call errors
* Ability to send multiple queries using a single API call
* Secured API keys generation is now based on secured HMAC-SHA256

## [1.2.5](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.2.5) (2014-02-24)

* Ability to generate secured API key from a list of tags + optional `user_token`
* Ability to specify a list of indexes targeted by the user key

## [1.2.4](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.2.4) (2014-02-21)

* Add `delete_objects`

## [1.2.3](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.2.3) (2014-02-10)

* `add_object`: POST request if `objectID` is `nil` OR `empty`

## [1.2.2](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.2.2) (2014-01-11)

* Expose `batch` requests

## [1.2.1](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.2.1) (2014-01-07)

* Removed `jeweler` since it doesn't support platform specific deps (see https://github.com/technicalpickles/jeweler/issues/170)

## [1.2.0](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.2.0) (2014-01-07)

* Removed `curb` dependency and switched on `httpclient` to avoid fork-safety issue (see issue #5)

## [1.1.18](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.1.18) (2014-01-06)

* Fixed batch request builder (broken since last refactoring)

## [1.1.17](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.1.17) (2014-01-02)

* Ability to use IP rate limit behind a proxy forwarding the end-user's IP
* Add documentation for the new `attributeForDistinct` setting and `distinct` search parameter

## [1.1.16](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.1.16) (2013-12-16)

* Add arguments type-checking
* Normalize save_object/partial_update/add_object signatures
* Force dependencies versions

## [1.1.15](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.1.15) (2013-12-16)

* Embed ca-bundle.crt

## [1.1.14](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.1.14) (2013-12-11)

* Added `index.add_user_key(acls, validity, rate_limit, maxApiCalls)``

## [1.1.13](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.1.13) (2013-12-10)

* WebMock integration

## [1.1.12](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.1.12) (2013-12-05)

* Add `browse` command

## [1.1.11](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.1.11) (2013-11-29)

* Remove rubysl (rbx required dependencies)

## [1.1.10](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.1.10) (2013-11-29)

* Fixed gzip handling bug

## [1.1.9](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.1.9) (2013-11-28)

* Added gzip support

## [1.1.8](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.1.8) (2013-11-26)

* Add `partial_update_objects` method

## [1.1.7](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.1.7) (2013-11-08)

* Search params: encode array-based parameters (`tagFilters`, `facetFilters`, ...)

## [1.1.6](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.1.6) (2013-11-07)

* Index: `clear` and `clear!` methods can now be used the delete the whole content of an index
* User keys: plug new `maxQueriesPerIPPerHour` and `maxHitsPerQuery` parameters

## [1.1.5](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.1.5) (2013-10-17)

* Version is now part of the user-agent

## [1.1.4](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.1.4) (2013-10-17)

* Fixed `wait_task` not sleeping at all

## [1.1.3](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.1.3) (2013-10-15)

* Fixed thread-safety issues
* Curl sessions are now thread-local

## [1.1.2](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.1.2) (2013-10-02)

* Fixed instance/class method conflict

## [1.1.1](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.1.1) (2013-10-01)

* Updated documentation
* Plug copy/move index

## [1.1.0](https://github.com/algolia/algoliasearch-client-ruby/releases/tag/1.1.0) (2013-09-17)

* Initial import
