module Pod
  class Installer
    # Validate the podfile before installing to catch errors and
    # problems
    #
    class PodfileValidator
      # @return [Podfile] The podfile being validated
      #
      attr_reader :podfile

      # @return [Array<String>] any errors that have occurred during the validation
      #
      attr_reader :errors

      # @return [Array<String>] any warnings that have occurred during the validation
      #
      attr_reader :warnings

      # Initialize a new instance
      #
      # @param [Podfile] podfile
      #        The podfile to validate
      #
      # @param [Analyzer::PodfileDependencyCache] podfile_dependency_cache
      #        An (optional) cache of all the dependencies in the podfile
      #
      def initialize(podfile, podfile_dependency_cache = Analyzer::PodfileDependencyCache.from_podfile(podfile))
        @podfile = podfile
        @podfile_dependency_cache = podfile_dependency_cache
        @errors = []
        @warnings = []
        @validated = false
      end

      # Validate the podfile
      # Errors are added to the errors array
      #
      def validate
        validate_installation_options
        validate_pod_directives
        validate_no_abstract_only_pods!
        validate_dependencies_are_present!
        validate_no_duplicate_targets!

        @validated = true
      end

      # Wether the podfile is valid is not
      # NOTE: Will execute `validate` if the podfile
      # has not yet been validated
      #
      def valid?
        validate unless @validated

        @validated && errors.empty?
      end

      # A message describing any errors in the
      # validation
      #
      def message
        errors.join("\n")
      end

      private

      def add_error(error)
        errors << error
      end

      def add_warning(warning)
        warnings << warning
      end

      def validate_installation_options
        installation_options = podfile.installation_options

        # Validate `incremental_installation` depends on `generate_multiple_pod_projects`
        invalid = installation_options.incremental_installation? && installation_options.incremental_installation != installation_options.generate_multiple_pod_projects
        add_error 'The installation option `incremental_installation` requires the option `generate_multiple_pod_projects` to also be enabled.' if invalid
      end

      def validate_pod_directives
        @podfile_dependency_cache.podfile_dependencies.each do |dependency|
          validate_conflicting_external_sources!(dependency)
        end
      end

      def validate_conflicting_external_sources!(dependency)
        external_source = dependency.external_source
        return false if external_source.nil?

        available_downloaders = Downloader.downloader_class_by_key.keys
        specified_downloaders = external_source.select { |key| available_downloaders.include?(key) }
        if specified_downloaders.size > 1
          add_error "The dependency `#{dependency.name}` specifies more than one download strategy(#{specified_downloaders.keys.join(',')})." \
            'Only one is allowed'
        end

        pod_spec_or_path = external_source[:podspec].present? || external_source[:path].present?
        if pod_spec_or_path && specified_downloaders.size > 0
          add_error "The dependency `#{dependency.name}` specifies `podspec` or `path` in combination with other" \
            ' download strategies. This is not allowed'
        end
      end

      # Warns the user if the podfile is empty.
      #
      # @note   The workspace is created in any case and all the user projects
      #         are added to it, however the projects are not integrated as
      #         there is no way to discern between target definitions which are
      #         empty and target definitions which just serve the purpose to
      #         wrap other ones. This is not an issue because empty target
      #         definitions generate empty libraries.
      #
      # @return [void]
      #
      def validate_dependencies_are_present!
        if @podfile_dependency_cache.target_definition_list.all?(&:empty?)
          add_warning 'The Podfile does not contain any dependencies.'
        end
      end

      # Verifies that no dependencies in the Podfile will end up not being built
      # at all. In other words, all dependencies should belong to a non-abstract
      # target, or be inherited by a target where `inheritance == complete`.
      #
      def validate_no_abstract_only_pods!
        @podfile_dependency_cache.target_definition_list.each do |target_definition|
          dependencies = @podfile_dependency_cache.target_definition_dependencies(target_definition)
          next if dependencies.empty?
          next unless target_definition.abstract?

          children = target_definition.recursive_children
          next if children.any? { |child_target_definition| target_definition_inherits?(:parent => target_definition, :child => child_target_definition) }

          add_warning "The abstract target #{target_definition.name} is not inherited by a concrete target, " \
            "so the following dependencies won't make it into any targets in your project:" \
            "\n    - #{dependencies.map(&:to_s).sort.join("\n    - ")}"

          next if target_definition.platform

          add_error "The abstract target #{target_definition.name} must specify a platform since its dependencies are not inherited by a concrete target."
        end
      end

      def target_definition_inherits?(parent: nil, child: nil)
        if parent == child
          true
        elsif child.exclusive?
          false
        else
          target_definition_inherits?(:parent => parent, :child => child.parent)
        end
      end

      def validate_no_duplicate_targets!
        @podfile_dependency_cache.target_definition_list.group_by { |td| [td.name, td.user_project_path] }.
          each do |(name, project), definitions|
          next unless definitions.size > 1
          error = "The target `#{name}` is declared multiple times"
          error << " for the project `#{project}`" if project
          add_error(error << '.')
        end
      end
    end
  end
end
