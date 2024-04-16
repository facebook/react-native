require 'cocoapods-core/specification/linter/result'

module Pod
  class Specification
    class Linter
      class Analyzer
        def initialize(consumer, results)
          @consumer = consumer
          @results = results
          @results.consumer = @consumer
        end

        # Analyzes the consumer adding a {Result} for any failed check to
        # the {#results} object.
        #
        # @return [Results] the results of the analysis.
        #
        def analyze
          check_attributes
          validate_file_patterns
          check_if_spec_is_empty
          results
        end

        private

        attr_reader :consumer

        attr_reader :results

        # @return [Array<String>] Keys that are valid but have been deprecated.
        #
        DEPRECATED_KEYS = ['swift_version'].freeze

        # @return [Array<String>] Keys that are only used for internal purposes.
        #
        INTERNAL_KEYS = ['configuration_pod_whitelist'].freeze

        # Checks the attributes hash for any unknown key which might be the
        # result of a misspelling in a JSON file.
        #
        # @note Sub-keys are not checked per-platform as
        #       there is no attribute supporting this combination.
        #
        # @note The keys of sub-keys are not checked as they are only used by
        #       the `source` attribute and they are subject
        #       to change according to the support in the
        #       `cocoapods-downloader` gem.
        #
        def check_attributes
          attributes_keys = Pod::Specification::DSL.attributes.keys.map(&:to_s)
          platform_keys = Specification::DSL::PLATFORMS.map(&:to_s)
          valid_keys = attributes_keys + platform_keys + DEPRECATED_KEYS + INTERNAL_KEYS
          attributes_hash = consumer.spec.attributes_hash
          keys = attributes_hash.keys
          Specification::DSL::PLATFORMS.each do |platform|
            if attributes_hash[platform.to_s]
              keys += attributes_hash[platform.to_s].keys
            end
          end
          unknown_keys = keys - valid_keys

          unknown_keys.each do |key|
            results.add_warning('attributes', "Unrecognized `#{key}` key.")
          end

          Pod::Specification::DSL.attributes.each do |_key, attribute|
            declared_value = consumer.spec.attributes_hash[attribute.name.to_s]
            validate_attribute_occurrence(attribute, declared_value)
            validate_attribute_type(attribute, declared_value)
            if attribute.name != :platforms
              value = value_for_attribute(attribute)
              validate_attribute_value(attribute, value) if value
            end
          end
        end

        # Checks the attributes that represent file patterns.
        #
        # @todo Check the attributes hash directly.
        #
        def validate_file_patterns
          attributes = DSL.attributes.values.select(&:file_patterns?)
          attributes.each do |attrb|
            patterns = consumer.send(attrb.name)

            if patterns.is_a?(Hash)
              patterns = patterns.values.flatten(1)
            end

            if patterns.respond_to?(:each)
              patterns.each do |pattern|
                pattern = pattern[:paths].join if attrb.name == :on_demand_resources
                if pattern.respond_to?(:start_with?) && pattern.start_with?('/')
                  results.add_error('File Patterns', 'File patterns must be ' \
                    "relative and cannot start with a slash (#{attrb.name}).")
                end
              end
            end
          end
        end

        # Check empty subspec attributes
        #
        def check_if_spec_is_empty
          methods = %w( source_files on_demand_resources resources resource_bundles preserve_paths
                        dependencies vendored_libraries vendored_frameworks )
          empty_patterns = methods.all? { |m| consumer.send(m).empty? }
          empty = empty_patterns && consumer.spec.subspecs.empty?
          if empty
            results.add_error('File Patterns', "The #{consumer.spec} spec is " \
              'empty (no source files, resources, resource_bundles, ' \
              'preserve paths, vendored_libraries, vendored_frameworks, ' \
              'dependencies, nor subspecs).')
          end
        end

        private

        # Returns the own or inherited (if applicable) value of the
        # given attribute.
        #
        # @param  [Spec::DSL::Attribute] attribute
        #         The attribute.
        #
        # @return [mixed]
        #
        def value_for_attribute(attribute)
          if attribute.root_only?
            consumer.spec.send(attribute.name)
          else
            consumer.send(attribute.name) if consumer.respond_to?(attribute.name)
          end
        rescue => e
          results.add_error('attributes', "Unable to validate `#{attribute.name}` (#{e}).")
          nil
        end

        # Validates that root attributes don't occur in subspecs.
        #
        # @param  [Spec::DSL::Attribute] attribute
        #         The attribute.

        # @param  [Object] value
        #         The value of the attribute.
        #
        def validate_attribute_occurrence(attribute, value)
          if attribute.root_only? && !value.nil? && !consumer.spec.root?
            results.add_error('attributes', "Can't set `#{attribute.name}` attribute for " \
              "subspecs (in `#{consumer.spec.name}`).")
          end
          if attribute.test_only? && !value.nil? && !consumer.spec.test_specification?
            results.add_error('attributes', "Attribute `#{attribute.name}` can only be set " \
              "within test specs (in `#{consumer.spec.name}`).")
          end
        end

        # Validates the given value for the given attribute.
        #
        # @param  [Spec::DSL::Attribute] attribute
        #         The attribute.
        #
        # @param  [Object] value
        #         The value of the attribute.
        #
        def validate_attribute_value(attribute, value)
          if attribute.keys.is_a?(Array)
            validate_attribute_array_keys(attribute, value)
          elsif attribute.keys.is_a?(Hash)
            validate_attribute_hash_keys(attribute, value)
          end
        end

        def validate_attribute_type(attribute, value)
          return unless value
          types = attribute.supported_types
          if types.none? { |klass| value.class == klass }
            results.add_error('attributes', 'Unacceptable type ' \
              "`#{value.class}` for `#{attribute.name}`. Allowed values: `#{types.inspect}`.")
          end
        end

        def validate_attribute_array_keys(attribute, value)
          unknown_keys = value.keys.map(&:to_s) - attribute.keys.map(&:to_s)
          unknown_keys.each do |unknown_key|
            results.add_warning('keys', "Unrecognized `#{unknown_key}` key for " \
              "`#{attribute.name}` attribute.")
          end
        end

        def validate_attribute_hash_keys(attribute, value)
          unless value.is_a?(Hash)
            results.add_error(attribute.name, "Unsupported type `#{value.class}`, expected `Hash`")
            return
          end
          major_keys = value.keys & attribute.keys.keys
          if major_keys.count.zero?
            results.add_warning('keys', "Missing primary key for `#{attribute.name}` " \
              'attribute. The acceptable ones are: ' \
              "`#{attribute.keys.keys.map(&:to_s).sort.join(', ')}`.")
          elsif major_keys.count == 1
            acceptable = attribute.keys[major_keys.first] || []
            unknown = value.keys - major_keys - acceptable
            unless unknown.empty?
              results.add_warning('keys', "Incompatible `#{unknown.sort.join(', ')}` " \
                "key(s) with `#{major_keys.first}` primary key for " \
                "`#{attribute.name}` attribute.")
            end
          else
            sorted_keys = major_keys.map(&:to_s).sort
            results.add_warning('keys', "Incompatible `#{sorted_keys.join(', ')}` " \
              "keys for `#{attribute.name}` attribute.")
          end
        end
      end
    end
  end
end
