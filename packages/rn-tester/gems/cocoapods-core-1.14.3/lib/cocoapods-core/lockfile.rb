module Pod
  # The Lockfile stores information about the pods that were installed by
  # CocoaPods.
  #
  # It is used in combination with the Podfile to resolve the exact version of
  # the Pods that should be installed (i.e. to prevent `pod install` from
  # upgrading dependencies).
  #
  # Moreover it is used as a manifest of an installation to detect which Pods
  # need to be installed or removed.
  #
  class Lockfile
    # @todo   The symbols should be converted to a String and back to symbol
    #         when reading (EXTERNAL SOURCES Download options)

    # @return [String] the hash used to initialize the Lockfile.
    #
    attr_reader :internal_data

    # @param  [Hash] hash
    #         a hash representation of the Lockfile.
    #
    def initialize(hash)
      @internal_data = hash
    end

    # Loads a lockfile form the given path.
    #
    # @note   This method returns nil if the given path doesn't exists.
    #
    # @raise  If there is a syntax error loading the YAML data.
    #
    # @param  [Pathname] path
    #         the path where the lockfile is serialized.
    #
    # @return [Lockfile] a new lockfile.
    #
    def self.from_file(path)
      return nil unless path.exist?
      hash = YAMLHelper.load_file(path)
      unless hash && hash.is_a?(Hash)
        raise Informative, "Invalid Lockfile in `#{path}`"
      end
      lockfile = Lockfile.new(hash)
      lockfile.defined_in_file = path
      lockfile
    end

    # @return [String] the file where the Lockfile is serialized.
    #
    attr_accessor :defined_in_file

    # @return [Boolean] Whether the Podfiles are equal.
    #
    def ==(other)
      other && to_hash == other.to_hash
    end

    # @return [String] a string representation suitable for debugging.
    #
    def inspect
      "#<#{self.class}>"
    end

    #-------------------------------------------------------------------------#

    # !@group Accessing the Data

    public

    # @return [Array<String>] the names of the installed Pods.
    #
    def pod_names
      generate_pod_names_and_versions unless @pod_names
      @pod_names
    end

    # Returns the version of the given Pod.
    #
    # @param [String] pod_name The name of the Pod (root name of the specification).
    #
    # @return [Version] The version of the pod.
    #
    # @return [Nil] If there is no version stored for the given name.
    #
    def version(pod_name)
      version = pod_versions[pod_name]
      return version if version
      root_name = pod_versions.keys.find do |name|
        Specification.root_name(name) == pod_name
      end
      pod_versions[root_name]
    end

    # Returns the source of the given Pod.
    #
    # @param [String] pod_name The name of the Pod (root name of the specification).
    #
    # @return [String] The source of the pod.
    #
    # @return [Nil] If there is no source stored for the given name.
    #
    def spec_repo(pod_name)
      spec_repos_by_pod[pod_name]
    end

    # Returns the checksum for the given Pod.
    #
    # @param [String] name The name of the Pod (root name of the specification).
    #
    # @return [String] The checksum of the specification for the given Pod.
    #
    # @return [Nil] If there is no checksum stored for the given name.
    #
    def checksum(name)
      checksum_data[name]
    end

    # @return [Array<Dependency>] the dependencies of the Podfile used for the
    #         last installation.
    #
    # @note   It includes only the dependencies explicitly required in the
    #         podfile and not those triggered by the Resolver.
    def dependencies
      unless @dependencies
        data = internal_data['DEPENDENCIES'] || []
        @dependencies = data.map do |string|
          dep = Dependency.from_string(string)
          dep.external_source = external_sources_data[dep.root_name]
          dep
        end
      end
      @dependencies
    end

    # Returns pod names grouped by the spec repo they were sourced from.
    #
    # @return [Hash<String, Array<String>>] A hash, where the keys are spec
    #         repo source URLs (or names), and the values are arrays of pod names.
    #
    # @note   It does not include pods that come from "external sources".
    #
    def pods_by_spec_repo
      @pods_by_spec_repo ||= internal_data['SPEC REPOS'] || {}
    end

    # Generates a dependency that requires the exact version of the Pod with the
    # given name.
    #
    # @param  [String] name
    #         the name of the Pod
    #
    # @note   The generated dependencies used are by the Resolver from
    #         upgrading a Pod during an installation.
    #
    # @raise  If there is no version stored for the given name.
    #
    # @return [Array<Dependency>] the generated dependency.
    #
    def dependencies_to_lock_pod_named(name)
      deps = dependencies.select { |d| d.root_name == name }
      if deps.empty?
        raise StandardError, "Attempt to lock the `#{name}` Pod without a " \
          'known dependency.'
      end

      deps.map do |dep|
        version = version(dep.name)
        locked_dependency = dep.dup
        locked_dependency.specific_version = version
        locked_dependency
      end
    end

    # Returns the specific checkout options for the external source of the pod
    # with the given name.
    #
    # @example  Output
    #           {:commit => "919903db28535c3f387c4bbaa6a3feae4428e993"
    #            :git => "https://github.com/luisdelarosa/AFRaptureXMLRequestOperation.git"}
    #
    # @return   [Hash] a hash of the checkout options for the external source of
    #           the pod with the given name.
    #
    # @param    [String] name
    #           the name of the Pod.
    #
    def checkout_options_for_pod_named(name)
      checkout_options_data[name]
    end

    # @return [Version] The version of CocoaPods which generated this lockfile.
    #
    def cocoapods_version
      Version.new(internal_data['COCOAPODS'])
    end

    #--------------------------------------#

    # !@group Accessing the internal data.

    private

    # @return [Array<String, Hash{String => Array[String]}>] the pods installed
    #         and their dependencies.
    #
    def generate_pod_names_and_versions
      @pod_names    = []
      @pod_versions = {}

      return unless pods = internal_data['PODS']
      pods.each do |pod|
        pod = pod.keys.first unless pod.is_a?(String)
        name, version = Spec.name_and_version_from_string(pod)
        @pod_names << name
        @pod_versions[name] = version
      end
    end

    # @return [Hash{String => Hash}] a hash where the name of the pods are the
    #         keys and the values are the external source hash the dependency
    #         that required the pod.
    #
    def external_sources_data
      @external_sources_data ||= internal_data['EXTERNAL SOURCES'] || {}
    end

    # @return [Hash{String => Hash}] a hash where the name of the pods are the
    #         keys and the values are a hash of specific checkout options.
    #
    def checkout_options_data
      @checkout_options_data ||= internal_data['CHECKOUT OPTIONS'] || {}
    end

    # @return [Hash{String => Version}] a Hash containing the name of the root
    #         specification of the installed Pods as the keys and their
    #         corresponding {Version} as the values.
    #
    def pod_versions
      generate_pod_names_and_versions unless @pod_versions
      @pod_versions
    end

    # @return [Hash{String => Version}] A Hash containing the checksums of the
    #         specification by the name of their root.
    #
    def checksum_data
      internal_data['SPEC CHECKSUMS'] || {}
    end

    # @return [Hash{String => String}] A hash containing the spec repo used for the specification
    #         by the name of the root spec.
    #
    def spec_repos_by_pod
      @spec_repos_by_pod ||= pods_by_spec_repo.each_with_object({}) do |(spec_repo, pods), spec_repos_by_pod|
        pods.each do |pod|
          spec_repos_by_pod[pod] = spec_repo
        end
      end
    end

    #-------------------------------------------------------------------------#

    # !@group Comparison with a Podfile

    public

    # Analyzes the {Lockfile} and detects any changes applied to the {Podfile}
    # since the last installation.
    #
    # For each Pod, it detects one state among the following:
    #
    # - added: Pods that weren't present in the Podfile.
    # - changed: Pods that were present in the Podfile but changed:
    #   - Pods whose version is not compatible anymore with Podfile,
    #   - Pods that changed their external options.
    # - removed: Pods that were removed form the Podfile.
    # - unchanged: Pods that are still compatible with Podfile.
    #
    # @param  [Podfile] podfile
    #         the podfile that should be analyzed.
    #
    # @return [Hash{Symbol=>Array[Strings]}] a hash where pods are grouped
    #         by the state in which they are.
    #
    # @todo   Why do we look for compatibility instead of just comparing if the
    #         two dependencies are equal?
    #
    def detect_changes_with_podfile(podfile)
      result = {}
      [:added, :changed, :removed, :unchanged].each { |k| result[k] = [] }

      installed_deps = {}
      dependencies.each do |dep|
        name = dep.root_name
        installed_deps[name] ||= dependencies_to_lock_pod_named(name)
      end

      installed_deps = installed_deps.values.flatten(1).group_by(&:name)

      podfile_dependencies = podfile.dependencies
      podfile_dependencies_by_name = podfile_dependencies.group_by(&:name)

      all_dep_names = (dependencies + podfile_dependencies).map(&:name).uniq
      all_dep_names.each do |name|
        installed_dep   = installed_deps[name]
        installed_dep &&= installed_dep.first
        podfile_dep     = podfile_dependencies_by_name[name]
        podfile_dep   &&= podfile_dep.first

        if installed_dep.nil?  then key = :added
        elsif podfile_dep.nil? then key = :removed
        elsif podfile_dep.compatible?(installed_dep) then key = :unchanged
        else key = :changed
        end
        result[key] << name
      end
      result
    end

    #-------------------------------------------------------------------------#

    # !@group Serialization

    public

    # Writes the Lockfile to the given path.
    #
    # @param  [Pathname] path
    #         the path where the lockfile should be saved.
    #
    # @return [void]
    #
    def write_to_disk(path)
      path.dirname.mkpath unless path.dirname.exist?
      self.defined_in_file = path
      # rubocop:disable Lint/RescueException
      # rubocop:disable Lint/HandleExceptions
      begin
        existing = Lockfile.from_file(path)
        return if existing == self
      rescue Exception
      end
      path.open('w') { |f| f.write(to_yaml) }
      # rubocop:enable Lint/HandleExceptions
      # rubocop:enable Lint/RescueException
    end

    # @return [Hash{String=>Array,Hash,String}] a hash representation of the
    #         Lockfile.
    #
    # @example Output
    #
    #   {
    #     'PODS'             => [ { BananaLib (1.0) => [monkey (< 1.0.9, ~> 1.0.1)] },
    #                             "JSONKit (1.4)",
    #                             "monkey (1.0.8)"]
    #     'DEPENDENCIES'     => [ "BananaLib (~> 1.0)",
    #                             "JSONKit (from `path/JSONKit.podspec`)" ],
    #     'EXTERNAL SOURCES' => { "JSONKit" => { :podspec => path/JSONKit.podspec } },
    #     'SPEC CHECKSUMS'   => { "BananaLib" => "439d9f683377ecf4a27de43e8cf3bce6be4df97b",
    #                             "JSONKit", "92ae5f71b77c8dec0cd8d0744adab79d38560949" },
    #     'PODFILE CHECKSUM' => "439d9f683377ecf4a27de43e8cf3bce6be4df97b",
    #     'COCOAPODS'        => "0.17.0"
    #   }
    #
    #
    def to_hash
      hash = {}
      internal_data.each do |key, value|
        hash[key] = value unless value.nil? || value.empty?
      end
      hash
    end

    # @return [Array<String>] The order in which the hash keys should appear in
    #         a serialized Lockfile.
    #
    HASH_KEY_ORDER = [
      'PODS',
      'DEPENDENCIES',
      'SPEC REPOS',
      'EXTERNAL SOURCES',
      'CHECKOUT OPTIONS',
      'SPEC CHECKSUMS',
      'PODFILE CHECKSUM',
      'COCOAPODS',
    ].map(&:freeze).freeze

    # @return [String] the YAML representation of the Lockfile, used for
    #         serialization.
    #
    # @note   Empty root keys are discarded.
    #
    # @note   The YAML string is prettified.
    #
    def to_yaml
      YAMLHelper.convert_hash(to_hash, HASH_KEY_ORDER, "\n\n")
    end

    #-------------------------------------------------------------------------#

    class << self
      # !@group Generation

      public

      # Generates a hash representation of the Lockfile generated from a given
      # Podfile and the list of resolved Specifications. This representation is
      # suitable for serialization.
      #
      # @param  [Podfile] podfile
      #         the podfile that should be used to generate the lockfile.
      #
      # @param  [Array<Specification>] specs
      #         an array containing the podspec that were generated by
      #         resolving the given podfile.
      #
      # @return [Lockfile] a new lockfile.
      #
      def generate(podfile, specs, checkout_options, spec_repos = {})
        hash = {
          'PODS'             => generate_pods_data(specs),
          'DEPENDENCIES'     => generate_dependencies_data(podfile),
          'SPEC REPOS'       => generate_spec_repos(spec_repos),
          'EXTERNAL SOURCES' => generate_external_sources_data(podfile),
          'CHECKOUT OPTIONS' => checkout_options,
          'SPEC CHECKSUMS'   => generate_checksums(specs),
          'PODFILE CHECKSUM' => podfile.checksum,
          'COCOAPODS'        => CORE_VERSION,
        }
        Lockfile.new(hash)
      end

      #--------------------------------------#

      private

      # !@group Private helpers

      # Generates the list of the installed Pods and their dependencies.
      #
      # @note   The dependencies of iOS and OS X version of the same pod are
      #         merged.
      #
      # @todo   Specifications should be stored per platform, otherwise they
      #         list dependencies which actually might not be used.
      #
      # @return [Array<Hash,String>] the generated data.
      #
      # @example Output
      #   [ {"BananaLib (1.0)"=>["monkey (< 1.0.9, ~> 1.0.1)"]},
      #   "monkey (1.0.8)" ]
      #
      #
      def generate_pods_data(specs)
        pods_and_deps_merged = specs.reduce({}) do |result, spec|
          name = spec.to_s
          result[name] ||= []
          result[name].concat(spec.all_dependencies.map(&:to_s))
          result
        end

        pod_and_deps = pods_and_deps_merged.map do |name, deps|
          deps.empty? ? name : { name => YAMLHelper.sorted_array(deps.uniq) }
        end
        YAMLHelper.sorted_array(pod_and_deps)
      end

      # Generates the list of the dependencies of the Podfile.
      #
      # @example  Output
      #           [ "BananaLib (~> 1.0)",
      #             "JSONKit (from `path/JSONKit.podspec')" ]
      #
      # @return   [Array] the generated data.
      #
      def generate_dependencies_data(podfile)
        YAMLHelper.sorted_array(podfile.dependencies.map(&:to_s))
      end

      # Generates the hash of spec repo sources used in the Podfile.
      #
      # @example  Output
      #           { "https://github.com/cocoapods/cocoapods.git" => ["Alamofire", "Moya"] }
      #
      def generate_spec_repos(spec_repos)
        Hash[spec_repos.map do |source, specs|
          next unless source
          next if specs.empty?
          key = source.url || source.name

          # save `trunk` as 'trunk' so that the URL itself can be changed without lockfile churn
          key = Pod::TrunkSource::TRUNK_REPO_NAME if source.name == Pod::TrunkSource::TRUNK_REPO_NAME

          value = specs.map { |s| s.root.name }.uniq
          [key, YAMLHelper.sorted_array(value)]
        end.compact]
      end

      # Generates the information of the external sources.
      #
      # @example  Output
      #           { "JSONKit"=>{:podspec=>"path/JSONKit.podspec"} }
      #
      # @return   [Hash] a hash where the keys are the names of the pods and
      #           the values store the external source hashes of each
      #           dependency.
      #
      def generate_external_sources_data(podfile)
        deps = podfile.dependencies.select(&:external?)
        deps = deps.sort { |d, other| d.name <=> other.name }
        sources = {}
        deps.each { |d| sources[d.root_name] = d.external_source }
        sources
      end

      # Generates the relative to the checksum of the specifications.
      #
      # @example  Output
      #           {
      #             "BananaLib"=>"9906b267592664126923875ce2c8d03824372c79",
      #             "JSONKit"=>"92ae5f71b77c8dec0cd8d0744adab79d38560949"
      #           }
      #
      # @return   [Hash] a hash where the keys are the names of the root
      #           specifications and the values are the SHA1 digest of the
      #           podspec file.
      #
      def generate_checksums(specs)
        checksums = {}
        specs.select(&:defined_in_file).each do |spec|
          checksums[spec.root.name] = spec.checksum
        end
        checksums
      end
    end
  end
end
