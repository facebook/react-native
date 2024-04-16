module Pod
  class Specification
    module JSONSupport
      # @return [String] the json representation of the specification.
      #
      def to_json(*a)
        require 'json'
        JSON.dump(to_hash, *a) << "\n"
      end

      # @return [String] the pretty json representation of the specification.
      #
      def to_pretty_json(*a)
        require 'json'
        JSON.pretty_generate(to_hash, *a) << "\n"
      end

      #-----------------------------------------------------------------------#

      # @return [Hash] the hash representation of the specification including
      #         subspecs.
      #
      def to_hash
        hash = attributes_hash.dup
        if root? || available_platforms != parent.available_platforms
          platforms = Hash[available_platforms.map { |p| [p.name.to_s, p.deployment_target && p.deployment_target.to_s] }]
          hash['platforms'] = platforms
        end
        specs_by_type = subspecs.group_by(&:spec_type)
        all_appspecs = specs_by_type[:app] || []
        all_testspecs = specs_by_type[:test] || []
        all_subspecs = specs_by_type[:library] || []

        hash.delete('testspecs')
        hash['testspecs'] = all_testspecs.map(&:to_hash) unless all_testspecs.empty?
        hash.delete('appspecs')
        hash['appspecs'] = all_appspecs.map(&:to_hash) unless all_appspecs.empty?
        hash.delete('subspecs')
        hash['subspecs'] = all_subspecs.map(&:to_hash) unless all_subspecs.empty?

        # Since CocoaPods 1.7 version the DSL has changed to be pluralized. When we serialize a podspec to JSON with
        # 1.7, ensure that we also include the singular version in the hash to maintain backwards compatibility with
        # < 1.7 versions. We also delete this key and re-add it to ensure it gets added at the end.
        hash.delete('swift_version')
        hash['swift_version'] = swift_version.to_s unless swift_version.nil?

        hash
      end
    end

    # Configures a new specification from the given JSON representation.
    #
    # @param  [String] the JSON encoded hash which contains the information of
    #         the specification.
    #
    #
    # @return [Specification] the specification
    #
    def self.from_json(json, path="")
      require 'json'
      begin
        hash = JSON.parse(json)
        from_hash(hash)
      rescue JSON::ParserError => e
        if path != ""
          raise e.class, "Failed to parse JSON at file: '#{path}'.\n\n#{e.message}"
        else raise
        end
      end      
    end

    # Configures a new specification from the given hash.
    #
    # @param  [Hash] hash the hash which contains the information of the
    #         specification.
    #
    # @param  [Specification] parent the parent of the specification unless the
    #         specification is a root.
    #
    # @return [Specification] the specification
    #
    def self.from_hash(hash, parent = nil, test_specification: false, app_specification: false)
      attributes_hash = hash.dup
      spec = Spec.new(parent, nil, test_specification, :app_specification => app_specification)
      subspecs = attributes_hash.delete('subspecs')
      testspecs = attributes_hash.delete('testspecs')
      appspecs = attributes_hash.delete('appspecs')

      ## backwards compatibility with 1.3.0
      spec.test_specification = !attributes_hash['test_type'].nil?

      spec.attributes_hash = attributes_hash
      spec.subspecs.concat(subspecs_from_hash(spec, subspecs, false, false))
      spec.subspecs.concat(subspecs_from_hash(spec, testspecs, true, false))
      spec.subspecs.concat(subspecs_from_hash(spec, appspecs, false, true))

      spec
    end

    def self.subspecs_from_hash(spec, subspecs, test_specification, app_specification)
      return [] if subspecs.nil?
      subspecs.map do |s_hash|
        Specification.from_hash(s_hash, spec,
                                :test_specification => test_specification,
                                :app_specification => app_specification)
      end
    end

    #-----------------------------------------------------------------------#
  end
end
