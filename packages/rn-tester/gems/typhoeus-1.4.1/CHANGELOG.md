# Changelog

## Master

[Full Changelog](http://github.com/typhoeus/typhoeus/compare/v1.4.1...master)

## 1.4.1

[Full Changelog](http://github.com/typhoeus/typhoeus/compare/v1.4.0...v1.4.1)

## 1.4.0

[Full Changelog](http://github.com/typhoeus/typhoeus/compare/v1.1.2...v1.4.0)

#### 1 feature
- Faraday adapter exceptions namespace compatibility with Faraday v1 ([@iMacTia](https://github.com/iMacTia) in [#616](https://github.com/typhoeus/typhoeus/pull/616))

#### 3 Others
- Yard warning fixes ([@olleolleolle](https://github.com/olleolleolle) in [#622](https://github.com/typhoeus/typhoeus/pull/622))
- Add more Ruby versions in CI matrix ([@olleolleolle](https://github.com/olleolleolle) in [#623](https://github.com/typhoeus/typhoeus/pull/623))
- Use of argument passed in function instead of `attr_reader` ([@v-kolesnikov](https://github.com/v-kolesnikov) in [#625](https://github.com/typhoeus/typhoeus/pull/625))

## 1.1.2

[Full Changelog](http://github.com/typhoeus/typhoeus/compare/v1.1.1...v1.1.2)

## 1.1.1

[Full Changelog](http://github.com/typhoeus/typhoeus/compare/v1.1.0...v1.1.1)

## 1.1.0

[Full Changelog](http://github.com/typhoeus/typhoeus/compare/v1.0.2...v1.1.0)

* Unless specified `Expect` header is set to be empty to avoid `100 continue`
  to be set when using `PUT`
* Add global config option `Typhoeus::Config.proxy`

## 1.0.2

[Full Changelog](http://github.com/typhoeus/typhoeus/compare/v1.0.1...v1.0.2)

## 1.0.1

[Full Changelog](http://github.com/typhoeus/typhoeus/compare/v1.0.0...v1.0.1)

## 1.0.0

[Full Changelog](http://github.com/typhoeus/typhoeus/compare/v0.8.0...v1.0.0)

## 0.8.0

[Full Changelog](http://github.com/typhoeus/typhoeus/compare/v0.7.3...v0.8.0)

* `EasyFactory`: Reduced object allocations and method calls during deprecated
    option handling and option sanitization.
  ([Tasos Laskos](https://github.com/zapotek))
* `Response` ([Tasos Laskos](https://github.com/zapotek))
    * `Header`
        * `#process_pair`: Halved `#set_value` calls.
        * `#set_value`: Minimized `Hash` accesses.
        * `#parse`: Use `String#start_with?` instead of `Regexp` match.
        * `#process_line`: Optimized key/value sanitization.
    * `Status`
        * `#timed_out?`: Only return `true` when `#return_code` is `operation_timedout`.

## 0.7.3

[Full Changelog](http://github.com/typhoeus/typhoeus/compare/v0.7.2...v0.7.3)

* Add on_body callbacks individually to allow Ethon to recognize the return code

## 0.7.2

[Full Changelog](http://github.com/typhoeus/typhoeus/compare/v0.7.1...v0.7.2)

* Allow arrays to be passed to Expectation#and_return
  ([JP Moral](https://github.com/jpmoral))

* Added getter for `redirect_time` value.
  ([Adrien Jarthon](https://github.com/jarthod))

## 0.7.1

[Full Changelog](http://github.com/typhoeus/typhoeus/compare/v0.7.0...v0.7.1)

Bugfixes:

* Forking may cause libcurl sockets to be shared with child processes, causing HTTP requests to be interleaved
  ([Rolf Timmermans](https://github.com/rolftimmermans), [\#436](https://github.com/typhoeus/typhoeus/pull/426))

## 0.7.0

[Full Changelog](http://github.com/typhoeus/typhoeus/compare/v0.7.0.pre1...v0.7.0)

Bugfixes:

* Call on_headers and on_body when using stubbed responses.

## 0.7.0.pre1

[Full Changelog](http://github.com/typhoeus/typhoeus/compare/v0.6.9...v0.7.0.pre1)

Enhancements:

* Improving timeout behavior and documentation. `no_signal` is now set per default!
  ([Jonas Wagner](https://github.com/jwagner), [\#398](https://github.com/typhoeus/typhoeus/pull/398))

## 0.6.8

[Full Changelog](http://github.com/typhoeus/typhoeus/compare/v0.6.7...v0.6.8)

Bugfixes:

* Fix Faraday 0.9 compatibility.
  ([Gleb Mazovetskiy](https://github.com/glebm), [\#357](https://github.com/typhoeus/typhoeus/pull/357))
* Fix Request#hash for different key orders.
  ([Matthew Schulkind](https://github.com/mschulkind), [\#344](https://github.com/typhoeus/typhoeus/pull/344))

Enhancements:

* Use an updated Ethon version. Note that from now on the `mime-types` is no longer a Ethon dependency. The gem will be still used if available to determine the mime type of a file which is uploaded. That means you have to have take care of the gem installation yourself.
* Use SVG for status badges in README.
  ([Sean Linsley](https://github.com/seanlinsley), [\#353](https://github.com/typhoeus/typhoeus/pull/353))
* Missing quotes in README example code.
  ([Jason R. Clark](https://github.com/jasonrclark), [\#351](https://github.com/typhoeus/typhoeus/pull/351))
* Specs for Faraday adapter.
  ([michaelavila](https://github.com/michaelavila), [\#348](https://github.com/typhoeus/typhoeus/pull/348))
* Clarify wording in README.
  ([Sean Linsley](https://github.com/seanlinsley), [\#347](https://github.com/typhoeus/typhoeus/pull/347))
* Make caching easier for non-memory caches.
  ([Matthew Schulkind](https://github.com/mschulkind), [\#345](https://github.com/typhoeus/typhoeus/pull/345))
* Spec refactoring.
  ([Matthew Schulkind](https://github.com/mschulkind), [\#343](https://github.com/typhoeus/typhoeus/pull/343))

## 0.6.7

[Full Changelog](http://github.com/typhoeus/typhoeus/compare/v0.6.6...v0.6.7)

Enhancements:

* Add response streaming.
  ([\#339](https://github.com/typhoeus/typhoeus/pull/339))

## 0.6.6

[Full Changelog](http://github.com/typhoeus/typhoeus/compare/v0.6.5...v0.6.6)

## 0.6.5

[Full Changelog](http://github.com/typhoeus/typhoeus/compare/v0.6.4...v0.6.5)

## 0.6.4

[Full Changelog](http://github.com/typhoeus/typhoeus/compare/v0.6.3...v0.6.4)

The changelog entries are coming soon!

## 0.6.3

[Full Changelog](http://github.com/typhoeus/typhoeus/compare/v0.6.2...v0.6.3)

Enhancements:

* Cache hydra per thread.
* Various documentation improvements.
  ([craiglittle](https://github.com/craiglittle))
* Add support for lazy construction of responses from stubbed requests.
  ([ryankindermann](https://github.com/ryankinderman), [\#275](https://github.com/typhoeus/typhoeus/pull/275))

## 0.6.2

[Full Changelog](http://github.com/typhoeus/typhoeus/compare/v0.6.1...v0.6.2)

Enhancements:

* Reintroduce a global cache.
* `Request#handled_response` falls back to the original response.
  ([turnerking](https://github.com/turnerking), [\#272](https://github.com/typhoeus/typhoeus/pull/272))
* When `Errors::NoStub` is raised the `url` is displayed.
  ([dschneider](https://github.com/dschneider), [\#276](https://github.com/typhoeus/typhoeus/pull/276))
* Make `Request#hash` consistent.
* Add `.rvmrc` and `ctags` to `.gitignore`.
  ([ryankindermann](https://github.com/ryankinderman), [\#274](https://github.com/typhoeus/typhoeus/pull/274))

## 0.6.1

[Full Changelog](http://github.com/typhoeus/typhoeus/compare/v0.6.0...v0.6.1)

Enhancements:

* Updated ethon version which allows to set multiple protocols.

## 0.6.0

[Full Changelog](http://github.com/typhoeus/typhoeus/compare/v0.5.4...v0.6.0)

Enhancements:

* `Request#url` now also contains the url parameters.
* Use updated ethon version which provides access to protocols and redir_protocols in response to [libcurl SASL buffer overflow vulnerability](http://curl.haxx.se/docs/adv_20130206.html)

Bugfixes:

* Corrected ssl options for the faraday adapter.
* The before hook now correctly returns the response.
  ([Mattias Putman](https://github.com/challengee), [\#268](https://github.com/typhoeus/typhoeus/pull/268))
* Benchmark is working again.

## 0.5.4

[Full Changelog](http://github.com/typhoeus/typhoeus/compare/v0.5.3...v0.5.4)

Enhancements:

* Make sure response_code is an integer.
* When setting an header through vcr or webmock it becomes a `Typhoeus::Response::Header`.
* Provide a Rack middleware to decode nested Typhoeus arrays properly.
  ([Dwayne Macgowan](https://github.com/dwaynemac), [\#224](https://github.com/typhoeus/typhoeus/issues/224))
* Handled response is available again.
* Rename parameter `url` to `base_url`. See discussion here: [\#250](https://github.com/typhoeus/typhoeus/issues/250).
  ([bkimble](https://github.com/bkimble), [\#256](https://github.com/typhoeus/typhoeus/pull/256))
* Provide O(1) header access.
  * Work around ruby 1.8.7 limitations.
    ([Chris Johnson](https://github.com/findchris), [\#227](https://github.com/typhoeus/typhoeus/pull/227) )
  * Provide symbol access.

## 0.5.3

[Full Changelog](http://github.com/typhoeus/typhoeus/compare/v0.5.2...v0.5.3)

Enhancements:

* When checking options in Expecation#matches? also consider Request#options.

Bugfixes:

* Do not break backwards compatibility with case insensitive headers access.
* Make sure hydra behaves correct in case of before hooks.

## 0.5.2

[Full Changelog](http://github.com/typhoeus/typhoeus/compare/v0.5.1...v0.5.2)

Enhancements:

* Do not check the return_code in Response#success? when response is mocked.
* Check for memoization, stubbing, before hooks are delayed to Hydra#run. It
  was on Hydra#queue before and led to strange behavior because if the request
  was stubbed, it was wrapped up in queue already. There was no way to add
  callbacks after queue thatswhy. This is now different, since everything happens
  in run, just as you expect.

## 0.5.1

[Full Changelog](http://github.com/typhoeus/typhoeus/compare/v0.5.0...v0.5.1)

Enhancements:

* Downcase header keys for easier access
  ( [\#227](https://github.com/typhoeus/typhoeus/issues/227) )
* Using an updated Ethon version.

## 0.5.0

[Full Changelog](http://github.com/typhoeus/typhoeus/compare/v0.4.2...v0.5.0)

Major Changes:

* Ethon integration
  * Params are url params and a body is always a body for every request type
  * The options you can set might have a slightly other names, as Ethon sticks to
    libcurl names. See
    [Easy.new](http://rubydoc.info/github/typhoeus/ethon/Ethon/Easy#initialize-instance_method)
    for a description.
  * Request parameter and body are properly encoded (only POST multiform body is not)
  * No more header sanitizing. Before: `:headers => { 'user_agent' => 'Custom' }` was modified to
        `:headers => { 'User-Agent' => 'Custom' }`
  * `Typhoeus::Easy` and `Typhoeus::Multi` are now `Ethon::Easy` and `Ethon::Multi`

* Request shortcuts: `Typhoeus.get("www.google.de")`
* Global configuration:
```ruby
Typhoeus.configure do |config|
  config.verbose = true
  config.memoize = true
end
```
* No more `Response#headers_hash`, instead `Response#headers` returning the last
  header and response#redirections returning the responses with headers
  generated through redirections
* Instead of defining the same callbacks on every request, you can define global callbacks:
```ruby
Typhoeus.on_complete { p "yay" }
```
* The stubbing interface changed slightly. You now have the same syntax as for requests:
```ruby
Typhoeus.stub(url, options).and_return(response)
```
* The following things were removed because they do not seemed to be used at all. Ping me if you disagree!
  * `Typhoeus::Filter`
  * `Typhoeus::Remote`
  * `Typhoeus::RemoteMethod`
  * `Typhoeus::RemoteProxyObject`
  * build in cache interface

Enhancements:

* Documentation
  ( [Alex P](https://github.com/ifesdjeen), [\#188](https://github.com/typhoeus/typhoeus/issues/188) )
* Request#on\_complete can hold multiple blocks.
* Request#eql? recognizes when header/params/body has a different order, but still same keys and values
  ( [Alex P](https://github.com/ifesdjeen), [\#194](https://github.com/typhoeus/typhoeus/issues/194) )

Bug Fixes:

* Zero bytes in strings are escaped for libcurl
* Add support for socks5 hostname proxy type
  ( [eweathers](https://github.com/eweathers), [\#183](https://github.com/typhoeus/typhoeus/issues/183) )
* Post body is encoded
  ( [Rohan Deshpande](https://github.com/rdeshpande), [\#143](https://github.com/typhoeus/typhoeus/issues/143) )
* Set default user agent
  ( [Steven Shingler](https://github.com/sshingler), [\#176](https://github.com/typhoeus/typhoeus/issues/176) )

## 0.4.2
* A header hotfix

## 0.4.1
* Fix verifypeer and verifyhost options
* Fix header sending

## 0.4.0
* Make a GET even when a body is given
* Deprecated User Agent setter removed
* Allow cache key basis overwrite (John Crepezzi, #147)
* FFI integration (Daniel Cavanagh, #151)
* Refactor upload code (Marnen Laibow-Koser, #152)
* Fix travis-ci build (Ezekiel Templin, #160)

## 0.3.3
* Make sure to call the Easy::failure callback on all non-success http response codes, even invalid ones. [balexis]
* Use bytesize instead of length to determine Content-Length [dlamacchia]
* Added SSL version option to Easy/Request [michelbarbosa/dbalatero]

## 0.3.2
* Fix array params to be consistent with HTTP spec [gridaphobe]
* traversal\_to\_params\_hash should use the escape option [itsmeduncan]
* Fix > 1024 open file descriptors [mschulkind]
* Fixed a bug with internally queued requests being dropped [mschulkind]
* Use gemspec in bundler to avoid duplication [mschulkind]
* Run internally queued requests in FIFO order [mschulkind]
* Moved Typhoeus::VERSION to a separate file, to fix rake build\_native [mschulkind]
* Fixed problems related to put requests with empty bodies [skaes, GH-84]
* Added CURLOPT\_INTERFACE option via Request#interface=. [spiegela]
* Added Tempfile support to Form#process! [richievos]
* Hydra won't forget to accept gzip/deflate encoding [codesnik]
* Accept and convert strings to integers in Typhoeus::Request#initialize for timeout/cache\_timeout/connect\_timeout values when using ruby 1.9.x. [djnawara]
* Added interface for registering stub finders [myronmarston]
* Fixed header stubbing [myronmarston]
* Added PKCS12 support [jodell]
* Make a request with handlers marshallable [bernerdschaefer]
* Upgraded to RSpec 2 [bernerdschaefer]
* Fix HTTP status edge-case [balexis]
* Expose primary\_ip to easy object [balexis]

## 0.2.4
* Fix form POSTs to only use multipart for file uploads, otherwise use application/x-www-form-urlencoded [dbalatero]

## 0.2.3
* Code duplication in Typhoeus::Form led to nested URL param errors on POST only. Fixed [dbalatero]

## 0.2.2
* Fixed a problem with nested URL params encoding incorrectly [dbalatero]

## 0.2.1
* Added extended proxy support [Zapotek, GH-46]
* eliminated compile time warnings by using proper type declarations [skaes, GH-54]
* fixed broken calls to rb\_raise [skaes, GH-54]
* prevent leaking of curl easy handles when exceptions are raised (either from typhoeus itself or user callbacks) [skaes, GH-54]
* fixed Easy#timed\_out? using curl return codes [skaes, GH-54]
* provide curl return codes and corresponding curl error messages on classes Easy and Request [skaes, GH-54]
* allow VCR to whitelist hosts in Typhoeus stubbing/mocking [myronmarston, GH-57]
* added timed\_out? documentation, method to Response [dbalatero, GH-34]
* added abort to Hydra to prematurely stop a hydra.run [Zapotek]
* added file upload support for POST requests [jtarchie, GH-59]

## 0.2.0
* Fix warning in Request#headers from attr\_accessor
* Params with array values were not parsing into the format that rack expects [GH-39, smartocci]
* Removed Rack as a dependency [GH-45]
* Added integration hooks for VCR!

## 0.1.31
* Fixed bug in setting compression encoding [morhekil]
* Exposed authentication control methods through Request interface [morhekil]

## 0.1.30
* Exposed CURLOPT\_CONNECTTIMEOUT\_MS to Requests [balexis]

## 0.1.29
* Fixed a memory corruption with using CURLOPT\_POSTFIELDS [gravis,
32531d0821aecc4]

## 0.1.28
* Added SSL cert options for Typhoeus::Easy [GH-25, gravis]
* Ported SSL cert options to Typhoeus::Request interface [gravis]
* Added support for any HTTP method (purge for Varnish) [ryana]

## 0.1.27
* Added rack as dependency, added dev dependencies to Rakefile [GH-21]
