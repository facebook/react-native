# Installation & Update

To install or update CocoaPods see this [guide](https://guides.cocoapods.org/using/index.html).

To install release candidates run `[sudo] gem install cocoapods --pre`

## 1.14.3 (2023-11-19)

##### Enhancements

* None.  

##### Bug Fixes

* Revert minimum required Ruby version to 2.6 to support macOS system Ruby  
  [Eric Amorde](https://github.com/amorde)
  [#12122](https://github.com/CocoaPods/CocoaPods/issues/12122)


## 1.14.2 (2023-10-27)

##### Enhancements

* None.  

##### Bug Fixes

* None.  


## 1.14.1 (2023-10-26)

##### Enhancements

* None.  

##### Bug Fixes

* None.  


## 1.14.0 (2023-10-26)

##### Enhancements

* None.  

##### Bug Fixes

* Fix a crash when running with activesupport 7.1.0.  
  [MCanhisares](https://github.com/MCanhisares)
  [#12081](https://github.com/CocoaPods/CocoaPods/issues/12081)

* Fix another crash when running with activesupport 7.1.0.  
  [movila](https://github.com/movila)
  [#12089](https://github.com/CocoaPods/CocoaPods/issues/12089)

##### Other

* Drop support for `bazaar` SCM  


## 1.13.0 (2023-09-22)

##### Enhancements

* Add `visionOS` as a new platform.  
  [Gabriel Donadel](https://github.com/gabrieldonadel)
  [#11965](https://github.com/CocoaPods/CocoaPods/pull/11965)

* Extend `script_phase` DSL to support `always_out_of_date` attribute.  
  [Alvar Hansen](https://github.com/alvarhansen)
  [#12055](https://github.com/CocoaPods/CocoaPods/pull/12055)

##### Bug Fixes

* Use `safe_load` during custom YAML config loading.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#11974](https://github.com/CocoaPods/CocoaPods/pull/11974)

* Xcode 15 fix: Replace `DT_TOOLCHAIN_DIR` with `TOOLCHAIN_DIR` when generating script.  
  [Marcus Wu](https://github.com/marcuswu0814)
  [#12009](https://github.com/CocoaPods/CocoaPods/pull/12009)

## 1.12.1 (2023-04-18)

##### Enhancements

* None.  

##### Bug Fixes

* Xcode 14.3 fix: Pass the -f option when resolving the path to the symlinked source.  
  [Chris Vasselli](https://github.com/chrisvasselli)
  [#11828](https://github.com/CocoaPods/CocoaPods/pull/11828)
  [#11808](https://github.com/CocoaPods/CocoaPods/issues/11808)

* Fix typo in validation for `--validation-dir` help message  
  [Austin Evans](https://github.com/ajevans99)
  [#11857](https://github.com/CocoaPods/CocoaPods/issues/11857)

* Xcode 14.3 fix: `pod lib lint` warning generation from main.m.  
  [Paul Beusterien](https://github.com/paulb777)
  [#11846](https://github.com/CocoaPods/CocoaPods/issues/11846)

## 1.12.0 (2023-02-27)

##### Enhancements

* Add ability to specify the `validation-dir` during `lint`.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#11773](https://github.com/CocoaPods/CocoaPods/pull/11773)

* Correctly handle `.docc` documentation in source_files.  
  [haifengkao](https://github.com/haifengkao)
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#11438](https://github.com/CocoaPods/CocoaPods/pull/11438)
  [#10885](https://github.com/CocoaPods/CocoaPods/issues/10885)

* Re-use the same path lists for pods that share the same root.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#11417](https://github.com/CocoaPods/CocoaPods/pull/11417)

* Integrate `parallelizable` scheme DSL option.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#11399](https://github.com/CocoaPods/CocoaPods/pull/11399)

* Use `${DEVELOPMENT_LANGUAGE}` as the default `CFBundleDevelopmentRegion` value in any generated `Info.plist`.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#10950](https://github.com/CocoaPods/CocoaPods/pull/10950)

* Fix setting `LD_RUNTIME_SEARCH_PATHS` for aggregate targets that include dynamic xcframeworks.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#11158](https://github.com/CocoaPods/CocoaPods/pull/11158)

* Add method for formatting licenses for acknowledgements generation.  
  [Raihaan Shouhell](https://github.com/res0nance)
  [#10940](https://github.com/CocoaPods/CocoaPods/pull/10940)

* Add the ability to download pods in parallel  
  [Seth Friedman](https://github.com/sethfri)
  [#11232](https://github.com/CocoaPods/CocoaPods/pull/11232)

* Include subprojects in the plugin post-install hook context  
  [Eric Amorde](https://github.com/amorde)
  [#11224](https://github.com/CocoaPods/CocoaPods/pull/11224)

* Ensure the order of slices passed to the `install_xcframework` script (in the "Copy XCFrameworks" script build phase) is stable.  
  [Olivier Halligon](https://github.com/AliSoftware)
  [#11707](https://github.com/CocoaPods/CocoaPods/pull/11707)

##### Bug Fixes

* Fix incremental installation when a development pod is deleted.  
  [John Szumski](https://github.com/jszumski)
  [#11438](https://github.com/CocoaPods/CocoaPods/pull/11681)

* Clean sandbox when a pod switches from remote to local.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#11213](https://github.com/CocoaPods/CocoaPods/pull/11213)

* Run post install hooks when "skip Pods.xcodeproj generation" option is set  
  [Elton Gao](https://github.com/gyfelton)
  [#11073](https://github.com/CocoaPods/CocoaPods/pull/11073)

* Change minimal required version of ruby-macho to 2.3.0.  
  [xuzhongping](https://github.com/xuzhongping)
  [#10390](https://github.com/CocoaPods/CocoaPods/issues/10390)

* Add .gitignores to the banana and snake fixtures  
  [Seth Friedman](https://github.com/sethfri)
  [#11235](https://github.com/CocoaPods/CocoaPods/pull/11235)

* Fix publishing podspecs with watchOS support on Xcode 14  
  [Justin Martin](https://github.com/justinseanmartin)
  [#11660](https://github.com/CocoaPods/CocoaPods/pull/11660)

## 1.11.3 (2022-03-16)

##### Enhancements

* None.  

##### Bug Fixes

* Fix script breaking when attempting to print a warning.  
  [Igor Makarov](https://github.com/igor-makarov)
  [#11251](https://github.com/CocoaPods/CocoaPods/issues/11251)

* Do not consider podspec_repo when analying sandbox for changes.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#10985](https://github.com/CocoaPods/CocoaPods/pull/10985)

* Rewrite XCFramework slice selection using plist metadata.  
  [Igor Makarov](https://github.com/igor-makarov)
  [#11229](https://github.com/CocoaPods/CocoaPods/pull/11229)

* Fix setting `LD_RUNTIME_SEARCH_PATHS` for aggregate targets that include dynamic xcframeworks.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#11158](https://github.com/CocoaPods/CocoaPods/pull/11158)

* Add catch for YAML syntax error to prevent crash in `cdn_url?` check.  
  [Kanstantsin Shautsou](https://github.com/KostyaSha)
  [#11010](https://github.com/CocoaPods/CocoaPods/issues/11010)

* Fix static Swift XCFramework import paths.  
  [Igor Makarov](https://github.com/igor-makarov)
  [#11058](https://github.com/CocoaPods/CocoaPods/issues/10058)
  [#11093](https://github.com/CocoaPods/CocoaPods/pull/11093)

## 1.11.2 (2021-09-13)

##### Enhancements

* None.  

##### Bug Fixes

* Do not validate modular header dependencies for pre-built Swift pods.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#10912](https://github.com/CocoaPods/CocoaPods/issues/10912)


## 1.11.1 (2021-09-12)

##### Enhancements

* None.  

##### Bug Fixes

* Handle spec repo urls with user info when determining if they are CDN.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#10941](https://github.com/CocoaPods/CocoaPods/issues/10941)

* Set `INFOPLIST_FILE` build setting to `$(SRCROOT)/App/App-Info.plist` during lint.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#10927](https://github.com/CocoaPods/CocoaPods/issues/10927)

* Set `PRODUCT_BUNDLE_IDENTIFIER` for generated app during lint.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#10933](https://github.com/CocoaPods/CocoaPods/issues/10933)


## 1.11.0 (2021-09-01)

##### Enhancements

* None.  

##### Bug Fixes

* None.  


## 1.11.0.rc.1 (2021-08-25)

##### Enhancements

* None.  

##### Bug Fixes

* Correctly process multiple `xcframeworks` a pod provides.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#10378](https://github.com/CocoaPods/CocoaPods/issues/10378)


## 1.11.0.beta.2 (2021-08-11)

##### Enhancements

* Integrate ODR categories into projects.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#10855](https://github.com/CocoaPods/CocoaPods/pull/10855)

##### Bug Fixes

* Pass correct paths for `select_slice` method.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#10430](https://github.com/CocoaPods/CocoaPods/issues/10430)


## 1.11.0.beta.1 (2021-08-09)

##### Enhancements

* Add support for integrating on demand resources.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [JunyiXie](https://github.com/JunyiXie)
  [#9606](https://github.com/CocoaPods/CocoaPods/issues/9606)
  [#10845](https://github.com/CocoaPods/CocoaPods/pull/10845)

* Integrate `project_header_files` specified by specs.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9820](https://github.com/CocoaPods/CocoaPods/issues/9820)

* Mark RealityComposer-projects (`.rcproject`) files defined in resources for compilation.  
  [Hendrik von Prince](https://github.com/parallaxe)
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#10793](https://github.com/CocoaPods/CocoaPods/pull/10793)

* Integrate test specs and app specs of pre-built pods.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#10795](https://github.com/CocoaPods/CocoaPods/pull/10795)

* Add support for `before_headers` and `after_headers` script phase DSL.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#10770](https://github.com/CocoaPods/CocoaPods/issues/10770)

* Fix touch on a missing directory for dSYM copy phase script.  
  [alvarollmenezes](https://github.com/alvarollmenezes)
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#10488](https://github.com/CocoaPods/CocoaPods/issues/10488)

* Check the podfile sources and plugin sources when printing warnings without explicitly using the master source.  
  [gonghonglou](https://github.com/gonghonglou)
  [#10764](https://github.com/CocoaPods/CocoaPods/pull/10764)

* Use relative paths in copy dsyms script.  
  [Mickey Knox](https://github.com/knox)
  [#10583](https://github.com/CocoaPods/CocoaPods/pull/10583)

* Use `OpenURI.open_uri` instead.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#10597](https://github.com/CocoaPods/CocoaPods/issues/10597)

* Set minimum supported Ruby version to 2.6.  
  [Igor Makarov](https://github.com/igor-makarov)
  [#10412](https://github.com/CocoaPods/CocoaPods/pull/10412)

* Improve compatibility with ActiveSupport 6  
  [Jun Jiang](https://github.com/jasl)
  [#10364](https://github.com/CocoaPods/CocoaPods/pull/10364)

* Add a `pre_integrate_hook` API  
  [dcvz](https://github.com/dcvz)
  [#9935](https://github.com/CocoaPods/CocoaPods/pull/9935)

* Rewrite the only place dependent on `typhoeus`.  
  [Jun Jiang](https://github.com/jasl), [Igor Makarov](https://github.com/igor-makarov)
  [#10346](https://github.com/CocoaPods/CocoaPods/pull/10346)

* Add a `--update-sources` option to `pod repo push` so one can ensure sources are up-to-date.  
  [Elton Gao](https://github.com/gyfelton)
  [Justin Martin](https://github.com/justinseanmartin)
  
* Installing a local (`:path`) pod that defines script phases will no longer
  produce warnings.  
  [Samuel Giddins](https://github.com/segiddins)

* Allow building app & test spec targets that depend on a library that uses
  Swift without requiring an empty Swift file be present.  
  [Samuel Giddins](https://github.com/segiddins)

* Add flag to ignore prerelease versions when reporting latest version for outdated pods.  
  [cltnschlosser](https://github.com/cltnschlosser)
  [#9916](https://github.com/CocoaPods/CocoaPods/pull/9916)

* Add possibility to skip modulemap generation  
  [till0xff](https://github.com/till0xff)
  [#10235](https://github.com/CocoaPods/CocoaPods/issues/10235)

* Add a `--version` option to `pod spec cat` and `pod spec which` for listing the podspec of a specific version  
  [pietbrauer](https://github.com/pietbrauer)
  [#10609](https://github.com/CocoaPods/CocoaPods/pull/10609)

##### Bug Fixes

* Fix resource variant groups in static frameworks  
  [Igor Makarov](https://github.com/igor-makarov)
  [#10834](https://github.com/CocoaPods/CocoaPods/pull/10834)
  [#10605](https://github.com/CocoaPods/CocoaPods/issues/10605)

* Fix adding embed frameworks script phase to unit test targets if xcframeworks are present.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#10652](https://github.com/CocoaPods/CocoaPods/issues/10652)

* Remove unused `install_xcframework_library` code.  
  [Gio Lodi](https://github.com/mokagio)
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#10831](https://github.com/CocoaPods/CocoaPods/pull/10831)

* Validate vendored library names after they have been expanded.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#10832](https://github.com/CocoaPods/CocoaPods/pull/10832)

* Place frameworks from xcframeworks into a unique folder name to avoid duplicate outputs.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#10106](https://github.com/CocoaPods/CocoaPods/issues/10106)

* Update pod in Pods folder when changing the pod from branch to version in Podfie.  
  [gonghonglou](https://github.com/gonghonglou)
  [#10825](https://github.com/CocoaPods/CocoaPods/pull/10825)

* Bump addressable dependency to 2.8.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#10802](https://github.com/CocoaPods/CocoaPods/issues/10802)

* Dedup bcsymbolmap paths found from multiple vendored frameworks.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#10373](https://github.com/CocoaPods/CocoaPods/issues/10373)

* Correctly filter dependencies for pod variants across different platforms.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#10777](https://github.com/CocoaPods/CocoaPods/issues/10777)

* Generate default `Info.plist` for consumer app during validation.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8570](https://github.com/CocoaPods/CocoaPods/issues/8570)

* Fix lint subspec error when the name of subspec start with the pod name.  
  [XianpuMeng](https://github.com/XianpuMeng)
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9906](https://github.com/CocoaPods/CocoaPods/issues/9906)

* Update `ruby-macho` gem version to support 1.x and 2.x.  
  [Eric Chamberlain](https://github.com/PeqNP)
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#10390](https://github.com/CocoaPods/CocoaPods/issues/10390)

* Respect `--configuration` option when analyzing via `pod lib lint --analyze`.  
  [Jenn Magder](https://github.com/jmagman)
  [#10476](https://github.com/CocoaPods/CocoaPods/issues/10476)

* Do not add dependencies to 'Link Binary With Libraries' phase.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#10133](https://github.com/CocoaPods/CocoaPods/pull/10133)

* Ensure cache integrity on concurrent installations.  
  [Erik Blomqvist](https://github.com/codiophile)
  [#10013](https://github.com/CocoaPods/CocoaPods/issues/10013)

* Force a clean install if installation options change.  
  [Sebastian Shanus](https://github.com/sebastianv1)
  [#10016](https://github.com/CocoaPods/CocoaPods/pull/10016)

* Correctly detect that a prebuilt pod uses Swift.  
  [Elton Gao](https://github.com/gyfelton)
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8649](https://github.com/CocoaPods/CocoaPods/issues/8649)

* fix: ensure cached spec path uniq  
  [SolaWing](https://github.com/SolaWing)
  [#10231](https://github.com/CocoaPods/CocoaPods/issues/10231)
  
* Set `knownRegions` on generated projects with localized resources to prevent Xcode from re-saving projects to disk.  
  [Eric Amorde](https://github.com/amorde)
  [#10290](https://github.com/CocoaPods/CocoaPods/pull/10290)

* Serialize schemes that do not need to be rewritten by Xcode.  
  [Samuel Giddins](https://github.com/segiddins)


## 1.10.2 (2021-07-28)

##### Enhancements

* None.  

##### Bug Fixes

* Fix errors when archiving a Catalyst app which depends on a pod which uses `header_mappings_dir`.  
  [Thomas Goyne](https://github.com/tgoyne)
  [#10224](https://github.com/CocoaPods/CocoaPods/pull/10224)

* Fix missing `-ObjC` for static XCFrameworks - take 2  
  [Paul Beusterien](https://github.com/paulb777)
  [#10459](https://github.com/CocoaPods/CocoaPods/issuess/10459)

* Change URL validation failure to a note  
  [Paul Beusterien](https://github.com/paulb777)
  [#10291](https://github.com/CocoaPods/CocoaPods/issues/10291)


## 1.10.1 (2021-01-07)

##### Enhancements

* None.

##### Bug Fixes

* Fix library name in LD `-l` flags for XCFrameworks containing libraries  
  [Wes Campaigne](https://github.com/Westacular)
  [#10165](https://github.com/CocoaPods/CocoaPods/issues/10165)

* Fix file extension replacement for resource paths when using static frameworks.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#10206](https://github.com/CocoaPods/CocoaPods/issues/10206)

* Fix processing of xcassets resources when pod target is static framework  
  [Federico Trimboli](https://github.com/fedetrim)
  [#10175](https://github.com/CocoaPods/CocoaPods/pull/10175)
  [#10170](https://github.com/CocoaPods/CocoaPods/issues/10170)

* Fix missing `-ObjC` for static XCFrameworks  
  [Paul Beusterien](https://github.com/paulb777)
  [#10234](https://github.com/CocoaPods/CocoaPods/pull/10234)


## 1.10.0 (2020-10-20)

##### Enhancements

* None.  

##### Bug Fixes

* Generate the correct LD `-l` flags for XCFrameworks containing libraries  
  [Wes Campaigne](https://github.com/Westacular)
  [#10071](https://github.com/CocoaPods/CocoaPods/issues/10071)

* Add support for automatically embedding XCFramework debug symbols for XCFrameworks generated with Xcode 12  
  [johntmcintosh](https://github.com/johntmcintosh)
  [#10111](https://github.com/CocoaPods/CocoaPods/issues/10111)

## 1.10.0.rc.1 (2020-09-15)

##### Enhancements

* None.  

##### Bug Fixes

* Fix XCFramework slice selection  
  [lowip](https://github.com/lowip)
  [#10026](https://github.com/CocoaPods/CocoaPods/issues/10026)

* Honor test spec deployment target during validation.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9999](https://github.com/CocoaPods/CocoaPods/pull/9999)

* Ensure that incremental installation is able to set target dependencies for a
  test spec that uses a custom `app_host_name` that is in a project that is not
  regenerated.  
  [Samuel Giddins](https://github.com/segiddins)


## 1.10.0.beta.2 (2020-08-12)

##### Enhancements

* None.  

##### Bug Fixes

* Ensure that static frameworks are not embedded  
  [Bernard Gatt](https://github.com/BernardGatt)
  [#9943](https://github.com/CocoaPods/CocoaPods/issues/9943)

* Ensure that the non-compilable resource skipping in static frameworks happens only for the pod itself  
  [Igor Makarov](https://github.com/igor-makarov)
  [#9922](https://github.com/CocoaPods/CocoaPods/pull/9922)
  [#9920](https://github.com/CocoaPods/CocoaPods/issues/9920)


## 1.10.0.beta.1 (2020-07-17)

##### Breaking

* Bump minimum Ruby version to 2.3.3 (included with macOS High Sierra)  
  [Eric Amorde](https://github.com/amorde)
  [#9821](https://github.com/CocoaPods/CocoaPods/issues/9821)

##### Enhancements

* Add the App Clip product symbol to the list of products that need embedding.  
  [Igor Makarov](https://github.com/igor-makarov)
  [#9882](https://github.com/CocoaPods/CocoaPods/pull/9882)

* Allow gem to run as root when passing argument flag `--allow-root`  
  [Sean Reinhardt](https://github.com/seanreinhardtapps)
  [#8929](https://github.com/CocoaPods/CocoaPods/issues/8929)
  
* Warn users to delete the master specs repo if its not explicitly used.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9871](https://github.com/CocoaPods/CocoaPods/pull/9871)

* Use User Project's compatibilityVersion instead of objectVersion when
  deciding when to use xcfilelists.  
  [Sean Reinhardt](https://github.com/seanreinhardtapps)
  [#9140](https://github.com/CocoaPods/CocoaPods/issues/9140)
  
* add a `--configuration` option to `pod lib lint` and `pod spec lint`.  
  [Gereon Steffens](https://github.com/gereons)
  [#9686](https://github.com/CocoaPods/CocoaPods/issues/9686)

* Add a `post_integrate_hook` API  
  [lucasmpaim](https://github.com/lucasmpaim)
  [#7432](https://github.com/CocoaPods/CocoaPods/issues/7432)

* Set the `BUILD_LIBRARY_FOR_DISTRIBUTION` build setting if integrating with a target that has the setting set to `YES`.  
  [Juanjo López](https://github.com/juanjonol)
  [#9232](https://github.com/CocoaPods/CocoaPods/issues/9232)

* Option to lint a specified set of test_specs  
  [Paul Beusterien](https://github.com/paulb777)
  [#9392](https://github.com/CocoaPods/CocoaPods/pull/9392)

* Add `--use-static-frameworks` lint option  
  [Paul Beusterien](https://github.com/paulb777)
  [#9632](https://github.com/CocoaPods/CocoaPods/pull/9632)

* Exclude the local spec-repos directory from Time Machine Backups.  
  [Jakob Krigovsky](https://github.com/sonicdoe)
  [#8308](https://github.com/CocoaPods/CocoaPods/issues/8308)

##### Bug Fixes

* Override Xcode 12 default for erroring on quoted imports in umbrellas.  
  [Paul Beusterien](https://github.com/paulb777)
  [#9902](https://github.com/CocoaPods/CocoaPods/issues/9902)

* Remove bitcode symbol maps from embedded framework bundles  
  [Eric Amorde](https://github.com/amorde)
  [#9681](https://github.com/CocoaPods/CocoaPods/issues/9681)

* Prevent "source changed" message for every version change when using trunk source  
  [cltnschlosser](https://github.com/cltnschlosser)
  [#9865](https://github.com/CocoaPods/CocoaPods/issues/9865)

* When pod target is a static framework, save time by copying compiled resources  
  [Igor Makarov](https://github.com/igor-makarov)
  [#9441](https://github.com/CocoaPods/CocoaPods/pull/9441)

* Re-implement `bcsymbolmap` copying to avoid duplicate outputs.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [mplorentz](https://github.com/mplorentz)
  [#9734](https://github.com/CocoaPods/CocoaPods/pull/9734)

* Fix Xcode 11 warning when setting Bundle Identifier in `info_plist`  
  [Sean Reinhardt](https://github.com/seanreinhardtapps)
  [#9536](https://github.com/CocoaPods/CocoaPods/issues/9536)

* Fix `incompatible encoding regexp match` for linting non-ascii pod name  
  [banjun](https://github.com/banjun)
  [#9765](https://github.com/CocoaPods/CocoaPods/issues/9765)
  [#9776](https://github.com/CocoaPods/CocoaPods/pull/9776)

* Fix crash when targets missing in Podfile  
  [Paul Beusterien](https://github.com/paulb777)
  [#9745](https://github.com/CocoaPods/CocoaPods/pull/9745)

* Fix adding developer library search paths during pod validation.  
  [Nick Entin](https://github.com/NickEntin)
  [#9736](https://github.com/CocoaPods/CocoaPods/pull/9736)

* Fix an issue that caused multiple xcframework scripts to produce the same output files  
  [Eric Amorde](https://github.com/amorde)
  [#9670](https://github.com/CocoaPods/CocoaPods/issues/9670)
  [#9720](https://github.com/CocoaPods/CocoaPods/pull/9720)

* Fix an issue preventing framework user targets with an xcframework dependency from building successfully  
  [Eric Amorde](https://github.com/amorde)
  [#9525](https://github.com/CocoaPods/CocoaPods/issues/9525)
  [#9720](https://github.com/CocoaPods/CocoaPods/pull/9720)

* Fix an issue preventing xcframeworks that wrapped static libraries from linking successfully  
  [Eric Amorde](https://github.com/amorde)
  [#9528](https://github.com/CocoaPods/CocoaPods/issues/9528)
  [#9720](https://github.com/CocoaPods/CocoaPods/pull/9720)

* Fix setting `swift_version` when deduplicate targets is turned off.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9689](https://github.com/CocoaPods/CocoaPods/pull/9689)

* Honor prefix_header_file=false for subspecs  
  [Paul Beusterien](https://github.com/paulb777)
  [#9687](https://github.com/CocoaPods/CocoaPods/pull/9687)

* Do not clean user projects from sandbox.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9683](https://github.com/CocoaPods/CocoaPods/pull/9683)

* Fix mapping of resource paths for app specs.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9676](https://github.com/CocoaPods/CocoaPods/pull/9676)

* When preserving pod paths, preserve ALL the paths  
  [Igor Makarov](https://github.com/igor-makarov)
  [#9483](https://github.com/CocoaPods/CocoaPods/pull/9483)

* Re-implement `dSYM` copying and stripping to avoid duplicate outputs.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9185](https://github.com/CocoaPods/CocoaPods/issues/9185)

* Add support for running tests through the scheme of the app spec host of a test spec    
  [Eric Amorde](https://github.com/amorde)
  [#9332](https://github.com/CocoaPods/CocoaPods/issues/9332)

* Fix an issue that prevented variables in test bundle scheme settings from expanding   
  [Eric Amorde](https://github.com/amorde)
  [#9539](https://github.com/CocoaPods/CocoaPods/pull/9539)

* Fix project path handling issue that caused cmake projects to be incorrect  
  [Paul Beusterien](https://github.com/paulb777)
  [Andrew](https://github.com/mad-rain)
  [#6268](https://github.com/CocoaPods/CocoaPods/pull/6268)

* Set `Missing Localizability` setting to `'YES'` to prevent warnings in Xcode 11  
  [Eric Amorde](https://github.com/amorde)
  [#9612](https://github.com/CocoaPods/CocoaPods/pull/9612)

* Don't crash on non UTF-8 error message  
  [Kenji KATO](https://github.com/katoken-0215)
  [#9706](https://github.com/CocoaPods/CocoaPods/pull/9706)

* Fix XCFramework slice selection when having more archs in slice than requested with $ARCHS  
  [jerbob92](https://github.com/jerbob92)
  [#9790](https://github.com/CocoaPods/CocoaPods/pull/9790)

* Don't add app spec dependencies to the parent library's target in Xcode,
  which was happening when the dependency's project was not being regenerated
  due to incremental installation.  
  [segiddins][https://github.com/segiddins]

* Add the trunk repo to the default `sources` for the `repo push` command  
  [Elf Sundae](https://github.com/ElfSundae)
  [#9840](https://github.com/CocoaPods/CocoaPods/pull/9840)

## 1.9.3 (2020-05-29)

##### Enhancements

* None.  

##### Bug Fixes

* None.  


## 1.9.2 (2020-05-22)

##### Enhancements

* None.  

##### Bug Fixes

* None.  


## 1.9.1 (2020-03-09)

##### Enhancements

##### Bug Fixes

* Apply correct `SYSTEM_FRAMEWORK_SEARCH_PATHS` for `XCTUnwrap` fix.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9579](https://github.com/CocoaPods/CocoaPods/pull/9579)

* Fix an issue that caused a build failure with vendored XCFrameworks on macOS  
  [Eric Amorde](https://github.com/amorde)
  [#9572](https://github.com/CocoaPods/CocoaPods/issues/9572)

* Fix an issue that prevented the correct XCFramework slice from being selected for watchOS extensions  
  [Eric Amorde](https://github.com/amorde)
  [#9569](https://github.com/CocoaPods/CocoaPods/issues/9569)


## 1.9.0 (2020-02-25)

##### Enhancements

* None.  

##### Bug Fixes

* Also apply Xcode 11 `XCTUnwrap` fix to library and framework targets that weakly link `XCTest`.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9518](https://github.com/CocoaPods/CocoaPods/pull/9518)

* Fix dSYM handling for XCFrameworks.  
  [Eric Amorde](https://github.com/amorde)
  [#9530](https://github.com/CocoaPods/CocoaPods/issues/9530)

## 1.9.0.beta.3 (2020-02-04)

##### Enhancements

* PathList optimizations related to file system reads.  
  [manuyavuz](https://github.com/manuyavuz)
  [#9428](https://github.com/CocoaPods/CocoaPods/pull/9428)

##### Bug Fixes

* Apply Xcode 11 `XCTUnwrap` fix to library and framework targets.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9500](https://github.com/CocoaPods/CocoaPods/pull/9500)

* Fix resources script when building a project from a symlink.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9423](https://github.com/CocoaPods/CocoaPods/issues/9423)

* Fix `pod install` crash on projects with atypical configuration names.  
  [Paul Beusterien](https://github.com/paulb777)
  [#9465](https://github.com/CocoaPods/CocoaPods/pull/9465)

* Fix an issue that caused iOS archives to be invalid when including a vendored XCFramework  
  [Eric Amorde](https://github.com/amorde)
  [#9458](https://github.com/CocoaPods/CocoaPods/issues/9458)

* Fix a bug where an incremental install missed library resources.  
  [Igor Makarov](https://github.com/igor-makarov)
  [#9431](https://github.com/CocoaPods/CocoaPods/pull/9431)

* Fix an issue that caused an incorrect warning to be emitted for CLI targets with static libraries  
  [Eric Amorde](https://github.com/amorde)
  [#9498](https://github.com/CocoaPods/CocoaPods/issues/9498)

## 1.9.0.beta.2 (2019-12-17)

##### Enhancements

* None.  

##### Bug Fixes

* Fix validator to properly integration project during `lint`.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9416](https://github.com/CocoaPods/CocoaPods/pull/9416)

## 1.9.0.beta.1 (2019-12-16)

##### Enhancements

* Support for scheme code coverage.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8921](https://github.com/CocoaPods/CocoaPods/issues/8921)

* Support Swift version variants.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9230](https://github.com/CocoaPods/CocoaPods/pull/9230)

* Configure dependencies per configuration.  
  [Samuel Giddins](https://github.com/segiddins)
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9149](https://github.com/CocoaPods/CocoaPods/pull/9149)

* Include Podfile Plugin changes for incremental installation.  
  [Sebastian Shanus](https://github.com/sebastianv1)
  [#9147](https://github.com/CocoaPods/CocoaPods/pull/9147)

* Integrate `use_frameworks!` linkage DSL.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9099](https://github.com/CocoaPods/CocoaPods/issues/9099)

* Add support for integrating dependency file in user script phases.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9082](https://github.com/CocoaPods/CocoaPods/issues/9082)
 
* Add support for XCFrameworks using the `vendored_frameworks` Podspec DSL.  
  [Eric Amorde](https://github.com/amorde)
  [#9148](https://github.com/CocoaPods/CocoaPods/issues/9148)

##### Bug Fixes

* Move `run_podfile_post_install_hooks` call to execute right before projects are saved.  
  [Yusuf Sobh](https://github.com/yusufoos)
  [#9379](https://github.com/CocoaPods/CocoaPods/issues/9379)

* Do not apply header mapping copy if the spec does not provide a header mappings dir.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9308](https://github.com/CocoaPods/CocoaPods/issues/9308)

* Fix issue where workspace was missing user project references during incremental installation.  
  [Sebastian Shanus](https://github.com/sebastianv1)
  [#9237](https://github.com/CocoaPods/CocoaPods/issues/9237)

* Search in users xcconfig's for figuring out when to set `APPLICATION_EXTENSION_API_ONLY`.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9233](https://github.com/CocoaPods/CocoaPods/issues/9233)

* Always generate a lockfile even if project integration is disabled.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9288](https://github.com/CocoaPods/CocoaPods/issues/9288)

* Fix incremental installation with plugins that include arguments with different ordering.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9170](https://github.com/CocoaPods/CocoaPods/pull/9170)

* Move custom `Copy Headers` script phase for header mappings before `Compile Sources`.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9131](https://github.com/CocoaPods/CocoaPods/pull/9131)

* Don't create a conflicting `LaunchScreen.storyboard` when an app spec contains a file
  with that name in its `resources`.  
  [Samuel Giddins](https://github.com/segiddins)


## 1.8.4 (2019-10-16)

##### Enhancements

* None.  

##### Bug Fixes

* Do not crash if the repos dir is not setup.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9216](https://github.com/CocoaPods/CocoaPods/issues/9216)

## 1.8.3 (2019-10-04)

##### Enhancements

* None.  

##### Bug Fixes

* Fix crash when running on mounted filesystems  
  [Paul Beusterien](https://github.com/paulb777)
  [#9200](https://github.com/CocoaPods/CocoaPods/pull/9200)


## 1.8.1 (2019-09-27)

##### Enhancements

* None.  

##### Bug Fixes

* None.  


## 1.8.0 (2019-09-23)

##### Enhancements

* None.  

##### Bug Fixes

* Include dependent vendored frameworks in linker flags  
  [Alex Coomans](https://github.com/drcapulet)
  [#9045](https://github.com/CocoaPods/CocoaPods/pull/9045)

* Correctly set deployment target for non library specs even if the root spec does not specify one.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9153](https://github.com/CocoaPods/CocoaPods/pull/9153)

* Make `APPLICATION_EXTENSION_API_ONLY` build setting not break when performing a cached incremental install.  
  [Igor Makarov](https://github.com/igor-makarov)
  [#8967](https://github.com/CocoaPods/CocoaPods/issues/8967)
  [#9141](https://github.com/CocoaPods/CocoaPods/issues/9141)
  [#9142](https://github.com/CocoaPods/CocoaPods/pull/9142)

## 1.8.0.beta.2 (2019-08-27)

##### Enhancements

* None.  

##### Bug Fixes

* Do not verify deployment target version during resolution for non library specs.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9105](https://github.com/CocoaPods/CocoaPods/issues/9105)

* Add `USE_RECURSIVE_SCRIPT_INPUTS_IN_SCRIPT_PHASES = YES` to all `.xcconfig`s  
  [Igor Makarov](https://github.com/igor-makarov)
  [#8073](https://github.com/CocoaPods/CocoaPods/issues/8073)
  [#9125](https://github.com/CocoaPods/CocoaPods/pull/9125)
  [cocoapods-integration-specs#248](https://github.com/CocoaPods/cocoapods-integration-specs/pull/248)

* Fix iOS app spec code signing.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9110](https://github.com/CocoaPods/CocoaPods/issues/9110)

* Add Apple watch device family to resource bundles built for WatchOS  
  [Aaron McDaniel](https://github.com/Spilly)
  [#9075](https://github.com/CocoaPods/CocoaPods/issues/9075)

## 1.8.0.beta.1 (2019-08-05)

##### Enhancements

* Allow Algolia search for CDNSource  
  [Igor Makarov](https://github.com/igor-makarov)
  [#9015](https://github.com/CocoaPods/CocoaPods/issues/9015)
  [#9046](https://github.com/CocoaPods/CocoaPods/pull/9046)
  [Core#569](https://github.com/CocoaPods/Core/pull/569)

* Using `repo push` now pushes to the current repo branch (`HEAD`) instead of `master`  
  [Jhonatan Avalos](https://github.com/baguio)
  [#8630](https://github.com/CocoaPods/CocoaPods/pull/8630)  

* Add support for UI test specs with `test_type` value `:ui`  
  [Yavuz Nuzumlali](https://github.com/manuyavuz)
  [#9002](https://github.com/CocoaPods/CocoaPods/pull/9002)
  [Core#562](https://github.com/CocoaPods/Core/pull/562)

* Replace git-based `MasterSource` with CDN-based `TrunkSource`  
  [Igor Makarov](https://github.com/igor-makarov)
  [#8923](https://github.com/CocoaPods/CocoaPods/pull/8923)
  [Core#552](https://github.com/CocoaPods/Core/pull/552)

* Integrate a pod into a custom project name if specified.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso) & [Sebastian Shanus](https://github.com/sebastianv1)
  [#8939](https://github.com/CocoaPods/CocoaPods/pull/8939)

* Performance optimization for large number of files related to cleaning sandbox directory during installation  
  [hovox](https://github.com/hovox)
  [#8797](https://github.com/CocoaPods/CocoaPods/issues/8797)

* Add support for Specification Info.plist DSL  
  [Eric Amorde](https://github.com/amorde)
  [#8753](https://github.com/CocoaPods/CocoaPods/issues/8753)
  [#3032](https://github.com/CocoaPods/CocoaPods/issues/3032)

* Fix target definition display name for inhibit warnings message.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8935](https://github.com/CocoaPods/CocoaPods/pull/8935)

* Allow using an application defined by an app spec as the app host for a test spec.  
  [jkap](https://github.com/jkap)
  [Samuel Giddins](https://github.com/segiddins)
  [#8654](https://github.com/CocoaPods/CocoaPods/pull/8654)

* Speed up dependency resolution when there are many requirements for the same pod
  or many versions that do not satisfy the given requirements.  
  [Samuel Giddins](https://github.com/segiddins)

* Add support for pods in abstract-only targets to be installed.  
  [Samuel Giddins](https://github.com/segiddins)

* Emit a warning when attempting to integrate dynamic frameworks into command line tool targets  
  [Eric Amorde](https://github.com/amorde)
  [#6493](https://github.com/CocoaPods/CocoaPods/issues/6493)

* Always suggest `pod repo update` on dependency resolution conflict,
  unless repo update was specifically requested.
  [Artem Sheremet](https://github.com/dotdoom)
  [#8768](https://github.com/CocoaPods/CocoaPods/pull/8768)

* Set Default Module for Storyboards in resource bundle targets.  
  [James Treanor](https://github.com/jtreanor)
  [#8890](https://github.com/CocoaPods/CocoaPods/pull/8890)

* Print correct platform name when inferring target platform.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8916](https://github.com/CocoaPods/CocoaPods/pull/8916)

* Do not re-write sandbox files if they have not changed.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8983](https://github.com/CocoaPods/CocoaPods/pull/8983)

* Added option to skip Pods.xcodeproj generation  
  [Itay Brenner](https://github.com/itaybre)
  [8872](https://github.com/CocoaPods/CocoaPods/pull/8872)

##### Bug Fixes

* Update symlink script to prevent duplicate files  
  [Alex Coomans](https://github.com/drcapulet)
  [#9035](https://github.com/CocoaPods/CocoaPods/pull/9035)

* Use correct `header_mappings_dir` for subspecs  
  [Alex Coomans](https://github.com/drcapulet)
  [#9019](https://github.com/CocoaPods/CocoaPods/pull/9019)

* Make CDNSource show up in `pod repo env`  
  [Igor Makarov](https://github.com/igor-makarov)
  [#9016](https://github.com/CocoaPods/CocoaPods/pull/9016)

* Fix regenerating aggregate targets for incremental installation.  
  [Sebastian Shanus](https://github.com/sebastianv1)
  [#9009](https://github.com/CocoaPods/CocoaPods/pull/9009)

* Fix heuristic for determining whether the source URL to be added is CDN  
  [Igor Makarov](https://github.com/igor-makarov)
  [#9000](https://github.com/CocoaPods/CocoaPods/issues/9000)
  [#8999](https://github.com/CocoaPods/CocoaPods/issues/8999)

* Fix set `cache_root` from config file error  
  [tripleCC](https://github.com/tripleCC)
  [#8515](https://github.com/CocoaPods/CocoaPods/issues/8515)

* Set default build configurations for app / test specs when installing with
  `integrate_targets: false`, ensuring the `Embed Frameworks` and
  `Copy Resources` scripts will copy the necessary build artifacts.  
  [Samuel Giddins](https://github.com/segiddins)

* No longer show a warning when using an optional include (`#include?`) to
  include the Pods .xcconfig from the base .xcconfig file  
  [Rob Hudson](https://github.com/robtimp)

* Remove stale podspecs from 'Local Podspecs' when installing non-local counterparts.  
  [Pär Strindevall](https://github.com/parski)
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8914](https://github.com/CocoaPods/CocoaPods/pull/8914)

* Fix inheriting search paths for test targets in `init` command.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8868](https://github.com/CocoaPods/CocoaPods/issues/8868)

* Allow detecting `SWIFT_VERSION` build settings from user targets when some
  xcconfig files are missing.  
  [Samuel Giddins](https://github.com/segiddins)

* Only return library itself as a framework path for library specs.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9029](https://github.com/CocoaPods/CocoaPods/pull/9029)
  
* Fix a bug that prevented dependencies in a plugin source from resolving  
  [Eric Amorde](https://github.com/amorde)
  [#8540](https://github.com/CocoaPods/CocoaPods/issues/8540)

* Store relative project and file paths in the incremental cache.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9041](https://github.com/CocoaPods/CocoaPods/pull/9041)

* Use correct deployment target for test specs and app specs.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9040](https://github.com/CocoaPods/CocoaPods/pull/9040)

* Allow overriding custom xcconfig entries set for compiling a library when
  specifying an app or test spec.  
  [Samuel Giddins](https://github.com/segiddins)

* Pass a non-browser user agent for social media validation  
  [Dov Frankel](https://github.com/abbeycode)
  [CocoaPods/Core#571](https://github.com/CocoaPods/Core/pull/571)
  [#9053](https://github.com/CocoaPods/Cocoapods/pull/9053)
  [#9049](https://github.com/CocoaPods/CocoaPods/issues/9049)

* Do not add CocoaPods script phases to targets that have no paths to embed.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9069](https://github.com/CocoaPods/CocoaPods/pull/9069)


## 1.7.5 (2019-07-19)

##### Enhancements

* None.  

##### Bug Fixes

* Do not pass inhibit warnings compiler flags for Swift source files.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#9013](https://github.com/CocoaPods/CocoaPods/issues/9013)


## 1.7.4 (2019-07-09)

##### Enhancements

* None.  

##### Bug Fixes

* Handle scheme configuration for specs with unsupported platforms.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8850](https://github.com/CocoaPods/CocoaPods/issues/8850)


## 1.7.3 (2019-06-28)

##### Enhancements

* None.  

##### Bug Fixes

* Honor the Swift version set by a dependency pod during lint.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8940](https://github.com/CocoaPods/CocoaPods/issues/8940)


## 1.7.2 (2019-06-13)

##### Enhancements

* None.  

##### Bug Fixes

* Prevent crash when configuring schemes for subspecs.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8880](https://github.com/CocoaPods/CocoaPods/issues/8880)

* Attempt to use Swift version for dependencies during lint.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8764](https://github.com/CocoaPods/CocoaPods/issues/8764)


## 1.7.1 (2019-05-30)

##### Enhancements

* None.  

##### Bug Fixes

* Stabilize product reference UUIDs to fix Xcode crashing with incremental installation.  
  [Sebastian Shanus](https://github.com/sebastianv1)
  [#8845](https://github.com/CocoaPods/CocoaPods/pull/8845)

* Fix a 1.7.0 regression in header directory paths when using static libraries  
  [Eric Amorde](https://github.com/amorde)
  [#8836](https://github.com/CocoaPods/CocoaPods/issues/8836)


## 1.7.0 (2019-05-22)

##### Enhancements

* None.  

##### Bug Fixes

* Fix 1.7.0.rc.2 regression - Resources need to be added for test specs in library builds  
  [Paul Beusterien](https://github.com/paulb777)
  [#8812](https://github.com/CocoaPods/CocoaPods/pull/8812)

* Configure schemes regardless if they are being shared or not.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8815](https://github.com/CocoaPods/CocoaPods/pull/8815)

* Update dSYM stripping string matcher for 64-bit only dSYMs.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8827](https://github.com/CocoaPods/CocoaPods/issues/8827)


## 1.7.0.rc.2 (2019-05-15)

##### Enhancements

* None.  

##### Bug Fixes

* Don't add resources to a second test_spec pod target build phase  
  [Paul Beusterien](https://github.com/paulb777)
  [#8173](https://github.com/CocoaPods/CocoaPods/issues/8173)

* Fix 1.7.0.rc.1 static library regression for pods with `header_dir` attribute  
  [Paul Beusterien](https://github.com/paulb777)
  [#8765](https://github.com/CocoaPods/CocoaPods/issues/8765)

* Scope app spec dependent targets when no dedup'ing targets.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8770](https://github.com/CocoaPods/CocoaPods/pull/8770)

* Fix embedding static frameworks in extensions while using `use_frameworks!`  
  [Martin Fiebig](https://github.com/mfiebig)
  [#8798](https://github.com/CocoaPods/CocoaPods/pull/8798)


## 1.7.0.rc.1 (2019-05-02)

##### Enhancements

* Replace Pods project `Dependencies` group with `Development Pods` and `Pods` groups.  
  [Sebastian Shanus](https://github.com/sebastianv1)
  [#8659](https://github.com/CocoaPods/CocoaPods/issues/8659)

* Add an error message for :podspec pods not matching the version in Pods and on disk  
  [orta](https://github.com/orta)
  [#8676](https://github.com/CocoaPods/CocoaPods/issues/8676)

##### Bug Fixes

* Allow insecure loads in requires_app_host's Info.plist  
  [Paul Beusterien](https://github.com/paulb777)
  [#8747](https://github.com/CocoaPods/CocoaPods/pull/8747)

* Fix a regression for static libraries with a custom module name  
  [Eric Amorde](https://github.com/amorde)
  [#8695](https://github.com/CocoaPods/CocoaPods/issues/8695)

* Fix target cache key SPECS key ordering.  
  [Sebastian Shanus](https://github.com/sebastianv1)
  [#8657](https://github.com/CocoaPods/CocoaPods/issues/8657)

* Fix regression not compiling xcdatamodeld files in static frameworks  
  [Paul Beusterien](https://github.com/paulb777)
  [#8702](https://github.com/CocoaPods/CocoaPods/issues/8702)

* Fix: AppIcon not found when executing `pod lib lint`  
  [Itay Brenner](https://github.com/itaybre)
  [#8648](https://github.com/CocoaPods/CocoaPods/issues/8648)


## 1.7.0.beta.3 (2019-03-28)

##### Enhancements

* Adds support for referring to other podspecs during validation  
  [Orta Therox](https://github.com/orta)
  [#8536](https://github.com/CocoaPods/CocoaPods/pull/8536)

##### Bug Fixes

* Deintegrate deleted targets even if `incremental_installation` is turned on.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso) & [Doug Mead](https://github.com/dmead28)
  [#8638](https://github.com/CocoaPods/CocoaPods/pull/8638)

* Reduce the probability of multiple project UUID collisions.  
  [Sebastian Shanus](https://github.com/sebastianv1)
  [#8636](https://github.com/CocoaPods/CocoaPods/pull/8636)

* Resolved an issue that could cause spec repo updates to fail on CI servers.  
  [rpecka](https://github.com/rpecka)
  [#7317](https://github.com/CocoaPods/CocoaPods/issues/7317)


## 1.7.0.beta.2 (2019-03-08)

##### Enhancements

* Integrate `xcfilelist` input/output paths for script phases.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8585](https://github.com/CocoaPods/CocoaPods/pull/8585)

##### Bug Fixes

* Do not warn of `.swift-version` file being deprecated if pod does not use Swift.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8593](https://github.com/CocoaPods/CocoaPods/pull/8593)

* Generate sibling targets for incremental installation.  
  [Sebastian Shanus](https://github.com/sebastianv1) & [Igor Makarov](https://github.com/igor-makarov)
  [#8577](https://github.com/CocoaPods/CocoaPods/issues/8577)

* Validator should filter our app specs from subspec analysis.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8592](https://github.com/CocoaPods/CocoaPods/pull/8592)

* Do not warn that `--swift-version` parameter is deprecated.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8586](https://github.com/CocoaPods/CocoaPods/pull/8586)

* Include `bcsymbolmap` file output paths into script phase.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8563](https://github.com/CocoaPods/CocoaPods/pull/8563)

* Copy `bcsymbolmap` files into correct destination to avoid invalid app archives  
  [florianbuerger](https://github.com/florianbuerger)
  [#8558](https://github.com/CocoaPods/CocoaPods/pull/8558)

* Fix: unset GIT_DIR and GIT_WORK_TREE for git operations  
  [tripleCC](https://github.com/tripleCC)
  [#7958](https://github.com/CocoaPods/CocoaPods/issues/7958)

* Fix crash when running `pod update` with `--sources` and `--project-directory`  
  [tripleCC](https://github.com/tripleCC)
  [#8565](https://github.com/CocoaPods/CocoaPods/issues/8565)

* Do not use spaces around variable assignment in generated embed framework script  
  [florianbuerger](https://github.com/florianbuerger)
  [#8548](https://github.com/CocoaPods/CocoaPods/pull/8548)

* Do not link specs into user targets that are only used by app specs.  
  [Samuel Giddins](https://github.com/segiddins)


## 1.7.0.beta.1 (2019-02-22)

##### Enhancements

* Copy `bcsymbolmap` files of a vendored framework.  
  [dacaiguoguogmail](https://github.com/dacaiguoguogmail)
  [#8461](https://github.com/CocoaPods/CocoaPods/issues/8461)

* Set the path of development pod groups to root directory of the Pod  
  [Eric Amorde](https://github.com/amorde)
  [#8445](https://github.com/CocoaPods/CocoaPods/pull/8445)
  [#8503](https://github.com/CocoaPods/CocoaPods/pull/8503)

* Incremental Pod Installation
  Enables only regenerating projects for pod targets that have changed since the previous installation. 
  This feature is gated by the `incremental_installation` option.  
  [Sebastian Shanus](https://github.com/sebastianv1)
  [#8319](https://github.com/CocoaPods/CocoaPods/issues/8319)

* Podfile: Add a CDNSource automatically if it's not present, just like git source.  
  Convenience for CDNSource when specified as `source 'https://cdn.jsdelivr.net/cocoa/'`.  
  If source doesn't exist, it will be created.  
  [igor-makarov](https://github.com/igor-makarov)
  [#8362](https://github.com/CocoaPods/CocoaPods/pull/8362)

* Scheme configuration support.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7577](https://github.com/CocoaPods/CocoaPods/issues/7577)

* Add support for `.rb` extension for Podfiles  
  [Eric Amorde](https://github.com/amorde)
  [#8171](https://github.com/CocoaPods/CocoaPods/issues/8171)

* Add CDN repo Source to allow retrieving specs from a web URL.  
  [igor-makarov](https://github.com/igor-makarov)
  [#8268](https://github.com/CocoaPods/CocoaPods/issues/8268) (partial beta solution)

* Multi Pod Project Generation Support.  
  Support for splitting the pods project into a subproject per pod target, gated by the `generate_multiple_pod_projects` installation option.  
  [Sebastian Shanus](https://github.com/sebastianv1)
  [#8253](https://github.com/CocoaPods/CocoaPods/issues/8253)

* Don't add main for app specs.  
  [Derek Ostrander](https://github.com/dostrander)
  [#8235](https://github.com/CocoaPods/CocoaPods/pull/8235)

* Multiple Swift versions support  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8191](https://github.com/CocoaPods/CocoaPods/issues/8191)

* Adds app spec project integration.  
  [Derek Ostrander](https://github.com/dostrander)
  [#8158](https://github.com/CocoaPods/CocoaPods/pull/8158)

* Add documentation for the Podfile installation options  
  [Eric Amorde](https://github.com/amorde)
  [#8198](https://github.com/CocoaPods/CocoaPods/issues/8198)
  [guides.cocoapods.org #142](https://github.com/CocoaPods/guides.cocoapods.org/issues/142)

##### Bug Fixes

* Clean up old integrated framework references.  
  [Dimitris Koutsogiorgas](https://github.com/dnkouts)
  [#8296](https://github.com/CocoaPods/CocoaPods/issues/8296)

* Always update sources specified with the `:source` option when `--repo-update` is specified  
  [Eric Amorde](https://github.com/amorde)
  [#8421](https://github.com/CocoaPods/CocoaPods/issues/8421) 

* Set `showEnvVarsInLog` for script phases only when its disabled.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8400](https://github.com/CocoaPods/CocoaPods/pull/8400)

* Fix error when execute pod list --update --verbose command  
  [tripleCC](https://github.com/tripleCC)
  [#8404](https://github.com/CocoaPods/CocoaPods/pull/8404)

* Remove `manifest` attribute from sandbox.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8260](https://github.com/CocoaPods/CocoaPods/pull/8260)
  
* Don't have libraries build the app spec.  
  [Derek Ostrander](https://github.com/dostrander)
  [#8244](https://github.com/CocoaPods/CocoaPods/pull/8244)
  
* Fix HTTPs -> HTTPS in warning message  
  [CydeWeys](https://github.com/CydeWeys)
  [#8354](https://github.com/CocoaPods/CocoaPods/issues/8354)

* Add the `FRAMEWORK_SEARCH_PATHS` necessary to import `XCTest` when it is
  linked as a weak framework.  
  [Samuel Giddins](https://github.com/segiddins)

* Treat `USER_HEADER_SEARCH_PATHS` as a plural build setting.  
  [Samuel Giddins](https://github.com/segiddins)
  [#8451](https://github.com/CocoaPods/CocoaPods/issues/8451)

* Trying to add a spec repo with a `file://` URL on Ruby 2.6 won't fail with a
  a git unknown option error.  
  [Samuel Giddins](https://github.com/segiddins)

* Fixed test host delegate methods to not warn about unused arguments.  
  [Jacek Suliga](https://github.com/jmkk)
  [#8521](https://github.com/CocoaPods/CocoaPods/pull/8521)


## 1.6.2 (2019-05-15)

##### Enhancements

* None.  

##### Bug Fixes

* Ensure all embedded pod targets are copied over to the host target.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8608](https://github.com/CocoaPods/CocoaPods/issues/8608)


## 1.6.1 (2019-02-21)

##### Enhancements

* Add `--analyze` option for the linters.  
  [Paul Beusterien](https://github.com/paulb777)
  [#8792](https://github.com/CocoaPods/CocoaPods/issues/8792)

##### Bug Fixes

* Properly link system frameworks and weak frameworks into dynamic framework targets.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8493](https://github.com/CocoaPods/CocoaPods/issues/8493)


## 1.6.0 (2019-02-07)

##### Enhancements

* None.  

##### Bug Fixes

* None.  


## 1.6.0.rc.2 (2019-01-29)

##### Enhancements

* None. 

##### Bug Fixes

* Fix linking of vendored libraries and frameworks in pod targets  
  [Wes Campaigne](https://github.com/Westacular)
  [#8453](https://github.com/CocoaPods/CocoaPods/issues/8453)


## 1.6.0.rc.1 (2019-01-25)

##### Enhancements

* Generate Info.plist files for static frameworks  
  [Paul Beusterien](https://github.com/paulb777)
  [#8287](https://github.com/CocoaPods/CocoaPods/issues/8287)

##### Bug Fixes

* Do not force 64-bit architectures on Xcode 10  
  [Eric Amorde](https://github.com/amorde)
  [#8242](https://github.com/CocoaPods/CocoaPods/issues/8242)

* Fix running test specs that support iOS 8.  
  [Jeff Kelley](https://github.com/SlaunchaMan)
  [#8286](https://github.com/CocoaPods/CocoaPods/pull/8286)

* Remove linker flags that linked dynamic libraries & frameworks from the build
  settings for pod targets.  
  [Samuel Giddins](https://github.com/segiddins)
  [#8314](https://github.com/CocoaPods/CocoaPods/pull/8314)

## 1.6.0.beta.2 (2018-10-17)

##### Enhancements

* Remove contraction from docs to fix rendering on the website.  
  [stevemoser](https://github.com/stevemoser)
  [#8131](https://github.com/CocoaPods/CocoaPods/pull/8131)

* Provide an installation option to preserve folder structure  
  [dacaiguoguogmail](https://github.com/dacaiguoguogmail)
  [#8097](https://github.com/CocoaPods/CocoaPods/pull/8097)

* Nests test specs host apps inside that Pod's directory for cleaner project 
  navigators.  
  [Derek Ostrander](https://github.com/dostrander)
   
* mark_ruby_file_ref add indent width and tab width config  
  [dacaiguoguogmail](https://github.com/dacaiguoguogmail)

* Print an error that will show up in Xcode's issue navigator upon unexpected
  failures in the copy resources and embed frameworks script phases.  
  [Samuel Giddins](https://github.com/segiddins)
  
* Validate that all generated `PBXNativeTarget`s contain source files to build,
  so specs (including test specs) with no source files won't fail at runtime
  due to the lack of a generated executable.  
  [Samuel Giddins](https://github.com/segiddins)

* Print better promote message when unable to find a specification.  
  [Xinyu Zhao](https://github.com/X140Yu)
  [#8064](https://github.com/CocoaPods/CocoaPods/issues/8064)

* Silence warnings in headers for Pods with `inhibit_warnings => true`  
  [Guillaume Algis](https://github.com/guillaumealgis)
  [#6401](https://github.com/CocoaPods/CocoaPods/pull/6401)

* When resolving a locked dependency, source the spec from the locked
  specs repository.  
  [Samuel Giddins](https://github.com/segiddins)

* Slightly improve resolution speed for Podfiles that contain multiple targets
  with the same dependencies.  
  [Samuel Giddins](https://github.com/segiddins)
  
##### Bug Fixes

* Don't generate unencrypted source warnings for localhost.  
  [Paul Beusterien](https://github.com/paulb777)
  [#8156](https://github.com/CocoaPods/CocoaPods/issues/8156)

* Fix linting when armv7 is included but i386 isn't.  
  [Paul Beusterien](https://github.com/paulb777)
  [#8129](https://github.com/CocoaPods/CocoaPods/issues/8129)

* Provide an installation option to disable usage of input/output paths.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8073](https://github.com/CocoaPods/CocoaPods/issues/8073)

* Scope prefix header setting to each test spec.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8046](https://github.com/CocoaPods/CocoaPods/pull/8046)

* Don't add incomplete subspec subset targets for extensions.  
  [Paul Beusterien](https://github.com/paulb777)
  [#7850](https://github.com/CocoaPods/CocoaPods/issues/7850)

* Clear out `MACH_O_TYPE` for unit test bundles that use static frameworks.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8031](https://github.com/CocoaPods/CocoaPods/issues/8031)

* Fix `weak_frameworks` missing regression.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7872](https://github.com/CocoaPods/CocoaPods/issues/7872)

* Fix line spacing for Swift error message.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8024](https://github.com/CocoaPods/CocoaPods/pull/8024)

* Improve validation for test_specs on specific platforms  
  [icecrystal23](https://github.com/icecrystal23)
  [#7009](https://github.com/CocoaPods/CocoaPods/issues/7009)

* Fix running `pod outdated` with externally-sourced pods.  
  [Samuel Giddins](https://github.com/segiddins)
  [#8025](https://github.com/CocoaPods/CocoaPods/issues/8025)

* Remove codesign suppression  
  [Jaehong Kang](https://github.com/sinoru)
  [#7606](https://github.com/CocoaPods/CocoaPods/issues/7606)


## 1.6.0.beta.1 (2018-08-16)

##### Enhancements

* Every test spec will have its own xctest bundle.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [Jenn Kaplan](https://github.com/jkap)
  [#7908](https://github.com/CocoaPods/CocoaPods/pull/7908)

* Generate a separate app host per pod.  
  [Samuel Giddins](https://github.com/segiddins)
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8005](https://github.com/CocoaPods/CocoaPods/pull/8005)

* Add default launch screen storyboard to test app hosts.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7971](https://github.com/CocoaPods/CocoaPods/pull/7971)

* Always display downloader error message.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7625](https://github.com/CocoaPods/CocoaPods/issues/7625)

* Warn instead of error when linting if `public_header_files` or
  `private_header_files` do not match any files.  
  [Eric Amorde](https://github.com/amorde)
  [#7427](https://github.com/CocoaPods/CocoaPods/issues/7427)

* Add `--platforms` parameter to `pod spec lint` and `pod lib lint` to specify
  which platforms to lint.  
  [Eric Amorde](https://github.com/amorde)
  [#7783](https://github.com/CocoaPods/CocoaPods/issues/7783)

* Warn if the `git://` protocol is used as the source of a pod.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7705](https://github.com/CocoaPods/CocoaPods/issues/7705)

* Remove all xcode project state from target objects,
  improving project generation performance.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7610](https://github.com/CocoaPods/CocoaPods/pull/7610)

* Improve performance of Pods project generation by skipping native targets
  for which dependent targets have already been added.
  [Jacek Suliga](https://github.com/jmkk)

* Refactor build settings generation to perform much better on large projects.  
  [Samuel Giddins](https://github.com/segiddins)

* Make sure the temporary directory used to download a pod is removed,
  even if an error is raised.  
  [augustorsouza](https://github.com/augustorsouza)

* Avoid unlocking sources on every `pod install` when there are no
  plugin post-install hooks for performance reasons.  
  [Samuel Giddins](https://github.com/segiddins)

* Change shell script relative paths to use `${PODS_ROOT}` instead of 
  `${SRCROOT}/Pods`.  
  [Whirlwind](https://github.com/Whirlwind)
  [#7878](https://github.com/CocoaPods/CocoaPods/pull/7878)

* Set the path of the Pods group in the user project.  
  [Whirlwind](https://github.com/Whirlwind)
  [#7886](https://github.com/CocoaPods/CocoaPods/pull/7886)
  [#6194](https://github.com/CocoaPods/CocoaPods/issues/6194)

* Add a `--deployment` flag to `pod install` that errors if there are any
  changes to the Podfile or Lockfile.  
  [Samuel Giddins](https://github.com/segiddins)
  
* Add `--use-modular-headers` flag to the `pod spec lint`, `pod lib lint`,
  and `pod repo push` commands.  
  [Eric Amorde](https://github.com/amorde)
  [#7683](https://github.com/CocoaPods/CocoaPods/issues/7683)

##### Bug Fixes

* Scope embedded pods to their host targets by their configuration.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#8011](https://github.com/CocoaPods/CocoaPods/issues/8011)

* Set the `SWIFT_VERSION` on resource bundle targets that contain compiled
  sources and use Swift.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7950](https://github.com/CocoaPods/CocoaPods/issues/7950)

* Do not ignore `--no-overwrite` parameter if a commit message is specified.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7926](https://github.com/CocoaPods/CocoaPods/issues/7926)
  
* Generate `-ObjC` in `OTHER_LDFLAGS` for apps with static frameworks.  
  [Paul Beusterien](https://github.com/paulb777)
  [#7946](https://github.com/CocoaPods/CocoaPods/pull/7946)

* Do not display that a source was changed if it uses different casing.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7883](https://github.com/CocoaPods/CocoaPods/pull/7883)
  
* Set `CURRENT_PROJECT_VERSION` for generated app host targets.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7825](https://github.com/CocoaPods/CocoaPods/pull/7825)

* Properly follow symlinks within macOS universal frameworks.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7587](https://github.com/CocoaPods/CocoaPods/issues/7587)
  
* Validator adds a Swift file if any of the pod targets use Swift.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7738](https://github.com/CocoaPods/CocoaPods/issues/7738)

* Fix `INFOPLIST_FILE` being overridden when set in a podspec's `pod_target_xcconfig`.  
  [Eric Amorde](https://github.com/amorde)
  [#7530](https://github.com/CocoaPods/CocoaPods/issues/7530)

* Raise an error if user target `SWIFT_VERSION` is missing.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7770](https://github.com/CocoaPods/CocoaPods/issues/7770)

* Fix the umbrella header import path when `header_dir` is specified in the
  podspec and building a static library with modular headers enabled.  
  [chuganzy](https://github.com/chuganzy)
  [#7724](https://github.com/CocoaPods/CocoaPods/pull/7724)

* Do not symlink headers that belong to test specs.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7762](https://github.com/CocoaPods/CocoaPods/pull/7762)

* Do not build pod target if it only contains script phases.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7746](https://github.com/CocoaPods/CocoaPods/issues/7746)

* Do not try to integrate uncreated test native targets.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7394](https://github.com/CocoaPods/CocoaPods/issues/7394)

* Attempt to parse `SWIFT_VERSION` from xcconfig during target inspection.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7731](https://github.com/CocoaPods/CocoaPods/issues/7731)

* Do not crash when creating build settings for a missing user build configuration.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7698](https://github.com/CocoaPods/CocoaPods/pull/7698)

* Do not overwrite App host info plist when using multiple test specs.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7695](https://github.com/CocoaPods/CocoaPods/pull/7695)

* Do not include test dependencies' input and output paths.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7688](https://github.com/CocoaPods/CocoaPods/pull/7688)

* Skip test file accessors for `uses_swift?` and `should_build?` methods.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7671](https://github.com/CocoaPods/CocoaPods/pull/7671)

* When integrating a vendored framework while building pods as static
  libraries, public headers will be found via `FRAMEWORK_SEARCH_PATHS`
  instead of via the sandbox headers store.  
  [Samuel Giddins](https://github.com/segiddins)

* Improve performance of grouping pods by configuration.  
  [Samuel Giddins](https://github.com/segiddins)

* Stop linking frameworks to static libraries to avoid warnings with the new build system.  
  [Samuel Giddins](https://github.com/segiddins)
  [#7570](https://github.com/CocoaPods/CocoaPods/pull/7570)

* Allow `EXPANDED_CODE_SIGN_IDENTITY` to be unset.  
  [Keith Smiley](https://github.com/keith)
  [#7708](https://github.com/CocoaPods/CocoaPods/issues/7708)

* Running `pod install` with static library modules no longer causes pods to
  be recompiled.  
  [Samuel Giddins](https://github.com/segiddins)

* A pod built as a static library linked into multiple targets will only build
  as a module when all of the targets it is linked into have opted into it.  
  [Samuel Giddins](https://github.com/segiddins)

* Use `CP_HOME_DIR` as the base for all default directories.  
  [mcfedr](https://github.com/mcfedr)
  [#7917](https://github.com/CocoaPods/CocoaPods/pull/7917)
  
* Exclude 32-bit architectures from Pod targets when the deployment target is
  iOS 11.0 or higher.  
  [Eric Amorde](https://github.com/amorde)
  [#7148](https://github.com/CocoaPods/CocoaPods/issues/7148)

* Fail gracefully when the analyzer has dependencies to fetch, but has been
  told not to fetch them.  
  [Samuel Giddins](https://github.com/segiddins)

* Don't generate framework or resource scripts if they will not be used.  
  [Eric Amorde](https://github.com/amorde)

* Fix a crash when loading the `macho` gem in certain environments.  
  [Eric Amorde](https://github.com/amorde)
  [#7867](https://github.com/CocoaPods/CocoaPods/issues/7867)


## 1.5.3 (2018-05-25)

##### Enhancements

* None.  

##### Bug Fixes

* Fix compatibility with RubyGems 2.7.7.  
  [Samuel Giddins](https://github.com/segiddins)
  [#7765](https://github.com/CocoaPods/CocoaPods/issues/7765)
  [#7766](https://github.com/CocoaPods/CocoaPods/issues/7766)
  [#7763](https://github.com/CocoaPods/CocoaPods/issues/7763)


## 1.5.2 (2018-05-09)

##### Enhancements

* None.  

##### Bug Fixes

* None.  


## 1.5.1 (2018-05-07)

##### Enhancements

* Improve performance of the dependency resolver by removing duplicates for dependency nodes.
  [Jacek Suliga](https://github.com/jmkk)

##### Bug Fixes

* Do not include test dependencies input and output paths.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7688](https://github.com/CocoaPods/CocoaPods/pull/7688)

* Remove [system] declaration attribute from generated module maps.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7589](https://github.com/CocoaPods/CocoaPods/issues/7589)

* Properly namespace Info.plist names during target installation.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7611](https://github.com/CocoaPods/CocoaPods/pull/7611)

* Always generate FRAMEWORK_SEARCH_PATHS for vendored_frameworks.  
  [Paul Beusterien](https://github.com/paulb777)
  [#7591](https://github.com/CocoaPods/CocoaPods/issues/7591)

* Fix modular header access to header_dir's.  
  [Paul Beusterien](https://github.com/paulb777)
  [#7597](https://github.com/CocoaPods/CocoaPods/issues/7597)

* Fix static framework dependent target double linking without `use_frameworks`.  
  [Paul Beusterien](https://github.com/paulb777)
  [#7592](https://github.com/CocoaPods/CocoaPods/issues/7592)

* Make modular header private header access consistent with frameworks and static libraries.  
  [Paul Beusterien](https://github.com/paulb777)
  [#7596](https://github.com/CocoaPods/CocoaPods/issues/7596)

* Inhibit warnings for all dependencies during validation except for the one being validated.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7434](https://github.com/CocoaPods/CocoaPods/issues/7434)

* Prevent duplicated targets from being stripped out from the framework search paths.  
  [Liquidsoul](https://github.com/liquidsoul)
  [#7644](https://github.com/CocoaPods/CocoaPods/pull/7644)

* Fix `assetcatalog_generated_info.plist` path in copy resources phase.  
  [Maxime Le Moine](https://github.com/MaximeLM)
  [#7590](https://github.com/CocoaPods/CocoaPods/issues/7590)

## 1.5.0 (2018-04-04)

##### Enhancements

* None.  

##### Bug Fixes

* Escape double quotes for module map contents  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7549](https://github.com/CocoaPods/CocoaPods/pull/7549)

* Fix building Swift static library test specs.  
  [Samuel Giddins](https://github.com/segiddins)

* Swift static libraries can be used in targets whose search paths are inherited.  
  [Samuel Giddins](https://github.com/segiddins)

## 1.5.0.beta.1 (2018-03-23)

##### Enhancements

* Add `--exclude-pods` option to `pod update` to allow excluding specific pods from update  
  [Oleksandr Kruk](https://github.com/0mega)
  [#7334](https://github.com/CocoaPods/CocoaPods/issues/7334)

* Add support for mixed Objective-C and Swift static frameworks  
  [Paul Beusterien](https://github.com/paulb777)
  [#7213](https://github.com/CocoaPods/CocoaPods/issues/7213)

* Improve `pod install` performance for pods with exact file paths rather than glob patterns  
  [Muhammed Yavuz Nuzumlalı](https://github.com/manuyavuz)
  [#7473](https://github.com/CocoaPods/CocoaPods/pull/7473)

* Display a message when a pods source has changed during installation  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7464](https://github.com/CocoaPods/CocoaPods/pull/7464)

* Add support for modular header search paths, include "legacy" support.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7412](https://github.com/CocoaPods/CocoaPods/pull/7412)

* Set direct and transitive dependency header search paths for pod targets  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7116](https://github.com/CocoaPods/CocoaPods/pull/7116)

* Log target names missing host for libraries  
  [Keith Smiley](https://github.com/keith)
  [#7346](https://github.com/CocoaPods/CocoaPods/pull/7346)

* Add a `--no-overwrite` flag to `pod repo push` to disable overwriting
  existing specs that have already been pushed.  
  [Samuel Giddins](https://github.com/segiddins)

* Store which specs repo a pod comes from in the lockfile.  
  [Samuel Giddins](https://github.com/segiddins)

* Add `set -u` to the copy frameworks and copy resources scripts.  
  [Keith Smiley](https://github.com/keith)
  [#7180](https://github.com/CocoaPods/CocoaPods/pull/7180)

* Allow integrating into static library targets without attempting to copy 
  resources or embed frameworks unless `UNLOCALIZED_RESOURCES_FOLDER_PATH` 
  or `FRAMEWORKS_FOLDER_PATH` is set.  
  [Samuel Giddins](https://github.com/segiddins)

* Change color scheme of `pod outdated` from red-yellow-green to red-blue-green to be more colorblind friendly  
  [iv-mexx](https://github.com/iv-mexx)  
  [#7372](https://github.com/CocoaPods/CocoaPods/issues/7372)  

* Add support for integrating swift pods as static libraries.  
  [Danielle Tomlinson](https://github.com/dantoml)
  [Samuel Giddins](https://github.com/segiddins)
  [#6899](https://github.com/CocoaPods/CocoaPods/issues/6899)

* Document format of POD_NAMES in pod update  
  [mrh-is](https://github.com/mrh-is)

* Update validator to stream output as xcodebuild runs  
  [abbeycode](https://github.com/abbeycode)
  [#7040](https://github.com/CocoaPods/CocoaPods/issues/7040)
  
##### Bug Fixes

* Create a generic Info.plist file for test targets  
  Use xcode default `PRODUCT_MODULE_NAME` for generated test targets  
  [Paul Zabelin](https://github.com/paulz)
  [#7506](https://github.com/CocoaPods/CocoaPods/issues/7506)
  
* Prevent `xcassets` compilation from stomping over the apps `xcassets`  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7003](https://github.com/CocoaPods/CocoaPods/issues/7003)

* Fix script phase output path for `.xcasset` resources  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7511](https://github.com/CocoaPods/CocoaPods/issues/7511)

* Fix `PRODUCT_MODULE_NAME` for generated test targets  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7507](https://github.com/CocoaPods/CocoaPods/issues/7507)

* Ensure `SWIFT_VERSION` is set for test only pod targets during validation  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7498](https://github.com/CocoaPods/CocoaPods/issues/7498)

* Fix iOS test native target signing settings  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7504](https://github.com/CocoaPods/CocoaPods/pull/7504)

* Clear input/output paths if they exceed an arbitrary limit  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7362](https://github.com/CocoaPods/CocoaPods/issues/7362)

* Warn instead of throwing an exception when a development pod specifies an invalid license file path  
  [Eric Amorde](https://github.com/amorde)
  [#7377](https://github.com/CocoaPods/CocoaPods/issues/7377)

* Better static frameworks transitive dependency error checking  
  [Paul Beusterien](https://github.com/paulb777)
  [#7352](https://github.com/CocoaPods/CocoaPods/issues/7352)

* Always update input/output paths even if they are empty  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7368](https://github.com/CocoaPods/CocoaPods/pull/7368)

* Unique all available pre-release versions when displaying  
  [Samuel Giddins](https://github.com/segiddins)
  [#7353](https://github.com/CocoaPods/CocoaPods/pull/7353)

* Do not attempt compilation for pods with no sources and skipping import validation  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7336](https://github.com/CocoaPods/CocoaPods/issues/7336)

* Avoid adding copy resources and frameworks script phases when those phases
  would not copy anything.  
  [Keith Smiley](https://github.com/keith)
  [Samuel Giddins](https://github.com/segiddins)

* Speed up `pod install` times by up to 50% for very large project.  
  [Samuel Giddins](https://github.com/segiddins)

* Avoid dependency resolution conflicts when a pod depends upon a local pod.  
  [Samuel Giddins](https://github.com/segiddins)

* Fix legacy header search paths that broke due to #7116 and #7412.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7445](https://github.com/CocoaPods/CocoaPods/pull/7445)

* Stop adding header search paths that do not contain any headers.  
  [Samuel Giddins](https://github.com/segiddins)

* Do not warn when http source uses `file:///` URI scheme  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7460](https://github.com/CocoaPods/CocoaPods/issues/7460)

* Remove bogus `PROVISIONING_PROFILE_SPECIFIER` value from Pods project.  
  [Ruenzuo](https://github.com/Ruenzuo)
  [#6964](https://github.com/CocoaPods/CocoaPods/issues/6964)

* Fix returning absolute paths from glob, fixes issue with static framework and public headers.  
  [Morgan McKenzie](https://github.com/rmtmckenzie)
  [#7463](https://github.com/CocoaPods/CocoaPods/issues/7463)

* Improve messages when integrating Swift pods as static libraries.  
  [Marcelo Fabri](https://github.com/marcelofabri)
  [#7495](https://github.com/CocoaPods/CocoaPods/issues/7495)

## 1.4.0 (2018-01-18)

##### Enhancements

* Show warning when Pod source uses unencrypted HTTP  
  [KrauseFx](https://github.com/KrauseFx)
  [#7293](https://github.com/CocoaPods/CocoaPods/issues/7293)

##### Bug Fixes

* Do not include test spec resources and framework paths of dependent targets into test scripts  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7318](https://github.com/CocoaPods/CocoaPods/pull/7318)

* Restore `development_pod_targets` public method in installer  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7292](https://github.com/CocoaPods/CocoaPods/pull/7292)

* Fix resolution when multiple sources provide the same pods, and there are 
  (potential) dependencies between the sources.  
  [Samuel Giddins](https://github.com/segiddins)
  [#7031](https://github.com/CocoaPods/CocoaPods/issues/7031)

* Ensure that externally-sourced (e.g. local & git) pods are allowed to resolve
  to prerelease versions.  
  [segiddins](https://github.com/segiddins)

## 1.4.0.rc.1 (2017-12-16)

##### Enhancements

* Integrate `swift_version` DSL support into pod targets  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7134](https://github.com/CocoaPods/CocoaPods/issues/7134)

* Add color indication to output of `pod outdated`  
  [iv-mexx](https://github.com/iv-mexx)
  [#7204](https://github.com/CocoaPods/CocoaPods/pull/7204)

* Set syntax of podspecs from development pods to Ruby when appropriate  
  [Eric Amorde](https://github.com/amorde)
  [#7278](https://github.com/CocoaPods/CocoaPods/pull/7278)

* Add support for editing the podspec, license, README, license, and docs of local development pods  
  [Eric Amorde](https://github.com/amorde)
  [#7093](https://github.com/CocoaPods/CocoaPods/pull/7093)

* Show warning when SDK provider tries to push a version with an unencrypted HTTP source  
  [KrauseFx](https://github.com/KrauseFx)
  [#7250](https://github.com/CocoaPods/CocoaPods/pull/7250)

##### Bug Fixes

* Deduplicate output path file names for resources and frameworks  
  [Eric Amorde](https://github.com/amorde)
  [#7259](https://github.com/CocoaPods/CocoaPods/issues/7259)

* Allow installation of a pod with its own Swift version on multiple targets  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7261](https://github.com/CocoaPods/CocoaPods/pull/7261)

* Quote framework names in OTHER_LDFLAGS  
  [Tyler Stromberg](https://github.com/AquaGeek)
  [#7185](https://github.com/CocoaPods/CocoaPods/issues/7185)

* Fix static framework archive regression from #7187  
  [Paul Beusterien](https://github.com/paulb777)
  [#7225](https://github.com/CocoaPods/CocoaPods/issues/7225)

* Install resource bundles and embed frameworks for every test target's configuration  
  [Nickolay Tarbayev](https://github.com/tarbayev)
  [#7012](https://github.com/CocoaPods/CocoaPods/issues/7012)

* Set `SWIFT_VERSION` to test native targets during validation  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7216](https://github.com/CocoaPods/CocoaPods/pull/7216)

* Add copied resources' paths to "Copy Pods Resources" output file list  
  [igor-makarov](https://github.com/igor-makarov)
  [#6936](https://github.com/CocoaPods/CocoaPods/issues/6936)

* Do not link system frameworks of test specs to library targets  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7205](https://github.com/CocoaPods/CocoaPods/pull/7205)

* Be more lenient when stripping frameworks and dSYMs for non fat binaries  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7196](https://github.com/CocoaPods/CocoaPods/issues/7196)
  [#5854](https://github.com/CocoaPods/CocoaPods/issues/5854)

* Do not display script phases warnings multiple times per platform  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7193](https://github.com/CocoaPods/CocoaPods/pull/7193)

* Fix unnecessary whole project recompilation with static frameworks  
  [Vladimir Gorbenko](https://github.com/volodg)
  [#7187](https://github.com/CocoaPods/CocoaPods/issues/7187)

* Prevent passing empty string to git when running `pod repo update --silent`  
  [Jon Sorrells](https://github.com/jonsorrells)
  [#7176](https://github.com/CocoaPods/CocoaPods/issues/7176)

* Do not propagate test spec frameworks and libraries into pod target xcconfig  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7172](https://github.com/CocoaPods/CocoaPods/issues/7172)

* Set language to Swift for test native targets if any dependencies use Swift  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7170](https://github.com/CocoaPods/CocoaPods/issues/7170)
  
* Prevent multiple script phases from stripping vendored dSYM  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7166](https://github.com/CocoaPods/CocoaPods/pull/7166)

* Static library headers should all be `Project` in Xcode header build phase  
  [Paul Beusterien](https://github.com/paulb777)
  [#4496](https://github.com/CocoaPods/CocoaPods/issues/4496)

* Fix archiving apps with static frameworks  
  [Paul Beusterien](https://github.com/paulb777)
  [#7158](https://github.com/CocoaPods/CocoaPods/issues/7158)

## 1.4.0.beta.2 (2017-10-24)

##### Enhancements

* Integrate execution position for shell script phases  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7101](https://github.com/CocoaPods/CocoaPods/pull/7101)

* Add support to integrate script phases from podspecs  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7092](https://github.com/CocoaPods/CocoaPods/pull/7092)

* Add support for preventing pch file generation with the skip_pch podspec attribute  
  [Paul Beusterien](https://github.com/paulb777)
  [#7044](https://github.com/CocoaPods/CocoaPods/pull/7044)

* Add app host support for test specs  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6953](https://github.com/CocoaPods/CocoaPods/issues/6953)

* Add support for resources in source static library frameworks  
  [Paul Beusterien](https://github.com/paulb777)
  [#7100](https://github.com/CocoaPods/CocoaPods/pull/7100)

##### Bug Fixes

* Copy .swiftmodule into static_frameworks to enable access to Swift static frameworks  
  [Paul Beusterien](https://github.com/paulb777)
  [#7140](https://github.com/CocoaPods/CocoaPods/issues/7140)

* Fix docs for prefix header paths  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7149](https://github.com/CocoaPods/CocoaPods/pull/7149)

* Fix integration `prefix_header_file` with test specs  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7147](https://github.com/CocoaPods/CocoaPods/pull/7147)

* Set the default Swift version to 3.2 during validation  
  [Victor Hugo Barros](https://github.com/heyzooi)
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7136](https://github.com/CocoaPods/CocoaPods/pull/7136)

* Better warning message for which Swift version was used during validation  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7121](https://github.com/CocoaPods/CocoaPods/issues/7121)

* Fix static_framework Swift pod dependencies and implement pod access to dependent vendored_framework modules  
  [Paul Beusterien](https://github.com/paulb777)
  [#7117](https://github.com/CocoaPods/CocoaPods/issues/7117)

* Strip vendored dSYMs during embed script phase  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7111](https://github.com/CocoaPods/CocoaPods/issues/7111)

* Warn when a pod that was added or changed includes script phases  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7110](https://github.com/CocoaPods/CocoaPods/pull/7110)

* Build pod targets with script phases and integrate them properly  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7104](https://github.com/CocoaPods/CocoaPods/pull/7104)

* Do not set a `CODE_SIGN_IDENTITY` for macOS app hosts or xctest bundles  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7103](https://github.com/CocoaPods/CocoaPods/pull/7103)

* Fix framework and resources paths caching  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7068](https://github.com/CocoaPods/CocoaPods/pull/7068)

* Build subspecs in static frameworks without error  
  [Paul Beusterien](https://github.com/paulb777)
  [#7058](https://github.com/CocoaPods/CocoaPods/pull/7058)

* Ensure `SYMROOT` is properly set for all user configurations  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7081](https://github.com/CocoaPods/CocoaPods/issues/7081)

## 1.4.0.beta.1 (2017-09-24)

##### Enhancements

* Do not force include the master spec repo if plugins provide sources  
  [Eric Amorde](https://github.com/amorde)
  [#7033](https://github.com/CocoaPods/CocoaPods/pull/7033)

* Add custom shell script integration from Podfile  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6820](https://github.com/CocoaPods/CocoaPods/pull/6820)

* Show full requirement trees when a version conflict is encountered during 
  dependency resolution.  
  [Samuel Giddins](https://github.com/segiddins)

* Add support for source static library frameworks  
  [Paul Beusterien](https://github.com/paulb777)
  [#6811](https://github.com/CocoaPods/CocoaPods/pull/6811)

* Add Private Header support to static frameworks  
  [Paul Beusterien](https://github.com/paulb777)
  [#6969](https://github.com/CocoaPods/CocoaPods/pull/6969)

* For source static frameworks, include frameworks from dependent targets and libraries in OTHER_LDFLAGS  
  [Paul Beusterien](https://github.com/paulb777)
  [#6988](https://github.com/CocoaPods/CocoaPods/pull/6988)

##### Bug Fixes

* Deduplicate test specs correctly from pod variants and targets  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7036](https://github.com/CocoaPods/CocoaPods/pull/7036)

* Do not merge `pod_target_xcconfig` from test specs into non test xcconfigs  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7037](https://github.com/CocoaPods/CocoaPods/pull/7037)

* Wrap `$PODS_CONFIGURATION_BUILD_DIR` and `$PODS_BUILD_DIR` with curlies  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7048](https://github.com/CocoaPods/CocoaPods/pull/7048)

* Fix common paths sometimes calculating incorrectly  
  [amorde](https://github.com/amorde)
  [#7028](https://github.com/CocoaPods/CocoaPods/pull/7028)

* Do not code sign OSX targets for testing bundles  
  [Justin Martin](https://github.com/justinseanmartin)
  [#7027](https://github.com/CocoaPods/CocoaPods/pull/7027)

* Ensure a unique ID is generated for each resource bundle  
  [Justin Martin](https://github.com/justinseanmartin)
  [#7015](https://github.com/CocoaPods/CocoaPods/pull/7015)

* Do not include settings from file accessors of test specs into aggregate xcconfigs  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7019](https://github.com/CocoaPods/CocoaPods/pull/7019)

* Use the resolver to identify which pod targets are test only  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [Justin Martin](https://github.com/justinseanmartin)
  [#7014](https://github.com/CocoaPods/CocoaPods/pull/7014)

* Perform code signing on xctest bundles in the Pods project generated by a test spec  
  [Justin Martin](https://github.com/justinseanmartin)
  [#7013](https://github.com/CocoaPods/CocoaPods/pull/7013)

* Exclude test resource and framework paths from aggregate targets  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#7000](https://github.com/CocoaPods/CocoaPods/pull/7000)

* Wrap platform warning message with quotes  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6968](https://github.com/CocoaPods/CocoaPods/pull/6968)

* Wire dependencies for pod targets not part of any aggregate target  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6948](https://github.com/CocoaPods/CocoaPods/pull/6948)

* Fix validation warnings when using --swift-version  
  [Danielle Tomlinson](https://github.com/dantoml)
  [#6971](https://github.com/CocoaPods/CocoaPods/pull/6971)

* Fix xcconfig boolean merging when substrings include yes or no  
  [Paul Beusterien](https://github.com/paulb777)
  [#6997](https://github.com/CocoaPods/CocoaPods/pull/6997)

* Filter out subset dependent targets from FRAMEWORK_SEARCH_PATHS  
  [Paul Beusterien](https://github.com/paulb777)
  [#7002](https://github.com/CocoaPods/CocoaPods/pull/7002)

* Propagate HEADER_SEARCH_PATHS settings from search paths  
  [Paul Beusterien](https://github.com/paulb777)
  [#7006](https://github.com/CocoaPods/CocoaPods/pull/7006)

## 1.3.1 (2017-08-02)

##### Enhancements

* None.

##### Bug Fixes

* Do not use `--delete` when copying resources to app target folder  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6927](https://github.com/CocoaPods/CocoaPods/issues/6927)

## 1.3.0 (2017-08-02)

##### Enhancements

* None.  

##### Bug Fixes

* Ensure transitive dependencies are linked to test targets  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6917](https://github.com/CocoaPods/CocoaPods/pull/6917)

* Properly install pod targets with test specs within subspecs  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6915](https://github.com/CocoaPods/CocoaPods/pull/6915)

* Add `--skip-tests` support `push` to push command  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6893](https://github.com/CocoaPods/CocoaPods/pull/6893)

## 1.3.0.rc.1 (2017-07-27)

##### Enhancements

* None.  

##### Bug Fixes

* Cache result of resource and framework paths  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6893](https://github.com/CocoaPods/CocoaPods/pull/6893)

* Ensure source urls are set when spec has subspecs with dependencies  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6888](https://github.com/CocoaPods/CocoaPods/pull/6888)

## 1.3.0.beta.3 (2017-07-19)

##### Enhancements

* Protect rsync tmp files from being deleted if two targets sync at the same time  
  [Justin Martin](https://github.com/justinseanmartin)
  [#6873](https://github.com/CocoaPods/CocoaPods/pull/6873)

* Include test schemes within library schemes  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6765](https://github.com/CocoaPods/CocoaPods/issues/6765)

* Truncate extra groups in Development Pods when they are parents of all files  
  [Eric Amorde](https://github.com/amorde)
  [#6814](https://github.com/CocoaPods/CocoaPods/pull/6814)

* Do not re-write generated files that have not changed  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [dingjingpisces2015](https://github.com/dingjingpisces2015)
  [#6825](https://github.com/CocoaPods/CocoaPods/pull/6825)

##### Bug Fixes

* Set the test xcconfig file to resource bundles used only by tests  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6886](https://github.com/CocoaPods/CocoaPods/pull/6886)

* Integrate test targets to embed frameworks and resources  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6828](https://github.com/CocoaPods/CocoaPods/pull/6828)

* Ensure resource bundle and test dependencies are set for test native targets  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6829](https://github.com/CocoaPods/CocoaPods/pull/6829)

* Provide a better error message when references are missing for non-source files
  [David Airapetyan](https://github.com/davidair)
  [#4887](https://github.com/CocoaPods/CocoaPods/issues/4887)

* Select unique module_name(s) across host target's and embedded targets' pod targets  
  [Anand Biligiri](https://github.com/abiligiri)
  [#6711](https://github.com/CocoaPods/CocoaPods/issues/6711)

## 1.3.0.beta.2 (2017-06-22)

##### Enhancements
* Add inputs and outputs for resources script phase  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6806](https://github.com/CocoaPods/CocoaPods/pull/6806)

* Simplify logic around framework input and output paths  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6803](https://github.com/CocoaPods/CocoaPods/pull/6803)

* Add inputs and outputs to check manifest lock and embed framework script phases  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6797](https://github.com/CocoaPods/CocoaPods/issues/6797)

##### Bug Fixes

* Remove 0.34 migration for a small boost in `pod install` time  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6783](hhttps://github.com/CocoaPods/CocoaPods/pull/6783)

* Use a cache when figuring out if a pod target is test only  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6787](https://github.com/CocoaPods/CocoaPods/pull/6787)

## 1.3.0.beta.1 (2017-06-06)

##### Enhancements

* Add validator support to run test specs during lint  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6753](https://github.com/CocoaPods/CocoaPods/pull/6753)

* Fix to include proper runtime search paths for test native targets  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6727](https://github.com/CocoaPods/CocoaPods/pull/6727)

* Aggregate targets should not include pod targets only used by tests  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6726](https://github.com/CocoaPods/CocoaPods/pull/6726)

* Add support for test target creation in the pods project generator  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6703](https://github.com/CocoaPods/CocoaPods/pull/6703) 

* Copy dSYM for vendored frameworks.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#1698](https://github.com/CocoaPods/CocoaPods/issues/1698) 

* Prevents need for .swift-version file in Objective-C pods  
  [Austin Emmons](https://github.com/atreat)
  [#6742](https://github.com/CocoaPods/CocoaPods/issues/6742) 

* Add a ipc command `podfile_json` converts a Podfile to JSON  
  [Dacaiguoguo](https://github.com/dacaiguoguogmail)
  [#6779](https://github.com/CocoaPods/CocoaPods/pull/6779)

##### Bug Fixes

* Link `swiftSwiftOnoneSupport` for test xcconfigs  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6769](https://github.com/CocoaPods/CocoaPods/pull/6769)

* Do not double add search paths to test xcconfig from parent  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6768](https://github.com/CocoaPods/CocoaPods/pull/6768)

* Ensure product name for tests is not overridden by custom build settings  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6766](https://github.com/CocoaPods/CocoaPods/pull/6766)

* Do not use the same product name for test targets  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6762](https://github.com/CocoaPods/CocoaPods/pull/6762)

* Use unique temp folder during lint for parallel execution  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#5117](https://github.com/CocoaPods/CocoaPods/issues/5117)

* Stop adding `$(inherited)` for every static library linked  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6756](https://github.com/CocoaPods/CocoaPods/pull/6756)

* Settings for dependent targets should include the parent target for test xcconfigs  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6755](https://github.com/CocoaPods/CocoaPods/pull/6755)

* Only check for valid Swift version for pod targets that use Swift  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6733](https://github.com/CocoaPods/CocoaPods/pull/6733) 

* Fix pod install error from 1.2.1 when working with static lib-only projects.  
  [Ben Asher](https://github.com/benasher44)
  [#6673](https://github.com/CocoaPods/CocoaPods/issues/6673)

* Use `git!` when executing `push` command in order to raise informative and set exit code.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6700](https://github.com/CocoaPods/CocoaPods/pull/6700) 

* Make copy resources echoes always return true to work around issue where Xcode stops handling build script output greater than \~440 characters (rdar://30607704).  
  [postmechanical](https://github.com/postmechanical)
  [#6595](https://github.com/CocoaPods/CocoaPods/issues/6595)

* Inherit pod defined values for `SWIFT_ACTIVE_COMPILATION_CONDITIONS`.  
  [Louis D'hauwe](https://github.com/louisdh)
  [#6629](https://github.com/CocoaPods/CocoaPods/pull/6629)
  
* Delete extraneous files in rsync destination.  
  [jgavris](https://github.com/jgavris)
  [#6694](https://github.com/CocoaPods/CocoaPods/pull/6694)
  
## 1.2.1 (2017-04-11)

##### Enhancements

* None.  

##### Bug Fixes

* No master specs cloning when not needed for `pod lib lint`.  
  [Alfredo Delli Bovi](https://github.com/adellibovi)
  [#6154](https://github.com/CocoaPods/CocoaPods/issues/6154)


## 1.2.1.rc.1 (2017-04-05)

##### Enhancements

* None.  

##### Bug Fixes

* Fix generating `LD_RUNPATH_SEARCH_PATHS` without `use_frameworks!` but consuming a vendored dynamic artifact.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6596](https://github.com/CocoaPods/CocoaPods/issues/6596)

* Fix building with static lib subprojects (previously only supported framework subprojects).  
  [Ben Asher](https://github.com/benasher44)
  [#5830](https://github.com/CocoaPods/CocoaPods/issues/5830)
  [#6306](https://github.com/CocoaPods/CocoaPods/issues/6306)

* Fix regression from #6457 to ensure a correct error message is given when a spec is not found.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6457](https://github.com/CocoaPods/CocoaPods/issues/6457)

* Provide a better error message if a podspec is found but cannot be parsed.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6457](https://github.com/CocoaPods/CocoaPods/issues/6457)

* Only share pod target xcscheme if present during validation.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6558](https://github.com/CocoaPods/CocoaPods/pull/6558)

* Properly compile storyboard for watch device family.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6516](https://github.com/CocoaPods/CocoaPods/issues/6516)

* Support git progress for `pod repo update` and `pod install --repo-update`  
  [Alfredo Delli Bovi](https://github.com/adellibovi)
  [#6525](https://github.com/CocoaPods/CocoaPods/issues/6525)

* Return new exit code (31) when spec not found  
  [Alfredo Delli Bovi](https://github.com/adellibovi)
  [#6033](https://github.com/CocoaPods/CocoaPods/issues/6033)

* Provide better error message when spec not found  
  [Alfredo Delli Bovi](https://github.com/adellibovi)
  [#6033](https://github.com/CocoaPods/CocoaPods/issues/6033)


## 1.2.1.beta.1 (2017-03-08)

##### Enhancements

* Use red text when pod installation fails 
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6534](https://github.com/CocoaPods/CocoaPods/issues/6534)
  
* Provide installation option to disable multiple pod sources warnings.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6497](https://github.com/CocoaPods/CocoaPods/pull/6497)

* Use the colored2 gem instead of colored.  
  [Orta Therox](https://github.com/orta)
  [xcodeproj#463](https://github.com/CocoaPods/Xcodeproj/pull/463)

* Cache results of dynamic_binary?  
  [Ken Wigginton](https://github.com/hailstorm350)
  [#6434](https://github.com/CocoaPods/CocoaPods/pull/6434)

* Created `NOMENCLATURE.md` to keep a glossary of the most common terms used in cocoapods.
  [Rob Contreras](https://github.com/robcontreras)
  [#2379](https://github.com/CocoaPods/CocoaPods/pull/2379)

##### Bug Fixes

* Ensure Core Data models get added to the compile sources phase for header generation.  
  [Ben Asher](https://github.com/benasher44)
  [#6259](https://github.com/CocoaPods/CocoaPods/issues/6259)

* Do not crash when attempting to install pod with no supported targets.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6465](https://github.com/CocoaPods/CocoaPods/issues/6465)

* Correctly handle `OTHER_LDFLAGS` for targets with inherit search paths and source pods.  
  [Justin Martin](https://github.com/justinseanmartin)
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6481](https://github.com/CocoaPods/CocoaPods/pull/6481)

* Uses `${PODS_PODFILE_DIR_PATH}` for generated manifest lock script phase.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#5499](https://github.com/CocoaPods/CocoaPods/issues/5499)

* Do not generate `UIRequiredDeviceCapabilities` for `tvOS` Info.plists.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6193](https://github.com/CocoaPods/CocoaPods/issues/6193)

* Fix integration with vendored static frameworks and libraries.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6477](https://github.com/CocoaPods/CocoaPods/pull/6477)

* Use `${SRCROOT}` rather than `${PODS_ROOT}` in the generated manifest lock script phase.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#5499](https://github.com/CocoaPods/CocoaPods/issues/5499)
  
* Fix build phase resource references to point at PBXVariantGroups where relevant.  
  [Wes Campaigne](https://github.com/Westacular)
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6373](https://github.com/CocoaPods/CocoaPods/issues/6373)

* Correctly set runtime search paths for OSX unit test bundles when using frameworks.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6435](https://github.com/CocoaPods/CocoaPods/pull/6435)
  
* Add `--skip-import-validation` to skip linking a pod during lint.  
  [Samuel Giddins](https://github.com/segiddins)
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#5670](https://github.com/CocoaPods/CocoaPods/issues/5670)

* Updated the colored2 gem (previous version removed from rubygems.org).  
  [Ben Asher](https://github.com/benasher44)
  [#6533](https://github.com/CocoaPods/CocoaPods/pull/6533)

## 1.2.0 (2017-01-28)

##### Enhancements

* None.  

##### Bug Fixes

* Do not link static frameworks to targets that use `inherit! search_paths`.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6065](https://github.com/CocoaPods/CocoaPods/issues/6065)


## 1.2.0.rc.1 (2017-01-13)

##### Enhancements

* Show git progress when downloading the CocoaPods Specs repo.  
  [Danielle Tomlinson](https://github.com/dantoml)
  [#5937](https://github.com/CocoaPods/CocoaPods/issues/5937)

* Move Installer target verification into the Xcode namespace 
  [Danielle Tomlinson](https://github.com/DanToml)
  [#5607](https://github.com/CocoaPods/CocoaPods/pull/5607)

##### Bug Fixes

* None.  


## 1.2.0.beta.3 (2016-12-28)

##### Enhancements

* `pod repo push` now accepts the `--swift-version` argument.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6217](https://github.com/CocoaPods/CocoaPods/issues/6217)

* Output Swift targets when multiple versions of Swift are detected.  
  [Justin Martin](https://github.com/justinseanmartin) & [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6191](https://github.com/CocoaPods/CocoaPods/issues/6191)

* [update] adding --sources to specify to only update pods from a repo  
  [Mark Schall](https://github.com/maschall)
  [#5809](https://github.com/CocoaPods/CocoaPods/pull/5809)

* Add aggregated search paths targets to vendored build settings  
  [Chris Ortman](https://github.com/chrisortman)
  [Johannes Plunien](https://github.com/plu)
  [#5512](https://github.com/CocoaPods/CocoaPods/issues/5512)

* Use fetch and reset rather than a pull when updating specs repos.  
  [Danielle Tomlinson](https://github.com/dantoml)
  [#6206](https://github.com/CocoaPods/CocoaPods/pull/6206)

##### Bug Fixes

* Fix default LD_RUNPATH_SEARCH_PATHS for host targets.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#6006](https://github.com/CocoaPods/CocoaPods/issues/6006)

* Fix codesigning issues when targets have spaces.   
  [Sam Gammon](https://github.com/sgammon)
  [#6153](https://github.com/CocoaPods/CocoaPods/issues/6153)

* Raise an exception if unable to find a reference for a path and handle symlink references.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#5427](https://github.com/CocoaPods/CocoaPods/issues/5427)

* Re-escaped backslashes in embed_frameworks generator  
  [Harlan Haskins](https://github.com/harlanhaskins)
  [#6121](https://github.com/CocoaPods/CocoaPods/issues/6121)

* Escape spaces in CONFIGURATION_BUILD_DIR when creating header folders symlink  
  [Dmitry Obukhov](https://github.com/stel)
  [#6146](https://github.com/CocoaPods/CocoaPods/pull/6146)

* Fail gracefully when downloading a podspec in `pod spec lint` fails.  
  [Samuel Giddins](https://github.com/segiddins)

* Remove the `const_missing` hack for `Pod::SourcesManager`.  
  [Samuel Giddins](https://github.com/segiddins)

* Fixed code signing issue causing lint failure on macOS.  
  [Paul Cantrell](https://github.com/pcantrell)
  [#5645](https://github.com/CocoaPods/CocoaPods/issues/5645)

* Raise an exception when using a git version prior to 1.8.5.  
  [Danielle Tomlinson](https://github.com/dantoml)
  [#6078](https://github.com/CocoaPods/CocoaPods/issues/6078)

* Fix framework support for frameworks in sub-projects.  
  [Ben Asher](https://github.com/benasher44)
  [#6123](https://github.com/CocoaPods/CocoaPods/issues/6123)

* Remove errors that prevent host/extension target mismatches, which Xcode will warn about.
  [Ben Asher](https://github.com/benasher44)
  [#6173](https://github.com/CocoaPods/CocoaPods/issues/6173)


## 1.2.0.beta.1 (2016-10-28)

##### Enhancements

* Generate `PODS_TARGET_SRCROOT` build setting for each pod target.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#5375](https://github.com/CocoaPods/CocoaPods/issues/5375)

* Add support for running CocoaPods on Linux.  
  [Samuel Giddins](https://github.com/segiddins)

* Use native Ruby ASCII plist parsing and serialization, removing dependencies
  on FFI, Xcode, and macOS.  
  [Samuel Giddins](https://github.com/segiddins)

* Run codesigning in parallel in the embed frameworks build phase when
 `COCOAPODS_PARALLEL_CODE_SIGN` is set to `true`.  
  [Ben Asher](https://github.com/benasher44)
  [#6088](https://github.com/CocoaPods/CocoaPods/pull/6088)

##### Bug Fixes

* Add target-device tvOS in copy_resources generator.  
  [Konrad Feiler](https://github.com/Bersaelor)
  [#6052](https://github.com/CocoaPods/CocoaPods/issues/6052)

* Read the correct `SWIFT_VERSION` when generating target XCConfigs.  
  [Ben Asher](https://github.com/benasher44)
  [#6067](https://github.com/CocoaPods/CocoaPods/issues/6067)

* Don't explicitly set `ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES` to NO.  
  [Ben Asher](https://github.com/benasher44)
  [#6064](https://github.com/CocoaPods/CocoaPods/issues/6064)

* Redefine FOUNDATION_EXPORT for C-only pods in umbrella header.  
  [Chris Ballinger](https://github.com/chrisballinger)
  [#6024](https://github.com/CocoaPods/CocoaPods/issues/6024)


## 1.1.1 (2016-10-20)

##### Enhancements

* None.  

##### Bug Fixes

* Strip newlines from .swift-version files.  
  [Danielle Tomlinson](https://github.com/dantoml)
  [#6059](https://github.com/CocoaPods/CocoaPods/pull/6059)


## 1.1.0 (2016-10-19)

##### Enhancements

* Use host target for frameworks of XPC services.  
  [Ingmar Stein](https://github.com/IngmarStein)
  [#6029](https://github.com/CocoaPods/CocoaPods/pull/6029)

* Use Swift 3.0 by default during validation.  
  [Danielle Tomlinson](https://github.com/dantoml)
  [#6042](https://github.com/CocoaPods/CocoaPods/pull/6042)

* Exit with non-zero exit status if pod repo update fails  
  [Uku Loskit](https://github.com/UkuLoskit)
  [#6037](https://github.com/CocoaPods/CocoaPods/issues/6037)

* The validator has an API for accessing which version of Swift was used.  
  [Orta Therox](https://github.com/orta)
  [#6049](https://github.com/CocoaPods/CocoaPods/pull/6049)

##### Bug Fixes

* None.  

* Redefine FOUNDATION_EXPORT for C-only pods in umbrella header.  
  [Chris Ballinger](https://github.com/chrisballinger)
  [#6024](https://github.com/CocoaPods/CocoaPods/issues/6024)

## 1.1.0.rc.3 (2016-10-11)

##### Enhancements

* Cache result of inhibit_warnings and include_in_build_config to speed up pod install.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#5934](https://github.com/CocoaPods/CocoaPods/pull/5934)

* Tell users about the .swift-version file on validation failures.  
  [Danielle Tomlinson](https://github.com/dantoml)
  [#5951](https://github.com/CocoaPods/CocoaPods/pull/5951)

* Improve performance of PathList.read_file_system  
  [Heath Borders](https://github.com/hborders)
  [#5890](https://github.com/CocoaPods/CocoaPods/issues/5890)

* Cache result of uses_swift and should_build to speed up pod install.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#5837](https://github.com/CocoaPods/CocoaPods/pull/5837)

* Remove uses of `cd` in generated scripts  
  [Ben Asher](https://github.com/benasher44)
  [#5959](https://github.com/CocoaPods/CocoaPods/pull/5959)

* Error with helpful message when integrating a pod into targets that have mismatched Swift versions.  
  [Ben Asher](https://github.com/benasher44)
  [#5984](https://github.com/CocoaPods/CocoaPods/pull/5984)

* Allow users to share pods between Objective-C and Swift targets.  
  [Danielle Tomlinson](https://github.com/dantoml)
  [#5984](https://github.com/CocoaPods/CocoaPods/pull/5984)

* Allow setting the linting Swift version via `--swift-version=VERSION`  
  [Danielle Tomlinson](https://github.com/dantoml)
  [#5989](https://github.com/CocoaPods/CocoaPods/pull/5989)

* Greenify pod install success message  
  [Stephen Hayes](https://github.com/schayes04)
  [#5713](https://github.com/CocoaPods/CocoaPods/issues/5713)

* Update EMBEDDED_CONTENT_CONTAINS_SWIFT flag behaviour based on xcode version.  
  [codymoorhouse](https://github.com/codymoorhouse)
  [#5732](https://github.com/CocoaPods/CocoaPods/issues/5732)

##### Bug Fixes

* Remove special handling for messages apps  
  [Ben Asher](https://github.com/benasher44)
  [#5860](https://github.com/CocoaPods/CocoaPods/issues/5860)

* Ensure messages apps have an embed frameworks build phase  
  [Ben Asher](https://github.com/benasher44)
  [#5860](https://github.com/CocoaPods/CocoaPods/issues/5860)

* Fix linting of private pods when using libraries.  
  [Stefan Pühringer](https://github.com/b-ray)
  [#5891](https://github.com/CocoaPods/CocoaPods/issues/5891)


## 1.1.0.rc.2 (2016-09-13)

##### Enhancements

* Use the SWIFT_VERSION when linting pods. To lint with Swift 3.0
  add a Swift Version file. `echo "3.0" >> .swift-version`.   
  [Danielle Tomlinson](https://github.com/dantoml)
  [#5841](https://github.com/CocoaPods/CocoaPods/pull/5841)

##### Bug Fixes

* Correctly pass Pod:VERSION in `pod lib create`.  
  [Danielle Tomlinson](https://github.com/dantoml)
  [#5840](https://github.com/CocoaPods/CocoaPods/issues/5840)


## 1.1.0.rc.1 (2016-09-10)

##### Enhancements

*  

##### Bug Fixes

* Wrap generated import headers with __OBJC__ to fix C only pods.   
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#5291](https://github.com/CocoaPods/CocoaPods/issues/5291)

* Prevent crash when generating acknowledgements when license type is not specified.  
  [Marcelo Fabri](https://github.com/marcelofabri)
  [#5826](https://github.com/CocoaPods/CocoaPods/issues/5826)

* Pass full path to App.xcworkspace for spec validation, and use `git -C` for `pod repo push` git ops.  
  [Ben Asher](https://github.com/benasher44)
  [#5805](https://github.com/CocoaPods/CocoaPods/issues/5805)


## 1.1.0.beta.2 (2016-09-03)

##### Enhancements

* Remove references to the pre-1.0 Migrator.  
  [Danielle Tomlinson](https://github.com/dantoml)
  [#5635](https://github.com/CocoaPods/CocoaPods/pull/5635)  

* Improve performance of dependency resolution.
  [yanzhiwei147](https://github.com/yanzhiwei147)
  [#5510](https://github.com/CocoaPods/CocoaPods/pull/5510)

* Add support for building Messages applications.  
  [Ben Asher](https://github.com/benasher44)
  [#5726](https://github.com/CocoaPods/CocoaPods/pull/5726)

* Improved messaging when missing host targets for embedded targets.
  Improved support for framework-only projects.  
  [Ben Asher](https://github.com/benasher44)
  [#5733](https://github.com/CocoaPods/CocoaPods/pull/5733)

* Set ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES when appropriate.  
  [Ben Asher](https://github.com/benasher44)
  [#5732](https://github.com/CocoaPods/CocoaPods/pull/5732)

* Verify that embedded target platform and swift version matches the host.  
  [Ben Asher](https://github.com/benasher44)
  [#5747](https://github.com/CocoaPods/CocoaPods/pull/5747)

* Pass the version of CocoaPods to `pod lib create`'s configure script.  
  [orta](https://github.com/orta)
  [#5787](https://github.com/CocoaPods/CocoaPods/pull/5787)

* Improve host target detection for embedded targets
  in sub-projects.  
  [Ben Asher](https://github.com/benasher44)
  [#5622](https://github.com/CocoaPods/CocoaPods/issues/5622)

##### Bug Fixes

* Hash scope suffixes if they are over 50 characters to prevent file paths from being too long.  
  [Danielle Tomlinson](https://github.com/dantoml)
  [#5491](https://github.com/CocoaPods/CocoaPods/issues/5491)

* Fix codesigning identity on watchOS and tvOS targets.  
  [Danielle Tomlinson](https://github.com/dantoml)
  [#5686](https://github.com/CocoaPods/CocoaPods/issues/5686)

* Fix SWIFT_VERSION not being read when only defined at the project level.  
  [Ben Asher](https://github.com/benasher44)
  [#5700](https://github.com/CocoaPods/CocoaPods/issues/5700) and [#5737](https://github.com/CocoaPods/CocoaPods/issues/5737)

* Fix analyzer checking the compatibility of an embedded target with a host that has not been added the Podfile.  
  [Ben Asher](https://github.com/benasher44)
  [#5783](https://github.com/CocoaPods/CocoaPods/issues/5783)

## 1.1.0.beta.1 (2016-07-11)

##### Enhancements

* Move Pods Project generation to an `Xcode` Namespace.  
  [Daniel Tomlinson](https://github.com/dantoml)
  [#5480](https://github.com/CocoaPods/CocoaPods/pull/5480)

* Add the ability to inhibit swift warnings.  
  [Peter Ryszkiewicz](https://github.com/pRizz)
  [#5414](https://github.com/CocoaPods/CocoaPods/pull/5414)

* Use `git ls-remote` to skip full clones for branch dependencies.  
  [Juan Civile](https://github.com/champo)
  [#5376](https://github.com/CocoaPods/CocoaPods/issues/5376)

* [repo/push] --use-json to convert podspecs to JSON format when pushing.  
  [Mark Schall](https://github.com/maschall)
  [#5568](https://github.com/CocoaPods/CocoaPods/pull/5568)

* Set 'Allow app extension API only' for Messages extensions.  
  [Boris Bügling](https://github.com/neonichu)
  [#5558](https://github.com/CocoaPods/CocoaPods/issues/5558)

* Accept `pod repo push` with URL instead of only repo name.  
  [Mark Schall](https://github.com/maschall)
  [#5572](https://github.com/CocoaPods/CocoaPods/pull/5572)

* [Installer] Set the SWIFT_VERSION for CocoaPods generated targets.  
  [Danielle Tomlinson](https://github.com/DanToml)
  [#5540](https://github.com/CocoaPods/CocoaPods/pull/5540)

* Print message when skipping user project integration.  
  [Danielle Tomlinson](https://github.com/dantoml)
  [#5517](https://github.com/CocoaPods/CocoaPods/issues/5517)

* Show GitHub Issues that could be related to exceptions.  
  [Orta Therox](https://github.com/orta)
  [#4817](https://github.com/CocoaPods/CocoaPods/issues/4817)

* Improve handling of app extensions, watch os 1 extensions
  and framework targets.  
  [Ben Asher](https://github.com/benasher44)
  [#4203](https://github.com/CocoaPods/CocoaPods/issues/4203)

* Add a license type to generated acknowledgements file in plist.  
  [Naoto Kaneko](https://github.com/naoty)
  [#5436](https://github.com/CocoaPods/CocoaPods/pull/5436)

##### Bug Fixes

* Fix local pod platform conflict error message.  
  [Muhammed Yavuz Nuzumlalı](https://github.com/manuyavuz)
  [#5052](https://github.com/CocoaPods/CocoaPods/issues/5052)

* Avoid use of `activesupport` version 5 to stay compatible with macOS system
  Ruby.  
  [Boris Bügling](https://github.com/neonichu)
  [#5602](https://github.com/CocoaPods/CocoaPods/issues/5602)

* Fix installing pods with `use_frameworks` when deduplication is disabled.  
  [Samuel Giddins](https://github.com/segiddins)
  [#5481](https://github.com/CocoaPods/CocoaPods/issues/5481)

* Running `pod setup --silent` will now properly silence git output while
  updating the repository.  
  [Samuel Giddins](https://github.com/segiddins)

* Fix linting pods that depend upon `XCTest`.  
  [Samuel Giddins](https://github.com/segiddins)
  [#5321](https://github.com/CocoaPods/CocoaPods/issues/5321)

* Use `require` instead of `autoload` to solve an issue with loading
  `fourflusher`.  
  [Boris Bügling](https://github.com/neonichu)
  [#5445](https://github.com/CocoaPods/CocoaPods/issues/5445)

* Resolve cyclic dependencies when creating pod targets.  
  [Juan Civile](https://github.com/champo)
  [#5362](https://github.com/CocoaPods/CocoaPods/issues/5362)

* Fix embedding frameworks in UI Testing bundles.  
  [Daniel Tomlinson](https://github.com/dantoml)
  [#5250](https://github.com/CocoaPods/CocoaPods/issues/5250)

* Ensure attempting to print a path in the error report doesn't itself error.  
  [Samuel Giddins](https://github.com/)
  [#5541](https://github.com/CocoaPods/CocoaPods/issues/5541)

* Fix linting with Xcode 8.  
  [Boris Bügling](https://github.com/neonichu)
  [#5529](https://github.com/CocoaPods/CocoaPods/issues/5529)

* Fix linting with Xcode 8 by disabling it entirely.  
  [Boris Bügling](https://github.com/neonichu)
  [#5528](https://github.com/CocoaPods/CocoaPods/issues/5528)

* Error during install when there are duplicate library names.  
  [Daniel Tomlinson](https://github.com/dantoml)
  [#4014](https://github.com/CocoaPods/CocoaPods/issues/4014)

* Make the `Check Pods Manifest.lock` script write errors to STDERR and improve
  POSIX shell compatibility.  
  [Simon Warta](https://github.com/webmaster128)
  [#5595](https://github.com/CocoaPods/CocoaPods/pull/5595)


## 1.0.1 (2016-06-02)

##### Enhancements

* None.

##### Bug Fixes

* Symlink the header folders in the framework bundle's root directory
  by a new shell script build phase if `header_mappings_dir` is used
  with frameworks.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#5313](https://github.com/CocoaPods/CocoaPods/issues/5313)

* Removed emojis in Build Phases names — as it seems that some third party tools have trouble with them.  
  [Olivier Halligon](https://github.com/AliSoftware)
  [#5382](https://github.com/CocoaPods/CocoaPods/pull/5382)

* Ensure `Set` is defined before using it.  
  [Samuel Giddins](https://github.com/segiddins)
  [#5287](https://github.com/CocoaPods/CocoaPods/issues/5287)

* Add --target-device to ibtool invocation for XIBs
  [Juan Civile](https://github.com/champo)
  [#5282](https://github.com/CocoaPods/CocoaPods/issues/5282)

* Fix error when executables cannot be found.
  [Jan Berkel](https://github.com/jberkel)
  [#5319](https://github.com/CocoaPods/CocoaPods/pull/5319)

* Avoid removing all files when root directory contains unicode characters.  
  [Marc Boquet](https://github.com/marcboquet)
  [#5294](https://github.com/CocoaPods/CocoaPods/issues/5294)

* Guarding from crash if pod lib create has a + character in the name.  
  [William Entriken](https://github.com/fulldecent)
  [CocoaPods/pod-template#69](https://github.com/CocoaPods/pod-template/issues/69)

* Use target product types to determine whether a target is a test target when
  running `pod init`.  
  [Samuel Giddins](https://github.com/segiddins)
  [#5378](https://github.com/CocoaPods/CocoaPods/issues/5378)


## 1.0.0 (2016-05-10)

##### Enhancements

* Validate that resource bundles declared in the podspec contain resources.  
  [Samuel Giddins](https://github.com/segiddins)
  [#5218](https://github.com/CocoaPods/CocoaPods/issues/5218)

* Improvements to the error messaging around missing dependencies.  
  [Orta Therox](https://github.com/orta)
  [#5260](https://github.com/CocoaPods/CocoaPods/issues/5260)

* Make sharing schemes for development pods an installation option
  (`share_schemes_for_development_pods`) and disable sharing schemes
  by default.  
  [Samuel Giddins](https://github.com/segiddins)

##### Bug Fixes

* Fix search paths inheritance when there are transitive dependencies.  
  [Samuel Giddins](https://github.com/segiddins)
  [#5264](https://github.com/CocoaPods/CocoaPods/issues/5264)


## 1.0.0.rc.2 (2016-05-04)

##### Enhancements

* None.  

##### Bug Fixes

* Handle when an abstract target has no declared platform without crashing.  
  [Samuel Giddins](https://github.com/segiddins)
  [#5236](https://github.com/CocoaPods/CocoaPods/issues/5236)

* Don't recurse into child directories to find podspecs when running
  `pod spec lint`.  
  [Samuel Giddins](https://github.com/segiddins)
  [#5244](https://github.com/CocoaPods/CocoaPods/issues/5244)


## 1.0.0.rc.1 (2016-04-30)

##### Enhancements

* The `pod init` command now uses target inheritance for test targets
  in the generated Podfile.  
  [Orta Therox](https://github.com/orta)
  [#4714](https://github.com/CocoaPods/CocoaPods/issues/4714)

* Support customized build directories by letting user xcconfig definitions
  rely on the new overridable alias build variable `PODS_BUILD_DIR`.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#5217](https://github.com/CocoaPods/CocoaPods/issues/5217)

##### Bug Fixes

* Fix for `pod repo push --help` throwing an error.  
  [Boris Bügling](https://github.com/neonichu)
  [#5214](https://github.com/CocoaPods/CocoaPods/pull/5214)

* The warning for not having utf-8 set as the default encoding for a
  terminal now properly respects the `--no-ansi` argument.  
  [Joshua Kalpin](https://github.com/Kapin)
  [#5199](https://github.com/CocoaPods/CocoaPods/pull/5199)


## 1.0.0.beta.8 (2016-04-15)

##### Enhancements

* None.  

##### Bug Fixes

* Headers from vendored frameworks no longer end up in the `HEADER_SEARCH_PATH`
  when using frameworks. They are now assumed to be already present as modular
  headers in the framework itself.  
  [Mark Spanbroek](https://github.com/markspanbroek)
  [#5146](https://github.com/CocoaPods/CocoaPods/pull/5146)

* Access to the `Pod::SourcesManager` constant has been restored, though its use
  is considered deprecated and subject to removal at any time. Migrate to use
  `Pod::Config.instance.sources_manager` in some manner as soon as possible.  
  [Samuel Giddins](https://github.com/segiddins)

* Running `pod repo update --silent` will now properly silence git output while
  updating the repository.  
  [Samuel Giddins](https://github.com/segiddins)


## 1.0.0.beta.7 (2016-04-15)

##### Enhancements

* When an unknown build configuration is mentioned in the Podfile, CocoaPods
  will suggest the build configurations found in the user project.  
  [Samuel Giddins](https://github.com/segiddins)
  [#5113](https://github.com/CocoaPods/CocoaPods/issues/5113)

* Improved the error message when a matching spec cannot be found,
  mentioning that now `pod repo update` is not implicit when running `pod
  install`.  
  [Orta Therox](https://github.com/orta)
  [#5135](https://github.com/CocoaPods/CocoaPods/issues/5135)

* Add support for sharded specs directories.  
  [Samuel Giddins](https://github.com/segiddins)
  [#5002](https://github.com/CocoaPods/CocoaPods/issues/5002)

* Pass the build setting `OTHER_CODE_SIGN_FLAGS` to codesign for the generated
  embed frameworks build phase's script, as Xcode does when signing natively.  
  [Václav Slavík](https://github.com/vslavik)
  [#5087](https://github.com/CocoaPods/CocoaPods/pull/5087)

##### Bug Fixes

* Sort files from `Dir.glob` explicitly to produce same result on case sensitive
  file system as result on case insensitive file system.  
  [Soutaro Matsumoto](https://github.com/soutaro)

* Fix build path for resource bundles.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#5034](https://github.com/CocoaPods/CocoaPods/issues/5034)

* Rely on `TARGET_BUILD_DIR` instead of `CONFIGURATION_BUILD_DIR` in the
  generated embed resources build phase's script, so that UI test targets can
  be run.  
  [seaders](https://github.com/seaders)
  [#5133](https://github.com/CocoaPods/CocoaPods/issues/5133)

* Ensure that a `CFBundleVersion` is set for resource bundles' Info.plist
  files.  
  [Samuel Giddins](https://github.com/segiddins)
  [#4897](https://github.com/CocoaPods/CocoaPods/issues/4897)


## 1.0.0.beta.6 (2016-03-15)

##### Breaking

* Running `pod install` doesn't imply an automatic spec repo update.  
  The old behavior can be achieved by passing in the option `--repo-update`
  or running `pod repo update`.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#5004](https://github.com/CocoaPods/CocoaPods/issues/5004)

* Remove the configuration variable `skip_repo_update` as the default behavior
  varies now between `pod install` and `pod (update|outdated)`.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#5017](https://github.com/CocoaPods/CocoaPods/issues/5017)

##### Enhancements

* The master specs repo will no longer perform 'no-op' git fetches. This should
  help to reduce the load on GitHub's servers.  
  [Daniel Tomlinson](https://github.com/DanielTomlinson)
  [#5005](https://github.com/CocoaPods/CocoaPods/issues/5005)
  [#4989](https://github.com/CocoaPods/CocoaPods/issues/4989)

* The specs repos will no longer support shallow clones to reduce CPU load
  on git servers. Pre-existing shallow clones of the `master` repo will
  automatically be upgraded to deep clones when the repo is updated.  
  [Samuel Giddins](https://github.com/segiddins)
  [#5016](https://github.com/CocoaPods/CocoaPods/issues/5016)

* The validator will check that all `public_header_files` and
  `private_header_files` are also present in `source_files`.  
  [Samuel Giddins](https://github.com/segiddins)
  [#4936](https://github.com/CocoaPods/CocoaPods/issues/4936)

##### Bug Fixes

* The master specs repository can no longer be added via `pod repo add`, but
  instead must be done via `pod setup`.  
  [Samuel Giddins](https://github.com/segiddins)

* Print a friendly error message when the platform for a target cannot be
  inferred.  
  [Samuel Giddins](https://github.com/segiddins)
  [#4790](https://github.com/CocoaPods/CocoaPods/issues/4790)

* Rely on `TARGET_BUILD_DIR` instead of `CONFIGURATION_BUILD_DIR` in the
  generated embed frameworks build phase's script, so that UI test targets can
  be run.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#5022](https://github.com/CocoaPods/CocoaPods/issues/5022)

* Fix build paths for resources bundles.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#5028](https://github.com/CocoaPods/CocoaPods/pull/5028)

* Validate that a Podfile does not declare the same target twice.  
  [Samuel Giddins](https://github.com/segiddins)
  [#5029](https://github.com/CocoaPods/CocoaPods/issues/5029)


## 1.0.0.beta.5 (2016-03-08)

##### Breaking

* Development pods will no longer be implicitly unlocked. This makes CocoaPods respect
  constraints related to dependencies of development pods in the lockfile.

  If you change the constraints of a dependency of your development pod and want to
  override the locked version, you will have to use
  `pod update ${DEPENDENCY_NAME}` manually.  
  [Muhammed Yavuz Nuzumlalı](https://github.com/manuyavuz)
  [#4211](https://github.com/CocoaPods/CocoaPods/issues/4211)
  [#4577](https://github.com/CocoaPods/CocoaPods/issues/4577)
  [#4580](https://github.com/CocoaPods/CocoaPods/issues/4580)

##### Enhancements

* Add the :package: emoji in front of CocoaPods Script Build Phases
  to quickly and visually differentiate them from other phases.  
  [Olivier Halligon](https://github.com/AliSoftware)
  [#4985](https://github.com/CocoaPods/CocoaPods/issues/4985)

* Enable syntax highlighting on the Podfile in the generated
  `Pods.xcodeproj`.  
  [Samuel Giddins](https://github.com/segiddins)
  [#4962](https://github.com/CocoaPods/CocoaPods/issues/4962)

##### Bug Fixes

* Fixes paths passed for resources bundles in the copy resources script.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#4954](https://github.com/CocoaPods/CocoaPods/pull/4954)

* Fix saying the `master` specs repo exists when it has not been set up.  
  [Samuel Giddins](https://github.com/segiddins)
  [#4955](https://github.com/CocoaPods/CocoaPods/issues/4955)

* Move `${TARGET_DEVICE_ARGS}` out of the quotations for `--sdk` in the
  `Copy Pods Resources` build phase.  
  [seaders](https://github.com/seaders) [#4940](https://github.com/CocoaPods/CocoaPods/issues/4940)

* Handle when `$PATH` isn't set.  
  [Samuel Giddins](https://github.com/segiddins)

* Module maps that are set per-platform will be installed for the correct
  platform.  
  [Samuel Giddins](https://github.com/segiddins)
  [#4968](https://github.com/CocoaPods/CocoaPods/issues/4968)


## 1.0.0.beta.4 (2016-02-24)

##### Enhancements

* Allow deduplication to take effect even when the same pod is used with
  different sets of subspecs across different platforms.
  This changes the general naming scheme scoped pod targets. They are
  suffixed now on base of what makes them different among others for the
  same root spec instead of being prefixed by the dependent target.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#4146](https://github.com/CocoaPods/CocoaPods/pull/4146)

* Pass `COCOAPODS_VERSION` as environment variable when invoking the
  `prepare_command`.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#4933](https://github.com/CocoaPods/CocoaPods/pull/4933)

##### Bug Fixes

* Pods are built by default in another scoping level of the build products
  directory identified by their name to prevent name clashes among
  dependencies.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#4146](https://github.com/CocoaPods/CocoaPods/pull/4146)

* Fix mixed integrations where static libraries are used along frameworks
  from different target definitions in one Podfile.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#4146](https://github.com/CocoaPods/CocoaPods/pull/4146)

* Pass target device arguments to `ibtool` in the copy resources script, fixing
  compilation of storyboards when targeting versions of iOS prior to iOS 8.  
  [seaders](https://github.com/seaders)
  [#4913](https://github.com/CocoaPods/CocoaPods/issues/4913)

* Fix `pod repo lint` when passed a path argument.  
  [Boris Bügling](https://github.com/neonichu)
  [#4883](https://github.com/CocoaPods/CocoaPods/issues/4883)


## 1.0.0.beta.3 (2016-02-03)

##### Breaking

* Rename the `xcodeproj` Podfile directive to `project`.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [Core#298](https://github.com/CocoaPods/Core/issues/298)

##### Enhancements

* None.  

##### Bug Fixes

* Don't try to embed project headers into frameworks.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#4819](https://github.com/CocoaPods/CocoaPods/issues/4819)

* Fix a crash in the analyzer when target deduplication is deactivated.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#4751](https://github.com/CocoaPods/CocoaPods/issues/4751)

* Handle CoreData mapping models with recursive resource globs.  
  [Eric Firestone](https://github.com/efirestone)
  [#4809](https://github.com/CocoaPods/CocoaPods/pull/4809)

* Generate valid xcconfig when target name includes spaces.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#4783](https://github.com/CocoaPods/CocoaPods/issues/4783)

* Properly add resource files to resources build phase.  
  [Eric Firestone](https://github.com/efirestone)
  [#4762](https://github.com/CocoaPods/CocoaPods/issues/4762)

* Fix suggestion of sudo when it actually isn't needed.  
  [Marcel Jackwerth](https://github.com/sirlantis)

* Set the `TARGET_DEVICE_FAMILY` to support both iPhone and iPad for iOS
  resource bundle targets.  
  [Andy Rifken](https://github.com/arifken)

* Share user schemes of `Pods.xcodeproj` after generating deterministic UUIDS.  
  [Samuel Giddins](https://github.com/segiddins)

* Only attempt to `import` a framework during linting if the pod has source
  files, and is thus being built by CocoaPods.  
  [Samuel Giddins](https://github.com/segiddins)
  [#4823](https://github.com/CocoaPods/CocoaPods/issues/4823)

* Determine whether an external source needs to be fetched when updating a
  dependency regardless of subspec names.  
  [Samuel Giddins](https://github.com/segiddins)
  [#4821](https://github.com/CocoaPods/CocoaPods/issues/4821)


## 1.0.0.beta.2 (2016-01-05)

##### Enhancements

* Present a friendly error suggesting running `pod install` when there are
  missing local podspecs when running `pod outdated`.  
  [Samuel Giddins](https://github.com/segiddins)
  [#4716](https://github.com/CocoaPods/CocoaPods/issues/4716)

* Don't warn about setting base config when identical to current config.  
  [Jed Lewison](https://github.com/jedlewison)
  [#4722](https://github.com/CocoaPods/CocoaPods/issues/4722)

* Add `user_targets` method to the `UmbrellaTargetDescription` in the
  post-install hooks context.  
  [Samuel Giddins](https://github.com/segiddins)

##### Bug Fixes

* Always fetch a `:podspec` dependency's podspec when it is missing in the
  `Pods` directory.  
  [Samuel Giddins](https://github.com/segiddins)
  [#4717](https://github.com/CocoaPods/CocoaPods/issues/4717)

* The `Info.plist` file will now be generated properly for resource bundles,
  setting the proper `CFBundlePackageType` and omitting the `CFBundleExecutable`
  key.  
  [Samuel Giddins](https://github.com/segiddins)
  [Xcodeproj#259](https://github.com/CocoaPods/Xcodeproj/issues/259)

* Fix crash when deintegrating due to major version change and there are
  multiple root-level Xcode projects.  
  [Samuel Giddins](https://github.com/segiddins)

* Ensure the `sandbox_root` attribute is set on the pre-install hooks context.  
  [Samuel Giddins](https://github.com/segiddins)


## 1.0.0.beta.1 (2015-12-30)

##### Breaking

* The `link_with` Podfile DSL method has been removed in favor of target
  inheritance.  
  [Samuel Giddins](https://github.com/segiddins)

* The `:exclusive => true` Podfile DSL target option has been removed in favor
  of the `inherit! :search_paths` directive.  
  [Samuel Giddins](https://github.com/segiddins)

* The specification of `:head` dependencies has been removed.  
  [Samuel Giddins](https://github.com/segiddins)
  [#4673](https://github.com/CocoaPods/CocoaPods/issues/4673)

* The deprecated `:local` dependency option has been removed in favor of the
  equivalent `:path` option.  
  [Samuel Giddins](https://github.com/segiddins)

* The deprecated `dependency` method in the Podfile DSL has been removed in
  favor of the equivalent `pod` method.  
  [Samuel Giddins](https://github.com/segiddins)

* The deprecated `preferred_dependency` method in the Specification DSL has been
  removed in favor of the equivalent `default_subspecs` method.  
  [Samuel Giddins](https://github.com/segiddins)

* The `docset_url` Specification attribute has been removed.  
  [Samuel Giddins](https://github.com/segiddins)
  [Core#284](https://github.com/CocoaPods/Core/issues/284)

* Build configuration names are no longer set as pre-processor defines, but
  rather `POD_CONFIGURATION_$CONFIGURATION_NAME` is defined in order to lessen
  conflicts with pod code.  
  [#4143](https://github.com/CocoaPods/CocoaPods/issues/4143)

##### Highlighted Enhancements That Need Testing

* The Podfile DSL has been cleaned up, with the removal of confusing options and
  the introduction of abstract targets, search paths-only inheritance, the
  specification of installation options, and the removal of head dependencies.  
  [Samuel Giddins](https://github.com/segiddins)
  [#840](https://github.com/CocoaPods/CocoaPods/issues/840)

##### Enhancements

* Add the ability to add a custom commit message when pushing a spec.
  [Bart Jacobs](https://github.com/bartjacobs)
  [#4583](https://github.com/CocoaPods/CocoaPods/issues/4583)

* Added support for `pod env` to print the pod environment without having to crash.  
  [Hemal Shah](https://github.com/hemal)
  [#3660](https://github.com/CocoaPods/CocoaPods/issues/3660)

* Add support for specifying :source with a pod dependency.  
  [Eric Firestone](https://github.com/efirestone)
  [#4486](https://github.com/CocoaPods/CocoaPods/pull/4486)

* Ask user to run `pod install` when a resource not found during in copy resources script.  
  [Muhammed Yavuz Nuzumlalı](https://github.com/manuyavuz)

* Add support to track `.def` sources.
* Add support to track `.def` files as headers.
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#338](https://github.com/CocoaPods/Xcodeproj/pull/338)

* `Pod::Installer::PostInstallHooksContext` now offers access to the `sandbox`
  object.  
  [Marcelo Fabri](https://github.com/marcelofabri)
  [#4487](https://github.com/CocoaPods/CocoaPods/pull/4487)

* Improve sorting algorithm for `pod search`.  
  [Muhammed Yavuz Nuzumlalı](https://github.com/manuyavuz)
  [cocoapods-search#12](https://github.com/CocoaPods/cocoapods-search/issues/12)

* Improve `pod search` performance while using _`--full`_ flag.  
  [Muhammed Yavuz Nuzumlalı](https://github.com/manuyavuz)
  [cocoapods-search#8](https://github.com/CocoaPods/cocoapods-search/issues/8)

* Improve message when there is no spec in repos for dependency set in Podfile.  
  [Muhammed Yavuz Nuzumlalı](https://github.com/manuyavuz)
  [#4430](https://github.com/CocoaPods/CocoaPods/issues/4430)

* Reduce the number of times the user's Xcode project is opened, speeding up
  installation.  
  [Samuel Giddins](https://github.com/segiddins)
  [#4374](https://github.com/CocoaPods/CocoaPods/issues/4374)

* Improving the performance of Pod::Installer::Analyzer#generate_pod_targets  
  [Daniel Ribeiro](https://github.com/danielribeiro)
  [#4399](https://github.com/CocoaPods/CocoaPods/pull/4399)

* Framework pods that have a `header_mappings_dirs` set will now produce
  frameworks with headers that respect the nesting.  
  [Samuel Giddins](https://github.com/segiddins)

* The validator will now ensure that pods with a `header_mappings_dirs` have all
  of their headers inside that directory.  
  [Samuel Giddins](https://github.com/segiddins)

* Pods will be validated with the `-Wincomplete-umbrella` compiler flag to
  ensure module maps are valid.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3428](https://github.com/CocoaPods/CocoaPods/issues/3428)

* The validator will now attempt to build an app that imports the pod.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2095](https://github.com/CocoaPods/CocoaPods/issues/2095)
  [#2134](https://github.com/CocoaPods/CocoaPods/issues/2134)

* The `Info.plist` file's `CFBundleIdentifier` is now set via the
  `PRODUCT_BUNDLE_IDENTIFIER` build setting, consistent with Xcode 7.  
  [Samuel Giddins](https://github.com/segiddins)
  [#4426](https://github.com/CocoaPods/CocoaPods/issues/4426)

* Externally-sourced pods will now have their specifications quickly linted.  
  [Samuel Giddins](https://github.com/segiddins)

* Set the deployment target on pods to be that which is defined in the
  podspec.  
  [Samuel Giddins](https://github.com/segiddins)
  [#4354](https://github.com/CocoaPods/CocoaPods/issues/3454)

* Set a deployment target for resource bundle targets.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3347](https://github.com/CocoaPods/CocoaPods/issues/3347)

* Targets that are no longer integrated with CocoaPods will be properly
  de-integrated when installation occurs.  
  [Samuel Giddins](https://github.com/segiddins)

* Targets that are integrated will be ensured that they have all
  CocoaPods-related settings and phases properly installed.  
  [Samuel Giddins](https://github.com/segiddins)

* Total de-integration will happen whenever the major version of CocoaPods
  changes, ensuring backwards-incompatible changes are properly applied.  
  [Samuel Giddins](https://github.com/segiddins)

* The Podfile now allows specifying installation options via the `install!`
  directive.  
  [Samuel Giddins](https://github.com/segiddins)
  [Core#151](https://github.com/CocoaPods/Core/issues/151)

* The Podfile now allows marking targets as `abstract` and specifying the pod
  inheritance mode via the `inherit!` directive.  
  [Samuel Giddins](https://github.com/segiddins)
  [#1249](https://github.com/CocoaPods/CocoaPods/issues/1249)
  [#1626](https://github.com/CocoaPods/CocoaPods/issues/1626)
  [#4001](https://github.com/CocoaPods/CocoaPods/issues/4001)

##### Bug Fixes

* Fix compiling of localized resources.
  [Eric Firestone](https://github.com/efirestone)
  [#1653](https://github.com/CocoaPods/CocoaPods/issues/1653)

* Fix compiling of asset catalog files inside resource bundles.  
  [Muhammed Yavuz Nuzumlalı](https://github.com/manuyavuz)
  [#4501](https://github.com/CocoaPods/CocoaPods/issues/4501)

* Prevent installer to be run from inside sandbox directory.  
  [Muhammed Yavuz Nuzumlalı](https://github.com/manuyavuz)

* Improve repo lint error message when no repo found with given name.  
  [Muhammed Yavuz Nuzumlalı](https://github.com/manuyavuz)
  [#4142](https://github.com/CocoaPods/CocoaPods/issues/4142)

* Fix a crash in dependency resolution when running Ruby 2.3.  
  [Samuel Giddins](https://github.com/segiddins)
  [#4345](https://github.com/CocoaPods/CocoaPods/issues/4345)

* Fix handling of localized files in Pods installed as frameworks.  
  [Tim Bodeit](https://github.com/timbodeit)
  [#2597](https://github.com/CocoaPods/CocoaPods/issues/2597)

* Only include native targets when generating the Podfile in `pod init`.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2169](https://github.com/CocoaPods/CocoaPods/issues/2169)

* Ensure that generated `Info.plist` files have a `CFBundleShortVersionString`
  that is precisely three dot-separated numbers.  
  [Samuel Giddins](https://github.com/segiddins)
  [#4421](https://github.com/CocoaPods/CocoaPods/issues/4421)

* Set the `APPLICATION_EXTENSION_API_ONLY` build setting if integrating with a
  tvOS extension target, or a target that has the setting set to `YES`.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3644](https://github.com/CocoaPods/CocoaPods/issues/3644)
  [#4393](https://github.com/CocoaPods/CocoaPods/issues/4393)

* Only the root directory of externally-sourced pods will be searched for
  podspecs.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3683](https://github.com/CocoaPods/CocoaPods/issues/3683)

* Remove the library name's extension when adding it in the "linker flags" build
  setting to support dynamic libraries.  
  [Andrea Cremaschi](https://github.com/andreacremaschi)
  [#4468](https://github.com/CocoaPods/CocoaPods/issues/4468)

* Specifying relative subspec names to the linter is now supported.  
  [Samuel Giddins](https://github.com/segiddins)
  [#1917](https://github.com/CocoaPods/CocoaPods/issues/1917)

* Headers used to build a pod will no longer be duplicated for frameworks.  
  [Samuel Giddins](https://github.com/segiddins)
  [#4420](https://github.com/CocoaPods/CocoaPods/issues/4420)

* The `UIRequiredDeviceCapabilities` key is now specified in the `Info.plist`
  file for tvOS pods built as frameworks.  
  [Samuel Giddins](https://github.com/segiddins)
  [#4514](https://github.com/CocoaPods/CocoaPods/issues/4514)

* Fix Swift code completion for Development Pods by using `realpath` for
  symlinked source files.  
  [Boris Bügling](https://github.com/neonichu)
  [#3777](https://github.com/CocoaPods/CocoaPods/issues/3777)

* Avoid the duplicate UUID warning when a Pod is installed for multiple
  platforms.  
  [Samuel Giddins](https://github.com/segiddins)
  [#4521](https://github.com/CocoaPods/CocoaPods/issues/4521)

* Changing the name of a target in a Podfile will no longer cause warnings about
  being unable to set the base configuration XCConfig.  
  [Samuel Giddins](https://github.com/segiddins)

* Ensure that linking multiple times against the same framework does not trigger
  the duplicate module name check for frameworks.  
  [Boris Bügling](https://github.com/neonichu)
  [Samuel Giddins](https://github.com/segiddins)
  [#4550](https://github.com/CocoaPods/CocoaPods/issues/4550)

* Fix lint in Xcode 7.2, it requires `-destination`.  
  [Boris Bügling](https://github.com/neonichu)
  [#4652](https://github.com/CocoaPods/CocoaPods/pull/4652)

* Empty podfiles / target blocks no longer break the user's Xcode project.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3617](https://github.com/CocoaPods/CocoaPods/issues/3617)

* The pre-processor define for `DEBUG` will be set for all debug-based build
  configurations when building pods.  
  [Samuel Giddins](https://github.com/segiddins)
  [#4148](https://github.com/CocoaPods/CocoaPods/issues/4148)


## 0.39.0 (2015-10-09)

##### Enhancements

* Podfile-specified options are passed to plugins as hashes that treat string
  and symbol keys identically.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3354](https://github.com/CocoaPods/CocoaPods/issues/3354)

##### Bug Fixes

* Only link dynamic vendored frameworks and libraries of pod dependencies.  
  [Kevin Coleman](https://github.com/kcoleman731)
  [#4336](https://github.com/CocoaPods/CocoaPods/issues/4336)


## 0.39.0.rc.1 (2015-10-05)

##### Enhancements

* Support for adding dependency target vendored libraries and frameworks to build settings.  
  [Kevin Coleman](https://github.com/kcoleman731)
  [#4278](https://github.com/CocoaPods/CocoaPods/pull/4278)

* Always link the aggregate target as static to the user project.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#4137](https://github.com/CocoaPods/CocoaPods/pull/4137)


## 0.39.0.beta.5 (2015-10-01)

##### Breaking

* Activesupport 4 is now required, breaking compatibility with applications
  locked to `3.x.y`.  

##### Enhancements

* The `EMBEDDED_CONTENT_CONTAINS_SWIFT` build setting will now be set when
  appropriate.  
  [Samuel Giddins](https://github.com/segiddins)

* The embed frameworks script will no longer manually copy over the Swift
  runtime libraries on Xcode 7 and later.  
  [Samuel Giddins](https://github.com/segiddins)
  [earltedly](https://github.com/segiddins)
  [DJ Tarazona](https://github.com/djtarazona)
  [#4188](https://github.com/CocoaPods/CocoaPods/issues/4188)

* A post-install summary of the pods installed is now printed.  
  [Samuel Giddins](https://github.com/segiddins)
  [#4124](https://github.com/CocoaPods/CocoaPods/issues/4124)

##### Bug Fixes

* Give a meaningful message for the case where there is no available stable
  version for a pod, and there is no explicit version requirement.  
  [Muhammed Yavuz Nuzumlalı](https://github.com/manuyavuz)
  [#4197](https://github.com/CocoaPods/CocoaPods/issues/4197)

* Use `watchsimulator` when validating pods with the watchOS platform.  
  [Thomas Kollbach](https://github.com/toto)
  [#4130](https://github.com/CocoaPods/CocoaPods/issues/4130)

* C or C++ preprocessor output files with `.i` extension now have their compiler
  flags set correctly.  
  [Andrea Aresu](https://github.com/aaresu/)

* Remove SDKROOT relative search path as it isn't needed anymore since XCTest.  
  [Boris Bügling](https://github.com/neonichu)
  [#4219](https://github.com/CocoaPods/CocoaPods/issues/4219)

* Podfile generated by `pod init` now specifies iOS 8.0 as the default platform
  and includes `use_frameworks!` for Swift projects.  
  [Jamie Evans](https://github.com/JamieREvans)

* Support for the new `tvos` platform.  
  [Boris Bügling](https://github.com/neonichu)
  [#4152](https://github.com/CocoaPods/CocoaPods/pull/4152)

* Either generate just one pod target or generate it once for each target
  definition.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#4034](https://github.com/CocoaPods/CocoaPods/issues/4034)

* Stop setting `DYLIB_CURRENT_VERSION`, `CURRENT_PROJECT_VERSION`, and
  `DYLIB_COMPATIBILITY_VERSION` for pods integrated as dynamic frameworks.  
  [Samuel Giddins](https://github.com/segiddins)
  [#4083](https://github.com/CocoaPods/CocoaPods/issues/4083)

* The headers folders paths for static library pods will be unset, fixing
  validation when archives are uploaded to iTunes Connect.  
  [Boris Bügling](https://github.com/neonichu)
  [Samuel Giddins](https://github.com/segiddins)
  [#4119](https://github.com/CocoaPods/CocoaPods/issues/4119)

* Don't require the `platform` attribute for targets without any declared pods
  when running `pod install --no-integrate`.  
  [Sylvain Guillopé](https://github.com/sguillope)
  [#3151](https://github.com/CocoaPods/CocoaPods/issues/3151)

* Gracefully handle exception if creating the repos directory fails due to a
  system error like a permission issue.  
  [Sylvain Guillopé](https://github.com/sguillope)
  [#4177](https://github.com/CocoaPods/CocoaPods/issues/4177)

## 0.39.0.beta.4 (2015-09-02)

##### Bug Fixes

* Using vendored frameworks without a `Headers` directory will no longer cause a
  crash.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3967](https://github.com/CocoaPods/CocoaPods/issues/3967)

* Computing the set of transitive dependencies for a pod target,
  even if the target is scoped, will no longer smash the stack.  
  [Samuel Giddins](https://github.com/segiddins)
  [#4092](https://github.com/CocoaPods/CocoaPods/issues/4092)

* Take into account a specification's `exclude_files` when constructing resource
  bundles.  
  [Samuel Giddins](https://github.com/segiddins)
  [#4065](https://github.com/CocoaPods/CocoaPods/issues/4065)

* Fix resolving to platform-compatible versions of transitive dependencies.  
  [Samuel Giddins](https://github.com/segiddins)
  [#4084](https://github.com/CocoaPods/CocoaPods/issues/4084)


## 0.39.0.beta.3 (2015-08-28)

##### Bug Fixes

* This release fixes a file permissions error when using the RubyGem.  
  [Samuel Giddins](https://github.com/segiddins)


## 0.39.0.beta.2 (2015-08-27)

##### Bug Fixes

* Ensure all gem files are readable.  
  [Samuel Giddins](https://github.com/segiddins)
  [#4085](https://github.com/CocoaPods/CocoaPods/issues/4085)


## 0.39.0.beta.1 (2015-08-26)

##### Breaking

* The `HEADER_SEARCH_PATHS` will no longer be constructed recursively.  
  [Samuel Giddins](https://github.com/segiddins)
  [twoboxen](https://github.com/twoboxen)
  [#1437](https://github.com/CocoaPods/CocoaPods/issues/1437)
  [#3760](https://github.com/CocoaPods/CocoaPods/issues/3760)

##### Enhancements

* Collapse the namespaced public and private pod xcconfig into one single
  xcconfig file.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#3916](https://github.com/CocoaPods/CocoaPods/pull/3916)

* Add `--sources` option to `push` command.  
  [Dimitris Koutsogiorgas](https://github.com/dnkoutso)
  [#3912](https://github.com/CocoaPods/CocoaPods/issues/3912)

* Implicitly unlock all local dependencies when installing.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3764](https://github.com/CocoaPods/CocoaPods/issues/3764)

* The resolver error message when a conflict occurred due to platform deployment
  target mismatches will now explain that.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3926](https://github.com/CocoaPods/CocoaPods/issues/3926)

* Add `:source_provider` hook to allow plugins to provide sources.  
  [Eric Amorde](https://github.com/amorde)
  [#3190](https://github.com/CocoaPods/CocoaPods/issues/3190)
  [#3792](https://github.com/CocoaPods/CocoaPods/pull/3792)

* Remove embed frameworks build phase from target types, where it is not required.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#3905](https://github.com/CocoaPods/CocoaPods/issues/3905)
  [#4028](https://github.com/CocoaPods/CocoaPods/pull/4028)

* Add a `--private` option to `pod spec lint`, `pod lib lint`, and
  `pod repo push` that will ignore warnings that only apply to public
  specifications and sources.  
  [Samuel Giddins](https://github.com/segiddins)
  [Core#190](https://github.com/CocoaPods/Core/issues/190)
  [#2682](https://github.com/CocoaPods/CocoaPods/issues/2682)

* Add support for dynamic `vendored_frameworks` and `vendored_libraries`.  
  [Samuel Giddins](https://github.com/segiddins)
  [#1993](https://github.com/CocoaPods/CocoaPods/issues/1993)

##### Bug Fixes

* Build settings specified in `pod_target_xcconfig` of a spec are also for
  library targets only applied to the pod target.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#3906](https://github.com/CocoaPods/CocoaPods/issues/3906)

* Use APPLICATION_EXTENSION_API_ONLY for watchOS 2 extensions.  
  [Boris Bügling](https://github.com/neonichu)
  [#3920](https://github.com/CocoaPods/CocoaPods/pull/3920)

* Prevent copying resources to installation directory when `SKIP_INSTALL` is enabled.  
  [Dominique d'Argent](https://github.com/nubbel)
  [#3971](https://github.com/CocoaPods/CocoaPods/pull/3971)

* Embed frameworks into app and watch extensions.  
  [Boris Bügling](https://github.com/neonichu)
  [#4004](https://github.com/CocoaPods/CocoaPods/pull/4004)

* Fix missing `$(inherited)` for generated xcconfig `LIBRARY_SEARCH_PATHS`
  and `HEADER_SEARCH_PATHS` build settings.  
  [Tyler Fox](https://github.com/smileyborg)
  [#3908](https://github.com/CocoaPods/CocoaPods/issues/3908)

* Fix source locking/unlocking.  
  [Samuel Giddins](https://github.com/segiddins)
  [#4059](https://github.com/CocoaPods/CocoaPods/issues/4059)

* Include the `-ObjC` linker flag when static `vendored_frameworks` are present.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3870](https://github.com/CocoaPods/CocoaPods/issues/3870)
  [#3992](https://github.com/CocoaPods/CocoaPods/issues/3992)


## 0.38.2 (2015-07-25)

##### Bug Fixes

* Fix generation of xcconfig files that specify both `-iquote` and `-isystem`
  headers.  
  [Russ Bishop](https://github.com/russbishop)
  [#3893](https://github.com/CocoaPods/CocoaPods/issues/3893)

* Pods integrated as static libraries can no longer be imported as
  modules, as that change had unexpected side-effects.  
  [Boris Bügling](https://github.com/neonichu)
  [#3898](https://github.com/CocoaPods/CocoaPods/pull/3898)
  [#3879](https://github.com/CocoaPods/CocoaPods/issues/3879)
  [#3888](https://github.com/CocoaPods/CocoaPods/issues/3888)
  [#3886](https://github.com/CocoaPods/CocoaPods/issues/3886)
  [#3889](https://github.com/CocoaPods/CocoaPods/issues/3889)
  [#3884](https://github.com/CocoaPods/CocoaPods/issues/3884)

* Source file locking now happens after plugin and podfile post-install hooks
  have run.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3529](https://github.com/CocoaPods/CocoaPods/issues/3529)

* Only set project, dylib, and compatibility versions to valid, three integer
  values.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3887](https://github.com/CocoaPods/CocoaPods/issues/3887)


## 0.38.1 (2015-07-23)

##### Enhancements

* Set project, dylib, and compatibility versions when building pods as
  frameworks.  
  [Marius Rackwitz](https://github.com/mrackwitz)

* Pods integrated as static libraries can now be imported as modules.  
  [Tomas Linhart](https://github.com/TomasLinhart)
  [#3874](https://github.com/CocoaPods/CocoaPods/issues/3874)

##### Bug Fixes

* Ensure the aggregate `.xcconfig` file only has the settings for the
  appropriate build configuration.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3842](https://github.com/CocoaPods/CocoaPods/issues/3842)

* Show the correct error when `pod spec lint` finds multiple podspecs, and at
  least one of them fails linting.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3869](https://github.com/CocoaPods/CocoaPods/issues/3869)

* Set header search paths properly on the user target when `vendored_libraries`
  Pods are used while integrating Pods as frameworks.  
  [Jonathan MacMillan](https://github.com/perotinus)
  [#3857](https://github.com/CocoaPods/CocoaPods/issues/3857)

* Only link public headers in the sandbox for Pods that are not being built
  into dynamic frameworks, when integrating Pods as frameworks.  
  [Jonathan MacMillan](https://github.com/perotinus)
  [#3867](https://github.com/CocoaPods/CocoaPods/issues/3867)

* Don't lock resource files, only source files.  
  [Mason Glidden](https://github.com/mglidden)
  [#3557](https://github.com/CocoaPods/CocoaPods/issues/3557)

* Fix copying frameworks when integrating with today extensions.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3819](https://github.com/CocoaPods/CocoaPods/issues/3819)


## 0.38.0 (2015-07-18)

##### Enhancements

* Improve the message shown when trying to use Swift Pods without frameworks.
  Now it includes the offending Pods so that the user can take action to remove
  the Pods, if they don’t want to move to frameworks yet.  
  [Eloy Durán](https://github.com/alloy)
  [#3830](https://github.com/CocoaPods/CocoaPods/pull/3830)

##### Bug Fixes

* Properly merge the `user_target_xcconfig`s of multiple subspecs.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3813](https://github.com/CocoaPods/CocoaPods/issues/3813)


## 0.38.0.beta.2 (2015-07-05)

##### Enhancements

* The resolver will now take supported platform deployment targets into account
  when resolving dependencies.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2443](https://github.com/CocoaPods/CocoaPods/issues/2443)

* `Pods.xcodeproj` will now be written with deterministic UUIDs, vastly reducing
  project churn and merge conflicts.  This behavior can be disabled via the new
  `COCOAPODS_DISABLE_DETERMINISTIC_UUIDS` environment variable.  
  [Samuel Giddins](https://github.com/segiddins)

* [`cocoapods-stats`](https://github.com/CocoaPods/cocoapods-stats)
  is now a default plugin.  
  [Samuel Giddins](https://github.com/segiddins)

##### Bug Fixes

* Ensure that the `prepare_command` is run even when skipping the download
  cache.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3674](https://github.com/CocoaPods/CocoaPods/issues/3674)

* Public headers inside a directory named `framework` should be linked in the
  sandbox.  
  [Vincent Isambart](https://github.com/vincentisambart)
  [#3751](https://github.com/CocoaPods/CocoaPods/issues/3751)

* Properly support targets with spaces in their name in the embed frameworks
  script.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3754](https://github.com/CocoaPods/CocoaPods/issues/3754)

* Don't add the `-ObjC` linker flag if it's unnecessary.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3537](https://github.com/CocoaPods/CocoaPods/issues/3537)

* Ensure that no duplicate framework or target dependencies are created.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3763](https://github.com/CocoaPods/CocoaPods/issues/3763)


## 0.38.0.beta.1 (2015-06-26)

##### Highlighted Enhancement That Needs Testing

* De-duplicate Pod Targets: CocoaPods now recognizes when a dependency is used
  multiple times across different user targets, but needs to be built only once.
  The targets in `Pods.xcodeproj` need to be duplicated when one of the following
  applies:
  * They are used on different platforms.
  * They are used with differents sets of subspecs.
  * They have any dependency which needs to be duplicated.

  You can opt-out of this behavior installation-wise, by setting the following
  option in your `~/.cocoapods/config.yaml`:
  ```yaml
  deduplicate_targets: false
  ```

  [Marius Rackwitz](https://github.com/mrackwitz)
  [#3550](https://github.com/CocoaPods/CocoaPods/issues/3550)

##### Breaking

* The CocoaPods environment header has been removed.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2390](https://github.com/CocoaPods/CocoaPods/issues/2390)

* The `Installer` is passed directly to the `pre_install` and `post_install`
  hooks defined in the Podfile, instead of the previously used
  `Hooks::InstallerRepresentation`.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#3648](https://github.com/CocoaPods/CocoaPods/issues/3648)

* Deprecate the `xcconfig` attribute in the Podspec DSL, which is replaced by
  the new attributes `pod_target_xcconfig` and `user_target_xcconfig`.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [CocoaPods#3465](https://github.com/CocoaPods/CocoaPods/issues/3465)

##### Enhancements

* The notice about a new version being available will now include our
  recommendation of using the latest stable version.  
  [Hugo Tunius](https://github.com/k0nserv)
  [#3667](https://github.com/CocoaPods/CocoaPods/pull/3667)

* New commands `pod cache list` and `pod cache clean` allows you to see the
  contents of the cache and clean it.  
  [Olivier Halligon](https://github.com/AliSoftware)
  [#3508](https://github.com/CocoaPods/CocoaPods/issues/3508)

* The download cache will automatically be reset when changing CocoaPods
  versions.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3542](https://github.com/CocoaPods/CocoaPods/issues/3542)

* Supports running pre-install hooks in plugins. This happens before the resolver
  does its work, and offers easy access to the sandbox, podfile and lockfile via a
  `PreInstallHooksContext` object. This also renames the post-install hooks from `HooksContext`
  to `PostInstallHooksContext`.  
  [Orta Therox](https://github.com/orta)
  [#3540](https://github.com/CocoaPods/cocoapods/issues/3409)

* Allow passing additional arguments to `pod lib create`, which then get passed
  as-is to the `configure` scripts.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2160](https://github.com/CocoaPods/CocoaPods/issues/2160)

* Use `-analyzer-disable-all-checks` to disable static analyzer for
  pods with `inhibit_warnings` enabled (requires Xcode >= 6.1).  
  [Dieter Komendera](https://github.com/kommen)
  [#2402](https://github.com/CocoaPods/CocoaPods/issues/2402)

* Cache globbing in `PathList` to speed up `pod install`.  
  [Vincent Isambart](https://github.com/vincentisambart)
  [#3699](https://github.com/CocoaPods/CocoaPods/pull/3699)

* CocoaPods will validate your podfile and try to identify problems
  and conflicts in how you've specified the dependencies.  
  [Hugo Tunius](https://github.com/k0nserv)
  [#995](https://github.com/CocoaPods/CocoaPods/issues/995)

* `pod update` will now accept root pod names, even when only subspecs are
  installed.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3689](https://github.com/CocoaPods/CocoaPods/issues/3689)

* Support for the new `watchos` platform.  
  [Boris Bügling](https://github.com/neonichu)
  [#3681](https://github.com/CocoaPods/CocoaPods/pull/3681)

##### Bug Fixes

* Added recursive support to the public headers of vendored frameworks
  that are automatically linked in the sandbox. This fixes and issue
  for framework header directories that contain sub-directories.  
  [Todd Casey](https://github.com/vhariable)
  [#3161](https://github.com/CocoaPods/CocoaPods/issues/3161)

* Public headers of vendored frameworks are now automatically linked in
  the sandbox. That allows transitive inclusion of headers from other pods.  
  [Vincent Isambart](https://github.com/vincentisambart)
  [#3161](https://github.com/CocoaPods/CocoaPods/issues/3161)

* Fixes an issue that prevented static libraries from building. `OTHER_LIBTOOLFLAGS`
  is no longer set to the value of `OTHER_LDFLAGS`. If you want to create a static
  library that includes all dependencies for (internal/external) distribution then
  you should use a tool like `cocoapods-packager`.  
  [Michael Moscardini](https://github.com/themackworth)
  [#2747](https://github.com/CocoaPods/CocoaPods/issues/2747)
  [#2704](https://github.com/CocoaPods/CocoaPods/issues/2704)

* The embed frameworks script will now properly filter out symlinks to the
  directories that are filtered, which fixes an issue when submitting to the
  Mac App Store.  
  [Samuel Giddins](https://github.com/segiddins)

* The error report template is now more robust against missing executables.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3719](https://github.com/CocoaPods/CocoaPods/issues/3719)

* Attempting to specify a `git` source where a Podspec for the requested pod is
  not found will have a more helpful error message.  
  [Samuel Giddins](https://github.com/segiddins)

* `pod outdated` will now accept the `--no-repo-update` and `--no-integrate`
  options.  
  [Samuel Giddins](https://github.com/segiddins)

* Fixes an issue which prevented using a custom `CONFIGURATION_BUILD_DIR` when
  integrating CocoaPods via dynamic frameworks.  
  [Tim Rosenblatt](https://github.com/timrosenblatt)
  [#3675](https://github.com/CocoaPods/CocoaPods/pull/3675)

* Pods frameworks in codesigned Mac apps are now signed.  
  [Nikolaj Schumacher](https://github.com/nschum)
  [#3646](https://github.com/CocoaPods/CocoaPods/issues/3646)


## 0.37.2 (2015-05-27)

##### Enhancements

* Schemes of development pods will now be shared.  
  [Boris Bügling](https://github.com/neonichu)
  [#3600](https://github.com/CocoaPods/CocoaPods/issues/3600)

* Recognizes incomplete cache when the original download of a pod was
  interrupted.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#3561](https://github.com/CocoaPods/CocoaPods/issues/3561)

* Allow opting out of pod source locking, meaning `pod try` yields editable
  projects.  
  [Samuel Giddins](https://github.com/segiddins)
  [cocoapods-try#31](https://github.com/CocoaPods/cocoapods-try/issues/31)

##### Bug Fixes

* `pod repo push` will now find and push JSON podspecs.  
  [#3494](https://github.com/CocoaPods/CocoaPods/issues/3494)
  [Kyle Fuller](https://github.com/kylef)

* Flush stdin/stderr and wait a bit in `executable`.  
  [Boris Bügling](https://github.com/neonichu)
  [#3500](https://github.com/CocoaPods/CocoaPods/issues/3500)

## 0.37.1 (2015-05-06)

##### Bug Fixes

* [Cache] Fixes a bug that caused that a pod, which was cached once is not updated
  correctly when needed e.g. for `pod spec lint`.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#3498](https://github.com/CocoaPods/CocoaPods/issues/3498)

* Only add the "Embed Pods Frameworks" script for application and unit test targets.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#3440](https://github.com/CocoaPods/CocoaPods/issues/3440)

* C++ source files with `.cc`, `.cxx` and `.c++` extensions now have their
  compiler flags set correctly.  
  [Chongyu Zhu](https://github.com/lembacon)
  [Kyle Fuller](https://github.com/kylef)

* Handle broken symlinks when installing a Pod.  
  [Daniel Barden](https://github.com/dbarden)
  [#3515](https://github.com/cocoapods/cocoapods/issues/3515)

* Just remove write permissions from files, so executables are unaffected.  
  [Mason Glidden](https://github.com/mglidden)
  [#3501](https://github.com/CocoaPods/CocoaPods/issues/3501)

* Always copy the generated `Podfile.lock` to `Pods/Manifest.lock` so they are
  guaranteed to match, character-by-character, after installation.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3502](https://github.com/CocoaPods/CocoaPods/issues/3502)

* Don't generate an umbrella header when a custom module map is specified. This
  avoids an incomplete module map warning.  
  [Samuel Giddins](https://github.com/segiddins)

* Actually allow skipping the download cache by downloading directly to the
  download target when requested.  
  [Samuel Giddins](https://github.com/segiddins)


## 0.37.0 (2015-05-03)

For more details, see 📝 [CocoaPods 0.37](https://blog.cocoapods.org/CocoaPods-0.37/) on our blog.

##### Bug Fixes

* Print the UTF-8 warning to STDERR.  
  [Matt Holgate](https://github.com/mjholgate)


## 0.37.0.rc.2 (2015-04-30)

##### Bug Fixes

* Handle caching specs that have subspecs with higher minimum deployment targets
  without deleting needed source files.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3471](https://github.com/CocoaPods/CocoaPods/issues/3471)

* Automatically detect JSON podspecs in `pod lib lint`.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3477](https://github.com/CocoaPods/CocoaPods/issues/3477)


## 0.37.0.rc.1 (2015-04-27)

[Core](https://github.com/CocoaPods/Core/compare/0.37.0.beta.1...0.37.0.rc.1)
[Xcodeproj](https://github.com/CocoaPods/Xcodeproj/compare/0.24.0...0.24.1)

##### Enhancements

* Add environment variable `COCOAPODS_SKIP_UPDATE_MESSAGE` to disable new
  version message.  
  [Andrea Mazzini](https://github.com/andreamazz)
  [#3364](https://github.com/CocoaPods/CocoaPods/issues/3364)

* Use user project's object version for pods project.  
  [Boris Bügling](https://github.com/neonichu)
  [#253](https://github.com/CocoaPods/Xcodeproj/issues/253)

##### Bug Fixes

* Adding `$(inherited)` to `FRAMEWORK_SEARCH_PATHS` build setting in xcconfig for aggregate.  
  [Tomohiro Kumagai](https://github.com/EZ-NET)
  [#3429](https://github.com/CocoaPods/CocoaPods/pull/3429)

* Don't crash when the downloader can't find an appropriate podspec in a `git`
  pod.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3433](https://github.com/CocoaPods/CocoaPods/issues/3433)

* Automatically lock Pod source files after installing.  
  [Mason Glidden](https://github.com/mglidden)
  [#1154](https://github.com/CocoaPods/CocoaPods/issues/1154)

* Handle subprocesses leaking STDOUT/STDERR pipes by more strictly managing
  process lifetime and not allowing I/O to block completion of the task.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3101](https://github.com/CocoaPods/CocoaPods/issues/3101)

* Do not create pod target if `source_files` only contains headers.  
  [Boris Bügling](https://github.com/neonichu)
  [#3106](https://github.com/CocoaPods/CocoaPods/issues/3106)

* Run a pod's `prepare_command` (if it has one) before it is cleaned in the
  download cache.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [Samuel Giddins](https://github.com/segiddins)
  [#3436](https://github.com/CocoaPods/CocoaPods/issues/3436)

* Don't set the `-fno-objc-arc` compiler flags for files for which the flag
  makes no sense.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2559](https://github.com/CocoaPods/CocoaPods/issues/2559)

* Also apply a pod's configuration to any resource targets defined by the pod.  
  [Tom Adriaenssen](https://github.com/inferis)
  [#3463](https://github.com/CocoaPods/CocoaPods/issues/3463)


## 0.37.0.beta.1 (2015-04-18)

##### Enhancements

* Allow the specification of custom module map files.  
  [Samuel Giddins](https://github.com/segiddins)
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#3145](https://github.com/CocoaPods/CocoaPods/issues/3145)

* Show the source URI for local Pod specification repositories in
  `pod repo list`.  
  [Kyle Fuller](https://github.com/kylef)

* Only show a warning when there is a minimum deployment target mismatch
  between target and spec, instead of throwing a hard error.  
  [Samuel Giddins](https://github.com/segiddins)
  [#1241](https://github.com/CocoaPods/CocoaPods/issues/1241)

* Add download caching for pods, which speeds up `pod install` and linting,
  potentially by several orders of magnitude.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2863](https://github.com/CocoaPods/CocoaPods/issues/2863)
  [#3172](https://github.com/CocoaPods/CocoaPods/issues/3172)

* Add a `--fail-fast` option to both `pod spec lint` and `pod lib lint` that
  causes the linter to exit as soon as a single subspec or platform fails
  linting.  
  [Marius Rackwitz](https://github.com/mrackwitz)

* Naïvely prevent base xcconfig warnings for targets that have custom
  config files set.  
  [Chris Brauchli](https://github.com/cbrauchli)
  [#2633](https://github.com/CocoaPods/CocoaPods/issues/2633)

* Ensure private headers are declared as such in a framework's generated module
  map.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2974](https://github.com/CocoaPods/CocoaPods/issues/2974)

##### Bug Fixes

* Do not pass code-sign arguments to xcodebuild when linting OS X targets.  
  [Boris Bügling](https://github.com/neonichu)
  [#3310](https://github.com/CocoaPods/CocoaPods/issues/3310)

* Fixes an issue showing the URL to remote resources in `pod repo list`.  
  [Kyle Fuller](https://github.com/kylef)

* Fixes a problem with code signing when integrating CocoaPods
  into a Today Widget extension.  
  [Christian Sampaio](https://github.com/chrisfsampaio)
  [#3390](https://github.com/CocoaPods/CocoaPods/pull/3390)


## 0.36.4 (2015-04-16)

##### Bug Fixes

* Fixes various problems with Pods that use xcasset bundles. Pods that
  use xcassets can now be used with the `pod :path` option.  
  [Kyle Fuller](https://github.com/kylef)
  [#1549](https://github.com/CocoaPods/CocoaPods/issues/1549)
  [#3384](https://github.com/CocoaPods/CocoaPods/pull/3383)
  [#3358](https://github.com/CocoaPods/CocoaPods/pull/3358)


## 0.36.3 (2015-03-31)

##### Bug Fixes

* Fix using the downloader.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3344](https://github.com/CocoaPods/CocoaPods/issues/3344)
  [#3345](https://github.com/CocoaPods/CocoaPods/issues/3345)


## 0.36.2 (2015-03-31)

[Core](https://github.com/CocoaPods/Core/compare/0.36.1...0.36.2)

##### Bug Fixes

* Unique resources passed to the script generator.  
  [Diego Torres](https://github.com/dtorres)
  [#3315](https://github.com/CocoaPods/CocoaPods/issues/3315)
  [#3327](https://github.com/CocoaPods/CocoaPods/issues/3327)

* Update the `Manifest.lock` when migrating local podspecs to JSON. This fixes
  running `pod install` after upgrading to `0.36`.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3292](https://github.com/CocoaPods/CocoaPods/issues/3292)
  [#3299](https://github.com/CocoaPods/CocoaPods/issues/3299)


## 0.36.1 (2015-03-27)

[Xcodeproj](https://github.com/CocoaPods/Xcodeproj/compare/0.23.0...0.23.1)

##### Bug Fixes

* Workarounds(✻) for the resource script's handling of `.xcasset` files.  
  [sodas](https://github.com/sodastsai)
  [Tony Li](https://github.com/crazytonyli)
  [Chongyu Zhu](https://github.com/lembacon)
  [#3247](https://github.com/CocoaPods/CocoaPods/issues/3247)
  [#3303](https://github.com/CocoaPods/CocoaPods/issues/3303)

* Fix the sanitization of configuration names in the generated target
  environment header.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3301](https://github.com/CocoaPods/CocoaPods/issues/3301)

> _(✻) Note: these fixes are only temporary to avoid overriding the user project's `xcassets`.
  We are aware that these workarounds are "too greedy" and thus user projects having different
  `xcassets` for different targets will still have issues; we ([@AliSoftware](https://github.com/AliSoftware))
  are working on a deeper fix ([#3263](https://github.com/CocoaPods/CocoaPods/issues/3263)) for the next release._

## 0.36.0 (2015-03-11)

[Xcodeproj](https://github.com/CocoaPods/Xcodeproj/compare/0.22.0...0.23.0)

For more details, see 📝 [CocoaPods 0.36](https://blog.cocoapods.org/CocoaPods-0.36/) on our blog.

##### Enhancements

* Allows Swift pods to have a deployment target under iOS 8.0 if they use
  XCTest.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3225](https://github.com/CocoaPods/CocoaPods/issues/3225)

##### Bug Fixes

* Include Swift-specific build settings on target creation, i.e. disable optimizations
  for debug configuration.
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#3238](https://github.com/CocoaPods/CocoaPods/issues/3238)

* Only copy explicitly specified xcasset files into the bundle of the integrated target.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#3219](https://github.com/CocoaPods/CocoaPods/issues/3219)

* Correctly filter Xcode warnings about the use of dynamic frameworks.  
  [Boris Bügling](https://github.com/neonichu)

* Fixes warnings, when the aggregate target doesn't contain any pod target, which is build,
  because `PODS_FRAMEWORK_BUILD_PATH` was added to `FRAMEWORK_SEARCH_PATHS`, but never created.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#3217](https://github.com/CocoaPods/CocoaPods/issues/3217)

* Allows the usage of `:head` dependencies even when the most recent published
  version was a pre-release.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3212](https://github.com/CocoaPods/CocoaPods/issues/3212)

* Limit the check for transitive static binaries to those which are directly linked to the user target.  
  [Boris Bügling](https://github.com/neonichu)
  [#3194](https://github.com/CocoaPods/CocoaPods/issues/3194)

* Lint to prevent dynamic libraries and frameworks from passing with iOS 7.  
  [Boris Bügling](https://github.com/neonichu)
  [#3193](https://github.com/CocoaPods/CocoaPods/issues/3193)

* Shows an informative error message when there is no base specification found
  for a `:head` dependency.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3230](https://github.com/CocoaPods/CocoaPods/issues/3230)

* Fix the `OTHER_SWIFT_FLAGS` generated, so it inherits previous definitions.  
  [Daniel Thorpe](https://github.com/danthorpe)
  [#2983](https://github.com/CocoaPods/CocoaPods/issues/2983)


## 0.36.0.rc.1 (2015-02-24)

##### Enhancements

* Set the `APPLICATION_EXTENSION_API_ONLY` build setting if integrating with a watch extension target.  
  [Boris Bügling](https://github.com/neonichu)
  [#3153](https://github.com/CocoaPods/CocoaPods/issues/3153)

* Build for iOS simulator only during validation. This allows validation without having
  provisioning profiles set up.  
  [Boris Bügling](https://github.com/neonichu)
  [#3083](https://github.com/CocoaPods/CocoaPods/issues/3083)
  [Swift#13](https://github.com/CocoaPods/swift/issues/13)

* Explicitly inform the user to close existing project when switching to
  a workspace for the first time.  
  [Kyle Fuller](https://github.com/kylef)
  [#2996](https://github.com/CocoaPods/CocoaPods/issues/2996)

* Automatically detect conflicts between framework names.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2943](https://github.com/CocoaPods/CocoaPods/issues/2943)

* Use the proper `TMPDIR` for the CocoaPods process, instead of blindly using
  `/tmp`.  
  [Samuel Giddins](https://github.com/segiddins)

* Let lint fail for Swift pods supporting deployment targets below iOS 8.0.  
  [Boris Bügling](https://github.com/neonichu)
  [#2963](https://github.com/CocoaPods/CocoaPods/issues/2963)

* Reject installation if a static library is used as a transitive dependency
  while integrating Pods as frameworks.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2926](https://github.com/CocoaPods/CocoaPods/issues/2926)

* Do not copy Swift standard libraries multiple times.  
  [Boris Bügling](https://github.com/neonichu)
  [#3131](https://github.com/CocoaPods/CocoaPods/issues/3131)

* Check for Xcode License Agreement before running commands.  
  [Xavi Matos](https://github.com/CalQL8ed-K-OS)
  [#3002](https://github.com/CocoaPods/CocoaPods/issues/3002)

* `pod update PODNAME` will update pods in a case-insensitive manner.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2992](https://github.com/CocoaPods/CocoaPods/issues/2992)

* Allow specifying repo names to `pod {spec,lib} lint --sources`.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2685](https://github.com/CocoaPods/CocoaPods/issues/2685)

* Require explicit use of `use_frameworks!` for Pods written in Swift.  
  [Boris Bügling](https://github.com/neonichu)
  [#3029](https://github.com/CocoaPods/CocoaPods/issues/3029)

* Lint as framework automatically. If needed, `--use-libraries` option
  allows linting as a static library.  
  [Boris Bügling](https://github.com/neonichu)
  [#2912](https://github.com/CocoaPods/CocoaPods/issues/2912)

* Adding Xcode Legacy build location support for default Pods.xcodeproj.
  It defaults to `${SRCROOT}/../build` but can be changed in a `post_install`
  hook by using the `Project#symroot=` writer.  
  [Sam Marshall](https://github.com/samdmarshall)

##### Bug Fixes

* Set `SKIP_INSTALL=YES` for all generated targets to avoid producing
  *Generic Xcode Archives* on Archive.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#3188](https://github.com/CocoaPods/CocoaPods/issues/3188)

* Added support for .tpp C++ header files in specs (previously were getting
  filtered out and symlinks wouldn't get created in the Pods/Headers folder.)  
  [Honza Dvorsky](https://github.com/czechboy0)
  [#3129](https://github.com/CocoaPods/CocoaPods/pull/3129)

* Fixed installation for app-extension targets which had no dependencies
  configured in the Podfile.  
  [Boris Bügling](https://github.com/neonichu)
  [#3102](https://github.com/CocoaPods/CocoaPods/issues/3102)

* Correct escaping of resource bundles in 'Copy Pods Resources' script.  
  [Seán Labastille](https://github.com/flufff42)
  [#3082](https://github.com/CocoaPods/CocoaPods/issues/3082)

* Correctly update sources when calling `pod outdated`, and also respect the
  `--[no-]repo-update` flag.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3137](https://github.com/CocoaPods/CocoaPods/issues/3137)

* Fix the `OTHER_SWIFT_FLAGS` generated, so `#if COCOAPODS` works in Swift.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2983](https://github.com/CocoaPods/CocoaPods/issues/2983)

* Output a properly-formed `Podfile` when running `pod init` with a target that
  contains a `'` in its name.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3136](https://github.com/CocoaPods/CocoaPods/issues/3136)

* Remove the stored lockfile checkout source when switching to a development
  pod.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3141](https://github.com/CocoaPods/CocoaPods/issues/3141)

* Migrate local Ruby podspecs to JSON, allowing updating those pods to work.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3038](https://github.com/CocoaPods/CocoaPods/issues/3038)

* Removing grep color markup in the embed frameworks script.  
  [Adriano Bonat](https://github.com/tanob)
  [#3117](https://github.com/CocoaPods/CocoaPods/issues/3117)

* Fixes an issue where `pod ipc list` and `pod ipc podfile` was returning an
  error.  
  [Kyle Fuller](https://github.com/kylef)
  [#3134](https://github.com/CocoaPods/CocoaPods/issues/3134)

* Fixes an issue with spaces in the path to the user's developer tools.  
  [Boris Bügling](https://github.com/neonichu)
  [#3181](https://github.com/CocoaPods/CocoaPods/issues/3181)


## 0.36.0.beta.2 (2015-01-28)

[Xcodeproj](https://github.com/CocoaPods/Xcodeproj/compare/0.21.0...0.21.2)

##### Breaking

* Changes the default spec repositories used from all configured spec
  repositories, to the master spec repository when no spec repositories
  are explicitly configured in a Podfile.  
  [Kyle Fuller](https://github.com/kylef)
  [#2946](https://github.com/CocoaPods/CocoaPods/issues/2946)

##### Enhancements

* Set the APPLICATION_EXTENSION_API_ONLY build setting if integrating with an app extension target.  
  [Boris Bügling](https://github.com/neonichu)
  [#2980](https://github.com/CocoaPods/CocoaPods/issues/2980)

* Xcodebuild warnings will now be reported as `warning` during linting
  instead of `note`.  
  [Hugo Tunius](https://github.com/K0nserv)

* Copy only the resources required for the current build configuration.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2391](https://github.com/CocoaPods/CocoaPods/issues/2391)

##### Bug Fixes

* Ensure that linting fails if xcodebuild doesn't successfully build your Pod.  
  [Kyle Fuller](https://github.com/kylef)
  [#2981](https://github.com/CocoaPods/CocoaPods/issues/2981)
  [cocoapods-trunk#33](https://github.com/CocoaPods/cocoapods-trunk/issues/33)

* Clone the master spec repository when no spec repositories are explicitly
  defined in the Podfile. This fixes problems using CocoaPods for the first
  time without any explicit spec repositories.  
  [Kyle Fuller](https://github.com/kylef)
  [#2946](https://github.com/CocoaPods/CocoaPods/issues/2946)

* Xcodebuild warnings with the string `error` in them will no longer be
  linted as errors if they are in fact warnings.  
  [Hugo Tunius](https://github.com/K0nserv)
  [#2579](https://github.com/CocoaPods/CocoaPods/issues/2579)

* Any errors which occur during fetching of external podspecs over HTTP
  will now be gracefully handled.  
  [Hugo Tunius](https://github.com/K0nserv)
  [#2823](https://github.com/CocoaPods/CocoaPods/issues/2823)

* When updating spec repositories only update the git sourced repos.  
  [Dustin Clark](https://github.com/clarkda)
  [#2558](https://github.com/CocoaPods/CocoaPods/issues/2558)

* Pods referenced via the `:podspec` option will have their podspecs properly
  parsed in the local directory if the path points to a local file.  
  [Samuel Giddins](https://github.com/segiddins)

* Fix an issue where using Swift frameworks in an Objective-C host application
  causes an error because the Swift frameworks we're not code signed.  
  [Joseph Ross](https://github.com/jrosssavant)
  [#3008](https://github.com/CocoaPods/CocoaPods/issues/3008)


## 0.36.0.beta.1 (2014-12-25)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.35.0...0.36.0.beta.1)
• [CocoaPods-Core](https://github.com/CocoaPods/Core/compare/0.35.0...0.36.0.beta.1)
• [Xcodeproj](https://github.com/CocoaPods/Xcodeproj/compare/0.20.2...0.21.0)
• [CLAide](https://github.com/CocoaPods/CLAide/compare/v0.7.0...0.8.0)
• [Molinillo](https://github.com/CocoaPods/Molinillo/compare/0.1.2...0.2.0)
• [cocoapods-downloader](https://github.com/CocoaPods/cocoapods-downloader/compare/0.8.0...0.8.1)
• [cocoapods-try](https://github.com/CocoaPods/cocoapods-try/compare/0.4.2...0.4.3)
• [cocoapods-trunk](https://github.com/CocoaPods/cocoapods-trunk/compare/0.4.1...0.5.0)
• [cocoapods-plugins](https://github.com/CocoaPods/cocoapods-plugins/compare/0.3.2...0.4.0)

##### Highlighted Enhancement That Needs Testing

* Support Frameworks & Swift: CocoaPods now recognizes Swift source files and
  builds dynamic frameworks when necessary. A project can explicitly
  opt-in via `use_frameworks!` in the Podfile, or if any dependency contains
  Swift code, all pods for that target will be integrated as frameworks.

  As a pod author, you can change the module name of the built framework by
  specifying a `module_name` in the podspec. The built frameworks are embedded into
  the host application with a new shell script build phase in the user's
  project allowing configuration-dependent pods.

  [Marius Rackwitz](https://github.com/mrackwitz)
  [#2835](https://github.com/CocoaPods/CocoaPods/issues/2835)

##### Breaking

* Bundle Resources into Frameworks: Previously all resources were compiled and
  copied into the `mainBundle`. Now Pods have to use
  `[NSBundle bundleForClass:<#Class from Pod#>]` to access provided resources
  relative to the bundle.

  [Boris Bügling](https://github.com/neonichu)
  [#2835](https://github.com/CocoaPods/CocoaPods/issues/2730)

* Only the hooks specified by usage of the `plugin` directive of the `Podfile`
  will be run. Additionally, plugins that depend on hooks will have to update to
  specify their 'plugin name' when registering the hooks in order to make it
  possible for those hooks to be run.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2640](https://github.com/CocoaPods/CocoaPods/issues/2640)

##### Enhancements

* Do not generate targets for Pods without sources.  
  [Boris Bügling](https://github.com/neonichu)
  [#2918](https://github.com/CocoaPods/CocoaPods/issues/2918)

* Show the name of the source for each hook that is run in verbose mode.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2639](https://github.com/CocoaPods/CocoaPods/issues/2639)

* Move pods' private headers to `Headers/Private` from `Headers/Build`.
  Since some SCM ignore templates include `build` by default, this makes it
  easier to check in the `Pods/` directory.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2623](https://github.com/CocoaPods/CocoaPods/issues/2623)

* Validate that a specification's `public_header_files` and
  `private_header_files` file patterns only match header files.
  Also, validate that all file patterns, if given, match at least one file.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2914](https://github.com/CocoaPods/CocoaPods/issues/2914)

* Installer changed to organize a development pod's source and resource files
  into subgroups reflecting their organization in the filesystem.  
  [Imre mihaly](https://github.com/imihaly)

##### Bug Fixes

* Fix updating a pod that has subspec dependencies.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2879](https://github.com/CocoaPods/CocoaPods/issues/2879)

* Restore the `#define`s in the environment header when the `--no-integrate`
  installation option is used.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2876](https://github.com/CocoaPods/CocoaPods/issues/2876)

* Fix issues when trying to discover the xcodeproj automatically
  but the current path contains special characters (`[`,`]`,`{`,`}`,`*`,`?`).  
  [Olivier Halligon](https://github.com/AliSoftware)
  [#2852](https://github.com/CocoaPods/CocoaPods/issues/2852)

* Fix linting subspecs that have a higher deployment target than the root
  spec.  
  [Samuel Giddins](https://github.com/segiddins)
  [#1919](https://github.com/CocoaPods/CocoaPods/issues/1919)

* Fix the reading of podspecs that come from the `:git`, `:svn`, `:http`, or
  `:hg` options in your `Podfile` that used context-dependent ruby code, such as
  reading a file to determine the specification version.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2875](https://github.com/CocoaPods/CocoaPods/issues/2875)

* Fix the updating of `:git`, `:svn`, and `:hg` dependencies when updating all
  pods.  
  [Samuel Giddins](https://github.com/CocoaPods/CocoaPods/issues/2859)
  [#2859](https://github.com/CocoaPods/CocoaPods/issues/2859)

* Fix an issue when a user doesn't yet have any spec repositories configured.  
  [Boris Bügling](https://github.com/neonichu)

* Fix an issue updating repositories when another spec repository doesn't
  have a remote.  
  [Kyle Fuller](https://github.com/kylef)
  [#2965](https://github.com/CocoaPods/CocoaPods/issues/2965)


## 0.35.0 (2014-11-19)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.34.4...0.35.0)
• [CocoaPods-Core](https://github.com/CocoaPods/Core/compare/0.34.4...0.35.0)
• [Xcodeproj](https://github.com/CocoaPods/Xcodeproj/compare/0.19.4...0.20.2)
• [cocoapods-downloader](https://github.com/CocoaPods/cocoapods-downloader/compare/0.7.2...0.8.0)

For more details, see 📝 [CocoaPods 0.35](https://blog.cocoapods.org/CocoaPods-0.35/) on our blog.

##### Enhancements

* Allow the specification of file patterns for the Podspec's `requires_arc`
  attribute.  
  [Kyle Fuller](https://github.com/kylef)
  [Samuel Giddins](https://github.com/segiddins)
  [#532](https://github.com/CocoaPods/CocoaPods/issues/532)

* From now on, pods installed directly from their repositories will be recorded
  in the `Podfile.lock` file and will be guaranteed to be checked-out using the
  same revision on subsequent installations. Examples of this are when using
  the `:git`, `:svn`, or `:hg` options in your `Podfile`.  
  [Samuel Giddins](https://github.com/segiddins)
  [#1058](https://github.com/CocoaPods/CocoaPods/issues/1058)

##### Bug Fixes

* Fix an output formatting issue with various commands like `pod search`
  and `pod trunk`.
  [Olivier Halligon](https://github.com/AliSoftware)
  [#2603](https://github.com/CocoaPods/CocoaPods/issues/2603)

* Show a helpful error message if the old resolver incorrectly activated a
  pre-release version that now leads to a version conflict.  
  [Samuel Giddins](https://github.com/segiddins)

* Provides a user friendly message when using `pod spec create` with a
  repository that doesn't yet have any commits.  
  [Kyle Fuller](https://github.com/kylef)
  [#2803](https://github.com/CocoaPods/CocoaPods/issues/2803)

* Fixes an issue with integrating into projects where there is a slash in the
  build configuration name.  
  [Kyle Fuller](https://github.com/kylef)
  [#2767](https://github.com/CocoaPods/CocoaPods/issues/2767)

* Pods will use `CLANG_ENABLE_OBJC_ARC = 'YES'` instead of
  `CLANG_ENABLE_OBJC_ARC = 'NO'`. For pods with `requires_arc = false` the
  `-fno-objc-arc` flag will be specified for the all source files.  
  [Hugo Tunius](https://github.com/K0nserv)
  [#2262](https://github.com/CocoaPods/CocoaPods/issues/2262)

* Fixed an issue that Core Data mapping models where not compiled when
  copying resources to main application bundle.  
  [Yan Rabovik](https://github.com/rabovik)

* Fix uninitialized constant Class::YAML crash in some cases.
  [Tim Shadel](https://github.com/timshadel)

##### Enhancements

* `pod search`, `pod spec which`, `pod spec cat` and `pod spec edit`
  now use plain text search by default instead of a regex. Especially
  `pod search UIView+UI` now searches for pods containing exactly `UIView+UI`
  in their name, not trying to interpret the `+` as a regular expression.
  _Note: You can still use a regular expression with the new `--regex` flag that has
  been added to these commands, e.g. `pod search --regex "(NS|UI)Color"`._
  [Olivier Halligon](https://github.com/AliSoftware)
  [Core#188](https://github.com/CocoaPods/Core/issues/188)

* Use `--allow-warnings` rather than `--error-only` for pod spec validation
  [Daniel Tomlinson](https://github.com/DanielTomlinson)
  [#2820](https://github.com/CocoaPods/CocoaPods/issues/2820)

## 0.35.0.rc2 (2014-11-06)

##### Enhancements

* Allow the resolver to fail faster when there are unresolvable conflicts
  involving the Lockfile.  
  [Samuel Giddins](https://github.com/segiddins)

##### Bug Fixes

* Allows pre-release spec versions when a requirement has an external source
  specified.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2768](https://github.com/CocoaPods/CocoaPods/issues/2768)

* We no longer require git version 1.7.5 or greater.  
  [Kyle Fuller](https://github.com/kylef)

* Fix the usage of `:head` pods.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2789](https://github.com/CocoaPods/CocoaPods/issues/2789)

* Show a more informative message when attempting to lint a spec whose
  source could not be downloaded.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2667](https://github.com/CocoaPods/CocoaPods/issues/2667)
  [#2759](https://github.com/CocoaPods/CocoaPods/issues/2759)

## 0.35.0.rc1 (2014-11-02)

##### Highlighted Enhancements That Need Testing

* The `Resolver` has been completely rewritten to use
  [Molinillo](https://github.com/CocoaPods/Molinillo), an iterative dependency
  resolution algorithm that automatically resolves version conflicts.
  The order in which dependencies are declared in the `Podfile` no longer has
  any effect on the resolution process.

  You should ensure that `pod install`, `pod update` and `pod update [NAME]`
  work as expected and install the correct versions of your pods during
  this RC1 release.
  [Samuel Giddins](https://github.com/segiddins)
  [#978](https://github.com/CocoaPods/CocoaPods/issues/978)
  [#2002](https://github.com/CocoaPods/CocoaPods/issues/2002)

##### Breaking

* Support for older versions of Ruby has been dropped and CocoaPods now depends
  on Ruby 2.0.0 or greater. This is due to the release of Xcode 6.0 which has
  dropped support for OS X 10.8, which results in the minimum version of
  Ruby pre-installed on OS X now being 2.0.0.

  If you are using a custom installation of Ruby  older than 2.0.0, you
  will need to update. Or even better, migrate to system Ruby.  
  [Kyle Fuller](https://github.com/kylef)

* Attempts to resolve circular dependencies will now raise an exception.  
  [Samuel Giddins](https://github.com/segiddins)
  [Molinillo#6](https://github.com/CocoaPods/Molinillo/issues/6)

##### Enhancements

* The use of implicit sources has been un-deprecated. By default, all available
  spec-repos will be used. There should only be a need to specify explicit
  sources if you want to specifically _exclude_ certain spec-repos, such as the
  `master` spec-repo, if you want to declare the order of spec look-up
  precedence, or if you want other users of a Podfile to automatically have a
  spec-repo cloned on `pod install`.  
  [Eloy Durán](https://github.com/alloy)

* The `pod push` command has been removed as it has been deprecated in favour of
  `pod repo push` in CocoaPods 0.33.  
  [Fabio Pelosin](https://github.com/fabiopelosin)

* Refactorings in preparation to framework support, which could break usage
  of the Hooks API.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#2461](https://github.com/CocoaPods/CocoaPods/issues/2461)

* Implicit dependencies are now locked, so simply running `pod install` will not
  cause them to be updated when they shouldn't be.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2318](https://github.com/CocoaPods/CocoaPods/issues/2318)
  [#2506](https://github.com/CocoaPods/CocoaPods/issues/2506)

* Pre-release versions are only considered in the resolution process when there
  are dependencies that explicitly reference pre-release requirements.  
  [Samuel Giddins](https://github.com/segiddins)
  [#1489](https://github.com/CocoaPods/CocoaPods/issues/1489)

* Only setup the master specs repo if required.  
  [Daniel Tomlinson](https://github.com/DanielTomlinson)
  [#2562](https://github.com/CocoaPods/CocoaPods/issues/2562)

* `Sandbox::FileAccessor` now optionally includes expanded paths of headers of
  vendored frameworks in `public_headers`.  
  [Eloy Durán](https://github.com/alloy)
  [#2722](https://github.com/CocoaPods/CocoaPods/pull/2722)

* Analysis is now halted and the user informed when there are multiple different
  external sources for dependencies with the same root name.
  The user is also now warned when there are duplicate dependencies in the
  Podfile.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2738](https://github.com/CocoaPods/CocoaPods/issues/2738)

* Multiple subspecs that point to the same external dependency will now only
  cause that external source to be fetched once.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2743](https://github.com/CocoaPods/CocoaPods/issues/2743)

##### Bug Fixes

* Fixes an issue in the `XCConfigIntegrator` where not all targets that need
  integration were being integrated, but were getting incorrect warnings about
  the user having specified a custom base configuration.  
  [Eloy Durán](https://github.com/alloy)
  [2752](https://github.com/CocoaPods/CocoaPods/issues/2752)

* Do not try to clone spec-repos in `/`.  
  [Eloy Durán](https://github.com/alloy)
  [#2723](https://github.com/CocoaPods/CocoaPods/issues/2723)

* Improved sanitizing of configuration names which have a numeric prefix.  
  [Steffen Matthischke](https://github.com/HeEAaD)
  [#2700](https://github.com/CocoaPods/CocoaPods/pull/2700)

* Fixes an issues where headers from a podspec with one platform are exposed to
  targets with a different platform. The headers are now only exposed to the
  targets with the same platform.  
  [Michael Melanson](https://github.com/michaelmelanson)
  [Kyle Fuller](https://github.com/kylef)
  [#1249](https://github.com/CocoaPods/CocoaPods/issues/1249)


## 0.34.4 (2014-10-18)

##### Bug Fixes

* Fixes a crash when running `pod outdated`.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2624](https://github.com/CocoaPods/CocoaPods/issues/2624)

* Ensure that external sources (as specified in the `Podfile`) are downloaded
  when their source is missing, even if their specification is present.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2494](https://github.com/CocoaPods/CocoaPods/issues/2494)

* Fixes an issue where running `pod install/update` while the Xcode project
  is open can cause the open project to have build failures until Xcode
  is restarted.  
  [Kyle Fuller](https://github.com/kylef)
  [#2627](https://github.com/CocoaPods/CocoaPods/issues/2627)
  [#2665](https://github.com/CocoaPods/CocoaPods/issues/2665)

* Fixes a crash when using file URLs as a source.  
  [Kurry Tran](https://github.com/kurry)
  [#2683](https://github.com/CocoaPods/CocoaPods/issues/2683)

* Fixes an issue when using pods in static library targets and building with
  Xcode 6 which requires `OTHER_LIBTOOLFLAGS` instead of `OTHER_LDFLAGS`, thus
  basically reverting to the previous Xcode behaviour, for now at least.  
  [Kyle Fuller](https://github.com/kylef)
  [Eloy Durán](https://github.com/alloy)
  [#2666](https://github.com/CocoaPods/CocoaPods/issues/2666)

* Fixes an issue running the resources script when Xcode is installed to a
  directory with a space when compiling xcassets.  
  [Kyle Fuller](https://github.com/kylef)
  [#2684](https://github.com/CocoaPods/CocoaPods/issues/2684)

* Fixes an issue when installing Pods with resources to a target which
  doesn't have any resources.  
  [Kyle Fuller](https://github.com/kylef)
  [#2083](https://github.com/CocoaPods/CocoaPods/issues/2083)

* Ensure that git 1.7.5 or newer is installed when running pod.  
  [Kyle Fuller](https://github.com/kylef)
  [#2651](https://github.com/CocoaPods/CocoaPods/issues/2651)


## 0.34.2 (2014-10-08)

##### Enhancements

* Make the output of `pod outdated` show what running `pod update` will do.
  Takes into account the sources specified in the `Podfile`.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2470](https://github.com/CocoaPods/CocoaPods/issues/2470)

* Allows the use of the `GCC_PREPROCESSOR_DEFINITION` flag `${inherited}`
  without emitting a warning.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2577](https://github.com/CocoaPods/CocoaPods/issues/2577)

* Integration with user project will no longer replace an existing
  base build configuration.  
  [Robert Jones](https://github.com/redshirtrob)
  [#1736](https://github.com/CocoaPods/CocoaPods/issues/1736)

##### Bug Fixes

* Improved sanitizing of configuration names to avoid generating invalid
  preprocessor definitions.  
  [Boris Bügling](https://github.com/neonichu)
  [#2542](https://github.com/CocoaPods/CocoaPods/issues/2542)

* More robust generation of source names from URLs.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2534](https://github.com/CocoaPods/CocoaPods/issues/2534)

* Allow the `Validator` to only use specific sources.
  Allows customizable source for `pod spec lint` and `pod lib lint`,
  with both defaulting to `master`.
  [Samuel Giddins](https://github.com/segiddins)
  [#2543](https://github.com/CocoaPods/CocoaPods/issues/2543)
  [cocoapods-trunk#28](https://github.com/CocoaPods/cocoapods-trunk/issues/28)

* Takes into account the sources specified in `Podfile` running
  `pod outdated`.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2553](https://github.com/CocoaPods/CocoaPods/issues/2553)

* Ensures that the master repo is shallow cloned when added via a Podfile
  `source` directive.  
  [Samuel Giddins](https://github.com/segiddins)
  [#3586](https://github.com/CocoaPods/CocoaPods/issues/2586)

* Ensures that the user project is not saved when there are no
  user targets integrated.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2561](https://github.com/CocoaPods/CocoaPods/issues/2561)
  [#2593](https://github.com/CocoaPods/CocoaPods/issues/2593)

* Fix a crash when running `pod install` with an empty target that inherits a
  pod from a parent target.  
  [Kyle Fuller](https://github.com/kylef)
  [#2591](https://github.com/CocoaPods/CocoaPods/issues/2591)

* Take into account versions of a Pod from all specified sources when
  resolving dependencies.  
  [Thomas Visser](https://github.com/Thomvis)
  [#2556](https://github.com/CocoaPods/CocoaPods/issues/2556)

* Sanitize build configuration names in target environment header macros.  
  [Kra Larivain](https://github.com/olarivain)
  [#2532](https://github.com/CocoaPods/CocoaPods/pull/2532)


## 0.34.1 (2014-09-26)

##### Bug Fixes

* Doesn't take into account the trailing `.git` in repository URLs when
  trying to find a matching specs repo.  
  [Samuel Giddins](https://github.com/segiddins)
  [#2526](https://github.com/CocoaPods/CocoaPods/issues/2526)


## 0.34.0 (2014-09-26)

For more details, see 📝 [CocoaPods 0.34](https://blog.cocoapods.org/CocoaPods-0.34/) on our blog.

##### Breaking

* Add support for loading podspecs from *only* specific spec-repos via
  `sources`. By default, when there are no sources specified in a Podfile all
  source repos will be used. This has always been the case. However, this
  implicit use of sources is now deprecated. Once you specify specific sources,
  **no** repos will be included by default. For example:

        source 'https://github.com/artsy/Specs.git'
        source 'https://github.com/CocoaPods/Specs.git'

  Any source URLs specified that have not yet been added will be cloned before
  resolution begins.  
  [François Benaiteau](https://github.com/netbe)
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [Samuel Giddins](https://github.com/segiddins)
  [#1143](https://github.com/CocoaPods/CocoaPods/pull/1143)
  [Core#19](https://github.com/CocoaPods/Core/pull/19)
  [Core#170](https://github.com/CocoaPods/Core/issues/170)
  [#2515](https://github.com/CocoaPods/CocoaPods/issues/2515)

##### Enhancements

* Added the `pod repo list` command which lists all the repositories.  
  [Luis Ascorbe](https://github.com/lascorbe)
  [#1455](https://github.com/CocoaPods/CocoaPods/issues/1455)

##### Bug Fixes

* Works around an Xcode issue where linting would fail even though `xcodebuild`
  actually succeeds. Xcode.app also doesn't fail when this issue occurs, so it's
  safe for us to do the same.  
  [Kra Larivain](https://github.com/olarivain)
  [Boris Bügling](https://github.com/neonichu)
  [Eloy Durán](https://github.com/alloy)
  [Samuel E. Giddins](https://github.com/segiddins)
  [#2394](https://github.com/CocoaPods/CocoaPods/issues/2394)
  [#2395](https://github.com/CocoaPods/CocoaPods/pull/2395)

* Fixes the detection of JSON podspecs included via `:path`.  
  [laiso](https://github.com/laiso)
  [#2489](https://github.com/CocoaPods/CocoaPods/pull/2489)

* Fixes an issue where `pod install` would crash during Plist building if any
  pod has invalid UTF-8 characters in their title or description.  
  [Ladislav Martincik](https://github.com/martincik)
  [#2482](https://github.com/CocoaPods/CocoaPods/issues/2482)

* Fix crash when the URL of a private GitHub repo is passed to `pod spec
  create` as an argument.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [#1543](https://github.com/CocoaPods/CocoaPods/issues/1543)


## 0.34.0.rc2 (2014-09-16)

##### Bug Fixes

* Fixes an issue where `pod lib lint` would crash if a podspec couldn't be
  loaded.  
  [Kyle Fuller](https://github.com/kylef)
  [#2147](https://github.com/CocoaPods/CocoaPods/issues/2147)

* Fixes an issue where `pod init` would not add `source 'master'` to newly
  created Podfiles.  
  [Ash Furrow](https://github.com/AshFurrow)
  [#2473](https://github.com/CocoaPods/CocoaPods/issues/2473)


## 0.34.0.rc1 (2014-09-13)

##### Breaking

* The use of the `$PODS_ROOT` environment variable has been deprecated and
  should not be used. It will be removed in future versions of CocoaPods.  
  [#2449](https://github.com/CocoaPods/CocoaPods/issues/2449)

* Add support for loading podspecs from specific spec-repos _only_, a.k.a. ‘sources’.
  By default, when not specifying any specific sources in your Podfile, the ‘master’
  spec-repo will be used, as was always the case. However, once you specify specific
  sources the ‘master’ spec-repo will **not** be included by default. For example:

        source 'private-spec-repo'
        source 'master'

  [François Benaiteau](https://github.com/netbe)
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [#1143](https://github.com/CocoaPods/CocoaPods/pull/1143)
  [Core#19](https://github.com/CocoaPods/Core/pull/19)

* The `Pods` directory has been reorganized. This might require manual
  intervention in projects where files generated by CocoaPods have manually been
  imported into the user's project (common with the acknowledgements files).  
  [#1055](https://github.com/CocoaPods/CocoaPods/pull/1055)
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [Michele Titolo](https://github.com/mtitolo)

* Plugins are now expected to include the `cocoapods-plugin.rb` file in
  `./lib`.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [CLAide#28](https://github.com/CocoaPods/CLAide/pull/28)

* The specification `requires_arc` attribute now defaults to true.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [CocoaPods#267](https://github.com/CocoaPods/CocoaPods/issues/267)

##### Enhancements

* Add support to specify dependencies per build configuration:

        pod 'Lookback', :configurations => ['Debug']

  Currently configurations can only be specified per single Pod.  
  [Joachim Bengtsson](https://github.com/nevyn)
  [Eloy Durán](https://github.com/alloy)
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [#1791](https://github.com/CocoaPods/CocoaPods/pull/1791)
  [#1668](https://github.com/CocoaPods/CocoaPods/pull/1668)
  [#731](https://github.com/CocoaPods/CocoaPods/pull/731)

* Improved performance of git downloads using shallow clone.  
  [Marin Usalj](https://github.com/supermarin)
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [cocoapods-downloader#29](https://github.com/CocoaPods/cocoapods-downloader/pull/29)

* Simplify installation: CocoaPods no longer requires the
  compilation of the troublesome native extensions.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [Xcodeproj#168](https://github.com/CocoaPods/Xcodeproj/pull/168)
  [Xcodeproj#167](https://github.com/CocoaPods/Xcodeproj/issues/167)

* Add hooks for plugins. Currently only the installer hook is supported.
  A plugin can register itself to be activated after the installation with the
  following syntax:

      Pod::HooksManager.register(:post_install) do |installer_context|
        # implementation
      end

  The `installer_context` is an instance of the `Pod::Installer:HooksContext`
  class which provides the information about the installation.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [Core#132](https://github.com/CocoaPods/Core/pull/1755)

* Add a support for migrating the sandbox to new versions of CocoaPods.  
  [Fabio Pelosin](https://github.com/fabiopelosin)

* Display an indication for deprecated Pods in the command line search.  
  [Hugo Tunius](https://github.com/k0nserv)
  [#2180](https://github.com/CocoaPods/CocoaPods/issues/2180)

* Use the CLIntegracon gem for the integration tests.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [#2371](https://github.com/CocoaPods/CocoaPods/issues/2371)

* Include configurations that a user explicitly specifies, in their Podfile,
  when the `--no-integrate` option is specified.  
  [Eloy Durán](https://github.com/alloy)

* Properly quote the `-isystem` values in the xcconfig files.  
  [Eloy Durán](https://github.com/alloy)

* Remove the installation post install message which presents the CHANGELOG.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [Eloy Durán](https://github.com/alloy)

* Add support for user-specified project directories with the
  `--project-directory` option.  
  [Samuel E. Giddins](https://github.com/segiddins)
  [#2183](https://github.com/CocoaPods/CocoaPods/issues/2183)

* Now the `plutil` tool is used when available to produce
  output consistent with Xcode.  
  [Fabio Pelosin](https://github.com/fabiopelosin)

* Indicate the name of the pod whose requirements cannot be satisfied.  
  [Seivan Heidari](https://github.com/seivan)
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [#1938](https://github.com/CocoaPods/CocoaPods/issues/1938)

* Add support for JSON specs to external sources (`:path`, `:git`, etc)
  options.  
  [Kyle Fuller](https://github.com/kylef)
  [#2320](https://github.com/CocoaPods/CocoaPods/issues/2320)

* Generate the workspaces using the same output of Xcode.  
  [Fabio Pelosin](https://github.com/fabiopelosin)


##### Bug Fixes

* Fix `pod repo push` to first check if a Specs directory exists and if so
  push there.  
  [Edward Valentini](edwardvalentini)
  [#2060](https://github.com/CocoaPods/CocoaPods/issues/2060)

* Fix `pod outdated` to not include subspecs.  
  [Ash Furrow](ashfurrow)
  [#2136](https://github.com/CocoaPods/CocoaPods/issues/2136)

* Always evaluate podspecs from the original podspec directory. This fixes
  an issue when depending on a pod via `:path` and that pod's podspec uses
  relative paths.  
  [Kyle Fuller](kylef)
  [pod-template#50](https://github.com/CocoaPods/pod-template/issues/50)

* Fix spec linting to not warn for missing license file in subspecs.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [Core#132](https://github.com/CocoaPods/Core/issues/132)

* Fix `pod init` so that it doesn't recurse when checking for Podfiles.  
  [Paddy O'Brien](https://github.com/tapi)
  [#2181](https://github.com/CocoaPods/CocoaPods/issues/2181)

* Fix missing XCTest framework in Xcode 6.  
  [Paul Williamson](squarefrog)
  [#2296](https://github.com/CocoaPods/CocoaPods/issues/2296)

* Support multiple values in `ARCHS`.  
  [Robert Zuber](https://github.com/z00b)
  [#1904](https://github.com/CocoaPods/CocoaPods/issues/1904)

* Fix static analysis in Xcode 6.  
  [Samuel E. Giddins](https://github.com/segiddins)
  [#2402](https://github.com/CocoaPods/CocoaPods/issues/2402)

* Fix an issue where a version of a spec will not be locked when using
  multiple subspecs of a podspec.  
  [Kyle Fuller](https://github.com/kylef)
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [#2135](https://github.com/CocoaPods/CocoaPods/issues/2135)

* Fix an issue using JSON podspecs installed directly from a lib's
  repository.  
  [Kyle Fuller](https://github.com/kylef)
  [#2320](https://github.com/CocoaPods/CocoaPods/issues/2320)

* Support and use quotes in the `OTHER_LDFLAGS` of xcconfigs to avoid
  issues with targets containing a space character in their name.  
  [Fabio Pelosin](https://github.com/fabiopelosin)


## 0.33.1 (2014-05-20)

##### Bug Fixes

* Fix `pod spec lint` for `json` podspecs.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [#2157](https://github.com/CocoaPods/CocoaPods/issues/2157)

* Fixed downloader issues related to `json` podspecs.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [#2158](https://github.com/CocoaPods/CocoaPods/issues/2158)

* Fixed `--no-ansi` flag in help banners.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [#34](https://github.com/CocoaPods/CLAide/issues/34)


## 0.33.0 (2014-05-20)

For more details, see 📝 [CocoaPods 0.33](https://blog.cocoapods.org/CocoaPods-0.33/) on our blog.

##### Breaking

* The deprecated `pre_install` and the `pod_install` hooks of the specification
  class have been removed.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [#2151](https://github.com/CocoaPods/CocoaPods/issues/2151)
  [#2153](https://github.com/CocoaPods/CocoaPods/pull/2153)

##### Enhancements

* Added the `cocoapods-trunk` plugin which introduces the `trunk` subcommand.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [#2151](https://github.com/CocoaPods/CocoaPods/issues/2151)
  [#2153](https://github.com/CocoaPods/CocoaPods/pull/2153)

* The `pod push` sub-command has been moved to the `pod repo push` sub-command.
  Moreover pushing to the master repo from it has been disabled.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [#2151](https://github.com/CocoaPods/CocoaPods/issues/2151)
  [#2153](https://github.com/CocoaPods/CocoaPods/pull/2153)

* Overhauled command line interface. Add support for auto-completion script
  (d). If auto-completion is enabled for your shell you can configure it for
  CocoaPods with the following command:

      rm -f /usr/local/share/zsh/site-functions/\_pod
      dpod --completion-script > /usr/local/share/zsh/site-functions/\_pod
      exec zsh

  Currently only the Z shell is supported.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [CLAide#25](https://github.com/CocoaPods/CLAide/issues/25)
  [CLAide#20](https://github.com/CocoaPods/CLAide/issues/20)
  [CLAide#19](https://github.com/CocoaPods/CLAide/issues/19)
  [CLAide#17](https://github.com/CocoaPods/CLAide/issues/17)
  [CLAide#12](https://github.com/CocoaPods/CLAide/issues/12)

* The `--version` flag is now only supported for the root `pod` command. If
  used in conjunction with the `--verbose` flag the version of the detected
  plugins will be printed as well.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [CLAide#13](https://github.com/CocoaPods/CLAide/issues/13)
  [CLAide#14](https://github.com/CocoaPods/CLAide/issues/14)

* The extremely meta `cocoaPods-plugins` is now installed by default providing
  information about the available and the installed plug-ins.  
  [David Grandinetti](https://github.com/dbgrandi)
  [Olivier Halligon](https://github.com/AliSoftware)
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [#2092](https://github.com/CocoaPods/CocoaPods/issues/2092)

* Validate the reachability of `social_media_url`, `documentation_url` and
  `docset_url` in podspecs we while linting a specification.  
  [Kyle Fuller](https://github.com/kylef)
  [#2025](https://github.com/CocoaPods/CocoaPods/issues/2025)

* Print the current version when the repo/lockfile requires a higher version.  
  [Samuel E. Giddins](https://github.com/segiddins)
  [#2049](https://github.com/CocoaPods/CocoaPods/issues/2049)

* Show `help` when running the `pod` command instead of defaulting to `pod
  install`.  
  [Kyle Fuller](https://github.com/kylef)
  [#1771](https://github.com/CocoaPods/CocoaPods/issues/1771)

##### Bug Fixes

* Show the actual executable when external commands fail.  
  [Boris Bügling](https://github.com/neonichu)
  [#2102](https://github.com/CocoaPods/CocoaPods/issues/2102)

* Fixed support for file references in the workspace generated by CocoaPods.  
  [Kyle Fuller](https://github.com/kylef)
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [Xcodeproj#105](https://github.com/CocoaPods/Xcodeproj/pull/150)

* Show a helpful error message when reading version information with merge
  conflict.  
  [Samuel E. Giddins](https://github.com/segiddins)
  [#1853](https://github.com/CocoaPods/CocoaPods/issues/1853)

* Show deprecated specs when invoking `pod outdated`.  
  [Samuel E. Giddins](https://github.com/segiddins)
  [#2003](https://github.com/CocoaPods/CocoaPods/issues/2003)

* Fixes an issue where `pod repo update` may start an un-committed merge.  
  [Kyle Fuller](https://github.com/kylef)
  [#2024](https://github.com/CocoaPods/CocoaPods/issues/2024)

## 0.32.1 (2014-04-15)

##### Bug Fixes

* Fixed the Podfile `default_subspec` attribute in nested subspecs.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [#2050](https://github.com/CocoaPods/CocoaPods/issues/2050)

## 0.32.0 (2014-04-15)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.31.1...0.32.0)
• [CocoaPods-Core](https://github.com/CocoaPods/Core/compare/0.31.1...0.32.0)

For more details, see 📝 [CocoaPods 0.32](https://blog.cocoapods.org/CocoaPods-0.32/) on our blog.

##### Enhancements

* Allow to update only a list of given pods with `pod update [POD_NAMES...]`.  
  [Marius Rackwitz](https://github.com/mrackwitz)
  [CocoaPods#760](https://github.com/CocoaPods/CocoaPods/issues/760)

* `pod update` prints the previous version of the updated pods.  
  [Andrea Mazzini](https://github.com/andreamazz)
  [#2008](https://github.com/CocoaPods/CocoaPods/issues/2008)

* `pod update` falls back to `pod install` if no Lockfile is present.  
  [Marius Rackwitz](https://github.com/mrackwitz)

* File references in the Pods project for development Pods now are absolute if
  the dependency is specified with an absolute paths.  
  [Samuel Ford](https://github.com/samuelwford)
  [#1042](https://github.com/CocoaPods/CocoaPods/issues/1042)

* Added `deprecated` and `deprecated_in_favor_of` attributes to Specification
  DSL.  
  [Paul Young](https://github.com/paulyoung)
  [Core#87](https://github.com/CocoaPods/Core/pull/87)

* Numerous improvements to the validator and to the linter.
  * Validate the reachability of screenshot URLs in podspecs while linting a
    specification.  
    [Kyle Fuller](https://github.com/kylef)
    [#2010](https://github.com/CocoaPods/CocoaPods/issues/2010)
  * Support HTTP redirects when linting homepage and screenshots.  
    [Boris Bügling](https://github.com/neonichu)
    [#2027](https://github.com/CocoaPods/CocoaPods/pull/2027)
  * The linter now checks `framework` and `library` attributes for invalid
    strings.  
    [Paul Williamson](https://github.com/squarefrog)
    [Fabio Pelosin](fabiopelosin)
    [Core#66](https://github.com/CocoaPods/Core/issues/66)
    [Core#96](https://github.com/CocoaPods/Core/pull/96)
    [Core#105](https://github.com/CocoaPods/Core/issues/105)
  * The Linter will not check for comments anymore.  
    [Fabio Pelosin](https://github.com/fabiopelosin)
    [Core#108](https://github.com/CocoaPods/Core/issues/108)
  * Removed legacy checks from the linter.  
    [Fabio Pelosin](https://github.com/fabiopelosin)
    [Core#108](https://github.com/CocoaPods/Core/issues/108)
  * Added logic to handle subspecs and platform scopes to linter check of
    the `requries_arc` attribute.  
    [Fabio Pelosin](https://github.com/fabiopelosin)
    [CocoaPods#2005](https://github.com/CocoaPods/CocoaPods/issues/2005)
  * The linter no longer considers empty a Specification if it only specifies the
    `resource_bundle` attribute.  
    [Joshua Kalpin](https://github.com/Kapin)
    [#63](https://github.com/CocoaPods/Core/issues/63)
    [#95](https://github.com/CocoaPods/Core/pull/95)

* `pod lib create` is now using the `configure` file instead of the
  `_CONFIGURE.rb` file.  
  [Piet Brauer](https://github.com/pietbrauer)
  [Orta Therox](https://github.com/orta)

* `pod lib create` now disallows any pod name that begins with a `.`  
  [Dustin Clark](https://github.com/clarkda)
  [#2026](https://github.com/CocoaPods/CocoaPods/pull/2026)
  [Core#97](https://github.com/CocoaPods/Core/pull/97)
  [Core#98](https://github.com/CocoaPods/Core/issues/98)

* Prevent the user from using `pod` commands as root.  
  [Kyle Fuller](https://github.com/kylef)
  [#1815](https://github.com/CocoaPods/CocoaPods/issues/1815)

* Dependencies declared with external sources now support HTTP downloads and
  have improved support for all the options supported by the downloader.  
  [Fabio Pelosin](https://github.com/fabiopelosin)

* An informative error message is presented when merge conflict is detected in
  a YAML file.  
  [Luis de la Rosa](https://github.com/luisdelarosa)
  [#69](https://github.com/CocoaPods/Core/issues/69)
  [#100](https://github.com/CocoaPods/Core/pull/100)

##### Bug Fixes

* Fixed the Podfile `default_subspec` attribute in nested subspecs.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [#1021](https://github.com/CocoaPods/CocoaPods/issues/1021)

* Warn when including deprecated pods
  [Samuel E. Giddins](https://github.com/segiddins)
  [#2003](https://github.com/CocoaPods/CocoaPods/issues/2003)


## 0.31.1 (2014-04-01)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.31.0...0.31.1)
• [CocoaPods-Core](https://github.com/CocoaPods/Core/compare/0.31.0...0.31.1)

##### Minor Enhancements

* The specification now strips the indentation of the `prefix_header` and
  `prepare_command` to aide their declaration as a here document (similarly to
  what it already does with the description).  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [Core#51](https://github.com/CocoaPods/Core/issues/51)

##### Bug Fixes

* Fix linting for Pods which declare a private repo as the source.  
  [Boris Bügling](https://github.com/neonichu)
  [Core#82](https://github.com/CocoaPods/Core/issues/82)


## 0.31.0 (2014-03-31)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.30.0...0.31.0)
• [CocoaPods-Core](https://github.com/CocoaPods/Core/compare/0.30.0...0.31.0)

For more details, see 📝 [CocoaPods 0.31](https://blog.cocoapods.org/CocoaPods-0.31/) on our blog.

##### Enhancements

* Warnings are not promoted to errors anymore to maximise compatibility with
  existing libraries.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [#1629](https://github.com/CocoaPods/CocoaPods/issues/1629)

* Include the versions of the Pods to the output of `pod list`.  
  [Stefan Damm](https://github.com/StefanDamm)
  [Robert Zuber](https://github.com/z00b)
  [#1617](https://github.com/CocoaPods/CocoaPods/issues/1617)

* Generated prefix header file will now have unique prefix_header_contents for
  Pods with subspecs.  
  [Luis de la Rosa](https://github.com/luisdelarosa)
  [#1449](https://github.com/CocoaPods/CocoaPods/issues/1449)

* The linter will now check the reachability of the homepage of Podspecs during
  a full lint.  
  [Richard Lee](https://github.com/dlackty)
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [#1704](https://github.com/CocoaPods/CocoaPods/issues/1704)
  [Core#70](https://github.com/CocoaPods/Core/pull/70)

* Improved detection of the last version of a specification in `pod spec`
  subcommands.  
  [Laurent Sansonetti](https://github.com/lrz)
  [#1953](https://github.com/CocoaPods/CocoaPods/pull/1953)

* Display advised settings for Travis CI in the warning related presented when
  the terminal encoding is not set to UTF-8.  
  [Richard Lee](https://github.com/dlackty)
  [#1933](https://github.com/CocoaPods/CocoaPods/issues/1933)
  [#1941](https://github.com/CocoaPods/CocoaPods/pull/1941)

* Unset the `CDPATH` env variable before shelling-out to `prepare_command`.  
  [Marc Boquet](https://github.com/apalancat)
  [#1943](https://github.com/CocoaPods/CocoaPods/pull/1943)

##### Bug Fixes

* Resolve crash related to the I18n deprecation warning.  
  [Eloy Durán](https://github.com/alloy)
  [#1950](https://github.com/CocoaPods/CocoaPods/issues/1950)

* Fix compilation issues related to the native Extension of Xcodeproj.  
  [Eloy Durán](https://github.com/alloy)

* Robustness against user Git configuration and against merge commits in `pod
  repo` subcommands.  
  [Boris Bügling](https://github.com/neonichu)
  [#1949](https://github.com/CocoaPods/CocoaPods/issues/1949)
  [#1978](https://github.com/CocoaPods/CocoaPods/pull/1978)

* Gracefully inform the user if the `:head` option is not supported for a given
  download strategy.  
  [Boris Bügling](https://github.com/neonichu)
  [#1947](https://github.com/CocoaPods/CocoaPods/issues/1947)
  [#1958](https://github.com/CocoaPods/CocoaPods/pull/1958)

* Cleanup a pod directory if error occurs while downloading.  
  [Alex Rothenberg](https://github.com/alexrothenberg)
  [#1842](https://github.com/CocoaPods/CocoaPods/issues/1842)
  [#1960](https://github.com/CocoaPods/CocoaPods/pull/1960)

* No longer warn for Github repositories with OAuth authentication.  
  [Boris Bügling](https://github.com/neonichu)
  [#1928](https://github.com/CocoaPods/CocoaPods/issues/1928)
  [Core#77](https://github.com/CocoaPods/Core/pull/77)

* Fix for when using `s.version` as the `:tag` for a git repository in a
  Podspec.  
  [Joel Parsons](https://github.com/joelparsons)
  [#1721](https://github.com/CocoaPods/CocoaPods/issues/1721)
  [Core#72](https://github.com/CocoaPods/Core/pull/72)

* Improved escaping of paths in Git downloader.  
  [Vladimir Burdukov](https://github.com/chipp)
  [cocoapods-downloader#14](https://github.com/CocoaPods/cocoapods-downloader/pull/14)

* Podspec without explicitly set `requires_arc` attribute no longer passes the
  lint.  
  [Richard Lee](https://github.com/dlackty)
  [#1840](https://github.com/CocoaPods/CocoaPods/issues/1840)
  [Core#71](https://github.com/CocoaPods/Core/pull/71)

* Properly quote headers in the `-isystem` compiler flag of the aggregate
  targets.  
  [Eloy Durán](https://github.com/alloy)
  [#1862](https://github.com/CocoaPods/CocoaPods/issues/1862)
  [#1894](https://github.com/CocoaPods/CocoaPods/pull/1894)

## 0.30.0 (2014-03-29)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.29.0...0.30.0)

For more details, see 📝 [CocoaPods 0.30](https://blog.cocoapods.org/CocoaPods-0.30/) on our blog.

###### Enhancements

* Radically reduce first run pod setup bandwidth by creating a shallow clone of
  the ‘master’ repo by default. Use the `--no-shallow` option to perform a full
  clone instead.  
  [Jeff Verkoeyen](https://github.com/jverkoey)
  [#1803](https://github.com/CocoaPods/CocoaPods/pull/1803)

* Improves the error message when searching with an invalid regular expression.  
  [Kyle Fuller](https://github.com/kylef)

* Improves `pod init` to save Xcode project file in Podfile when one was supplied.  
  [Kyle Fuller](https://github.com/kylef)

* Adds functionality to specify a template URL for the `pod lib create` command.  
  [Piet Brauer](https://github.com/pietbrauer)

###### Bug Fixes

* Fixes a bug with `pod repo remove` silently handling permission errors.  
  [Kyle Fuller](https://github.com/kylef)
  [#1778](https://github.com/CocoaPods/CocoaPods/issues/1778)

* `pod push` now properly checks that the repo has changed before attempting
  to commit. This only affected pods with special characters (such as `+`) in
  their names.  
  [Gordon Fontenot](https://github.com/gfontenot)
  [#1739](https://github.com/CocoaPods/CocoaPods/pull/1739)


## 0.29.0 (2013-12-25)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.28.0...0.29.0)
• [CocoaPods-core](https://github.com/CocoaPods/Core/compare/0.28.0...0.29.0)
• [cocoapods-downloader](https://github.com/CocoaPods/cocoapods-downloader/compare/0.2.0...0.3.0)

For more details, see 📝 [CocoaPods 0.29](https://blog.cocoapods.org/CocoaPods-0.29/) on our blog.

###### Breaking

* The command `podfile_info` is now a plugin offered by CocoaPods.
  As a result, the command has been removed from CocoaPods.  
  [Joshua Kalpin](https://github.com/Kapin)
  [#1589](https://github.com/CocoaPods/CocoaPods/issues/1589)

* JSON has been adopted as the format to store specifications. As a result
  the `pod ipc spec` command returns a JSON representation and the YAML
  specifications are not supported anymore. JSON specifications adopt the
  `.podspec.json` extension.
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [#1568](https://github.com/CocoaPods/CocoaPods/pull/1568)

###### Enhancements

* Introduced `pod try` the easiest way to test the example project of a pod.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [#1568](https://github.com/CocoaPods/CocoaPods/pull/1568)

* Pod headers are now provided to the user target as a system
  header. This means that any warnings in a Pod's code will show
  under its target in Xcode's build navigator, and never under the
  user target.  
  [Swizzlr](https://github.com/swizzlr)
  [#1596](https://github.com/CocoaPods/CocoaPods/pull/1596)

* Support LZMA2 compressed tarballs in the downloader.  
  [Kyle Fuller](https://github.com/kylef)
  [cocoapods-downloader#5](https://github.com/CocoaPods/cocoapods-downloader/pull/5)

* Add Bazaar support for installing directly from a repo.  
  [Fred McCann](https://github.com/fmccann)
  [#1632](https://github.com/CocoaPods/CocoaPods/pull/1632)

* The `pod search <query>` command now supports regular expressions
  for the query parameter when searching using the option `--full`.  
  [Florian Hanke](https://github.com/floere)
  [#1643](https://github.com/CocoaPods/CocoaPods/pull/1643)

* Pod lib lint now accepts multiple podspecs in the same folder.  
  [kra Larivain/OpenTable](https://github.com/opentable)
  [#1635](https://github.com/CocoaPods/CocoaPods/pull/1635)

* The `pod push` command will now silently test the upcoming CocoaPods trunk
  service. The service is only tested when pushing to the master repo and the
  test doesn't affect the normal workflow.  
  [Fabio Pelosin](https://github.com/fabiopelosin)

* The `pod search <query>` command now supports searching on cocoapods.org
  when searching using the option `--web`. Options `--ios` and `--osx` are
  fully supported.
  [Florian Hanke](https://github.com/floere)
  [#1643](https://github.com/CocoaPods/CocoaPods/pull/1682)

* The `pod search <query>` command now supports multiword queries when using
  the `--web` option.
  [Florian Hanke](https://github.com/floere)
  [#1643](https://github.com/CocoaPods/CocoaPods/pull/1682)

###### Bug Fixes

* Fixed a bug which resulted in `pod lib lint` not being able to find the
  headers.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [#1566](https://github.com/CocoaPods/CocoaPods/issues/1566)

* Fixed the developer frameworks search paths so that
  `$(SDKROOT)/Developer/Library/Frameworks` is used for iOS and
  `$(DEVELOPER_LIBRARY_DIR)/Frameworks` is used for OS X.  
  [Kevin Wales](https://github.com/kwales)
  [#1562](https://github.com/CocoaPods/CocoaPods/pull/1562)

* When updating the pod repos, repositories with unreachable remotes
  are now ignored. This fixes an issue with certain private repositories.  
  [Joshua Kalpin](https://github.com/Kapin)
  [#1595](https://github.com/CocoaPods/CocoaPods/pull/1595)
  [#1571](https://github.com/CocoaPods/CocoaPods/issues/1571)

* The linter will now display an error if a Pod's name contains whitespace.  
  [Joshua Kalpin](https://github.com/Kapin)
  [Core#39](https://github.com/CocoaPods/Core/pull/39)
  [#1610](https://github.com/CocoaPods/CocoaPods/issues/1610)

* Having the silent flag enabled in the config will no longer cause issues
  with `pod search`. In addition, the flag `--silent` is no longer supported
  for the command.  
  [Joshua Kalpin](https://github.com/Kapin)
  [#1627](https://github.com/CocoaPods/CocoaPods/pull/1627)

* The linter will now display an error if a framework ends with `.framework`
  (i.e. `QuartzCore.framework`).  
  [Joshua Kalpin](https://github.com/Kapin)
  [#1331](https://github.com/CocoaPods/CocoaPods/issues/1336)
  [Core#45](https://github.com/CocoaPods/Core/pull/45)

* The linter will now display an error if a library ends with `.a` or `.dylib`
  (i.e. `z.dylib`). It will also display an error if it begins with `lib`
  (i.e. `libxml`).  
  [Joshua Kalpin](https://github.com/Kapin)
  [Core#44](https://github.com/CocoaPods/Core/issues/44)

* The ARCHS build setting can come back as an array when more than one
  architecture is specified.  
  [Carson McDonald](https://github.com/carsonmcdonald)
  [#1628](https://github.com/CocoaPods/CocoaPods/issues/1628)

* Fixed all issues caused by `/tmp` being a symlink to `/private/tmp`.
  This affected mostly `pod lib lint`, causing it to fail when the
  Pod used `prefix_header_*` or when the pod headers imported headers
  using the namespaced syntax (e.g. `#import <MyPod/Header.h>`).  
  [kra Larivain/OpenTable](https://github.com/opentable)
  [#1514](https://github.com/CocoaPods/CocoaPods/pull/1514)

* Fixed an incorrect path being used in the example app Podfile generated by
  `pod lib create`.
  [Eloy Durán](https://github.com/alloy)
  [cocoapods-try#5](https://github.com/CocoaPods/cocoapods-try/issues/5)


## 0.28.0 (2013-11-14)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.27.1...0.28.0)
• [CocoaPods-core](https://github.com/CocoaPods/Core/compare/0.27.1...0.28.0)
• [CLAide](https://github.com/CocoaPods/CLAide/compare/0.3.2...0.4.0)

For more details, see 📝 [CocoaPods 0.28](https://blog.cocoapods.org/CocoaPods-0.28/) on our blog.

###### Enhancements

* CLAide now supports gem plugins. An example CocoaPods plugin can be found at
  [open\_pod\_bay](https://github.com/leshill/open_pod_bay).

  As of yet there are no promises made yet on the APIs, so try to fail as
  gracefully as possible in case a CocoaPods update breaks your usage. In these
  cases, also please let us know what you would need, so we can take this into
  account when we do finalize APIs.

  [Les Hill](https://github.com/leshill)
  [CLAide#1](https://github.com/CocoaPods/CLAide/pull/1)
  [#959](https://github.com/CocoaPods/CocoaPods/issues/959)

###### Bug Fixes

* Compiling `xcassets` with `actool` now uses `UNLOCALIZED_RESOURCES_FOLDER_PATH`
  instead of `PRODUCT_NAME.WRAPPER_EXTENSION` as output directory as it is more
  accurate and allows the project to overwrite `WRAPPER_NAME`.  
  [Marc Knaup](https://github.com/fluidsonic)
  [#1556](https://github.com/CocoaPods/CocoaPods/pull/1556)

* Added a condition to avoid compiling xcassets when `WRAPPER_EXTENSION`
  is undefined, as it would be in the case of static libraries. This prevents
  trying to copy the compiled files to a directory that does not exist.  
  [Noah McCann](https://github.com/nmccann)
  [#1521](https://github.com/CocoaPods/CocoaPods/pull/1521)

* Added additional condition to check if `actool` is available when compiling
  `xcassets`. This prevents build failures of Xcode 5 projects on Travis CI (or
  lower Xcode versions).  
  [Michal Konturek](https://github.com/michalkonturek)
  [#1511](https://github.com/CocoaPods/CocoaPods/pull/1511)

* Added a condition to properly handle universal or mac apps when compiling
  xcassets. This prevents build errors in the xcassets compilation stage
  particularly when using xctool to build.  
  [Ryan Marsh](https://github.com/ryanwmarsh)
  [#1594](https://github.com/CocoaPods/CocoaPods/pull/1594)

* Vendored Libraries now correctly affect whether a podspec is considered empty.  
  [Joshua Kalpin](https://github.com/Kapin)
  [Core#38](https://github.com/CocoaPods/Core/pull/38)

* Vendored Libraries and Vendored Frameworks now have their paths validated correctly.  
  [Joshua Kalpin](https://github.com/Kapin)
  [#1567](https://github.com/CocoaPods/CocoaPods/pull/1567)

* Gists are now correctly accepted with https.  
  [Joshua Kalpin](https://github.com/Kapin)
  [Core#38](https://github.com/CocoaPods/Core/pull/38)

* The `pod push` command is now more specific about the branch it pushes to.  
  [orta](http://orta.github.io)
  [#1561](https://github.com/CocoaPods/CocoaPods/pull/1561)

* Dtrace files are now properly left unflagged when installing, regardless of configuration.  
  [Swizzlr](https://github.com/swizzlr)
  [#1560](https://github.com/CocoaPods/CocoaPods/pull/1560)

* Users are now warned if their terminal encoding is not UTF-8. This fixes an issue
  with a small percentage of pod names that are incompatible with ASCII.  
  [Joshua Kalpin](https://github.com/Kapin)
  [#1570](https://github.com/CocoaPods/CocoaPods/pull/1570)


## 0.27.1 (2013-10-24)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.26.2...0.27.1)
• [cocoapods-core](https://github.com/CocoaPods/Core/compare/0.26.2...0.27.1)
• [Xcodeproj](https://github.com/CocoaPods/Xcodeproj/compare/0.13.0...0.14.0)

For more details, see 📝 [CocoaPods 0.27 and improved installation UX](https://blog.cocoapods.org/CocoaPods-0.27-and-improved-installation-UX/) on our blog.

###### Enhancements

* The xcodeproj gem now comes bundled with prebuilt binaries for the Ruby
  versions that come with OS X 10.8 and 10.9. Users now no longer need to
  install the Xcode Command Line Tools or deal with the Ruby C header location.  
  [Eloy Durán](https://github.com/alloy)
  [Xcodeproj#88](https://github.com/CocoaPods/Xcodeproj/issues/88)

* Targets passed to the `link_with` method of the Podfile DSL no longer need
  to be explicitly passed as an array. `link_with ['target1', 'target2']` can
  now be written as `link_with 'target1', 'target2'`.  
  [Adam Sharp](https://github.com/sharplet)
  [Core#30](https://github.com/CocoaPods/Core/pull/30)

* The copy resources script now compiles xcassets resources.  
  [Ulrik Damm](https://github.com/ulrikdamm)
  [#1427](https://github.com/CocoaPods/CocoaPods/pull/1427)

* `pod repo` now support a `remove ['repo_name']` command.  
  [Joshua Kalpin](https://github.com/Kapin)
  [#1493](https://github.com/CocoaPods/CocoaPods/issues/1493)
  [#1484](https://github.com/CocoaPods/CocoaPods/issues/1484)

###### Bug Fixes

* The architecture is now set in the build settings of the user build
  configurations.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [#1450](https://github.com/CocoaPods/CocoaPods/issues/1462)
  [#1462](https://github.com/CocoaPods/CocoaPods/issues/1462)

* Fixed a crash related to CocoaPods being unable to resolve an unique build
  setting of an user target with custom build configurations.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [#1462](https://github.com/CocoaPods/CocoaPods/issues/1462)
  [#1463](https://github.com/CocoaPods/CocoaPods/issues/1463)
  [#1457](https://github.com/CocoaPods/CocoaPods/issues/1457)

* Fixed a defect which prevented subspecs from being dependant on a pod with a
  name closely matching the name of one of the subspec's parents.  
  [Noah McCann](https://github.com/nmccann)
  [#29](https://github.com/CocoaPods/Core/pull/29)

* The developer dir relative to the SDK is not added anymore if testing
  frameworks are detected in OS X targets, as it doesn't exists, avoiding the
  presentation of the relative warning in Xcode.  
  [Fabio Pelosin](https://github.com/fabiopelosin)


## 0.26.2 (2013-10-09)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.26.1...0.26.2)
• [cocoapods-core](https://github.com/CocoaPods/Core/compare/0.26.1...0.26.2)
• [Xcodeproj](https://github.com/CocoaPods/Xcodeproj/compare/0.11.1...0.13.0)

###### Bug Fixes

* Fixed a crash which was causing a failure in `pod lib create` if the name of
  the Pod included spaces. As spaces are not supported now this is gracefully
  handled with an informative message.  
  [Kyle Fuller](https://github.com/kylef)
  [#1456](https://github.com/CocoaPods/CocoaPods/issues/1456)

* If an user target doesn't specify an architecture the value specified for the
  project is used in CocoaPods targets.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [#1450](https://github.com/CocoaPods/CocoaPods/issues/1450)

* The Pods project now properly configures ARC on all build configurations.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [#1454](https://github.com/CocoaPods/CocoaPods/issues/1454)


## 0.26.1 (2013-10-08)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.25.0...0.26.1)
• [cocoapods-core](https://github.com/CocoaPods/Core/compare/0.25.0...0.26.1)
• [Xcodeproj](https://github.com/CocoaPods/Xcodeproj/compare/0.11.1...0.12.0)

For more details, see 📝 [CocoaPods 0.26](https://blog.cocoapods.org/CocoaPods-0.26/) on our blog.

###### Enhancements

* CocoaPods now creates and hides the schemes of its targets after every
  installation. The schemes are not shared because the flag which keeps track
  whether they should be visible is a user only flag. The schemes are still
  present and to debug a single Pod it is possible to make its scheme visible
  in the Schemes manager of Xcode. This is rarely needed though because the
  user targets trigger the compilation of the Pod targets.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [#1185](https://github.com/CocoaPods/CocoaPods/pull/1185)

* Installations which don't integrate a user target (lint subcommands and
  `--no-integrate` option) now set the architecture of OS X Pod targets to
  `$(ARCHS_STANDARD_64_BIT)` (Xcode 4 default value for new targets). This
  fixes lint issues with Xcode 4.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [#1185](https://github.com/CocoaPods/CocoaPods/pull/1185)

* Further improvements to the organization of the Pods project  

  - The project is now is sorted by name with groups at the bottom.
  - Source files are now stored in the root group of the spec, subspecs are not
    stored in a `Subspec` group anymore and the products of the Pods all are
    stored in the products group of the project.
  - The frameworks are referenced relative to the Developer directory and
    namespaced per platform.

  [Fabio Pelosin](https://github.com/fabiopelosin)
  [#1389](https://github.com/CocoaPods/CocoaPods/pull/1389)
  [#1420](https://github.com/CocoaPods/CocoaPods/pull/1420)

* Added the `documentation_url` DSL attribute to the specifications.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [#1273](https://github.com/CocoaPods/CocoaPods/pull/1273)

###### Bug Fixes

* The search paths of vendored frameworks and libraries now are always
  specified relatively.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [#1405](https://github.com/CocoaPods/CocoaPods/pull/1405)

* Fix an issue where CocoaPods would fail to work when used with an older
  version of the Active Support gem. This fix raises the dependency version to
  the earliest compatible version of Active Support.  
  [Kyle Fuller](https://github.com/kylef)
  [#1407](https://github.com/CocoaPods/CocoaPods/issues/1407)

* CocoaPods will not attempt to load anymore all the version of a specification
  preventing crashes if those are incompatible.  
  [Fabio Pelosin](https://github.com/fabiopelosin)
  [#1272](https://github.com/CocoaPods/CocoaPods/pull/1272)


## 0.25.0 (2013-09-20)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.24.0...0.25.0)
• [cocoapods-core](https://github.com/CocoaPods/Core/compare/0.24.0...0.25.0)
• [Xcodeproj](https://github.com/CocoaPods/Xcodeproj/compare/0.10.1...0.11.0)

###### Enhancements

* Added support for Xcode 5.

  The generated Pods Xcode project is now compatible with `arm64` projects and
  is updated to use Xcode 5’s default settings removing all warnings.

  **NOTE to users migrating projects from Xcode 4, or are still using Xcode 4:**
  1. The Pods Xcode project now sets the `ONLY_ACTIVE_ARCH` build setting to
     `YES` in the `Debug` configuration. You _will_ have to set the same on your
     project/target, otherwise the build _will_ fail.
  2. Ensure your project/target has an `ARCHS` value set, otherwise the build
     _will_ fail.
  3. When building a **iOS** project from the command-line, with the `xcodebuild`
     tool that comes with Xcode 4, you’ll need to completely disable this setting
     by appending to your build command: `ONLY_ACTIVE_ARCH=NO`.

  [#1352](https://github.com/CocoaPods/CocoaPods/pull/1352)

* Speed up project generation in `pod install` and `pod update`.

* The pre and post install hooks that have been deprecated now include the name
  and version of the spec that’s using them.

###### Bug Fixes

* Only create a single resource bundle for all targets. Prior to this change a
  resource bundle included into multiple targets within the project would create
  duplicately named targets in the Pods Xcode project, causing duplicately named
  Schemes to be created on each invocation of `pod install`. All targets that
  reference a given resource bundle now have dependencies on a single common
  target.

  [Blake Watters](https://github.com/blakewatters)
  [#1338](https://github.com/CocoaPods/CocoaPods/issues/1338)

* Solved outstanding issues with CocoaPods resource bundles and Archive builds:
  1. The rsync task copies symlinks into the App Bundle, producing an invalid
     app. This change add `--copy-links` to the rsync invocation to ensure the
     target files are copied rather than the symlink.
  2. The Copy Resources script uses `TARGET_BUILD_DIR` which points to the App
     Archiving folder during an Archive action. Switching to
     `BUILT_PRODUCTS_DIR` instead ensures that the path is correct for all
     actions and configurations.

  [Blake Watters](https://github.com/blakewatters)
  [#1309](https://github.com/CocoaPods/CocoaPods/issues/1309)
  [#1329](https://github.com/CocoaPods/CocoaPods/issues/1329)

* Ensure resource bundles are copied to installation location on install actions
  [Chris Gummer](https://github.com/chrisgummer)
  [#1364](https://github.com/CocoaPods/CocoaPods/issues/1364)

* Various bugfixes in Xcodeproj, refer to its [CHANGELOG](https://github.com/CocoaPods/Xcodeproj/blob/0.11.0/CHANGELOG.md)
  for details.


## 0.24.0 (2013-09-04)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.23.0...0.24.0)
• [cocoapods-core](https://github.com/CocoaPods/Core/compare/0.23.0...0.24.0)
• [Xcodeproj](https://github.com/CocoaPods/Xcodeproj/compare/0.8.1...0.9.0)
• [cocoapods-downloader](https://github.com/CocoaPods/cocoapods-downloader/compare/0.1.1...0.2.0)

###### Enhancements

* Added `pod init` command which generates a Podfile according to the
  targets of the project stored in the working directory and to the templates
  stored in the `~/.cocoapods/templates` folder. Two templates are supported:
    - the `Podfile.default` template for regular targets.
    - and the `Podfile.test` template for test targets.
  [Ian Ynda-Hummel](https://github.com/ianyh)
  [#1106](https://github.com/CocoaPods/CocoaPods/issues/1106)
  [#1045](https://github.com/CocoaPods/CocoaPods/issues/1045)

* CocoaPods will now leverage the [xcproj](https://github.com/0xced/xcproj)
  command line tool if available in the path of the user to touch saved
  projects. This will result in projects being serialized in the exact format
  used by Xcode eliminating merge conflicts and other related issues. To learn
  more about how to install xcproj see its
  [readme](https://github.com/0xced/xcproj).
  [Cédric Luthi](https://github.com/0xced)
  [#1275](https://github.com/CocoaPods/CocoaPods/issues/1275)

* Rationalized and cleaned up Pods project group structure and path specification.

* Create all necessary build configurations for *Pods.xcodeproj* at the project level. If the user’s project has more than just *Debug* and *Release* build configurations, they may be explicitly specified in the Podfile:  
`xcodeproj 'MyApp', 'App Store' => :release, 'Debug' => :debug, 'Release' => :release`  
  If build configurations aren’t specified in the Podfile then they will be automatically picked from the user’s project in *Release* mode.  
  These changes will ensure that the `libPods.a` static library is not stripped for all configurations, as explained in [#1217](https://github.com/CocoaPods/CocoaPods/pull/1217).  
  [Cédric Luthi](https://github.com/0xced)  
  [#1294](https://github.com/CocoaPods/CocoaPods/issues/1294)

* Added basic support for Bazaar repositories.  
  [Fred McCann](https://github.com/fmccann)  
  [cocoapods-downloader#4](https://github.com/CocoaPods/cocoapods-downloader/pull/4)

###### Bug Fixes

* Fixed crash in `pod spec cat`.

* Use the `TARGET_BUILD_DIR` environment variable for installing resource bundles.  
  [Cédric Luthi](https://github.com/0xced)  
  [#1268](https://github.com/CocoaPods/CocoaPods/issues/1268)  

* CoreData versioned models are now properly handled respecting the contents of
  the `.xccurrentversion` file.  
  [Ashton-W](https://github.com/Ashton-W)  
  [#1288](https://github.com/CocoaPods/CocoaPods/issues/1288),
  [Xcodeproj#83](https://github.com/CocoaPods/Xcodeproj/pull/83)  

* OS X frameworks are now copied to the Resources folder using rsync to
  properly overwrite existing files.  
  [Nikolaj Schumacher](https://github.com/nschum)  
  [#1063](https://github.com/CocoaPods/CocoaPods/issues/1063)

* User defined build configurations are now added to the resource bundle
  targets.  
  [#1309](https://github.com/CocoaPods/CocoaPods/issues/1309)


## 0.23.0 (2013-08-08)


## 0.23.0.rc1 (2013-08-02)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.22.3...0.23.0.rc1)
• [cocoapods-core](https://github.com/CocoaPods/Core/compare/0.22.3...0.23.0.rc1)
• [Xcodeproj](https://github.com/CocoaPods/Xcodeproj/compare/0.8.1...0.9.0)
• [cocoapods-downloader](https://github.com/CocoaPods/cocoapods-downloader/compare/0.1.1...0.1.2)

###### Enhancements

* Added `prepare_command` attribute to Specification DSL. The prepare command
  will replace the `pre_install` hook. The `post_install` hook has also been
  deprecated.
  [#1247](https://github.com/CocoaPods/CocoaPods/issues/1247)

  The reason we provided Ruby hooks at first, was because we wanted to offer
  the option to make any required configuration possible. By now, however, we
  have a pretty good idea of the use-cases and are therefore locking down the
  freedom that was once available. In turn, we’re adding attributes that can
  replace the most common use-cases. _(See the enhancements directly following
  this entry for more info)._

  The second reason we need to lock this down is because this is the last
  remaining obstacle to fully serialize specifications, which we need in order
  to move to a ‘spec push’ web-service in the future.

* Added `resource_bundles` attribute to the Specification DSL.  
  [#743](https://github.com/CocoaPods/CocoaPods/issues/743)
  [#1186](https://github.com/CocoaPods/CocoaPods/issues/1186)

* Added `vendored_frameworks` attribute to the Specification DSL.  
  [#809](https://github.com/CocoaPods/CocoaPods/issues/809)
  [#1075](https://github.com/CocoaPods/CocoaPods/issues/1075)

* Added `vendored_libraries` attribute to the Specification DSL.  
  [#809](https://github.com/CocoaPods/CocoaPods/issues/809)
  [#1075](https://github.com/CocoaPods/CocoaPods/issues/1075)

* Restructured `.cocoapods` folder to contain repos in a subdirectory.  
  [Ian Ynda-Hummel](https://github.com/ianyh)
  [#1150](https://github.com/CocoaPods/CocoaPods/issues/1150)  

* Improved `pod spec create` template.  
  [#1223](https://github.com/CocoaPods/CocoaPods/issues/1223)

* Added copy&paste-friendly dependency to `pod search`.  
  [#1073](https://github.com/CocoaPods/CocoaPods/issues/1073)

* Improved performance of the installation of Pods with git
  sources which specify a tag.  
  [#1077](https://github.com/CocoaPods/CocoaPods/issues/1077)

* Core Data `xcdatamodeld` files are now properly referenced from the Pods
  project.  
  [#1155](https://github.com/CocoaPods/CocoaPods/issues/1155)

* Removed punctuation check from the specification validations.  
  [#1242](https://github.com/CocoaPods/CocoaPods/issues/1242)

* Deprecated the `documentation` attribute of the Specification DSL.  
  [Core#20](https://github.com/CocoaPods/Core/issues/20)

###### Bug Fixes

* Fix copy resource script issue related to filenames with spaces.  
  [Denis Hennessy](https://github.com/dhennessy)
  [#1231](https://github.com/CocoaPods/CocoaPods/issues/1231)  



## 0.22.3 (2013-07-23)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.22.2...0.22.3)

###### Enhancements

* Add support for .xcdatamodel resource files (in addition to .xcdatamodeld).
  [#1201](https://github.com/CocoaPods/CocoaPods/pull/1201)

###### Bug Fixes

* Always exlude `USE_HEADERMAP` from the user’s project.
  [#1216](https://github.com/CocoaPods/CocoaPods/issues/1216)

* Use correct template repo when using the `pod lib create` command.
  [#1214](https://github.com/CocoaPods/CocoaPods/issues/1214)

* Fixed issue with `pod push` failing when the podspec is unchanged. It will now
  report `[No change] ExamplePod (0.1.0)` and continue to push other podspecs if
  they exist. [#1199](https://github.com/CocoaPods/CocoaPods/pull/1199)

* Set STRIP_INSTALLED_PRODUCT = NO in the generated Pods project. This allows
  Xcode to include symbols from CocoaPods in dSYMs during Archive builds.
  [#1217](https://github.com/CocoaPods/CocoaPods/pull/1217)

* Ensure the resource script doesn’t fail due to the resources list file not
  existing when trying to delete it.
  [#1198](https://github.com/CocoaPods/CocoaPods/pull/1198)

* Fix handling of spaces in paths when compiling xcdatamodel(d) files.
  [#1201](https://github.com/CocoaPods/CocoaPods/pull/1201)



## 0.22.2 (2013-07-11)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.22.1...0.22.2)
• [cocoapods-core](https://github.com/CocoaPods/Core/compare/0.22.1...0.22.2)
• [Xcodeproj](https://github.com/CocoaPods/Xcodeproj/compare/0.8.0...0.8.1)

###### Enhancements

* The build settings of the Pods project and of its target have been updated to
  be in line with the new defaults of the future versions of Xcode.

###### Bug fixes

* Specifications defining build setting with the `[*]` syntax are now properly
  handled.
  [#1171](https://github.com/CocoaPods/CocoaPods/issues/1171)

* The name of the files references are now properly set fixing a minor
  regression introduced by CocoaPods 0.22.1 and matching more closely Xcode
  behaviour.

* The validator now builds the Pods target instead of the first target actually
  performing the validation.

* Build settings defined through the `xcconfig` attribute of a `podspec` are now
  stripped of duplicate values when merged in an aggregate target.
  [#1189](https://github.com/CocoaPods/CocoaPods/issues/1189)


## 0.22.1 (2013-07-03)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.22.0...0.22.1)
• [cocoapods-core](https://github.com/CocoaPods/Core/compare/0.22.0...0.22.1)

###### Bug fixes

* Fixed a crash related to target dependencies and subspecs.
  [#1168](https://github.com/CocoaPods/CocoaPods/issues/1168)


## 0.22.0 (2013-07-03)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.21.0...0.22.0)
• [cocoapods-core](https://github.com/CocoaPods/Core/compare/0.21.0...0.22.0)
• [Xcodeproj](https://github.com/CocoaPods/Xcodeproj/compare/0.7.1...0.8.0)

###### Enhancements

* Added the `pod lib create` subcommand which allows to create a new Pod
  adhering to the best practices. The template is still a bit primitive
  and we encourage users to provide feedback by submitting patches and issues
  to https://github.com/CocoaPods/CocoaPods.
  [#850](https://github.com/CocoaPods/CocoaPods/issues/850)

* Added the `pod lib lint` subcommand which allows to lint the Pod stored
  in the working directory (a pod spec in the root is needed). This subcommand
  is equivalent to the deprecated `pod spec lint --local`.
  [#850](https://github.com/CocoaPods/CocoaPods/issues/850)

* The dependencies of the targets of the Pods project are now made explicit.
  [#1165](https://github.com/CocoaPods/CocoaPods/issues/1165)

* The size of the cache used for the git repos is now configurable. For more
  details see
  https://github.com/CocoaPods/CocoaPods/blob/master/lib/cocoapods/config.rb#L7-L25
  [#1159](https://github.com/CocoaPods/CocoaPods/issues/1159)

* The copy resources shell script now aborts if any error occurs.
  [#1098](https://github.com/CocoaPods/CocoaPods/issues/1098)

* The output of shell script build phases no longer includes environment
  variables to reduce noise.
  [#1122](https://github.com/CocoaPods/CocoaPods/issues/1122)

* CocoaPods no longer sets the deprecated `ALWAYS_SEARCH_USER_PATHS` build
  setting.

###### Bug fixes

* Pods whose head state changes now are correctly detected and reinstalled.
  [#1160](https://github.com/CocoaPods/CocoaPods/issues/1160)

* Fixed the library reppresentation of the hooks which caused issues with the
  `#copy_resources_script_path` method.
  [#1157](https://github.com/CocoaPods/CocoaPods/issues/1157)

* Frameworks symlinks are not properly preserved by the copy resources script.
  Thanks to Thomas Dohmke (ashtom) for the fix.
  [#1063](https://github.com/CocoaPods/CocoaPods/issues/1063)

## 0.21.0 (2013-07-01)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.21.0.rc1...0.21.0)
• [cocoapods-core](https://github.com/CocoaPods/Core/compare/0.21.0.rc1...0.21.0)
• [Xcodeproj](https://github.com/CocoaPods/Xcodeproj/compare/0.7.0...0.7.1)

###### Bug fixes

* Fixed a linter issue related to the dedicated targets change.
  [#1130](https://github.com/CocoaPods/CocoaPods/issues/1130)

* Fixed xcconfig issues related to Pods including a dot in the name.
  [#1152](https://github.com/CocoaPods/CocoaPods/issues/1152)


## 0.21.0.rc1 (2013-06-18)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.20.2...0.21.0.rc1)
• [cocoapods-core](https://github.com/CocoaPods/Core/compare/0.20.2...0.21.0.rc1)
• [Xcodeproj](https://github.com/CocoaPods/Xcodeproj/compare/0.6.0...0.7.0)

###### Enhancements

* Pods are now built in dedicated targets. This enhancement isolates the build
  environment of each Pod from other ones eliminating pollution issues. It also
  introduces an important architectural improvement which lays the foundation
  for the upcoming CocoaPods features. Stay tuned! This feature has been
  implemented by [Jeremy Slater](https://github.com/jasl8r).
  [#1011](https://github.com/CocoaPods/CocoaPods/issues/1011)
  [#983](https://github.com/CocoaPods/CocoaPods/issues/983)
  [#841](https://github.com/CocoaPods/CocoaPods/issues/841)

* Reduced external dependencies and deprecation of Rake::FileList.
  [#1080](https://github.com/CocoaPods/CocoaPods/issues/1080)

###### Bug fixes

* Fixed crash due to Podfile.lock containing multiple version requirements for
  a Pod. [#1076](https://github.com/CocoaPods/CocoaPods/issues/1076)

* Fixed a build error due to the copy resources script using the same temporary
  file for multiple targets.
  [#1099](https://github.com/CocoaPods/CocoaPods/issues/1099)

## 0.20.2 (2013-05-26)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.20.1...0.20.2)

###### Bug fixes

* Ensure that, in a sandbox-pod env, RubyGems loads the CocoaPods gem on system
  Ruby (1.8.7).
  [#939](https://github.com/CocoaPods/CocoaPods/issues/939#issuecomment-18396063)
* Allow sandbox-pod to execute any tool inside the Xcode.app bundle.
* Allow sandbox-pod to execute any tool inside a rbenv prefix.

## 0.20.1 (2013-05-23)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.20.0...0.20.1)
• [CLAide](https://github.com/CocoaPods/CLAide/compare/0.3.0...0.3.2)

###### Bug fixes

* Made sandbox-pod executable visible as it wasn't correctly configured in the
  gemspec.
* Made sandbox-pod executable actually work when installed as a gem. (In which
  case every executable is wrapped in a wrapper bin script and the DATA constant
  can no longer be used.)
* Required CLAide 0.3.2 as 0.3.0 didn't include all the files in the gemspec
  and 0.3.1 was not correctly processed by RubyGems.

## 0.20.0 (2013-05-23)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.19.1...0.20.0)
• [cocoapods-core](https://github.com/CocoaPods/Core/compare/0.19.1...0.20.0)
• [cocoapods-downloader](https://github.com/CocoaPods/CLAide/compare/0.1.0...0.1.1)
• [Xcodeproj](https://github.com/CocoaPods/Xcodeproj/compare/0.5.5...0.6.0)
• [CLAide](https://github.com/CocoaPods/CLAide/compare/0.2.0...0.3.0)

###### Enhancements

* Introduces an experimental sandbox feature.
  [#939](https://github.com/CocoaPods/CocoaPods/issues/939)

  Let’s face it, even though we have a great community that spends an amazing
  amount of time on curating the specifications, the internet can be a hostile
  place and the community is growing too large to take a naive approach any
  longer.

  As such, we have started leveraging OS X’s sandbox facilities to disallow
  unsanctioned operations. This is still very experimental and therefore has to
  be used explicitely, for now, but that does **not** mean we don’t want you to
  start using it and **report issues**.

  To use the sandbox, simply use the `sandbox-pod` command instead. E.g.:

        $ sandbox-pod install

  In case of issues, be sure to check `/var/log/system.log` for ‘deny’ messages.
  For instance, here’s an example where the sandbox denies read access to `/`:

        May 16 00:23:35 Khaos kernel[0]: Sandbox: ruby(98430) deny file-read-data /

  **NOTE**: _The above example is actually one that we know of. We’re not sure
  yet which process causes this, but there shouldn’t be a need for any process
  to read data from the root path anyways._

  **NOTE 2**: _At the moment the sandbox is not compatible with the `:path` option
  when referencing Pods that are not stored within the directory of the Podfile._

* The naked `pod` command now defaults to `pod install`.
  [#958](https://github.com/CocoaPods/CocoaPods/issues/958)

* CocoaPods will look for the Podfile in the ancestors paths if one is
  not available in the working directory.
  [#940](https://github.com/CocoaPods/CocoaPods/issues/940)

* Documentation generation has been removed from CocoaPods as it graduated
  to CocoaDocs. This decision was taken because CocoaDocs is a much better
  solution which doesn't clutter Xcode's docsets while still allowing
  access to the docsets with Xcode and with Dash. Removing this feature
  keeps the installer leaner and easier to develop and paves the way for the
  upcoming sandbox. Private pods can use pre install hook to generate the
  documentation. If there will be enough demand this feature might be
  reintegrated as plugin (see
  [#1037](https://github.com/CocoaPods/CocoaPods/issues/1037)).

* Improved performance of the copy resources script and thus build time of
  the integrated targets. Contribution by [@onato](https://github.com/onato)
  [#1050](https://github.com/CocoaPods/CocoaPods/issues/1050).

* The changelog for the current version is printed after CocoaPods is
  installed/updated.
  [#853](https://github.com/CocoaPods/CocoaPods/issues/853).


###### Bug fixes

* Inheriting `inhibit_warnings` per pod is now working
  [#1032](https://github.com/CocoaPods/CocoaPods/issues/1032)
* Fix copy resources script for iOS < 6 and OS X < 10.8 by removing the
  `--reference-external-strings-file`
  flag. [#1030](https://github.com/CocoaPods/CocoaPods/pull/1030)
* Fixed issues with the `:head` option of the Podfile.
  [#1046](https://github.com/CocoaPods/CocoaPods/issues/1046)
  [#1039](https://github.com/CocoaPods/CocoaPods/issues/1039)

## 0.19.1 (2013-04-30)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.19.0...0.19.1)
• [cocoapods-core](https://github.com/CocoaPods/Core/compare/0.19.0...0.19.1)

###### Bug fixes

* Project-level preprocessor macros are not overwritten anymore.
  [#903](https://github.com/CocoaPods/CocoaPods/issues/903)
* A Unique hash instances for the build settings of the Pods target is now
  created resolving interferences in the hooks.
  [#1014](https://github.com/CocoaPods/CocoaPods/issues/1014)

## 0.19.0 (2013-04-30)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.18.1...0.19.0)
• [cocoapods-core](https://github.com/CocoaPods/Core/compare/0.18.1...0.19.0)

###### Enhancements

* Compile time introspection. Macro definitions which allow to inspect the
  installed Pods and their version have been introduced in the build
  environment of the Pod libraries
  ([example](https://gist.github.com/fabiopelosin/5348551)).
* CocoaPods now defines the `COCOAPODS=1` macro in the Pod and the Client
  targets. This is useful for libraries which conditionally expose interfaces.
  [#903](https://github.com/CocoaPods/CocoaPods/issues/903)
* Added support for the `private_header_files` attribute of the Specification
  DSL.
  [#998](https://github.com/CocoaPods/CocoaPods/issues/998)
* CocoaPods now defines the deployment target of the Pods project computed as
  the minimum deployment target of the Pods libraries.
  [#556](https://github.com/CocoaPods/CocoaPods/issues/556)
* Added `pod podfile-info` command. Shows list of used Pods and their info
  in a project or supplied Podfile.
  Options: `--all` - with dependencies. `--md` - in Markdown.
  [#855](https://github.com/CocoaPods/CocoaPods/issues/855)
* Added `pod help` command. You can still use the old format
  with --help flag.
  [#957](https://github.com/CocoaPods/CocoaPods/pull/957)
* Restored support for Podfiles named `CocoaPods.podfile`. Moreover, the
  experimental YAML format of the Podfile now is associated with files named
  `CocoaPods.podfile.yaml`.
  [#1004](https://github.com/CocoaPods/CocoaPods/pull/1004)

###### Deprecations

* The `:local` flag in Podfile has been renamed to `:path` and the old syntax
  has been deprecated.
  [#971](https://github.com/CocoaPods/CocoaPods/issues/971)

###### Bug fixes

* Fixed issue related to `pod outdated` and external sources.
  [#954](https://github.com/CocoaPods/CocoaPods/issues/954)
* Fixed issue with .svn folders in copy resources script.
  [#972](https://github.com/CocoaPods/CocoaPods/issues/972)

## 0.18.1 (2013-04-10)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.18.0...0.18.1)
• [cocoapods-core](https://github.com/CocoaPods/Core/compare/0.18.0...0.18.)

###### Bug fixes

* Fixed a bug introduced in 0.18 which cause compilation issue due to the
  quoting of the inherited value in the xcconfigs.
  [#956](https://github.com/CocoaPods/CocoaPods/issues/956)
* Robustness against user targets including build files with missing file
  references.
  [#938](https://github.com/CocoaPods/CocoaPods/issues/938)
* Partially fixed slow performance from the command line
  [#919](https://github.com/CocoaPods/CocoaPods/issues/919)


## 0.18.0 (2013-04-08)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.17.2...0.18.0)
• [cocoapods-core](https://github.com/CocoaPods/Core/compare/0.17.2...0.18.0)
• [Xcodeproj](https://github.com/CocoaPods/Xcodeproj/compare/0.5.2...0.5.5)

###### Enhancements

* Added the ability to inhibit warnings per pod.
  Just pass `:inhibit_warnings => true` inline.
  This feature has been implemented by Marin Usalj (@mneorr).
  [#10](https://github.com/CocoaPods/Core/pull/10)
  [#934](https://github.com/CocoaPods/CocoaPods/pull/934)
* Inhibiting warnings will also suppress the warnings of the static analyzer.
* A new build phase has been added to check that your
  installation is in sync with the `Podfile.lock` and fail the build otherwise.
  The new build phase will not be added automatically to targets already
  integrated with CocoaPods, for integrating targets manually see [this
  comment](https://github.com/CocoaPods/CocoaPods/pull/946#issuecomment-16042419).
  This feature has been implemented by Ullrich Schäfer (@stigi).
  [#946](https://github.com/CocoaPods/CocoaPods/pull/946)
* The `pod search` commands now accepts the `--ios` and the `--osx` arguments
  to filter the results by platform.
  [#625](https://github.com/CocoaPods/CocoaPods/issues/625)
* The developer frameworks are automatically added if `SenTestingKit` is
  detected. There is no need to specify them in specifications anymore.
  [#771](https://github.com/CocoaPods/CocoaPods/issues/771)
* The `--no-update` argument of the `install`, `update`, `outdated` subcommands
  has been renamed to `--no-repo-update`.
  [#913](https://github.com/CocoaPods/CocoaPods/issues/913)

###### Bug fixes

* Improved handling for Xcode projects containing non ASCII characters.
  Special thanks to Cédric Luthi (@0xced), Vincent Isambart (@vincentisambart),
  and Manfred Stienstra (@Manfred) for helping to develop the workaround.
  [#926](https://github.com/CocoaPods/CocoaPods/issues/926)
* Corrected improper configuration of the PODS_ROOT xcconfig variable in
  non-integrating installations.
  [#918](https://github.com/CocoaPods/CocoaPods/issues/918)
* Improved support for pre-release versions using dashes.
  [#935](https://github.com/CocoaPods/CocoaPods/issues/935)
* Documentation sets are now namespaced by pod solving improper attribution.
  [#659](https://github.com/CocoaPods/CocoaPods/issues/659)


## 0.17.2 (2013-04-03)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.17.1...0.17.2)
• [cocoapods-core](https://github.com/CocoaPods/Core/compare/0.17.1...0.17.2)

###### Bug fixes

* Fix crash related to the specification of the workspace as a relative path.
  [#920](https://github.com/CocoaPods/CocoaPods/issues/920)
* Fix an issue related to the `podspec` dsl directive of the Podfile for
  specifications with internal dependencies.
  [#928](https://github.com/CocoaPods/CocoaPods/issues/928)
* Fix crash related to search from the command line.
  [#929](https://github.com/CocoaPods/CocoaPods/issues/929)

###### Ancillary enhancements

* Enabled the FileList deprecation warning in the Linter.
* CocoaPods will raise if versions requirements are specified for dependencies
  with external sources.
* The exclude patterns now handle folders automatically.


## 0.17.1 (2013-03-30)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.17.0...0.17.1)
• [cocoapods-core](https://github.com/CocoaPods/Core/compare/0.17.0...0.17.1)

###### Bug fixes

* Always create the CACHE_ROOT directory when performing a search.
  [#917](https://github.com/CocoaPods/CocoaPods/issues/917)

## 0.17.0 (2013-03-29)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.17.0.rc7...0.17.0)
• [cocoapods-core](https://github.com/CocoaPods/Core/compare/0.17.0.rc7...0.17.0)

#### GM

###### Bug fixes

* Don’t break when specifying doc options, but not appledoc ones.
  [#906](https://github.com/CocoaPods/CocoaPods/issues/906)
* Sort resolved specifications.
  [#907](https://github.com/CocoaPods/CocoaPods/issues/907)
* Subspecs do not need to include HEAD information.
  [#905](https://github.com/CocoaPods/CocoaPods/issues/905)

###### Ancillary enhancements

* Allow the analyzer to do its work without updating sources.
  [motion-cocoapods#50](https://github.com/HipByte/motion-cocoapods/pull/50)

#### rc7

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.17.0.rc6...0.17.0.rc7)
• [cocoapods-core](https://github.com/CocoaPods/Core/compare/0.17.0.rc6...0.17.0.rc7)

###### Bug fixes

- Fixed an issue which lead to the missing declaration of the plural directives
  of the Specification DSL.
  [#816](https://github.com/CocoaPods/CocoaPods/issues/816)
- The resolver now respects the order of specification of the target
  definitions.
- Restore usage of cache file to store a cache for expensive stats.
- Moved declaration of `Pod::FileList` to CocoaPods-core.

###### Ancillary enhancements

- Fine tuned the Specification linter and the health reporter of repositories.
- Search results are sorted.

#### rc6

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.17.0.rc5...0.17.0.rc6)
• [cocoapods-core](https://github.com/CocoaPods/Core/compare/0.17.0.rc5...0.17.0.rc6)

###### Bug fixes

- CocoaPods updates the repositories by default.
  [#872](https://github.com/CocoaPods/CocoaPods/issues/872)
- Fixed a crash which was present when the Podfile specifies a workspace.
  [#871](https://github.com/CocoaPods/CocoaPods/issues/871)
- Fix for a bug which lead to a broken installation in paths containing
  brackets and other glob metacharacters.
  [#862](https://github.com/CocoaPods/CocoaPods/issues/862)
- Fix for a bug related to the case of the paths which lead to clean all files
  in the directories of the Pods.


###### Ancillary enhancements

- CocoaPods now maintains a search index which is updated incrementally instead
  of analyzing all the specs every time. The search index can be updated
  manually with the `pod ipc update-search-index` command.
- Enhancements to the `pod repo lint` command.
- CocoaPods will not create anymore the pre commit hook in the master repo
  during setup. If already created it is possible remove it deleting the
  `~/.cocoapods/master/.git/hooks/pre-commit` path.
- Improved support for linting and validating specs repo.

#### rc5

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.17.0.rc4...0.17.0.rc5)
• [cocoapods-core](https://github.com/CocoaPods/Core/compare/0.17.0.rc4...0.17.0.rc5)

###### Bug fixes

- The `--no-clean` argument is not ignored anymore by the installer.
- Proper handling of file patterns ending with a slash.
- More user errors are raised as an informative.

#### rc4

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.17.0.rc3...0.17.0.rc4)

###### Bug fixes

- Restored compatibility with `Podfile::TargetDefinition#copy_resources_script_name`
  in the Podfile hooks.
- Updated copy resources script so that it will use base internationalization
  [#846](https://github.com/CocoaPods/CocoaPods/issues/846)
- Robustness against an empty configuration file.
- Fixed a crash with `pod push`
  [#848](https://github.com/CocoaPods/CocoaPods/issues/848)
- Fixed an issue which lead to the creation of a Pods project which would
  crash Xcode.
  [#854](https://github.com/CocoaPods/CocoaPods/issues/854)
- Fixed a crash related to a `PBXVariantGroup` present in the frameworks build
  phase of client targets.
  [#859](https://github.com/CocoaPods/CocoaPods/issues/859)


###### Ancillary enhancements

- The `podspec` option of the `pod` directive of the Podfile DSL now accepts
  folders.

#### rc3

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.17.0.rc2...0.17.0.rc3
• [Xcodeproj](https://github.com/CocoaPods/Xcodeproj/compare/0.5.0...0.5.1))

###### Bug fixes

- CocoaPods will not crash anymore if the license file indicated on the spec
  doesn't exits.
- Pre install hooks are called before the Pods are cleaned.
- Fixed and issue which prevent the inclusion of OTHER_CFLAGS and
  OTHER_CPLUSPLUSFLAGS  in the release builds of the Pods project.
- Fixed `pod lint --local`
- Fixed the `--allow-warnings` of `pod push`
  [#835](https://github.com/CocoaPods/CocoaPods/issues/835)
- Added `copy_resources_script_name` to the library representation used in the
  hooks.
  [#837](https://github.com/CocoaPods/CocoaPods/issues/837)

###### Ancillary enhancements

- General improvements to `pod ipc`.
- Added `pod ipc repl` subcommand.

#### rc2

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.17.0.rc1...0.17.0.rc2)
• [cocoapods-core](https://github.com/CocoaPods/Core/compare/0.17.0.rc1...0.17.0.rc2)

###### Bug fixes

- Restored output coloring.
- Fixed a crash related to subspecs
  [#819](https://github.com/CocoaPods/CocoaPods/issues/819)
- Git repos were not cached for dependencies with external sources.
  [#820](https://github.com/CocoaPods/CocoaPods/issues/820)
- Restored support for directories for the preserve_patterns specification
  attribute.
  [#823](https://github.com/CocoaPods/CocoaPods/issues/823)

#### rc1

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.16.4...0.17.0.rc1)
• [Xcodeproj](https://github.com/CocoaPods/Xcodeproj/compare/0.4.3...0.5.0)
• [cocoapods-core](https://github.com/CocoaPods/Core)
• [cocoapods-downloader](https://github.com/CocoaPods/cocoapods-downloader)

###### __Notice__

At some point in future the master repo will be switched to the YAML format of
specifications. This means that specifications with hooks (or any other kind of
dynamic logic) will not be accepted. Please let us know if there is need for
other DSL attributes or any other kind of support.

Currently the following specifications fail to load as they depended on the
CocoaPods internals and need to be updated:

- LibComponentLogging-pods/0.0.1/LibComponentLogging-pods.podspec
- RestKit/0.9.3/RestKit.podspec
- Three20/1.0.11/Three20.podspec
- ARAnalytics/1.1/ARAnalytics.podspec

Other specifications, might present compatibility issues for the reasons
presented below.

###### __Breaking__

- Subspecs do **not** inherit the files patterns from the parent spec anymore.
  This feature made the implementation more complicated and was not easy to
  explain to podspecs maintainers. Compatibility can be easily fixed by adding
  a 'Core' subspec.
- Support for inline podspecs has been removed.
- The support for Rake::FileList is being deprecated, in favor of a more
  consistent DSL. Rake::FileList also presented issues because it would access
  the file system as soon as it was converted to an array.
- The hooks architecture has been re-factored and might present
  incompatibilities (please open an issue if appropriate).
- The `requires_arc` attribute default value is transitioning from `false` to
  `true`. In the meanwhile a value is needed to pass the lint.
- Deprecated `copy_header_mapping` hook.
- Deprecated `exclude_header_search_paths` attribute.
- External sources are not supported in the dependencies of specifications
  anymore. Actually they never have been supported, they just happened to work.

###### DSL

- Podfile:
  - It is not needed to specify the platform anymore (unless not integrating)
    as CocoaPods now can infer the platform from the integrated targets.
- Specification:
  - `preferred_dependency` has been renamed to `default_subspec`.
  - Added `exclude_files` attribute.
  - Added `screenshots` attribute.
  - Added default values for attributes like `source_files`.

###### Enhancements

- Released preview [documentation](http://docs.cocoapods.org).
- CocoaPods now has support for working in teams and not committing the Pods
  folder, as it will keep track of the status of the Pods folder.
  [#552](https://github.com/CocoaPods/CocoaPods/issues/552)
- Simplified installation: no specific version of ruby gems is required anymore.
- The workspace is written only if needed greatly reducing the occasions in
  which Xcode asks to revert.
- The Lockfile is sorted reducing the SCM noise.
  [#591](https://github.com/CocoaPods/CocoaPods/issues/591)
- Added Podfile, Frameworks, and Resources to the Pods project.
  [#647](https://github.com/CocoaPods/CocoaPods/issues/647)
  [#588](https://github.com/CocoaPods/CocoaPods/issues/588)
- Adds new subcommand `pod spec cat NAME` to print a spec file to standard output.
- Specification hooks are only called when the specification is installed.
- The `--no-clean` option of the `pod spec lint` command now displays the Pods
  project for inspection.
- It is now possible to specify default values for the configuration in
  `~/.cocoapods/config.yaml` ([default values](https://github.com/CocoaPods/CocoaPods/blob/master/lib/cocoapods/config.rb#L17)).
- CocoaPods now checks the checksums of the installed specifications and
  reinstalls them if needed.
- Support for YAML formats of the Podfile and the Specification.
- Added new command `pod ipc` to provide support for inter process
  communication through YAML formats.
- CocoaPods now detects if the folder of a Pod is empty and reinstalls it.
  [#534](https://github.com/CocoaPods/CocoaPods/issues/534)
- Install hooks and the `prefix_header_contents` attribute are supported in subspecs.
  [#617](https://github.com/CocoaPods/CocoaPods/issues/617)
- Dashes are now supported in the versions of the Pods.
  [#293](https://github.com/CocoaPods/CocoaPods/issues/293)

###### Bug fixes

- CocoaPods is not confused anymore by target definitions with different activated subspec.
  [#535](https://github.com/CocoaPods/CocoaPods/issues/535)
- CocoaPods is not confused anymore by to dependencies from external sources.
  [#548](https://github.com/CocoaPods/CocoaPods/issues/548)
- The git cache will always update against the remote if a tag is requested,
  resolving issues where library maintainers where updating the tag after a
  lint and would be confused by CocoaPods using the cached commit for the tag.
  [#407](https://github.com/CocoaPods/CocoaPods/issues/407)
  [#596](https://github.com/CocoaPods/CocoaPods/issues/596)

###### Codebase

- Major clean up and refactor of the whole code base.
- Extracted the core classes into
  [cocoapods-core](https://github.com/CocoaPods/Core) gem.
- Extracted downloader into
  [cocoapods-downloader](https://github.com/CocoaPods/cocoapods-downloader).
- Extracted command-line command & option handling into
  [CLAide](https://github.com/CocoaPods/CLAide).

## 0.16.4 (2013-02-25)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.16.3...0.16.4)

###### Enhancements

- Add explicit flattening option to `Downloader:Http`: `:flatten => true`.
  [#814](https://github.com/CocoaPods/CocoaPods/pull/814)
  [#812](https://github.com/CocoaPods/CocoaPods/issues/812)
  [#1314](https://github.com/CocoaPods/Specs/pull/1314)

###### Bug fixes

- Explicitely require `date` in the gemspec for Ruby 2.0.0.
  [34da3f7](https://github.com/CocoaPods/CocoaPods/commit/34da3f792b2a36fafacd4122e29025c9cf2ff38d)

## 0.16.3 (2013-02-20)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.16.2...0.16.3) • [Xcodeproj](https://github.com/CocoaPods/Xcodeproj/compare/0.4.3...0.5.0)

###### Bug fixes

- Only flatten tarballs, **not** zipballs, from HTTP sources. A zipball can
  contain single directories in the root that should be preserved, for instance
  a framework bundle. This reverts part of the change in 0.16.1.
  **NOTE** This will break some podspecs that were changed after 0.16.1.
  [#783](https://github.com/CocoaPods/CocoaPods/pull/783)
  [#727](https://github.com/CocoaPods/CocoaPods/issues/727)
- Never consider aggregate targets in the user’s project for integration.
  [#729](https://github.com/CocoaPods/CocoaPods/issues/729)
  [#784](https://github.com/CocoaPods/CocoaPods/issues/784)
- Support comments on all build phases, groups and targets in Xcode projects.
  [#51](https://github.com/CocoaPods/Xcodeproj/pull/51)
- Ensure default Xcode project values are copied before being used.
  [b43087c](https://github.com/CocoaPods/Xcodeproj/commit/b43087cb342d8d44b491e702faddf54a222b23c3)
- Block assertions in Release builds.
  [#53](https://github.com/CocoaPods/Xcodeproj/pull/53)
  [#803](https://github.com/CocoaPods/CocoaPods/pull/803)
  [#802](https://github.com/CocoaPods/CocoaPods/issues/802)


###### Enhancements

- Compile Core Data model files.
  [#795](https://github.com/CocoaPods/CocoaPods/pull/795)
- Add `Xcodeproj::Differ`, which shows differences between Xcode projects.
  [308941e](https://github.com/CocoaPods/Xcodeproj/commit/308941eeaa3bca817742c774fd584cc5ab1c8f84)


## 0.16.2 (2013-02-02)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.16.1...0.16.2) • [Xcodeproj](https://github.com/CocoaPods/Xcodeproj/compare/0.4.1...0.4.3)

###### Bug fixes

- Quote storyboard and xib paths in ‘copy resource’ script.
  [#740](https://github.com/CocoaPods/CocoaPods/pull/740)
- Fix use of `podspec` directive in Podfile with no options specified.
  [#768](https://github.com/CocoaPods/CocoaPods/pull/768)
- Generate Mac OS X Pods target with the specified deployment target.
  [#757](https://github.com/CocoaPods/CocoaPods/issues/757)
- Disable libSystem objects for ARC libs that target older platforms.
  This applies when the deployment target is set to < iOS 6.0 or OS X 10.8,
  or not specified at all.
  [#352](https://github.com/CocoaPods/Specs/issues/352)
  [#1161](https://github.com/CocoaPods/Specs/pull/1161)
- Mark header source files as ‘Project’ not ‘Public’.
  [#747](https://github.com/CocoaPods/CocoaPods/issues/747)
- Add `PBXGroup` as acceptable `PBXFileReference` value.
  [#49](https://github.com/CocoaPods/Xcodeproj/pull/49)
- Make `xcodeproj show` without further arguments actually work.
  [#45](https://github.com/CocoaPods/Xcodeproj/issues/45)

###### Enhancements

- Added support for pre-download over Mercurial.
  [#750](https://github.com/CocoaPods/CocoaPods/pull/750)

## 0.16.1 (2013-01-13)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.16.0...0.16.1) • [Xcodeproj](https://github.com/CocoaPods/Xcodeproj/compare/0.4.0...0.4.1)

###### Bug fixes

- After unpacking source from a HTTP location, move the source into the parent
  dir if the archive contained only one child. This is done to make it
  consistent with how source from other types of locations are described in a
  podspec.
  **NOTE** This might break some podspecs that assumed the incorrect layout.
  [#727](https://github.com/CocoaPods/CocoaPods/issues/727)
  [#728](https://github.com/CocoaPods/CocoaPods/pull/728)
- Remove duplicate option in `pod update` command.
  [#725](https://github.com/CocoaPods/CocoaPods/issues/725)
- Memory fixes in Xcodeproj.
  [#43](https://github.com/CocoaPods/Xcodeproj/pull/43)

###### Xcodeproj Enhancements

- Sort contents of xcconfig files by setting name.
  [#591](https://github.com/CocoaPods/CocoaPods/issues/591)
- Add helpers to get platform name, deployment target, and frameworks build phases
- Take SDKROOT into account when adding frameworks.

## 0.16.0 (2012-11-22)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.16.0.rc5...master)

###### Enhancements

- Use Rake 0.9.4
  [#657](https://github.com/CocoaPods/CocoaPods/issues/657)

## 0.16.0.rc5 (2012-11-14)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.16.0.rc4...0.16.0.rc5)

###### Deprecated

- The usage of specifications defined in a Podfile is deprecated. Use the
  `:podspec` option with a file path instead. Complete removal will most
  probably happen in 0.17.0.
  [#549](https://github.com/CocoaPods/CocoaPods/issues/549)
  [#616](https://github.com/CocoaPods/CocoaPods/issues/616)
  [#525](https://github.com/CocoaPods/CocoaPods/issues/525)

###### Bug fixes

- Always consider inline podspecs as needing installation.
- Fix detection when the lib has already been integrated with the user’s target.
  [#643](https://github.com/CocoaPods/CocoaPods/issues/643)
  [#614](https://github.com/CocoaPods/CocoaPods/issues/614)
  [#613](https://github.com/CocoaPods/CocoaPods/issues/613)

## 0.16.0.rc4 (2012-11-14)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.16.0.rc3...0.16.0.rc4)

###### Bug fixes

- Fix for Rake 0.9.3
  [#657](https://github.com/CocoaPods/CocoaPods/issues/657)

## 0.16.0.rc3 (2012-11-02)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.16.0.rc2...0.16.0.rc3) • [Xcodeproj](https://github.com/CocoaPods/Xcodeproj/compare/0.4.0.rc1...0.4.0.rc6)

###### Enhancements

- Added support for copying frameworks to the app bundle.
  [#597](https://github.com/CocoaPods/CocoaPods/pull/597)

###### Bug fixes

- Ignore PBXReferenceProxy while integrating into user project.
  [#626](https://github.com/CocoaPods/CocoaPods/issues/626)
- Added support for PBXAggregateTarget and PBXLegacyTarget.
  [#615](https://github.com/CocoaPods/CocoaPods/issues/615)
- Added support for PBXReferenceProxy.
  [#612](https://github.com/CocoaPods/CocoaPods/issues/612)

## 0.16.0.rc2 (2012-10-21)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.16.0.rc1...0.16.0.rc2)

###### Bug fixes

- Fix for uninitialized constant Xcodeproj::Constants error.

## 0.16.0.rc1 (2012-10-21)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.15.2...0.16.0.rc1) • [Xcodeproj](https://github.com/CocoaPods/Xcodeproj/compare/0.3.5...0.4.0.rc1)

###### Enhancements

- Xcodeproj partial rewrite.
  [#565](https://github.com/CocoaPods/CocoaPods/issues/565)
  [#561](https://github.com/CocoaPods/CocoaPods/pull/561)
  - Performance improvements in the `Generating support files` phase.
  - Better support for editing existing projects and sorting groups.

## 0.15.2 (2012-10-19)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.15.1...0.15.2)

###### Enhancements

- Added support for `.hh` headers.
  [#576](https://github.com/CocoaPods/CocoaPods/pull/576)

###### Bug fixes

- Restored support for running CocoaPods without a terminal.
  [#575](https://github.com/CocoaPods/CocoaPods/issues/575)
  [#577](https://github.com/CocoaPods/CocoaPods/issues/577)
- The git cache now always uses a barebones repo preventing a number of related issues.
  [#581](https://github.com/CocoaPods/CocoaPods/issues/581)
  [#569](https://github.com/CocoaPods/CocoaPods/issues/569)
- Improved fix for the issue that lead to empty directories for Pods.
  [#572](https://github.com/CocoaPods/CocoaPods/issues/572)
  [#602](https://github.com/CocoaPods/CocoaPods/issues/602)
- Xcodeproj robustness against invalid values, such as malformed UTF8.
  [#592](https://github.com/CocoaPods/CocoaPods/issues/592)

## 0.15.1 (2012-10-04)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.15.0...0.15.1)

###### Enhancements

- Show error if syntax error in Podfile or Podfile.lock.

###### Bug fixes

- Fixed an issue that lead to empty directories for Pods.
  [#519](https://github.com/CocoaPods/CocoaPods/issues/519)
  [#568](https://github.com/CocoaPods/CocoaPods/issues/568)
- Fixed a crash related to the RubyGems version informative.
  [#570](https://github.com/CocoaPods/CocoaPods/issues/570)
- Fixed a crash for `pod outdated`.
  [#567](https://github.com/CocoaPods/CocoaPods/issues/567)
- Fixed an issue that lead to excessively slow sets computation.

## 0.15.0 (2012-10-02)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.14.0...0.15.0) • [Xcodeproj](https://github.com/CocoaPods/Xcodeproj/compare/0.3.3...0.3.4)

###### Enhancements

- Pod `install` will update the specs repo only if needed.
  [#533](https://github.com/CocoaPods/CocoaPods/issues/533)
- CocoaPods now searches for the highest version of a Pod on all the repos.
  [#85](https://github.com/CocoaPods/CocoaPods/issues/85)
- Added a pre install hook to the Podfile and to root specifications.
  [#486](https://github.com/CocoaPods/CocoaPods/issues/486)
- Support for `header_mappings_dir` attribute in subspecs.
- Added support for linting a Podspec using the files from its folder `pod spec
  lint --local`
- Refactored UI.
- Added support for Podfiles named `CocoaPods.podfile` which allows to
  associate an editor application in Mac OS X.
  [#528](https://github.com/CocoaPods/CocoaPods/issues/528)
- Added config option to disable the new version available message.
  [#448](https://github.com/CocoaPods/CocoaPods/issues/448)
- Added support for extracting `.tar.bz2` files
  [#522](https://github.com/CocoaPods/CocoaPods/issues/522)
- Improved feedback for errors of repo subcommands.
  [#505](https://github.com/CocoaPods/CocoaPods/issues/505)


###### Bug fixes

- Subspecs namespacing has been restored.
  [#541](https://github.com/CocoaPods/CocoaPods/issues/541)
- Improvements to the git cache that should be more robust.
  [#517](https://github.com/CocoaPods/CocoaPods/issues/517)
  - In certain conditions pod setup would execute twice.
- The git cache now is updated if a branch is not found
  [#514](https://github.com/CocoaPods/CocoaPods/issues/514)
- Forcing UTF-8 encoding on licenses generation in Ruby 1.9.
  [#530](https://github.com/CocoaPods/CocoaPods/issues/530)
- Added support for `.hpp` headers.
  [#244](https://github.com/CocoaPods/CocoaPods/issues/244)

## 0.14.0 (2012-09-10)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.14.0.rc2...0.14.0) • [Xcodeproj](https://github.com/CocoaPods/Xcodeproj/compare/0.3.2...0.3.3)

###### Bug fixes

- In certain conditions the spec of an external would have been overridden
  by the spec in the root of a Pod.
  [#489](https://github.com/CocoaPods/CocoaPods/issues/489)
- CocoaPods now uses a recent version of Octokit.
  [#490](https://github.com/CocoaPods/CocoaPods/issues/490)
- Fixed a bug that caused Pods with preferred dependencies to be always
  installed.
  [Specs#464](https://github.com/CocoaPods/CocoaPods/issues/464)
- Fixed Xcode 4.4+ artwork warning.
  [Specs#508](https://github.com/CocoaPods/CocoaPods/issues/508)

## 0.14.0.rc2 (2012-08-30)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.14.0.rc1...0.14.0.rc2)

###### Bug fixes

- Fix incorrect name for Pods from external sources with preferred subspecs.
  [#485](https://github.com/CocoaPods/CocoaPods/issues/485)
- Prevent duplication of Pod with a local source and mutliple activated specs.
  [#485](https://github.com/CocoaPods/CocoaPods/issues/485)
- Fixed the `uninitialized constant Pod::Lockfile::Digest` error.
  [#484](https://github.com/CocoaPods/CocoaPods/issues/484)

## 0.14.0.rc1 (2012-08-28)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.13.0...0.14.0.rc1) • [Xcodeproj](https://github.com/CocoaPods/Xcodeproj/compare/0.3.1...0.3.2)

###### Enhancements

- Improve installation process by preserving the installed versions of Pods
  across installations and machines. A Pod is reinstalled if:
  - the version required in the Podfile changes and becomes incompatible with
    the installed one.
    [#191](https://github.com/CocoaPods/CocoaPods/issues/191)
  - the external source changes.
  - the head status changes (from disabled to enabled or vice-versa).
- Introduce `pod update` command that installs the dependencies of the Podfile
  **ignoring** the lockfile `Podfile.lock`.
  [#131](https://github.com/CocoaPods/CocoaPods/issues/131)
- Introduce `pod outdated` command that shows the pods with known updates.
- Add `:local` option for dependencies which will use the source files directly
  from a local directory. This is usually used for libraries that are being
  developed in parallel to the end product (application/library).
  [#458](https://github.com/CocoaPods/CocoaPods/issues/458),
  [#415](https://github.com/CocoaPods/CocoaPods/issues/415),
  [#156](https://github.com/CocoaPods/CocoaPods/issues/156).
- Folders of Pods which are no longer required are removed during installation.
  [#298](https://github.com/CocoaPods/CocoaPods/issues/298)
- Add meaningful error messages
  - ia podspec can’t be found in the root of an external source.
    [#385](https://github.com/CocoaPods/CocoaPods/issues/385),
    [#338](https://github.com/CocoaPods/CocoaPods/issues/338),
    [#337](https://github.com/CocoaPods/CocoaPods/issues/337).
  - a subspec name is misspelled.
    [#327](https://github.com/CocoaPods/CocoaPods/issues/327)
  - an unrecognized command and/or argument is provided.
- The subversion downloader now does an export instead of a checkout, which
  makes it play nicer with SCMs that store metadata in each directory.
  [#245](https://github.com/CocoaPods/CocoaPods/issues/245)
- Now the Podfile is added to the Pods project for convenient editing.

###### Bug fixes

- The git cache now fetches the tags from the remote if it can’t find the
  reference.
- Xcodeproj now builds on 10.6.8 and Travis CI without symlinking headers.
- Only try to install, add source files to the project, and clean a Pod once.
  [#376](https://github.com/CocoaPods/CocoaPods/issues/376)

###### Notes

- External Pods might be reinstalled due to the migration to the new
  `Podfile.lock`.
- The SCM reference of head Pods is not preserved across machines.
- Pods whose inline specification changed are not detected as modified. As a
  workaround, remove their folder stored in `Pods`.
- Pods whose specification changed are not detected as modified. As a
  workaround, remove their folder stored in `Pods`.


## 0.13.0 (2012-08-22)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.12.0...0.13.0)

###### Enhancements

- Add Podfile `podspec` which allows to use the dependencies of a podspec file.
  [#162](https://github.com/CocoaPods/CocoaPods/issues/162)
- Check if any of the build settings defined in the xcconfig files is
  overridden. [#92](https://github.com/CocoaPods/CocoaPods/issues/92)
- The Linter now checks that there are no compiler flags that disable warnings.

###### Bug fixes

- The final project isn’t affected anymore by the `inhibit_all_warnings!`
  option.
- Support for redirects while using podspec from an url.
  [#462](https://github.com/CocoaPods/CocoaPods/issues/462)


## 0.12.0 (2012-08-21)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.11.1...0.12.0)

###### Enhancements

- The documentation is generated using the public headers if they are
  specified.
- In case of a download failure the installation is aborted and the error
  message is shown.
- Git submodules are initialized only if requested.
- Don’t impose a certain structure of the user’s project by raising if no
  ‘Frameworks’ group exists.
  [#431](https://github.com/CocoaPods/CocoaPods/pull/431)
- Support for GitHub Gists in the linter.
- Allow specifying ARC settings in subspecs.
- Add Podfile `inhibit_all_warnings!` which will inhibit all warnings from the
  Pods library. [#209](https://github.com/CocoaPods/CocoaPods/issues/209)
- Make the Pods Xcode project prettier by namespacing subspecs in nested
  groups. [#466](https://github.com/CocoaPods/CocoaPods/pull/466)


## 0.11.1 (2012-08-09)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.11.0...0.11.1)

###### Bug fixes

- Fixed a crash related to subspecs without header files. [#449]
- Git submodules are loaded after the appropriate referenced is checked out and
  will be not loaded anymore in the cache. [#451]
- Fixed SVN support for the head version. [#432]


## 0.11.0 (2012-08-08)

[CocoaPods](https://github.com/CocoaPods/CocoaPods/compare/0.10.0...0.11.0)

###### Enhancements

- Added support for public headers. [#440]
- Added `pod repo lint`. [#423]
- Improved support for `:head` option and SVN repositories.
- When integrating Pods with a project without "Frameworks" group in root of
  the project, raise an informative message.
  [#431](https://github.com/CocoaPods/CocoaPods/pull/431)
- Dropped support for legacy `config.ios?` and `config.osx?`

###### Bug fixes

- Version message now correctly terminates with a 0 exit status.
- Resolved an issue that lead to git error messages in the error report.


## 0.10.0 (2012-07-29)

[CocoaPods](http://git.io/4i75YA)

###### Enhancements

- Added a `--local-only` option to `pod push` so that developers can push
  locally and test before pushing to a remote. [#405](http://git.io/0ILJEw)
- Added line number information for errors generated in the Podfile.
  [#408](http://git.io/fWQvMg)
- Pods stored in git repositories now initialize submodules.
  [#406](http://git.io/L9ssSw)

###### Bug fixes

- Removed note about the post install hook form the linter.
- Improved xcodebuild error detection in the linter.
- Ensure the git cache exists, before updating it, when trying to install the
  ‘bleeding edge’ of a pod. [#426](http://git.io/d4eqRA)
- Clean downloaded external pods **after** resolving and activating (sub)specs.
  [#414](http://git.io/i77q_w)
- Support `tar.gz` as filename in a HTTP source. [#428](http://git.io/qhwKkA)


## 0.9.2 (2012-07-16)

[CocoaPods](http://git.io/AVlRKg) • [Xcodeproj](http://git.io/xHbc0w)

###### Bug fixes

- When generating the PodsDummy class, make that class unique to each target. [#402](http://git.io/NntYiQ)
- Raise an informative error message when the platform in the `Podfile` is omitted or incorrect. [#403](http://git.io/k5EcUQ)


## 0.9.1 (2012-07-14)

[CocoaPods](http://git.io/_kqAbw)

###### Bug fixes

- CocoaPods 0.9.x needs Xcodeproj 0.3.0.


## 0.9.0 (2012-07-14)

[CocoaPods](http://git.io/kucJQw) • [Xcodeproj](http://git.io/5eLL8g)

###### Enhancements

- Force downloading the ‘bleeding edge’ version of a pod with the `:head` flag. [#392](http://git.io/t_NVRQ)
- Support for weak frameworks. [#263](http://git.io/XZDuog)
- Use double quotes when shelling out. This makes a url like `$HOME/local/lib` work. [#396](http://git.io/DnBzhA)

###### Bug fixes

- Relaxed linter to accepts pod that only specify paths to preserve (like TuneupJS).
- Gender neutralization of podfile documentation. [#384](http://git.io/MAsHXg)
- Exit early when using an old RubyGems version (< 1.4.0). These versions contain subtle bugs
  related to prerelease version comparisons. Unfortunately, OS X >= 10.7 ships with 1.3.6. [#398](http://git.io/Lr7DoA)


## 0.8.0 (2012-07-09)

[CocoaPods](http://git.io/RgMF3w) • [Xcodeproj](http://git.io/KBKE_Q)

###### Breaking change

Syntax change in Podfile: `dependency` has been replaced by `pod`.

``ruby
platform :ios
pod 'JSONKit',      '~> 1.4'
pod 'Reachability', '~> 2.0.4'
``

###### Bug fixes

- Properly quote all paths given to Git.


## 0.7.0 (2012-07-06)

[CocoaPods](http://git.io/Agia6A) • [Xcodeproj](http://git.io/mlqquw)

###### Features

- Added support for branches in git repos.
- Added support for linting remote files, i.e. `pod spec lint http://raw/file.podspec`.
- Improved `Spec create template`.
- The indentation is automatically stripped for podspecs strings.

###### Bug fixes

- The default warnings of Xcode are not overriden anymore.
- Improvements to the detection of the license files.
- Improvements to `pod spec lint`.
- CocoaPods is now case insensitive.


## 0.6.1 (2012-07-01)

[CocoaPods](http://git.io/45wFjw) • [Xcodeproj](http://git.io/rRA4XQ)

###### Bug fixes

- Switched to master branch for specs repo.
- Fixed a crash with `pod spec lint` related to `preserve_paths`.
- Fixed a bug that caused subspecs to not inherit the compiler flags of the top level specification.
- Fixed a bug that caused duplication of system framworks.


## 0.6.0 (2012-07-01)

A full list of all the changes since 0.5.1 can be found [here][6].


### Link with specific targets

CocoaPods can now integrate all the targets specified in your `Podfile`.

To specify which target, in your Xcode project, a Pods target should be linked
with, use the `link_with` method like so:

```ruby
platform :ios

workspace 'MyWorkspace'

link_with ['MyAppTarget', 'MyOtherAppTarget']
dependency 'JSONKit'

target :test, :exclusive => true do
  xcodeproj 'TestProject', 'Test' => :debug
  link_with 'TestRunnerTarget'
  dependency 'Kiwi'
end
```

_NOTE: As you can see it can take either one target name, or an array of names._

* If no explicit Xcode workspace is specified and only **one** project exists in
the same directory as the Podfile, then the name of that project is used as the
workspace’s name.

* If no explicit Xcode project is specified for a target, it will use the Xcode
project of the parent target. If no target specifies an expicit Xcode project
and there is only **one** project in the same directory as the Podfile then that
project will be used.

* If no explicit target is specified, then the Pods target will be linked with
the first target in your project. So if you only have one target you do not
need to specify the target to link with.

See [#76](https://github.com/CocoaPods/CocoaPods/issues/76) for more info.

Finally, CocoaPods will add build configurations to the Pods project for all
configurations in the other projects in the workspace. By default the
configurations are based on the `Release` configuration, to base them on the
`Debug` configuration you will have to explicitely specify them as can be seen
above in the following line:

```ruby
xcodeproj 'TestProject', 'Test' => :debug
```


### Documentation

CocoaPods will now generate documentation for every library with the
[`appledoc`][5] tool and install it into Xcode’s documentation viewer.

You can customize the settings used like so:

```ruby
s.documentation = { :appledoc => ['--product-name', 'My awesome project!'] }
```

Alternatively, you can specify a URL where an HTML version of the documentation
can be found:

```ruby
s.documentation = { :html => 'http://example.com/docs/index.html' }
```

See [#149](https://github.com/CocoaPods/CocoaPods/issues/149) and
[#151](https://github.com/CocoaPods/CocoaPods/issues/151) for more info.


### Licenses & Documentation

CocoaPods will now generate two 'Acknowledgements' files for each target specified
in your Podfile which contain the License details for each Pod used in that target
(assuming details have been specified in the Pod spec).

There is a markdown file, for general consumption, as well as a property list file
that can be added to a settings bundle for an iOS application.

You don't need to do anything for this to happen, it should just work.

If you're not happy with the default boilerplate text generated for the title, header
and footnotes in the files, it's possible to customize these by overriding the methods
that generate the text in your `Podfile` like this:

```ruby
class ::Pod::Generator::Acknowledgements
  def header_text
    "My custom header text"
  end
end
```

You can even go one step further and customize the text on a per target basis by
checking against the target name, like this:

```ruby
class ::Pod::Generator::Acknowledgements
  def header_text
    if @target_definition.label.end_with?("MyTargetName")
      "Custom header text for MyTargetName"
    else
      "Custom header text for other targets"
    end
  end
end
```

Finally, here's a list of the methods that are available to override:

```ruby
header_title
header_text
footnote_title
footnote_text
```


### Introduced two new classes: LocalPod and Sandbox.

The Sandbox represents the entire contents of the `POD_ROOT` (normally
`SOURCE_ROOT/Pods`). A LocalPod represents a pod that has been installed within
the Sandbox.

These two classes can be used as better homes for various pieces of logic
currently spread throughout the installation process and provide a better API
for working with the contents of this directory.


### Xcodeproj API

All Xcodeproj APIs are now in `snake_case`, instead of `camelCase`. If you are
manipulating the project from your Podfile's `post_install` hook, or from a
podspec, then update these method calls.


### Enhancements

* [#188](https://github.com/CocoaPods/CocoaPods/pull/188): `list` command now
  displays the specifications introduced in the master repo if it is given as an
  option the number of days to take into account.

* [#188](https://github.com/CocoaPods/CocoaPods/pull/188): Transferred search
  layout improvements and options to `list` command.

* [#166](https://github.com/CocoaPods/CocoaPods/issues/166): Added printing
  of homepage and source to search results.

* [#177](https://github.com/CocoaPods/CocoaPods/issues/177): Added `--stat`
  option to display watchers and forks for pods hosted on GitHub.

* [#177](https://github.com/CocoaPods/CocoaPods/issues/177): Introduced colors
  and tuned layout of search.

* [#112](https://github.com/CocoaPods/CocoaPods/issues/112): Introduced `--push`
  option to `$ pod setup`. It configures the master spec repository to use the private
  push URL. The change is preserved in future calls to `$ pod setup`.

* [#153](https://github.com/CocoaPods/CocoaPods/issues/153): It is no longer
  required to call `$ pod setup`.

* [#163](https://github.com/CocoaPods/CocoaPods/issues/163): Print a template
  for a new ticket when an error occurs.

* Added a new Github-specific downloader that can download repositories as a
  gzipped tarball.

* No more global state is kept during resolving of dependencies.

* Updated Xcodeproj to have a friendlier API.


### Fixes

* [#142](https://github.com/CocoaPods/CocoaPods/issues/142): Xcode 4.3.2 no longer
  supports passing the -fobj-arc flag to the linker and will fail to build. The
  addition of this flag was a workaround for a compiler bug in previous versions.
  This flag is no longer included by default - to keep using this flag, you need to
  add `set_arc_compatibility_flag!` to your Podfile.

* [#183](https://github.com/CocoaPods/CocoaPods/issues/183): Fix for
  `.DS_Store` file in `~/.cocoapods` prevents `$ pod install` from running.

* [#134](https://github.com/CocoaPods/CocoaPods/issues/134): Match
  `IPHONEOS_DEPLOYMENT_TARGET` build setting with `deployment_target` option in
  generated Pods project file.

* [#142](https://github.com/CocoaPods/CocoaPods/issues/): Add `-fobjc-arc` to
  `OTHER_LDFLAGS` if _any_ pods require ARC.

* [#148](https://github.com/CocoaPods/CocoaPods/issues/148): External encoding
  set to UTF-8 on Ruby 1.9 to fix crash caused by non-ascii characters in pod
  description.

* Ensure all header search paths are quoted in the xcconfig file.

* Added weak quoting to `ibtool` input paths.


## 0.5.0 (2011-11-22)

No longer requires MacRuby. Runs on MRI 1.8.7 (OS X system version) and 1.9.3.

A full list of all the changes since 0.3.0 can be found [here][7].


## 0.4.0

Oops, accidentally skipped this version.


## 0.3.0 (2011-11-12)

### Multiple targets

Add support for multiple static library targets in the Pods Xcode project with
different sets of depedencies. This means that you can create a separate
library which contains all dependencies, including extra ones that you only use
in, for instance, a debug or test build. [[docs][1]]

```ruby
# This Podfile will build three static libraries:
# * libPods.a
# * libPods-debug.a
# * libPods-test.a

# This dependency is included in the `default` target, which generates the
# `libPods.a` library, and all non-exclusive targets.
dependency 'SSCatalog'

target :debug do
  # This dependency is only included in the `debug` target, which generates
  # the `libPods-debug.a` library.
  dependency 'CocoaLumberjack'
end

target :test, :exclusive => true do
  # This dependency is *only* included in the `test` target, which generates
  # the `libPods-test.a` library.
  dependency 'Kiwi'
end
```

### Install libraries from anywhere

A dependency can take a git url if the repo contains a podspec file in its
root, or a podspec can be loaded from a file or HTTP location. If no podspec is
available, a specification can be defined inline in the Podfile. [[docs][2]]

```ruby
# From a spec repo.
dependency 'SSToolkit'

# Directly from the Pod’s repo (if it contains a podspec).
dependency 'SSToolkit', :git => 'https://github.com/samsoffes/sstoolkit.git'

# Directly from the Pod’s repo (if it contains a podspec) with a specific commit (or tag).
dependency 'SSToolkit', :git    => 'https://github.com/samsoffes/sstoolkit.git',
                        :commit => '2adcd0f81740d6b0cd4589af98790eee3bd1ae7b'

# From a podspec that's outside a spec repo _and_ the library’s repo. This can be a file or http url.
dependency 'SSToolkit', :podspec => 'https://raw.github.com/gist/1353347/ef1800da9c5f5d267a642b8d3950b41174f2a6d7/SSToolkit-0.1.1.podspec'

# If no podspec is available anywhere, you can define one right in your Podfile.
dependency do |s|
  s.name         = 'SSToolkit'
  s.version      = '0.1.3'
  s.platform     = :ios
  s.source       = { :git => 'https://github.com/samsoffes/sstoolkit.git', :commit => '2adcd0f81740d6b0cd4589af98790eee3bd1ae7b' }
  s.resources    = 'Resources'
  s.source_files = 'SSToolkit/**/*.{h,m}'
  s.frameworks   = 'QuartzCore', 'CoreGraphics'

  def s.post_install(target)
    prefix_header = config.project_pods_root + target.prefix_header_filename
    prefix_header.open('a') do |file|
      file.puts(%{#ifdef __OBJC__\n#import "SSToolkitDefines.h"\n#endif})
    end
  end
end
```

### Add a `post_install` hook to the Podfile class

This allows the user to customize, for instance, the generated Xcode project
_before_ it’s written to disk. [[docs][3]]

```ruby
# Enable garbage collection support for MacRuby applications.
post_install do |installer|
  installer.project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['GCC_ENABLE_OBJC_GC'] = 'supported'
    end
  end
end
```

### Manifest

Generate a Podfile.lock file next to the Podfile, which contains a manifest of
your application’s dependencies and their dependencies.

```
PODS:
  - JSONKit (1.4)
  - LibComponentLogging-Core (1.1.4)
  - LibComponentLogging-NSLog (1.0.2):
    - LibComponentLogging-Core (>= 1.1.4)
  - RestKit-JSON-JSONKit (0.9.3):
    - JSONKit
    - RestKit (= 0.9.3)
  - RestKit-Network (0.9.3):
    - LibComponentLogging-NSLog
    - RestKit (= 0.9.3)
  - RestKit-ObjectMapping (0.9.3):
    - RestKit (= 0.9.3)
    - RestKit-Network (= 0.9.3)

DOWNLOAD_ONLY:
  - RestKit (0.9.3)

DEPENDENCIES:
  - RestKit-JSON-JSONKit
  - RestKit-ObjectMapping
```

### Generate Xcode projects from scratch

We no longer ship template projects with the gem, but instead generate them
programmatically. This code has moved out into its own [Xcodeproj gem][4],
allowing you to automate Xcode related tasks.




[1]: https://github.com/CocoaPods/CocoaPods/blob/master/lib/cocoapods/podfile.rb#L151
[2]: https://github.com/CocoaPods/CocoaPods/blob/master/lib/cocoapods/podfile.rb#L82
[3]: https://github.com/CocoaPods/CocoaPods/blob/master/lib/cocoapods/podfile.rb#L185
[4]: https://github.com/CocoaPods/Xcodeproj
[5]: https://github.com/tomaz/appledoc
[6]: https://github.com/CocoaPods/CocoaPods/compare/0.5.1...0.6.0
[7]: https://github.com/CocoaPods/CocoaPods/compare/0.3.10...0.5.0
