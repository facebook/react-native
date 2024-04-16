module Pod
  class Podfile
    # The methods defined in this file and the order of the methods is
    # relevant for the documentation generated on
    # https://github.com/CocoaPods/guides.cocoapods.org.

    # The Podfile is a specification that describes the dependencies of the
    # targets of one or more Xcode projects.
    #
    # A Podfile can be very simple:
    #
    #     target 'MyApp'
    #     pod 'AFNetworking', '~> 1.0'
    #
    # An example of a more complex Podfile can be:
    #
    #     platform :ios, '9.0'
    #     inhibit_all_warnings!
    #
    #     target 'MyApp' do
    #       pod 'ObjectiveSugar', '~> 0.5'
    #
    #       target 'MyAppTests' do
    #         inherit! :search_paths
    #         pod 'OCMock', '~> 2.0.1'
    #       end
    #     end
    #
    #     post_install do |installer|
    #       installer.pods_project.targets.each do |target|
    #         puts "#{target.name}"
    #       end
    #     end
    #
    module DSL
      # @!group Root Options
      #   Configuration that applies to the Podfile as a whole.
      #
      #   * `install!` declares the installation method and options to be used
      #     during installation.

      # Specifies the installation method and options to be used when
      # CocoaPods installs this Podfile.
      #
      # The first parameter indicates the installation method to use;
      # next parameters indicate installation options.
      #
      # For now the only accepted installation method is `'cocoapods'`, so
      # you'll always use this value for the first parameter; but more
      # installation methods might be available in future versions.
      #
      # @param   [String] installation_method
      #          the name of the installation strategy.
      #
      # @param   [Hash] options
      #          the installation options.
      #
      # @example Specifying custom CocoaPods installation options
      #
      #          install! 'cocoapods',
      #                   :deterministic_uuids => false,
      #                   :integrate_targets => false
      #
      # @return  [void]
      #
      def install!(installation_method, options = {})
        unless current_target_definition.root?
          raise Informative, 'The installation method can only be set at the root level of the Podfile.'
        end

        set_hash_value('installation_method', 'name' => installation_method, 'options' => options)
      end

      # Raises a warning when CocoaPods is run using the Global Gemset.
      # A Semantic version can be supplied to warn if the bundler version
      # does not match the required version.
      #
      # @param   [String] version
      #          The required bundler version, in semantic version format.
      #
      # @example
      #
      #   ensure_bundler!
      #
      # @example
      #
      #   ensure_bundler! '~> 2.0.0'
      #
      # @return  [void]
      #
      def ensure_bundler!(version = nil)
        unless current_target_definition.root?
          raise Informative, 'The Ensure Bundler check can only be set at the root level of the Podfile.'
        end
        unless %w(BUNDLE_BIN_PATH BUNDLE_GEMFILE).all? { |key| ENV.key?(key) }
          raise Informative, "CocoaPods was invoked from Global Gemset.\nPlease re-run using: `bundle exec pod #{ARGV.join(' ')}`"
        end
        unless ENV['BUNDLER_VERSION'].nil? || Requirement.create(version).satisfied_by?(Version.new(ENV['BUNDLER_VERSION']))
          raise Informative, "The installed Bundler version: #{ENV['BUNDLER_VERSION']} does not match the required version: #{version}"
        end
      end

      #-----------------------------------------------------------------------#

      # @!group Dependencies
      #   The Podfile specifies the dependencies of each user target.
      #
      #   * `pod` is the way to declare a specific dependency.
      #   * `podspec` provides an easy API for the creation of podspecs.
      #   * `target` is how you scope your dependencies to specific
      #   targets in your Xcode projects.

      #-----------------------------------------------------------------------#

      # Specifies a dependency of the project.
      #
      # A dependency requirement is defined by the name of the Pod and
      # optionally a list of version requirements.
      #
      # When starting out with a project it is likely that you will want to use
      # the latest version of a Pod. If this is the case, simply omit the
      # version requirements.
      #
      #     pod 'SSZipArchive'
      #
      # Later on in the project you may want to freeze to a specific version of
      # a Pod, in which case you can specify that version number.
      #
      #     pod 'Objection', '0.9'
      #
      # Besides no version, or a specific one, it is also possible to use
      # operators:
      #
      # * `= 0.1`    Version 0.1.
      # * `> 0.1`    Any version higher than 0.1.
      # * `>= 0.1`   Version 0.1 and any higher version.
      # * `< 0.1`    Any version lower than 0.1.
      # * `<= 0.1`   Version 0.1 and any lower version.
      # * `~> 0.1.2` Version 0.1.2 and the versions up to 0.2, not including 0.2.
      #              This operator works based on _the last component_ that you
      #              specify in your version requirement. The example is equal to
      #              `>= 0.1.2` combined with `< 0.2.0` and will always match the
      #              latest known version matching your requirements.
      # * `~> 0`     Version 0 and the versions up to 1, not including 1.
      # * `~> 0.1.3-beta.0` Beta and release versions for 0.1.3, release versions
      #              up to 0.2 excluding 0.2. Components separated by a dash (-)
      #              will not be considered for the version requirement.
      #
      # A list of version requirements can be specified for even more fine
      # grained control.
      #
      # For more information, regarding versioning policy, see:
      #
      # * [Semantic Versioning](http://semver.org)
      # * [RubyGems Versioning Policies](http://guides.rubygems.org/patterns/#semantic-versioning)
      #
      # ------
      #
      # ### Build configurations
      #
      # By default dependencies are installed in all the build configurations
      # of the target. For debug purposes or for other reasons, they can be
      # only enabled on a list of build configurations.
      #
      #     pod 'PonyDebugger', :configurations => ['Debug', 'Beta']
      #
      # Alternatively, you can specify to have it included on a single build
      # configuration.
      #
      #     pod 'PonyDebugger', :configuration => 'Debug'
      #
      # Note that transitive dependencies are included in all configurations
      # and you have to manually specify build configurations for them as well in
      # case this is not desired.
      #
      # ------
      #
      # ### Modular Headers
      #
      # If you would like to use modular headers per Pod you can use the
      # following syntax:
      #
      #     pod 'SSZipArchive', :modular_headers => true
      #
      # Additionally, when you use the `use_modular_headers!` attribute,
      # you can exclude a particular Pod from modular headers using the following:
      #
      #     pod 'SSZipArchive', :modular_headers => false
      #
      # ------
      #
      # ### Source
      #
      # By default the sources specified at the global level are searched in the order
      # they are specified for a dependency match. This behaviour can be altered
      # for a specific dependency by specifying the source with the dependency:
      #
      #     pod 'PonyDebugger', :source => 'https://cdn.cocoapods.org/'
      #
      # In this case only the specified source will be searched for the dependency
      # and any global sources ignored.
      #
      # ------
      #
      # ### Subspecs
      #
      # When installing a Pod via its name, it will install all of the
      # default subspecs defined in the podspec.
      #
      # You may install a specific subspec using the following:
      #
      #     pod 'QueryKit/Attribute'
      #
      # You may specify a collection of subspecs to be installed as follows:
      #
      #     pod 'QueryKit', :subspecs => ['Attribute', 'QuerySet']
      #
      # ### Test Specs
      #
      # Test specs can be optionally included via the `:testspecs` option. By default,
      # none of a Pod's test specs are included.
      #
      # You may specify a list of test spec names to install using the following:
      #
      #     pod 'AFNetworking', :testspecs => ['UnitTests', 'SomeOtherTests']
      #
      # The values provided to `:testspecs` correspond to the name provided to the
      # `test_spec` DSL attribute in a Podspec.
      #
      # ------
      #
      # Dependencies can be obtained also from external sources.
      #
      #
      # ### Using the files from a local path.
      #
      #  If you would like to use develop a Pod in tandem with its client
      #  project you can use the `path` option.
      #
      #     pod 'AFNetworking', :path => '~/Documents/AFNetworking'
      #
      #  Using this option CocoaPods will assume the given folder to be the
      #  root of the Pod and will link the files directly from there in the
      #  Pods project. This means that your edits will persist to CocoaPods
      #  installations.
      #
      #  The referenced folder can be a checkout of your your favourite SCM or
      #  even a git submodule of the current repository.
      #
      #  Note that the `podspec` of the Pod file is expected to be in the
      #  folder.
      #
      #
      # ### From a podspec in the root of a library repository.
      #
      # Sometimes you may want to use the bleeding edge version of a Pod. Or a
      # specific revision. If this is the case, you can specify that with your
      # pod declaration.
      #
      # To use the `master` branch of the repository:
      #
      #     pod 'AFNetworking', :git => 'https://github.com/gowalla/AFNetworking.git'
      #
      #
      # To use a different branch of the repository:
      #
      #     pod 'AFNetworking', :git => 'https://github.com/gowalla/AFNetworking.git', :branch => 'dev'
      #
      #
      # To use a tag of the repository:
      #
      #     pod 'AFNetworking', :git => 'https://github.com/gowalla/AFNetworking.git', :tag => '0.7.0'
      #
      #
      # Or specify a commit:
      #
      #     pod 'AFNetworking', :git => 'https://github.com/gowalla/AFNetworking.git', :commit => '082f8319af'
      #
      # It is important to note, though, that this means that the version will
      # have to satisfy any other dependencies on the Pod by other Pods.
      #
      # The `podspec` file is expected to be in the root of the repository,
      # if this library does not have a `podspec` file in its repository
      # yet, you will have to use one of the approaches outlined in the
      # sections below.
      #
      #
      # ### From a podspec outside a spec repository, for a library without podspec.
      #
      # If a podspec is available from another source outside of the library’s
      # repository. Consider, for instance, a podspec available via HTTP:
      #
      #     pod 'JSONKit', :podspec => 'https://example.com/JSONKit.podspec'
      #
      #
      # @note       This method allow a nil name and the raises to be more
      #             informative.
      #
      # @return     [void]
      #
      def pod(name = nil, *requirements)
        unless name
          raise StandardError, 'A dependency requires a name.'
        end

        current_target_definition.store_pod(name, *requirements)
      end

      # Use just the dependencies of a Pod defined in the given podspec file.
      # If no arguments are passed the first podspec in the root of the Podfile
      # is used. It is intended to be used by the project of a library. Note:
      # this does not include the sources derived from the podspec just the
      # CocoaPods infrastructure.
      #
      # @example
      #   podspec
      #
      # @example
      #   podspec :name => 'QuickDialog'
      #
      # @example
      #   podspec :path => '/Documents/PrettyKit/PrettyKit.podspec'
      #
      # @param    [Hash {Symbol=>String}] options
      #           the path where to load the {Specification}. If not provided
      #           the first podspec in the directory of the Podfile is used.
      #
      # @option   options [String] :path
      #           the path of the podspec file
      #
      # @option   options [String] :name
      #           the name of the podspec
      #
      # @note     This method uses the dependencies declared for the
      #           platform of the target definition.
      #
      #
      # @note     This method requires that the Podfile has a non nil value for
      #           {#defined_in_file} unless the path option is used.
      #
      # @return   [void]
      #
      def podspec(options = nil)
        current_target_definition.store_podspec(options)
      end

      # Defines a CocoaPods target and scopes dependencies defined
      # within the given block. A target should correspond to an Xcode target.
      # By default the target includes the dependencies defined outside of
      # the block, unless instructed not to `inherit!` them.
      #
      # @param    [Symbol, String] name
      #           the name of the target.
      #
      # @example  Defining a target
      #
      #           target 'ZipApp' do
      #             pod 'SSZipArchive'
      #           end
      #
      # @example  Defining a test target accessing SSZipArchive pod from its parent
      #
      #           target 'ZipApp' do
      #             pod 'SSZipArchive'
      #
      #             target 'ZipAppTests' do
      #               inherit! :search_paths
      #               pod 'Nimble'
      #             end
      #           end
      #
      # @example  Defining a target applies Pods to multiple targets via its parent target
      #
      #           target 'ShowsApp' do
      #             pod 'ShowsKit'
      #
      #             # Has its own copy of ShowsKit + ShowTVAuth
      #             target 'ShowsTV' do
      #               pod 'ShowTVAuth'
      #             end
      #
      #             # Has its own copy of Specta + Expecta
      #             # and has access to ShowsKit via the app
      #             # that the test target is bundled into
      #
      #             target 'ShowsTests' do
      #               inherit! :search_paths
      #               pod 'Specta'
      #               pod 'Expecta'
      #             end
      #           end
      #
      # @return   [void]
      #
      def target(name, options = nil)
        if options
          raise Informative, "Unsupported options `#{options}` for " \
            "target `#{name}`."
        end

        parent = current_target_definition
        definition = TargetDefinition.new(name, parent)
        self.current_target_definition = definition
        yield if block_given?
      ensure
        self.current_target_definition = parent
      end

      # Adds a script phase to be integrated with this target. A script phase can be used to execute an arbitrary
      # script that can use all Xcode environment variables during execution. A target may include multiple script
      # phases which they will be added in the order they were declared. Deleting a script phase will effectively remove
      # it from the target if it has been added previously.
      #
      # @example
      #   script_phase :name => 'HelloWorldScript', :script => 'echo "Hello World"'
      #
      # @example
      #   script_phase :name => 'HelloWorldScript', :script => 'puts "Hello World"', :shell_path => '/usr/bin/ruby'
      #
      # @param    [Hash] options
      #           the options for this script phase.
      #
      # @option   options [String] :name
      #           the name of the script phase. This option is required.
      #
      # @option   options [String] :script
      #           the body of the script to execute. This option is required.
      #
      # @option   options [String] :shell_path
      #           the shell path to use for this script phase, for example `/usr/bin/ruby` to use Ruby for this phase.
      #
      # @option   options [Array<String>] :input_files
      #           the input paths to use for this script phase. This is used by Xcode to determine whether to re-execute
      #           this script phase if the input paths have changed or not.
      #
      # @option   options [Array<String>] :output_files
      #           the output paths to use for this script phase. This is used by Xcode to avoid re-executing this script
      #           phase if none of the output paths have changed.
      #
      # @option   options [Array<String>] :input_file_lists
      #           the input file lists to use for this script phase. This is used by Xcode to determine whether to
      #           re-execute this script phase if the input paths have changed or not.
      #
      # @option   options [Array<String>] :output_file_lists
      #           the output file lists to use for this script phase. This is used by Xcode to avoid re-executing this
      #           script phase if none of the output paths have changed.
      #
      # @option   options [Boolean] :show_env_vars_in_log
      #           whether this script phase should output the environment variables during execution.
      #
      # @option   options [Symbol] :execution_position
      #           specifies the position of which this script phase should be executed. The currently supported values are:
      #           `:before_compile`, `:after_compile` and `:any` which is the default.
      #
      # @option   options [String] :dependency_file
      #           specifies the dependency file to use for this script phase.
      #
      # @option   options [String] :always_out_of_date
      #           specifies whether or not this run script will be forced to
      #           run even on incremental builds
      #
      # @return   [void]
      #
      def script_phase(options)
        raise Informative, 'Script phases can only be added within target definitions.' if current_target_definition.root?
        raise Informative, 'Script phases cannot be added to abstract targets.' if current_target_definition.abstract?
        current_target_definition.store_script_phase(options)
      end

      # Defines a new abstract target that can be used for convenient
      # target dependency inheritance.
      #
      # @param    [Symbol, String] name
      #           the name of the target.
      #
      # @example  Defining an abstract target
      #
      #           abstract_target 'Networking' do
      #             pod 'AlamoFire'
      #
      #             target 'Networking App 1'
      #             target 'Networking App 2'
      #           end
      #
      # @example  Defining an abstract_target wrapping Pods to multiple targets
      #
      #           # Note: There are no targets called "Shows" in any of this workspace's Xcode projects
      #           abstract_target 'Shows' do
      #             pod 'ShowsKit'
      #
      #             # The target ShowsiOS has its own copy of ShowsKit (inherited) + ShowWebAuth (added here)
      #             target 'ShowsiOS' do
      #               pod 'ShowWebAuth'
      #             end
      #
      #             # The target ShowsTV has its own copy of ShowsKit (inherited) + ShowTVAuth (added here)
      #             target 'ShowsTV' do
      #               pod 'ShowTVAuth'
      #             end
      #
      #             # Our tests target has its own copy of
      #             # our testing frameworks, and has access
      #             # to ShowsKit as well because it is
      #             # a child of the abstract target 'Shows'
      #
      #             target 'ShowsTests' do
      #               inherit! :search_paths
      #               pod 'Specta'
      #               pod 'Expecta'
      #             end
      #           end
      #
      # @return   [void]
      #
      def abstract_target(name)
        target(name) do
          abstract!
          yield if block_given?
        end
      end

      # Denotes that the current target is abstract, and thus will not directly
      # link against an Xcode target.
      #
      # @return [void]
      #
      def abstract!(abstract = true)
        current_target_definition.abstract = abstract
      end

      # Sets the inheritance mode for the current target.
      #
      # @param   [Symbol] inheritance
      #          the inheritance mode to set.
      #
      #          **Available Modes:**
      #          + `:complete` The target inherits all
      #          behaviour from the parent.
      #          + `:none` The target inherits none of
      #          the behaviour from the parent.
      #          + `:search_paths` The target inherits
      #          the search paths of the parent only.
      #
      #
      # @example Inheriting only search paths
      #
      #          target 'App' do
      #            target 'AppTests' do
      #              inherit! :search_paths
      #            end
      #          end
      #
      # @return  [void]
      #
      def inherit!(inheritance)
        current_target_definition.inheritance = inheritance
      end

      #-----------------------------------------------------------------------#

      # @!group Target configuration
      #   These settings are used to control the CocoaPods generated project.
      #
      #   This starts out simply with stating what `platform` you are working
      #   on. `xcodeproj` allows you to state specifically which project to
      #   link with.

      #-----------------------------------------------------------------------#

      # Specifies the platform for which a static library should be built.
      #
      # CocoaPods provides a default deployment target if one is not specified.
      # The current default values are `4.3` for iOS, `10.6` for OS X, `9.0` for tvOS,
      # `1.0` for visionOS and `2.0` for watchOS.
      #
      # If the deployment target requires it (iOS < `4.3`), `armv6`
      # architecture will be added to `ARCHS`.
      #
      # @param    [Symbol] name
      #           the name of platform, can be either `:osx` for OS X, `:ios`
      #           for iOS, `:tvos` for tvOS, `:visionos` for visionOS, or `:watchos` for watchOS.
      #
      # @param    [String, Version] target
      #           The optional deployment.  If not provided a default value
      #           according to the platform name will be assigned.
      #
      # @example  Specifying the platform
      #
      #           platform :ios, '4.0'
      #           platform :ios
      #
      # @return   [void]
      #
      def platform(name, target = nil)
        # Support for deprecated options parameter
        target = target[:deployment_target] if target.is_a?(Hash)
        current_target_definition.set_platform!(name, target)
      end

      # Specifies the Xcode project that contains the target that the Pods
      # library should be linked with.
      #
      # -----
      #
      # If none of the target definitions specify an explicit project
      # and there is only **one** project in the same directory as the Podfile
      # then that project will be used.
      #
      # It is possible also to specify whether the build settings of your
      # custom build configurations should be modelled after the release or
      # the debug presets. To do so you need to specify a hash where the name
      # of each build configuration is associated to either `:release` or
      # `:debug`.
      #
      # @param    [String] path
      #           the path of the project to link with
      #
      # @param    [Hash{String => symbol}] build_configurations
      #           a hash where the keys are the name of the build
      #           configurations in your Xcode project and the values are
      #           Symbols that specify if the configuration should be based on
      #           the `:debug` or `:release` configuration. If no explicit
      #           mapping is specified for a configuration in your project, it
      #           will default to `:release`.
      #
      # @example  Specifying the user project
      #
      #           # This Target can be found in a Xcode project called `FastGPS`
      #           target 'MyGPSApp' do
      #             project 'FastGPS'
      #             ...
      #           end
      #
      #           # Same Podfile, multiple Xcodeprojects
      #           target 'MyNotesApp' do
      #             project 'FastNotes'
      #             ...
      #           end
      #
      # @example  Using custom build configurations
      #
      #           project 'TestProject', 'Mac App Store' => :release, 'Test' => :debug
      #
      # @return   [void]
      #
      def project(path, build_configurations = {})
        current_target_definition.user_project_path = path
        current_target_definition.build_configurations = build_configurations
      end

      # @!visibility private
      #
      # @deprecated #{xcodeproj} was renamed to #{project}.
      #
      # `xcodeproj` is deprecated in [1.0](http://blog.cocoapods.org/CocoaPods-1.0/) and has been renamed to `project`.
      # For pre-1.0 versions use `xcodeproj`.
      #
      def xcodeproj(*args)
        CoreUI.warn '`xcodeproj` was renamed to `project`. Please update your Podfile accordingly.'
        project(*args)
      end

      # @!visibility private
      #
      # @deprecated linking a single target with multiple Xcode targets is no
      #             longer supported. Use an {#abstract_target} and target
      #             inheritance instead.
      #
      # `link_with` is deprecated in [1.0](http://blog.cocoapods.org/CocoaPods-1.0/) in
      # favour of `abstract_target` and target inheritance instead.
      #
      def link_with(*)
        raise Informative, 'The specification of `link_with` in the Podfile ' \
          'is now unsupported, please use target blocks instead.'
      end

      # Inhibits **all** the warnings from the CocoaPods libraries.
      #
      # ------
      #
      # This attribute is inherited by child target definitions.
      #
      # If you would like to inhibit warnings per Pod you can use the
      # following syntax:
      #
      #     pod 'SSZipArchive', :inhibit_warnings => true
      #
      # Additionally, when you use `inhibit_all_warnings!` attribute,
      # you can exclude a particular Pod from being inhibited using the following:
      #
      #     pod 'SSZipArchive', :inhibit_warnings => false
      #
      def inhibit_all_warnings!
        current_target_definition.inhibit_all_warnings = true
      end

      # Use modular headers for all CocoaPods static libraries.
      #
      # ------
      #
      # This attribute is inherited by child target definitions.
      #
      # If you would like to use modular headers per Pod you can use the
      # following syntax:
      #
      #     pod 'SSZipArchive', :modular_headers => true
      #
      # Additionally, when you use the `use_modular_headers!` attribute,
      # you can exclude a particular Pod from modular headers using the following:
      #
      #     pod 'SSZipArchive', :modular_headers => false
      #
      def use_modular_headers!
        current_target_definition.use_modular_headers_for_all_pods = true
      end

      # Use frameworks instead of static libraries for Pods. When using frameworks, you may also specify the `:linkage`
      # style to use, either `:static` or `:dynamic`.
      #
      # ------
      #
      # This attribute is inherited by child target definitions.
      #
      # @param [Boolean, Hash] option
      #        The option to use for configuring packaging and linkage style.
      #
      # @example
      #
      #   target 'MyApp' do
      #     use_frameworks!
      #     pod 'AFNetworking', '~> 1.0'
      #   end
      #
      # @example
      #
      #   target 'MyApp' do
      #     use_frameworks! :linkage => :dynamic
      #     pod 'AFNetworking', '~> 1.0'
      #   end
      #
      #   target 'ZipApp' do
      #     use_frameworks! :linkage => :static
      #     pod 'SSZipArchive'
      #   end
      #
      # @return   [void]
      #
      def use_frameworks!(option = true)
        current_target_definition.use_frameworks!(option)
      end

      # Specifies the Swift version requirements this target definition supports.
      #
      # **Note** These requirements are inherited from the parent, if specified and if none
      # are specified at the root level then all versions are considered to be supported.
      #
      # @param   [String, Version, Array<String>, Array<Version>] requirements
      #          The set of requirements this target supports.
      #
      # @example
      #
      #   target 'MyApp' do
      #     supports_swift_versions '>= 3.0', '< 4.0'
      #     pod 'AFNetworking', '~> 1.0'
      #   end
      #
      # @example
      #
      #   supports_swift_versions '>= 3.0', '< 4.0'
      #
      #   target 'MyApp' do
      #     pod 'AFNetworking', '~> 1.0'
      #   end
      #
      #   target 'ZipApp' do
      #     pod 'SSZipArchive'
      #   end
      #
      # @return   [void]
      #
      def supports_swift_versions(*requirements)
        current_target_definition.store_swift_version_requirements(*requirements)
      end

      #-----------------------------------------------------------------------#

      # @!group Workspace
      #
      #   This group list the options to configure workspace and to set global
      #   settings.

      #-----------------------------------------------------------------------#

      # Specifies the Xcode workspace that should contain all the projects.
      #
      # -----
      #
      # If no explicit Xcode workspace is specified and only **one** project
      # exists in the same directory as the Podfile, then the name of that
      # project is used as the workspace’s name.
      #
      # @param    [String] path
      #           path of the workspace.
      #
      # @example  Specifying a workspace
      #
      #           workspace 'MyWorkspace'
      #
      # @return   [void]
      #
      def workspace(path)
        set_hash_value('workspace', path.to_s)
      end

      # Specifies that a BridgeSupport metadata document should be generated
      # from the headers of all installed Pods.
      #
      # -----
      #
      # This is for scripting languages such as [MacRuby](http://macruby.org),
      # [Nu](http://programming.nu/index), and
      # [JSCocoa](http://inexdo.com/JSCocoa), which use it to bridge types,
      # functions, etc.
      #
      # @return   [void]
      #
      def generate_bridge_support!
        set_hash_value('generate_bridge_support', true)
      end

      # Specifies that the -fobjc-arc flag should be added to the
      # `OTHER_LD_FLAGS`.
      #
      # -----
      #
      # This is used as a workaround for a compiler bug with non-ARC projects
      # (see #142). This was originally done automatically but libtool as of
      # Xcode 4.3.2 no longer seems to support the `-fobjc-arc` flag. Therefore
      # it now has to be enabled explicitly using this method.
      #
      # Support for this method might be dropped in CocoaPods `1.0`.
      #
      # @return   [void]
      #
      def set_arc_compatibility_flag!
        set_hash_value('set_arc_compatibility_flag', true)
      end

      #-----------------------------------------------------------------------#

      # @!group Sources
      #
      #   The Podfile retrieves specs from a given list of sources (repositories).
      #
      #   Sources are __global__ and they are not stored per target definition.

      #-----------------------------------------------------------------------#

      # Specifies the location of specs
      #
      # -----
      #
      # Use this method to specify sources. The order of the sources is
      # relevant. CocoaPods will use the highest version of a Pod of the first
      # source which includes the Pod (regardless whether other sources have a
      # higher version).
      #
      # The official CocoaPods source is implicit.
      # Once you specify another source, then it will need to be included.
      #
      # @param    [String] source
      #           The URL of a specs repository.
      #
      # @example  Specifying to first use the Artsy repository and then the CocoaPods Master Repository
      #
      #           source 'https://github.com/artsy/Specs.git'
      #           source 'https://cdn.cocoapods.org/'
      #
      # @return   [void]
      #
      def source(source)
        hash_sources = get_hash_value('sources') || []
        hash_sources << source
        set_hash_value('sources', hash_sources.uniq)
      end

      #-----------------------------------------------------------------------#

      # @!group Hooks
      #   The Podfile provides hooks that will be called during the
      #   installation process.
      #
      #   Hooks are __global__ and not stored per target definition.

      #-----------------------------------------------------------------------#

      # Specifies the plugins that should be used during installation.
      #
      # -----
      #
      # Use this method to specify a plugin that should be used during
      # installation, along with the options that should be passed to the plugin
      # when it is invoked.
      #
      # @param    [String] name
      #           The name of the plugin.
      #
      # @param    [Hash] options
      #           The optional options that should be passed to the plugin when
      #           its hooks are invoked.
      #
      # @example  Specifying to use the `slather` and `cocoapods-keys` plugins.
      #
      #           plugin 'cocoapods-keys', :keyring => 'Eidolon'
      #           plugin 'slather'
      #
      # @return   [void]
      #
      def plugin(name, options = {})
        hash_plugins = get_hash_value('plugins') || {}
        (hash_plugins[name] ||= {}).merge!(options.deep_stringify_keys)
        set_hash_value('plugins', hash_plugins)
      end

      # This hook allows you to make any changes to the Pods after they have
      # been downloaded but before they are installed.
      #
      # It receives the [Pod::Installer] as its only argument.
      #
      # @example  Defining a pre-install hook in a Podfile.
      #
      #   pre_install do |installer|
      #     # Do something fancy!
      #   end
      #
      #
      def pre_install(&block)
        @pre_install_callback = block
      end

      # This hook allows you to make changes before the project is written
      # to disk.
      #
      # It receives the [Pod::Installer] as its only argument.
      #
      # @example  Customizing the dependencies before integration
      #
      #   pre_integrate do |installer|
      #     # perform some changes on dependencies
      #   end
      #
      # @return   [void]
      #
      def pre_integrate(&block)
        raise Informative, 'Specifying multiple `pre_integrate` hooks is unsupported.' if @pre_integrate_callback
        @pre_integrate_callback = block
      end

      # This hook allows you to make any last changes to the generated Xcode
      # project before it is written to disk, or any other tasks you might want
      # to perform.
      #
      # It receives the [Pod::Installer] as its only argument.
      #
      # @example  Customizing the build settings of all targets
      #
      #   post_install do |installer|
      #     installer.pods_project.targets.each do |target|
      #       target.build_configurations.each do |config|
      #         config.build_settings['GCC_ENABLE_OBJC_GC'] = 'supported'
      #       end
      #     end
      #   end
      #
      # @return   [void]
      #
      def post_install(&block)
        raise Informative, 'Specifying multiple `post_install` hooks is unsupported.' if @post_install_callback
        @post_install_callback = block
      end

      # This hook allows you to make changes after the project is written
      # to disk.
      #
      # It receives the [Pod::Installer] as its only argument.
      #
      # @example  Customizing the build settings of all targets
      #
      #   post_integrate do |installer|
      #     # some change after project write to disk
      #   end
      #
      # @return   [void]
      #
      def post_integrate(&block)
        raise Informative, 'Specifying multiple `post_integrate` hooks is unsupported.' if @post_integrate_callback
        @post_integrate_callback = block
      end
    end
  end
end
