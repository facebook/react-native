module Pod
  class Command
    class Lib < Command
      class Create < Lib
        self.summary = 'Creates a new Pod'

        self.description = <<-DESC
          Creates a scaffold for the development of a new Pod named `NAME`
          according to the CocoaPods best practices.
          If a `TEMPLATE_URL`, pointing to a git repo containing a compatible
          template, is specified, it will be used in place of the default one.
        DESC

        self.arguments = [
          CLAide::Argument.new('NAME', true),
        ]

        def self.options
          [
            ['--template-url=URL', 'The URL of the git repo containing a compatible template'],
          ].concat(super)
        end

        def initialize(argv)
          @name = argv.shift_argument
          @template_url = argv.option('template-url', TEMPLATE_REPO)
          super
          @additional_args = argv.remainder!
        end

        def validate!
          super
          help! 'A name for the Pod is required.' unless @name
          help! 'The Pod name cannot contain spaces.' if @name =~ /\s/
          help! 'The Pod name cannot contain plusses.' if @name =~ /\+/
          help! "The Pod name cannot begin with a '.'" if @name[0, 1] == '.'
        end

        def run
          clone_template
          configure_template
          print_info
        end

        private

        #----------------------------------------#

        # !@group Private helpers

        extend Executable
        executable :git

        TEMPLATE_REPO = 'https://github.com/CocoaPods/pod-template.git'.freeze
        TEMPLATE_INFO_URL = 'https://github.com/CocoaPods/pod-template'.freeze
        CREATE_NEW_POD_INFO_URL = 'https://guides.cocoapods.org/making/making-a-cocoapod'.freeze

        # Clones the template from the remote in the working directory using
        # the name of the Pod.
        #
        # @return [void]
        #
        def clone_template
          UI.section("Cloning `#{template_repo_url}` into `#{@name}`.") do
            git! ['clone', template_repo_url, @name]
          end
        end

        # Runs the template configuration utilities.
        #
        # @return [void]
        #
        def configure_template
          UI.section("Configuring #{@name} template.") do
            Dir.chdir(@name) do
              if File.exist?('configure')
                system({ 'COCOAPODS_VERSION' => Pod::VERSION }, './configure', @name, *@additional_args)
              else
                UI.warn 'Template does not have a configure file.'
              end
            end
          end
        end

        # Runs the template configuration utilities.
        #
        # @return [void]
        #
        def print_info
          UI.puts "\nTo learn more about the template see `#{template_repo_url}`."
          UI.puts "To learn more about creating a new pod, see `#{CREATE_NEW_POD_INFO_URL}`."
        end

        # Checks if a template URL is given else returns the TEMPLATE_REPO URL
        #
        # @return String
        #
        def template_repo_url
          @template_url || TEMPLATE_REPO
        end
      end
    end
  end
end
