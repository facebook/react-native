module Pod
  class Specification
    module DSL
      # Provides the accessors methods for the root attributes. Root attributes
      # do not support multi-platform values and inheritance.
      #
      module RootAttributesAccessors
        # @return [String] The name of the specification *not* including the
        #         names of the parents, in case of ‘sub-specifications’.
        #
        def base_name
          attributes_hash['name']
        end

        # @return [String] The name of the specification including the names of
        #         the parents, in case of ‘sub-specifications’.
        #
        def name
          parent ? "#{parent.name}/#{base_name}" : base_name
        end

        # @return [Bool, String, Array<String>] The requires_arc value.
        #
        def requires_arc
          attributes_hash['requires_arc']
        end

        # @return [Version] The version of the Pod.
        #
        def version
          if root?
            @version ||= Version.new(attributes_hash['version'])
          else
            @version ||= root.version
          end
        end

        # @deprecated in favor of #swift_versions
        #
        # @return [Version] The Swift version specified by the specification.
        #
        def swift_version
          swift_versions.last
        end

        # @return [Array<Version>] The Swift versions supported by the specification.
        #
        def swift_versions
          @swift_versions ||= begin
            swift_versions = Array(attributes_hash['swift_versions']).dup
            # Pre 1.7.0, the DSL was singularized as it supported only a single version of Swift. In 1.7.0 the DSL
            # is now pluralized always and a specification can support multiple versions of Swift. This ensures
            # we parse the old JSON serialized format and include it as part of the Swift versions supported.
            swift_versions << attributes_hash['swift_version'] unless attributes_hash['swift_version'].nil?
            swift_versions.map { |swift_version| Version.new(swift_version) }.uniq.sort
          end
        end

        # @return [Requirement] The CocoaPods version required to use the specification.
        #
        def cocoapods_version
          @cocoapods_version ||= Requirement.create(attributes_hash['cocoapods_version'])
        end

        # @return [Hash] a hash containing the authors as the keys and their
        #         email address as the values.
        #
        # @note   The value is coerced to a hash with a nil email if needed.
        #
        # @example Possible values
        #
        #   { 'Author' => 'email@host.com' }
        #   [ 'Author', { 'Author_2' => 'email@host.com' } ]
        #   [ 'Author', 'Author_2' ]
        #   'Author'
        #
        def authors
          authors = attributes_hash['authors']
          if authors.is_a?(Hash)
            authors
          elsif authors.is_a?(Array)
            result = {}
            authors.each do |name_or_hash|
              if name_or_hash.is_a?(String)
                result[name_or_hash] = nil
              else
                result.merge!(name_or_hash)
              end
            end
            result
          elsif authors.is_a?(String)
            { authors => nil }
          end
        end

        # @return [String] The social media URL.
        #
        def social_media_url
          attributes_hash['social_media_url']
        end

        # @return [String] The readme.
        #
        def readme
          attributes_hash['readme']
        end

        # @return [String] The changelog.
        #
        def changelog
          attributes_hash['changelog']
        end

        # @return [Hash] A hash containing the license information of the Pod.
        #
        # @note   The indentation is stripped from the license text.
        #
        def license
          license = attributes_hash['license']
          if license.is_a?(String)
            { :type => license }
          elsif license.is_a?(Hash)
            license = Specification.convert_keys_to_symbol(license)
            license[:text] = license[:text].strip_heredoc if license[:text]
            license
          else
            {}
          end
        end

        # @return [String] The URL of the homepage of the Pod.
        #
        def homepage
          attributes_hash['homepage']
        end

        # @return [Hash{Symbol=>String}] The location from where the library
        #         should be retrieved.
        #
        def source
          value = attributes_hash['source']
          if value && value.is_a?(Hash)
            Specification.convert_keys_to_symbol(value)
          else
            value
          end
        end

        # @return [String] A short description of the Pod.
        #
        def summary
          summary = attributes_hash['summary']
          summary.strip_heredoc.chomp if summary
        end

        # @return [String] A longer description of the Pod.
        #
        # @note   The indentation is stripped from the description.
        #
        def description
          description = attributes_hash['description']
          description.strip_heredoc.chomp if description
        end

        # @return [Array<String>] The list of the URL for the screenshots of
        #         the Pod.
        #
        # @note   The value is coerced to an array.
        #
        def screenshots
          value = attributes_hash['screenshots']
          [*value]
        end

        # @return [String, Nil] The documentation URL of the Pod if specified.
        #
        def documentation_url
          attributes_hash['documentation_url']
        end

        # @return [String, Nil] The prepare command of the Pod if specified.
        #
        def prepare_command
          command = attributes_hash['prepare_command']
          command.strip_heredoc.chomp if command
        end

        # @return [Boolean] Indicates, that if use_frameworks! is specified, the
        #         framework should include a static library.
        #
        def static_framework
          attributes_hash['static_framework']
        end

        # @return [Boolean] Whether the Pod has been deprecated.
        #
        def deprecated
          attributes_hash['deprecated']
        end

        # @return [String] The name of the Pod that this one has been
        #         deprecated in favor of.
        #
        def deprecated_in_favor_of
          attributes_hash['deprecated_in_favor_of']
        end

        # @return [Boolean] Wether the pod is deprecated either in favor of some other
        #         pod or simply deprecated.
        #
        def deprecated?
          deprecated || !deprecated_in_favor_of.nil?
        end

        # @return [String, Nil] The custom module map file of the Pod,
        #         if specified.
        #
        def module_map
          attributes_hash['module_map']
        end

        #---------------------------------------------------------------------#
      end
    end
  end
end
