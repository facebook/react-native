require 'xcodeproj'
require 'active_support/core_ext/string/strip'

module Pod
  class Command
    class Init < Command
      self.summary = 'Generate a Podfile for the current directory'
      self.description = <<-DESC
        Creates a Podfile for the current directory if none currently exists. If
        an `XCODEPROJ` project file is specified or if there is only a single
        project file in the current directory, targets will be automatically
        generated based on targets defined in the project.

        It is possible to specify a list of dependencies which will be used by
        the template in the `Podfile.default` (normal targets) `Podfile.test`
        (test targets) files which should be stored in the
        `#{Config.instance.templates_dir}` folder.
      DESC
      self.arguments = [
        CLAide::Argument.new('XCODEPROJ', :false),
      ]

      def initialize(argv)
        @podfile_path = Pathname.pwd + 'Podfile'
        @project_path = argv.shift_argument
        @project_paths = Pathname.pwd.children.select { |pn| pn.extname == '.xcodeproj' }
        super
      end

      def validate!
        super
        raise Informative, 'Existing Podfile found in directory' unless config.podfile_path_in_dir(Pathname.pwd).nil?
        if @project_path
          help! "Xcode project at #{@project_path} does not exist" unless File.exist? @project_path
          project_path = @project_path
        else
          raise Informative, 'No Xcode project found, please specify one' unless @project_paths.length > 0
          raise Informative, 'Multiple Xcode projects found, please specify one' unless @project_paths.length == 1
          project_path = @project_paths.first
        end
        @xcode_project = Xcodeproj::Project.open(project_path)
      end

      def run
        @podfile_path.open('w') { |f| f << podfile_template(@xcode_project) }
      end

      private

      # @param  [Xcodeproj::Project] project
      #         The Xcode project to generate a podfile for.
      #
      # @return [String] the text of the Podfile for the provided project
      #
      def podfile_template(project)
        podfile = ''
        podfile << "project '#{@project_path}'\n\n" if @project_path
        podfile << <<-PLATFORM.strip_heredoc
          # Uncomment the next line to define a global platform for your project
          # platform :ios, '9.0'
        PLATFORM

        # Split out the targets into app and test targets
        test_targets, app_targets = project.native_targets.sort_by { |t| t.name.downcase }.partition(&:test_target_type?)

        app_targets.each do |app_target|
          test_targets_for_app = test_targets.select do |target|
            target.name.downcase.start_with?(app_target.name.downcase)
          end
          podfile << target_module(app_target, test_targets_for_app)
        end

        podfile
      end

      # @param [PBXNativeTarget] host the native host target for the module.
      #
      # @param [Array<PBXNativeTarget>] tests the native test targets for the module.
      #
      # @return [String] the text for the target module.
      #
      def target_module(host, tests)
        target_module = "\ntarget '#{host.name.gsub(/'/, "\\\\\'")}' do\n"

        target_module << <<-RUBY
  # Comment the next line if you don't want to use dynamic frameworks
  use_frameworks!

         RUBY

        target_module << template_contents(config.default_podfile_path, '  ', "Pods for #{host.name}\n")

        tests.each do |test|
          target_module << "\n  target '#{test.name.gsub(/'/, "\\\\\'")}' do\n"
          unless Pod::AggregateTarget::EMBED_FRAMEWORKS_IN_HOST_TARGET_TYPES.include?(host.symbol_type) || test.symbol_type == :ui_test_bundle
            target_module << "    inherit! :search_paths\n"
          end
          target_module << template_contents(config.default_test_podfile_path, '    ', 'Pods for testing')
          target_module << "\n  end\n"
        end

        target_module << "\nend\n"
      end

      # @param [Pathname] path the path of the template to load contents from.
      #
      # @param [String] prefix the prefix to use for each line.
      #
      # @param [String] fallback the fallback contents to use if the path for the template does not exist.
      #
      # @return [String] the template contents for the given path.
      #
      def template_contents(path, prefix, fallback)
        if path.exist?
          path.read.chomp.lines.map { |line| "#{prefix}#{line}" }.join("\n")
        else
          "#{prefix}# #{fallback}"
        end
      end
    end
  end
end
