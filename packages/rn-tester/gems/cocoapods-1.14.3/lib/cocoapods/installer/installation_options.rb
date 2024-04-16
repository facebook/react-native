require 'active_support/hash_with_indifferent_access'

module Pod
  class Installer
    # Represents the installation options the user can customize via a
    # `Podfile`.
    #
    class InstallationOptions
      # Parses installation options from a podfile.
      #
      # @param  [Podfile] podfile the podfile to parse installation options
      #         from.
      #
      # @raise  [Informative] if `podfile` does not specify a `CocoaPods`
      #         install.
      #
      # @return [Self]
      #
      def self.from_podfile(podfile)
        name, options = podfile.installation_method
        unless name.downcase == 'cocoapods'
          raise Informative, "Currently need to specify a `cocoapods` install, you chose `#{name}`."
        end
        new(options)
      end

      # Defines a new installation option.
      #
      # @param  [#to_s] name the name of the option.
      #
      # @param  default the default value for the option.
      #
      # @param [Boolean] boolean whether the option has a boolean value.
      #
      # @return [void]
      #
      # @!macro [attach] option
      #
      #   @note this option defaults to $2.
      #
      #   @return [Boolean] the $1 $0 for installation.
      #
      def self.option(name, default, boolean: true)
        name = name.to_s
        raise ArgumentError, "The `#{name}` option is already defined" if defaults.key?(name)
        defaults[name] = default
        attr_accessor name
        alias_method "#{name}?", name if boolean
      end

      # @return [Hash<Symbol,Object>] all known installation options and their
      #         default values.
      #
      def self.defaults
        @defaults ||= {}
      end

      # @return [Array<Symbol>] the names of all known installation options.
      #
      def self.all_options
        defaults.keys
      end

      # Initializes the installation options with a hash of options from a
      # Podfile.
      #
      # @param  [Hash] options the options to parse.
      #
      # @raise  [Informative] if `options` contains any unknown keys.
      #
      def initialize(options = {})
        options = ActiveSupport::HashWithIndifferentAccess.new(options)
        unknown_keys = options.keys - self.class.all_options.map(&:to_s)
        raise Informative, "Unknown installation options: #{unknown_keys.to_sentence}." unless unknown_keys.empty?
        self.class.defaults.each do |key, default|
          value = options.fetch(key, default)
          send("#{key}=", value)
        end
      end

      # @param  [Boolean] include_defaults whether values that match the default
      #         for their option should be included. Defaults to `true`.
      #
      # @return [Hash] the options, keyed by option name.
      #
      def to_h(include_defaults: true)
        self.class.defaults.reduce(ActiveSupport::HashWithIndifferentAccess.new) do |hash, (option, default)|
          value = send(option)
          hash[option] = value if include_defaults || value != default
          hash
        end
      end

      def ==(other)
        other.is_a?(self.class) && to_h == other.to_h
      end

      alias_method :eql, :==

      def hash
        to_h.hash
      end

      # Whether to clean the sources of the pods during installation
      #
      # Cleaning removes any files not used by the pod as specified by the podspec and the platforms
      # that the project supports
      #
      # @see {PodSourceInstaller#clean!}
      #
      option :clean, true

      # Whether to deduplicate pod targets
      #
      # Target deduplication adds suffixes to pod targets for the cases where a pod is included
      # in multiple targets that have different requirements. For example, a pod named 'MyPod' with a subspec 'SubA'
      # that is included in two targets as follows:
      #
      #     target 'MyTargetA' do
      #       pod 'MyPod/SubA'
      #     end
      #
      #     target 'MyTargetB' do
      #       pod 'MyPod'
      #     end
      #
      # will result in two Pod targets: `MyPod` and `MyPod-SubA`
      #
      option :deduplicate_targets, true

      # Whether to generate deterministic UUIDs when creating the Pods project
      #
      # @see {Xcodeproj#generate_uuid}
      #
      option :deterministic_uuids, true

      # Whether to integrate the installed pods into the user project
      #
      # If set to false, Pods will be downloaded and installed to the `Pods/` directory
      # but they will not be integrated into your project.
      #
      option :integrate_targets, true

      # Whether to lock the source files of pods. Xcode will prompt to unlock the files when attempting to modify
      # their contents
      #
      # @note There is a performance penalty to locking the pods during installation. If this is significantly
      #       impacting the duration of `pod install` for your project, you can try setting this to `false`
      #
      option :lock_pod_sources, true

      # Whether to emit a warning when multiple sources contain a Pod with the same name and version
      #
      option :warn_for_multiple_pod_sources, true

      # Whether to emit a warning if a project is not explicitly specifying the git based master specs repo and can
      # instead use CDN which is the default.
      #
      option :warn_for_unused_master_specs_repo, true

      # Whether to share Xcode schemes for development pods.
      #
      # Schemes for development pods are created automatically but are not shared by default.
      #
      option :share_schemes_for_development_pods, false

      # Whether to disable the input & output paths of the CocoaPods script phases (Copy Frameworks & Copy Resources)
      #
      # @see https://github.com/CocoaPods/CocoaPods/issues/8073
      #
      option :disable_input_output_paths, false

      # Whether to preserve the file structure of all Pods, including externally sourced pods.
      #
      # By default, the file structure of Pod sources is preserved only for development pods. Setting
      # `:preserve_pod_file_structure` to `true` will _always_ preserve the file structure.
      #
      option :preserve_pod_file_structure, false

      # Whether to generate a project per pod target. Instead of creating 1 `Pods.xcodeproj`, this option will generate
      # a project for every pod target that will be nested under the `Pods.xcodeproj`.
      #
      option :generate_multiple_pod_projects, false

      # Whether to enable only regenerating targets and their associate projects that have changed
      # since the previous installation.
      #
      option :incremental_installation, false

      # Whether to skip generating the `Pods.xcodeproj` and perform only dependency resolution and downloading.
      #
      option :skip_pods_project_generation, false

      # Whether to download pods in parallel before beginning the installation process
      #
      option :parallel_pod_downloads, false

      # The size of the thread pool to use when downloading pods in parallel. Only takes effect when
      # `parallel_pod_downloads` is `true`.
      #
      # Default: 40
      #
      option(:parallel_pod_download_thread_pool_size, 40, :boolean => false)
    end
  end
end
