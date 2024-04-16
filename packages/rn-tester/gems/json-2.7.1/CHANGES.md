# Changes

### 2023-12-05 (2.7.1)

* JSON.dump: handle unenclosed hashes regression #554
* Overload kwargs in JSON.dump #556
* [DOC] RDoc for additions #557
* Fix JSON.dump overload combination #558

### 2023-12-01 (2.7.0)

* Add a strict option to Generator #519
* `escape_slash` option was renamed as `script_safe` and now also escape U+2028 and U+2029. `escape_slash` is now an alias of `script_safe` #525
* Remove unnecessary initialization of create_id in JSON.parse() #454
* Improvements to Hash#to_json in pure implementation generator #203
* Use ruby_xfree to free buffers #518
* Fix "unexpected token" offset for Infinity #507
* Avoid using deprecated BigDecimal.new on JRuby #546
* Removed code for Ruby 1.8 #540
* Rename JSON::ParseError to JSON:ParserError #530
* Call super in included hook #486
* JRuby requires a minimum of Java 8 #516
* Always indent even if empty #517

### 2022-11-30 (2.6.3)

* bugfix json/pure mixing escaped with literal unicode raises Encoding::CompatibilityError #483
* Stop including the parser source __LINE__ in exceptions #470

### 2022-11-17 (2.6.2)

* Remove unknown keyword arg from DateTime.parse #488
* Ignore java artifacts by @hsbt #489
* Fix parser bug for empty string allocation #496

### 2021-10-24 (2.6.1)

* Restore version.rb with 2.6.1

### 2021-10-14 (2.6.0)

* Use `rb_enc_interned_str` if available to reduce allocations in `freeze: true` mode. #451.
* Bump required_ruby_version to 2.3.
* Fix compatibility with `GC.compact`.
* Fix some compilation warnings. #469

## 2020-12-22 (2.5.1)

* Restore the compatibility for constants of JSON class.

## 2020-12-22 (2.5.0)

* Ready to Ractor-safe at Ruby 3.0.

## 2020-12-17 (2.4.1)

* Restore version.rb with 2.4.1

## 2020-12-15 (2.4.0)

* Implement a freeze: parser option #447
* Fix an issue with generate_pretty and empty objects in the Ruby and Java implementations #449
* Fix JSON.load_file doc #448
* Fix pure parser with unclosed arrays / objects #425
* bundle the LICENSE file in the gem #444
* Add an option to escape forward slash character #405
* RDoc for JSON #439 #446 #442 #434 #433 #430

## 2020-06-30 (2.3.1)

* Spelling and grammar fixes for comments. Pull request #191 by Josh
  Kline.
* Enhance generic JSON and #generate docs. Pull request #347 by Victor
  Shepelev.
* Add :nodoc: for GeneratorMethods. Pull request #349 by Victor Shepelev.
* Baseline changes to help (JRuby) development. Pull request #371 by Karol
  Bucek.
* Add metadata for rubygems.org. Pull request #379 by Alexandre ZANNI.
* Remove invalid JSON.generate description from JSON module rdoc. Pull
  request #384 by Jeremy Evans.
* Test with TruffleRuby in CI. Pull request #402 by Benoit Daloze.
* Rdoc enhancements. Pull request #413 by Burdette Lamar.
* Fixtures/ are not being tested... Pull request #416 by Marc-André
  Lafortune.
* Use frozen string for hash key. Pull request #420 by Marc-André
  Lafortune.
* Added :call-seq: to RDoc for some methods. Pull request #422 by Burdette
  Lamar.
* Small typo fix. Pull request #423 by Marc-André Lafortune.

## 2019-12-11 (2.3.0)
 * Fix default of `create_additions` to always be `false` for `JSON(user_input)`
   and `JSON.parse(user_input, nil)`.
   Note that `JSON.load` remains with default `true` and is meant for internal
   serialization of trusted data. [CVE-2020-10663]
 * Fix passing args all #to_json in json/add/*.
 * Fix encoding issues
 * Fix issues of keyword vs positional parameter
 * Fix JSON::Parser against bigdecimal updates
 * Bug fixes to JRuby port

## 2019-02-21 (2.2.0)
 * Adds support for 2.6 BigDecimal and ruby standard library Set datetype.

## 2017-04-18 (2.1.0)
 * Allow passing of `decimal_class` option to specify a class as which to parse
   JSON float numbers.
## 2017-03-23 (2.0.4)
 * Raise exception for incomplete unicode surrogates/character escape
   sequences. This problem was reported by Daniel Gollahon (dgollahon).
 * Fix arbitrary heap exposure problem. This problem was reported by Ahmad
   Sherif (ahmadsherif).

## 2017-01-12 (2.0.3)
 * Set `required_ruby_version` to 1.9
 * Some small fixes

## 2016-07-26 (2.0.2)
  * Specify `required_ruby_version` for json\_pure.
  * Fix issue #295 failure when parsing frozen strings.

## 2016-07-01 (2.0.1)
  * Fix problem when requiring json\_pure and Parser constant was defined top
    level.
  * Add `RB_GC_GUARD` to avoid possible GC problem via Pete Johns.
  * Store `current_nesting` on stack by Aaron Patterson.

## 2015-09-11 (2.0.0)
  * Now complies to newest JSON RFC 7159.
  * Implements compatibility to ruby 2.4 integer unification.
  * Drops support for old rubies whose life has ended, that is rubies < 2.0.
    Also see https://www.ruby-lang.org/en/news/2014/07/01/eol-for-1-8-7-and-1-9-2/
  * There were still some mentions of dual GPL licensing in the source, but JSON
    has just the Ruby license that itself includes an explicit dual-licensing
    clause that allows covered software to be distributed under the terms of
    the Simplified BSD License instead for all ruby versions >= 1.9.3. This is
    however a GPL compatible license according to the Free Software Foundation.
    I changed these mentions to be consistent with the Ruby license setting in
    the gemspec files which were already correct now.

## 2017-01-13 (1.8.6)
  * Be compatible with ancient ruby 1.8 (maybe?)

## 2015-09-11 (1.8.5)
  * Be compatible with ruby 2.4.0
  * There were still some mentions of dual GPL licensing in the source, but JSON
    has just the Ruby license that itself includes an explicit dual-licensing
    clause that allows covered software to be distributed under the terms of
    the Simplified BSD License instead for all ruby versions >= 1.9.3. This is
    however a GPL compatible license according to the Free Software Foundation.
    I changed these mentions to be consistent with the Ruby license setting in
    the gemspec files which were already correct now.

## 2015-06-01 (1.8.3)
  * Fix potential memory leak, thx to nobu.

## 2015-01-08 (1.8.2)
  * Some performance improvements by Vipul A M <vipulnsward@gmail.com>.
  * Fix by Jason R. Clark <jclark@newrelic.com> to avoid mutation of
    `JSON.dump_default_options`.
  * More tests by Michael Mac-Vicar <mmacvicar@gmail.com> and fixing
    `space_before` accessor in generator.
  * Performance on Jruby improved by Ben Browning <bbrownin@redhat.com>.
  * Some fixes to be compatible with the new Ruby 2.2 by Zachary Scott <e@zzak.io>
    and SHIBATA Hiroshi <hsbt@ruby-lang.org>.

## 2013-05-13 (1.8.1)
  * Remove Rubinius exception since transcoding should be working now.

## 2013-05-13 (1.8.0)
  * Fix https://github.com/flori/json/issues/162 reported by Marc-Andre
    Lafortune <github_rocks@marc-andre.ca>. Thanks!
  * Applied patches by Yui NARUSE <naruse@airemix.jp> to suppress warning with
    -Wchar-subscripts and better validate UTF-8 strings.
  * Applied patch by ginriki@github to remove unnecessary if.
  * Add load/dump interface to `JSON::GenericObject` to make
        serialize :some_attribute, `JSON::GenericObject`
    work in Rails active models for convenient `SomeModel#some_attribute.foo.bar`
    access to serialised JSON data.

## 2013-02-04 (1.7.7)
  * Security fix for JSON create_additions default value and
    `JSON::GenericObject`. It should not be possible to create additions unless
    explicitly requested by setting the create_additions argument to true or
    using the JSON.load/dump interface. If `JSON::GenericObject` is supposed to
    be automatically deserialised, this has to be explicitly enabled by
    setting
        JSON::GenericObject.json_creatable = true
    as well.
  * Remove useless assert in fbuffer implementation.
  * Apply patch attached to https://github.com/flori/json/issues#issue/155
    provided by John Shahid <jvshahid@gmail.com>, Thx!
  * Add license information to rubygems spec data, reported by Jordi Massaguer Pla <jmassaguerpla@suse.de>.
  * Improve documentation, thx to Zachary Scott <zachary@zacharyscott.net>.

## 2012-11-29 (1.7.6)
  * Add `GeneratorState#merge` alias for JRuby, fix state accessor methods. Thx to
   jvshahid@github.
  * Increase hash likeness of state objects.

## 2012-08-17 (1.7.5)
  * Fix compilation of extension on older rubies.

## 2012-07-26 (1.7.4)
  * Fix compilation problem on AIX, see https://github.com/flori/json/issues/142

## 2012-05-12 (1.7.3)
  * Work around Rubinius encoding issues using iconv for conversion instead.

## 2012-05-11 (1.7.2)
  * Fix some encoding issues, that cause problems for  the pure and the
    extension variant in jruby 1.9 mode.

## 2012-04-28 (1.7.1)
  * Some small fixes for building

## 2012-04-28 (1.7.0)
  * Add `JSON::GenericObject` for method access to objects transmitted via JSON.

## 2012-04-27 (1.6.7)
  * Fix possible crash when trying to parse nil value.

## 2012-02-11 (1.6.6)
  * Propagate src encoding to values made from it (fixes 1.9 mode converting
    everything to ascii-8bit; harmless for 1.8 mode too) (Thomas E. Enebo
    <tom.enebo@gmail.com>), should fix
    https://github.com/flori/json/issues#issue/119.
  * Fix https://github.com/flori/json/issues#issue/124 Thx to Jason Hutchens.
  * Fix https://github.com/flori/json/issues#issue/117

## 2012-01-15 (1.6.5)
  * Vit Ondruch <v.ondruch@tiscali.cz> reported a bug that shows up when using
    optimisation under GCC 4.7. Thx to him, Bohuslav Kabrda
    <bkabrda@redhat.com> and Yui NARUSE <naruse@airemix.jp> for debugging and
    developing a patch fix.

## 2011-12-24 (1.6.4)
  * Patches that improve speed on JRuby contributed by Charles Oliver Nutter
    <headius@headius.com>.
  * Support `object_class`/`array_class` with duck typed hash/array.

## 2011-12-01 (1.6.3)
  * Let `JSON.load('')` return nil as well to make mysql text columns (default to
    `''`) work better for serialization.

## 2011-11-21 (1.6.2)
  * Add support for OpenStruct and BigDecimal.
  * Fix bug when parsing nil in `quirks_mode`.
  * Make JSON.dump and JSON.load methods better cooperate with Rails' serialize
    method. Just use:
        serialize :value, JSON
  * Fix bug with time serialization concerning nanoseconds. Thanks for the
    patch go to Josh Partlow (jpartlow@github).
  * Improve parsing speed for JSON numbers (integers and floats) in a similar way to
    what Evan Phoenix <evan@phx.io> suggested in:
    https://github.com/flori/json/pull/103

## 2011-09-18 (1.6.1)
  * Using -target 1.5 to force Java bits to compile with 1.5.

## 2011-09-12 (1.6.0)
  * Extract utilities (prettifier and GUI-editor) in its own gem json-utils.
  * Split json/add/core into different files for classes to be serialised.

## 2011-08-31 (1.5.4)
  * Fix memory leak when used from multiple JRuby. (Patch by
    jfirebaugh@github).
  * Apply patch by Eric Wong <nocode@yhbt.net> that fixes garbage collection problem
    reported in https://github.com/flori/json/issues/46.
  * Add :quirks_mode option to parser and generator.
  * Add support for Rational and Complex number additions via json/add/complex
    and json/add/rational requires.

## 2011-06-20 (1.5.3)
  * Alias State#configure method as State#merge to increase duck type synonymy with Hash.
	* Add `as_json` methods in json/add/core, so rails can create its json objects
	  the new way.

## 2011-05-11 (1.5.2)
  * Apply documentation patch by Cory Monty <cory.monty@gmail.com>.
  * Add gemspecs for json and json\_pure.
  * Fix bug in jruby pretty printing.
  * Fix bug in `object_class` and `array_class` when inheriting from Hash or
    Array.

## 2011-01-24 (1.5.1)
  * Made rake-compiler build a fat binary gem. This should fix issue
    https://github.com/flori/json/issues#issue/54.

## 2011-01-22 (1.5.0)
  * Included Java source codes for the Jruby extension made by Daniel Luz
    <dev@mernen.com>.
  * Output full exception message of `deep_const_get` to aid debugging.
  * Fixed an issue with ruby 1.9 `Module#const_defined?` method, that was
    reported by Riley Goodside.

## 2010-08-09 (1.4.6)
  * Fixed oversight reported in http://github.com/flori/json/issues/closed#issue/23,
    always create a new object from the state prototype.
  * Made pure and ext api more similar again.

## 2010-08-07 (1.4.5)
  * Manage data structure nesting depth in state object during generation. This
    should reduce problems with `to_json` method definіtions that only have one
    argument.
  * Some fixes in the state objects and additional tests.
## 2010-08-06 (1.4.4)
  * Fixes build problem for rubinius under OS X, http://github.com/flori/json/issues/closed#issue/25
  * Fixes crashes described in http://github.com/flori/json/issues/closed#issue/21 and
    http://github.com/flori/json/issues/closed#issue/23
## 2010-05-05 (1.4.3)
  * Fixed some test assertions, from Ruby r27587 and r27590, patch by nobu.
  * Fixed issue http://github.com/flori/json/issues/#issue/20 reported by
    electronicwhisper@github. Thx!

## 2010-04-26 (1.4.2)
  * Applied patch from naruse Yui NARUSE <naruse@airemix.com> to make building with
    Microsoft Visual C possible again.
  * Applied patch from devrandom <c1.github@niftybox.net> in order to allow building of
    json_pure if extensiontask is not present.
  * Thanks to Dustin Schneider <dustin@stocktwits.com>, who reported a memory
    leak, which is fixed in this release.
  * Applied 993f261ccb8f911d2ae57e9db48ec7acd0187283 patch from josh@github.

## 2010-04-25 (1.4.1)
  * Fix for a bug reported by Dan DeLeo <dan@kallistec.com>, caused by T_FIXNUM
    being different on 32bit/64bit architectures.

## 2010-04-23 (1.4.0)
  * Major speed improvements and building with simplified
    directory/file-structure.
  * Extension should at least be compatible with MRI, YARV and Rubinius.

## 2010-04-07 (1.2.4)
  * Triger const_missing callback to make Rails' dynamic class loading work.

## 2010-03-11 (1.2.3)
  * Added a `State#[]` method which returns an attribute's value in order to
    increase duck type compatibility to Hash.

## 2010-02-27 (1.2.2)
  * Made some changes to make the building of the parser/generator compatible
    to Rubinius.

## 2009-11-25 (1.2.1)
  * Added `:symbolize_names` option to Parser, which returns symbols instead of
    strings in object names/keys.

## 2009-10-01 (1.2.0)
  * `fast_generate` now raises an exception for nan and infinite floats.
  * On Ruby 1.8 json supports parsing of UTF-8, UTF-16BE, UTF-16LE, UTF-32BE,
    and UTF-32LE JSON documents now. Under Ruby 1.9 the M17n conversion
    functions are used to convert from all supported encodings. ASCII-8BIT
    encoded strings are handled like all strings under Ruby 1.8 were.
  * Better documentation

## 2009-08-23 (1.1.9)
  * Added forgotten main doc file `extra_rdoc_files`.

## 2009-08-23 (1.1.8)
  * Applied a patch by OZAWA Sakuro <sakuro@2238club.org> to make json/pure
    work in environments that don't provide iconv.
  * Applied patch by okkez_ in order to fix Ruby Bug #1768:
      http://redmine.ruby-lang.org/issues/show/1768.
  * Finally got around to avoid the rather paranoid escaping of ?/ characters
    in the generator's output. The parsers aren't affected by this change.
    Thanks to Rich Apodaca <rapodaca@metamolecular.com> for the suggestion.

## 2009-06-29 (1.1.7)
  * Security Fix for JSON::Pure::Parser. A specially designed string could
    cause catastrophic backtracking in one of the parser's regular expressions
    in earlier 1.1.x versions. JSON::Ext::Parser isn't affected by this issue.
    Thanks to Bartosz Blimke <bartosz@new-bamboo.co.uk> for reporting this
    problem.
  * This release also uses a less strict ruby version requirement for the
    creation of the mswin32 native gem.

## 2009-05-10 (1.1.6)
  * No changes. І tested native linux gems in the last release and they don't
    play well with different ruby versions other than the one the gem was built
    with. This release is just to bump the version number in order to skip the
    native gem on rubyforge.

## 2009-05-10 (1.1.5)
  * Started to build gems with rake-compiler gem.
  * Applied patch object/array class patch from Brian Candler
    <B.Candler@pobox.com> and fixes.

## 2009-04-01 (1.1.4)
  * Fixed a bug in the creation of serialized generic rails objects reported by
    Friedrich Graeter <graeter@hydrixos.org>.
  * Deleted tests/runner.rb, we're using testrb instead.
  * Editor supports Infinity in numbers now.
  * Made some changes in order to get the library to compile/run under Ruby
    1.9.
  * Improved speed of the code path for the fast_generate method in the pure
    variant.

## 2008-07-10 (1.1.3)
  * Wesley Beary <monki@geemus.com> reported a bug in json/add/core's DateTime
    handling: If the nominator and denominator of the offset were divisible by
    each other Ruby's Rational#to_s returns them as an integer not a fraction
    with '/'. This caused a ZeroDivisionError during parsing.
  * Use Date#start and DateTime#start instead of sg method, while
    remaining backwards compatible.
  * Supports ragel >= 6.0 now.
  * Corrected some tests.
  * Some minor changes.

## 2007-11-27 (1.1.2)
  * Remember default dir (last used directory) in editor.
  * JSON::Editor.edit method added, the editor can now receive json texts from
    the clipboard via C-v.
  * Load json texts from an URL pasted via middle button press.
  * Added :create_additions option to Parser. This makes it possible to disable
    the creation of additions by force, in order to treat json texts as data
    while having additions loaded.
  * Jacob Maine <jmaine@blurb.com> reported, that JSON(:foo) outputs a JSON
    object if the rails addition is enabled, which is wrong. It now outputs a
    JSON string "foo" instead, like suggested by Jacob Maine.
  * Discovered a bug in the Ruby Bugs Tracker on rubyforge, that was reported
    by John Evans lgastako@gmail.com. He could produce a crash in the JSON
    generator by returning something other than a String instance from a
    to_json method. I now guard against this by doing a rather crude type
    check, which raises an exception instead of crashing.

## 2007-07-06 (1.1.1)
  * Yui NARUSE <naruse@airemix.com> sent some patches to fix tests for Ruby
    1.9. I applied them and adapted some of them a bit to run both on 1.8 and
    1.9.
  * Introduced a `JSON.parse!` method without depth checking for people who
    like danger.
  * Made generate and `pretty_generate` methods configurable by an options hash.
  * Added :allow_nan option to parser and generator in order to handle NaN,
    Infinity, and -Infinity correctly - if requested. Floats, which aren't numbers,
    aren't valid JSON according to RFC4627, so by default an exception will be
    raised if any of these symbols are encountered. Thanks to Andrea Censi
    <andrea.censi@dis.uniroma1.it> for his hint about this.
  * Fixed some more tests for Ruby 1.9.
  * Implemented dump/load interface of Marshal as suggested in ruby-core:11405
    by murphy <murphy@rubychan.de>.
  * Implemented the `max_nesting` feature for generate methods, too.
  * Added some implementations for ruby core's custom objects for
    serialisation/deserialisation purposes.

## 2007-05-21 (1.1.0)
  * Implemented max_nesting feature for parser to avoid stack overflows for
    data from untrusted sources. If you trust the source, you can disable it
    with the option max_nesting => false.
  * Piers Cawley <pdcawley@bofh.org.uk> reported a bug, that not every
    character can be escaped by `\` as required by RFC4627. There's a
    contradiction between David Crockford's JSON checker test vectors (in
    tests/fixtures) and RFC4627, though. I decided to stick to the RFC, because
    the JSON checker seems to be a bit older than the RFC.
  * Extended license to Ruby License, which includes the GPL.
  * Added keyboard shortcuts, and 'Open location' menu item to edit_json.rb.

## 2007-05-09 (1.0.4)
  * Applied a patch from Yui NARUSE <naruse@airemix.com> to make JSON compile
    under Ruby 1.9. Thank you very much for mailing it to me!
  * Made binary variants of JSON fail early, instead of falling back to the
    pure version. This should avoid overshadowing of eventual problems while
    loading of the binary.

## 2007-03-24 (1.0.3)
  * Improved performance of pure variant a bit.
  * The ext variant of this release supports the mswin32 platform. Ugh!

## 2007-03-24 (1.0.2)
  * Ext Parser didn't parse 0e0 correctly into 0.0: Fixed!

## 2007-03-24 (1.0.1)
  * Forgot some object files in the build dir. I really like that - not!

## 2007-03-24 (1.0.0)
  * Added C implementations for the JSON generator and a ragel based JSON
    parser in C.
  * Much more tests, especially fixtures from json.org.
  * Further improved conformance to RFC4627.

## 2007-02-09 (0.4.3)
  * Conform more to RFC4627 for JSON: This means JSON strings
    now always must contain exactly one object `"{ ... }"` or array `"[ ... ]"` in
    order to be parsed without raising an exception. The definition of what
    constitutes a whitespace is narrower in JSON than in Ruby ([ \t\r\n]), and
    there are differences in floats and integers (no octals or hexadecimals) as
    well.
  * Added aliases generate and `pretty_generate` of unparse and `pretty_unparse`.
  * Fixed a test case.
  * Catch an `Iconv::InvalidEncoding` exception, that seems to occur on some Sun
    boxes with SunOS 5.8, if iconv doesn't support utf16 conversions. This was
    reported by Andrew R Jackson <andrewj@bcm.tmc.edu>, thanks a bunch!

## 2006-08-25 (0.4.2)
  * Fixed a bug in handling solidi (/-characters), that was reported by
    Kevin Gilpin <kevin.gilpin@alum.mit.edu>.

## 2006-02-06 (0.4.1)
  * Fixed a bug related to escaping with backslashes. Thanks for the report go
    to Florian Munz <surf@theflow.de>.

## 2005-09-23 (0.4.0)
  * Initial Rubyforge Version
