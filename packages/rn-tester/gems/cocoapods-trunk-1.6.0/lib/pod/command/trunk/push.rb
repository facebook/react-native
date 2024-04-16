module Pod
  class Command
    class Trunk
      # @CocoaPods 0.33.0
      #
      class Push < Trunk
        self.summary = 'Publish a podspec'
        self.description = <<-DESC
                Publish the podspec at `PATH` to make it available to all users of
                the ‘trunk’ spec-repo. If `PATH` is not provided, defaults to the
                current directory.

                Before pushing the podspec to cocoapods.org, this will perform a local
                lint of the podspec, including a build of the library. However, it
                remains *your* responsibility to ensure that the published podspec
                will actually work for your users. Thus it is recommended that you
                *first* try to use the podspec to integrate the library into your demo
                and/or real application.

                If this is the first time you publish a spec for this pod, you will
                automatically be registered as the ‘owner’ of this pod. (Note that
                ‘owner’ in this case implies a person that is allowed to publish new
                versions and add other ‘owners’, not necessarily the library author.)
        DESC

        self.arguments = [
          CLAide::Argument.new('PATH', false),
        ]

        def self.options
          [
            ['--allow-warnings', 'Allows push even if there are lint warnings'],
            ['--use-libraries', 'Linter uses static libraries to install the spec'],
            ['--use-modular-headers', 'Lint uses modular headers during installation'],
            ['--swift-version=VERSION', 'The SWIFT_VERSION that should be used to lint the spec. ' \
             'This takes precedence over a .swift-version file.'],
            ['--skip-import-validation', 'Lint skips validating that the pod can be imported'],
            ['--skip-tests', 'Lint skips building and running tests during validation'],
            ['--synchronous', 'If validation depends on other recently pushed pods, synchronize'],
          ].concat(super)
        end

        def initialize(argv)
          @allow_warnings = argv.flag?('allow-warnings', false)
          @use_frameworks = !argv.flag?('use-libraries')
          @use_modular_headers = argv.flag?('use-modular-headers')
          @swift_version = argv.option('swift-version', nil)
          @skip_import_validation = argv.flag?('skip-import-validation', false)
          @skip_tests = argv.flag?('skip-tests', false)
          @path = argv.shift_argument || '.'
          @synchronous = argv.flag?('synchronous', false)
          find_podspec_file if File.directory?(@path)
          super
        end

        def validate!
          super
          unless token
            help! 'You need to run `pod trunk register` to register a session first.'
          end
          unless @path
            help! 'Please specify the path to the podspec file.'
          end
          unless File.exist?(@path) && !File.directory?(@path)
            help! "The specified path `#{@path}` does not point to " \
                    'an existing podspec file.'
          end
        end

        def run
          update_master_repo
          validate_podspec
          status, json = push_to_trunk
          update_master_repo

          if (400...600).cover?(status)
            print_messages(json['data_url'], json['messages'], nil)
          else
            print_messages(json['data_url'], json['messages'], spec, 'published')
          end
        end

        private

        MASTER_GIT_REPO_URL = 'https://github.com/CocoaPods/Specs.git'.freeze

        def push_to_trunk
          spec.attributes_hash[:pushed_with_swift_version] = @swift_version if @swift_version
          response = request_path(:post, "pods?allow_warnings=#{@allow_warnings}",
                                  spec.to_json, auth_headers)
          url = response.headers['location'].first
          return response.status_code, json(request_url(:get, url, default_headers))
        rescue REST::Error => e
          raise Informative, 'There was an error pushing a new version ' \
                                   "to trunk: #{e.message}"
        end

        def find_podspec_file
          podspecs = Dir[Pathname(@path) + '*.podspec{.json,}']
          case podspecs.count
          when 0
            UI.notice "No podspec found in directory `#{@path}`"
          when 1
            UI.notice "Found podspec `#{podspecs[0]}`"
          else
            UI.notice "Multiple podspec files in directory `#{@path}`. " \
                        'You need to explicitly specify which one to use.'
          end
          @path = (podspecs.count == 1) ? podspecs[0] : nil
        end

        def spec
          @spec ||= Pod::Specification.from_file(@path)
        rescue Informative => e # TODO: this should be a more specific error
          raise Informative, 'Unable to interpret the specified path ' \
                             "#{UI.path(@path)} as a podspec (#{e})."
        end

        # Performs a full lint against the podspecs.
        #
        # TODO: Currently copied verbatim from `pod push`.
        def validate_podspec
          UI.puts 'Validating podspec'.yellow

          validator = Validator.new(spec, [repo_url])
          validator.allow_warnings = @allow_warnings
          validator.use_frameworks = @use_frameworks
          if validator.respond_to?(:use_modular_headers=)
            validator.use_modular_headers = @use_modular_headers
          end
          if validator.respond_to?(:swift_version=)
            validator.swift_version = @swift_version
          end
          validator.skip_import_validation = @skip_import_validation
          validator.skip_tests = @skip_tests
          validator.validate
          unless validator.validated?
            raise Informative, "The spec did not pass validation, due to #{validator.failure_reason}."
          end

          # Let the validator's logic for the swift version
          # set the value for the trunk JSON uploader
          @swift_version = validator.respond_to?(:used_swift_version) && validator.used_swift_version
        end

        def repo_url
          @synchronous ? MASTER_GIT_REPO_URL : Pod::TrunkSource::TRUNK_REPO_URL
        end

        def update_master_repo
          # more robust Trunk setup logic:
          # - if Trunk exists, updates it
          # - if Trunk doesn't exist, add it and update it
          #
          repo = sources_manager.find_or_create_source_with_url(repo_url)
          sources_manager.update(repo.name)
        end

        def sources_manager
          if defined?(Pod::SourcesManager)
            Pod::SourcesManager
          else
            config.sources_manager
          end
        end
      end
    end
  end
end
