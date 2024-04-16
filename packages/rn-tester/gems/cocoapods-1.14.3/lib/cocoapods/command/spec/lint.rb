module Pod
  class Command
    class Spec < Command
      class Lint < Spec
        self.summary = 'Validates a spec file'

        self.description = <<-DESC
          Validates `NAME.podspec`. If a `DIRECTORY` is provided, it validates
          the podspec files found, including subfolders. In case
          the argument is omitted, it defaults to the current working dir.
        DESC

        self.arguments = [
          CLAide::Argument.new(%w(NAME.podspec DIRECTORY http://PATH/NAME.podspec), false, true),
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
            ['--skip-import-validation', 'Lint skips validating that the pod can be imported'],
            ['--skip-tests', 'Lint skips building and running tests during validation'],
            ['--test-specs=test-spec1,test-spec2,etc', 'List of test specs to run'],
            ['--analyze', 'Validate with the Xcode Static Analysis tool'],
            ['--configuration=CONFIGURATION', 'Build using the given configuration (defaults to Release)'],
            ['--validation-dir', 'The directory to use for validation. If none is specified a temporary directory will be used.'],
          ].concat(super)
        end

        def initialize(argv)
          @quick           = argv.flag?('quick')
          @allow_warnings  = argv.flag?('allow-warnings')
          @clean           = argv.flag?('clean', true)
          @fail_fast       = argv.flag?('fail-fast', false)
          @subspecs        = argv.flag?('subspecs', true)
          @only_subspec    = argv.option('subspec')
          @use_frameworks  = !argv.flag?('use-libraries')
          @use_modular_headers = argv.flag?('use-modular-headers')
          @use_static_frameworks = argv.flag?('use-static-frameworks')
          @source_urls     = argv.option('sources', Pod::TrunkSource::TRUNK_REPO_URL).split(',')
          @platforms       = argv.option('platforms', '').split(',')
          @private         = argv.flag?('private', false)
          @swift_version   = argv.option('swift-version', nil)
          @skip_import_validation = argv.flag?('skip-import-validation', false)
          @skip_tests      = argv.flag?('skip-tests', false)
          @test_specs      = argv.option('test-specs', nil)&.split(',')
          @analyze         = argv.flag?('analyze', false)
          @podspecs_paths  = argv.arguments!
          @configuration   = argv.option('configuration', nil)
          @validation_dir = argv.option('validation-dir', nil)
          super
        end

        def run
          UI.puts
          failure_reasons = []
          podspecs_to_lint.each do |podspec|
            validator                = Validator.new(podspec, @source_urls, @platforms)
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
            validator.configuration = @configuration
            validator.validation_dir = @validation_dir
            validator.validate
            failure_reasons << validator.failure_reason

            unless @clean
              UI.puts "Pods workspace available at `#{validator.validation_dir}/App.xcworkspace` for inspection."
              UI.puts
            end
          end

          count = podspecs_to_lint.count
          UI.puts "Analyzed #{count} #{'podspec'.pluralize(count)}.\n\n"

          failure_reasons.compact!
          if failure_reasons.empty?
            lint_passed_message = count == 1 ? "#{podspecs_to_lint.first.basename} passed validation." : 'All the specs passed validation.'
            UI.puts lint_passed_message.green << "\n\n"
          else
            raise Informative, if count == 1
                                 "The spec did not pass validation, due to #{failure_reasons.first}."
                               else
                                 "#{failure_reasons.count} out of #{count} specs failed validation."
                               end
          end
          podspecs_tmp_dir.rmtree if podspecs_tmp_dir.exist?
        end

        private

        def podspecs_to_lint
          @podspecs_to_lint ||= begin
            files = []
            @podspecs_paths << '.' if @podspecs_paths.empty?
            @podspecs_paths.each do |path|
              if path =~ %r{https?://}
                require 'cocoapods/open-uri'
                output_path = podspecs_tmp_dir + File.basename(path)
                output_path.dirname.mkpath
                begin
                  OpenURI.open_uri(path) do |io|
                    output_path.open('w') { |f| f << io.read }
                  end
                rescue => e
                  raise Informative, "Downloading a podspec from `#{path}` failed: #{e}"
                end
                files << output_path
              elsif (pathname = Pathname.new(path)).directory?
                files += Pathname.glob(pathname + '*.podspec{.json,}')
                raise Informative, 'No specs found in the current directory.' if files.empty?
              else
                files << (pathname = Pathname.new(path))
                raise Informative, "Unable to find a spec named `#{path}'." unless pathname.exist? && path.include?('.podspec')
              end
            end
            files
          end
        end

        def podspecs_tmp_dir
          Pathname.new(Dir.tmpdir) + 'CocoaPods/Lint_podspec'
        end
      end
    end
  end
end
