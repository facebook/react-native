module Pod
  class Source
    # Checks a source for errors and warnings.
    #
    class HealthReporter
      # @return [Source] the source to check.
      #
      attr_reader :source

      # @param  [Pathname] repo @see Source#repo.
      #
      def initialize(repo)
        @source = Source.new(repo)
        @errors = {}
        @linter_results = {}
      end

      public

      # @!group Configuration
      #-----------------------------------------------------------------------#

      # Allows to specify an optional callback which is called before
      # analysing every spec. Suitable for UI.
      #
      # @param  [Proc] A callback which is called before checking any
      #         specification. It receives the name and the version of the
      #         spec.
      #
      # @return [void]
      #
      def pre_check(&block)
        @pre_check_callback = block
      end

      public

      # @!group Actions
      #-----------------------------------------------------------------------#

      # Analyzes all the specification files in the source.
      #
      # @return [HealthReport] A report which contains the information about the
      #         state of the source.
      #
      def analyze
        @report = HealthReport.new(source)

        source.pods.each do |name|
          source.versions(name).each do |version|
            @pre_check_callback.call(name, version) if @pre_check_callback
            spec_path = source.specification_path(name, version)
            spec = lint_spec(name, version, spec_path)
            check_spec_path(name, version, spec) if spec
            report.analyzed_paths << spec_path
          end
        end

        check_stray_specs
        report
      end

      # @return [HealtReport] The report produced by the analysis.
      #
      attr_reader :report

      private

      # @!group Private helpers
      #-----------------------------------------------------------------------#

      # Checks the validity of the specification with the linter.
      #
      # @param  [String] name
      #         The name of the Pod.
      #
      # @param  [Version] version
      #         The version of the specification.
      #
      # @param  [Pathname] spec_path
      #         The path of the specification to check.
      #
      # @return [Specification] The specification loaded by the linter.
      # @return [Nil] If the specifications raised during evaluation.
      #
      def lint_spec(name, version, spec_path)
        linter = Specification::Linter.new(spec_path)
        linter.lint
        linter.results.each do |result|
          next if result.public_only?
          report.add_message(result.type, result.message, name, version)
        end
        linter.spec
      end

      # Ensures that the name and the version of the specification correspond
      # to the ones expected by the repo given its path.
      #
      # @param  [String] name
      #         The name of the Pod.
      #
      # @param  [Version] version
      #         The version of the specification.
      #
      # @param  [Specification] spec
      #         The specification to check.
      #
      # @return [void]
      #
      def check_spec_path(name, version, spec)
        unless spec.name == name && spec.version.to_s == version.to_s
          message = "Incorrect path #{spec.defined_in_file}"
          report.add_message(:error, message, name, spec.version)
        end
      end

      # Checks for any stray specification in the repo.
      #
      # @param  [Array<Pathname>] analyzed_paths
      #         The specification to check.
      #
      # @return [void]
      #
      def check_stray_specs
        all_paths = Pathname.glob(source.repo + '**/*.podspec{,.json}')
        stray_specs = all_paths - report.analyzed_paths
        stray_specs.each do |path|
          report.add_message(:error, 'Stray spec', path)
        end
      end

      #-----------------------------------------------------------------------#

      # Encapsulates the information about the state of a repo.
      #
      class HealthReport
        # @return [Source] the source analyzed.
        #
        attr_reader :source

        # @param [Source] @see source.
        #
        def initialize(source)
          @source = source
          @analyzed_paths = []
          @pods_by_error = {}
          @pods_by_warning = {}
        end

        # @return [Array<Pathname>] The list of the analyzed paths.
        #
        attr_accessor :analyzed_paths

        # @return [Hash{ String => Hash }] The pods (the version grouped by
        #         name) grouped by an error message.
        #
        attr_accessor :pods_by_error

        # @return [Hash{ String => Hash }] The pods (the version grouped by
        #         name) grouped by a warning message.
        #
        attr_accessor :pods_by_warning

        # Adds a message with the given type for the specification with the
        # given name and version.
        #
        # @param  [Symbol] type
        #         The type of message. Either `:error` or `:warning`.
        #
        # @param  [String] message
        #         The contents of the message.
        #
        # @param  [String] spec_name
        #         The name of the Pod.
        #
        # @param  [String] spec_version
        #         The version of the specification.
        #
        # @return [void]
        #
        def add_message(type, message, spec_name, spec_version = nil)
          pods = send(:"pods_by_#{type}")
          pods[message] ||= {}
          pods[message][spec_name] ||= []
          pods[message][spec_name] << spec_version
        end
      end

      #-----------------------------------------------------------------------#
    end
  end
end
