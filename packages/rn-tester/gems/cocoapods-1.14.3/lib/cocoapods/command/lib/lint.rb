module Pod
  class Command
    class Lib < Command
      class Lint < Lib
        self.summary = 'Validates a Pod'

        self.description = <<-DESC
          Validates the Pod using the files in the working directory.
        DESC

        self.arguments = [
          CLAide::Argument.new('PODSPEC_PATHS', false, true),
        ]

        def self.options
          [
            ['--quick', 'Lint skips checks that would require to download and build the spec'],
            ['--allow-warnings', 'Lint validates even if warnings are present'],
            ['--subspec=NAME', 'Lint validates only the given subspec'],
            ['--no-subspecs', 'Lint skips validation of subspecs'],
            ['--no-clean', 'Lint leaves the build directory intact for inspection'],
            ['--fail-fast', 'Lint stops on the first failing platform or subspec'],
            ['--use-libraries', 'Lint uses static libraries to install the spec'],
            ['--use-modular-headers', 'Lint uses modular headers during installation'],
            ['--use-static-frameworks', 'Lint uses static frameworks during installation'],
            ["--sources=#{Pod::TrunkSource::TRUNK_REPO_URL}", 'The sources from which to pull dependent pods ' \
              "(defaults to #{Pod::TrunkSource::TRUNK_REPO_URL}). Multiple sources must be comma-delimited"],
            ['--platforms=ios,macos', 'Lint against specific platforms (defaults to all platforms supported by the ' \
              'podspec). Multiple platforms must be comma-delimited'],
            ['--private', 'Lint skips checks that apply only to public specs'],
            ['--swift-version=VERSION', 'The `SWIFT_VERSION` that should be used to lint the spec. ' \
             'This takes precedence over the Swift versions specified by the spec or a `.swift-version` file'],
            ['--include-podspecs=**/*.podspec', 'Additional ancillary podspecs which are used for linting via :path'],
            ['--external-podspecs=**/*.podspec', 'Additional ancillary podspecs which are used for linting '\
              'via :podspec. If there are --include-podspecs, then these are removed from them'],
            ['--skip-import-validation', 'Lint skips validating that the pod can be imported'],
            ['--skip-tests', 'Lint skips building and running tests during validation'],
            ['--test-specs=test-spec1,test-spec2,etc', 'List of test specs to run'],
            ['--analyze', 'Validate with the Xcode Static Analysis tool'],
            ['--configuration=CONFIGURATION', 'Build using the given configuration (defaults to Release)'],
            ['--validation-dir', 'The directory to use for validation. If none is specified a temporary directory will be used.'],
          ].concat(super)
        end

        def initialize(argv)
          @quick               = argv.flag?('quick')
          @allow_warnings      = argv.flag?('allow-warnings')
          @clean               = argv.flag?('clean', true)
          @fail_fast           = argv.flag?('fail-fast', false)
          @subspecs            = argv.flag?('subspecs', true)
          @only_subspec        = argv.option('subspec')
          @use_frameworks      = !argv.flag?('use-libraries')
          @use_modular_headers = argv.flag?('use-modular-headers')
          @use_static_frameworks = argv.flag?('use-static-frameworks')
          @source_urls         = argv.option('sources', Pod::TrunkSource::TRUNK_REPO_URL).split(',')
          @platforms           = argv.option('platforms', '').split(',')
          @private             = argv.flag?('private', false)
          @swift_version       = argv.option('swift-version', nil)
          @include_podspecs    = argv.option('include-podspecs', nil)
          @external_podspecs   = argv.option('external-podspecs', nil)
          @skip_import_validation = argv.flag?('skip-import-validation', false)
          @skip_tests          = argv.flag?('skip-tests', false)
          @test_specs          = argv.option('test-specs', nil)&.split(',')
          @analyze             = argv.flag?('analyze', false)
          @podspecs_paths      = argv.arguments!
          @configuration       = argv.option('configuration', nil)
          @validation_dir      = argv.option('validation-dir', nil)
          super
        end

        def validate!
          super
        end

        def run
          UI.puts
          podspecs_to_lint.each do |podspec|
            validator                = Validator.new(podspec, @source_urls, @platforms)
            validator.local          = true
            validator.quick          = @quick
            validator.no_clean       = !@clean
            validator.fail_fast      = @fail_fast
            validator.allow_warnings = @allow_warnings
            validator.no_subspecs    = !@subspecs || @only_subspec
            validator.only_subspec   = @only_subspec
            validator.use_frameworks = @use_frameworks
            validator.use_modular_headers = @use_modular_headers
            validator.use_static_frameworks = @use_static_frameworks
            validator.ignore_public_only_results = @private
            validator.swift_version = @swift_version
            validator.skip_import_validation = @skip_import_validation
            validator.skip_tests = @skip_tests
            validator.test_specs = @test_specs
            validator.analyze = @analyze
            validator.include_podspecs = @include_podspecs
            validator.external_podspecs = @external_podspecs
            validator.configuration = @configuration
            validator.validation_dir = @validation_dir
            validator.validate

            unless @clean
              UI.puts "Pods workspace available at `#{validator.validation_dir}/App.xcworkspace` for inspection."
              UI.puts
            end
            if validator.validated?
              UI.puts "#{validator.spec.name} passed validation.".green
            else
              spec_name = podspec
              spec_name = validator.spec.name if validator.spec
              message = "#{spec_name} did not pass validation, due to #{validator.failure_reason}."

              if @clean
                message << "\nYou can use the `--no-clean` option to inspect " \
                  'any issue.'
              end
              raise Informative, message
            end
          end
        end

        private

        #----------------------------------------#

        # !@group Private helpers

        # @return [Pathname] The path of the podspec found in the current
        #         working directory.
        #
        # @raise  If no podspec is found.
        # @raise  If multiple podspecs are found.
        #
        def podspecs_to_lint
          if !@podspecs_paths.empty?
            Array(@podspecs_paths)
          else
            podspecs = Pathname.glob(Pathname.pwd + '*.podspec{.json,}')
            if podspecs.count.zero?
              raise Informative, 'Unable to find a podspec in the working ' \
                'directory'
            end
            podspecs
          end
        end
      end
    end
  end
end
