
module Pod
  class Command
    class Plugins
      # The `installed` subcommand.
      # Used to list all installed plugins.
      #
      class Installed < Plugins
        self.summary = 'List plugins installed on your machine'
        self.description = <<-DESC
                List all installed plugins and their
                respective version.
        DESC

        def self.options
          # Silent mode is meaningless for this command as
          # the command only purpose is to print information
          super.reject { |option, _| option == '--silent' }
        end

        def run
          plugins = CLAide::Command::PluginManager.specifications

          UI.title 'Installed CocoaPods Plugins:' do
            if verbose?
              print_verbose_list(plugins)
            else
              print_compact_list(plugins)
            end
          end
        end

        private

        # Print the given plugins as a compact list, one line
        #   per plugin with only its name & version
        #
        # @param [Array<Gem::Specification>] plugins
        #        The list of plugins to print
        #
        def print_compact_list(plugins)
          max_length = plugins.map { |p| p.name.length }.max
          plugins.each do |plugin|
            name_just = plugin.name.ljust(max_length)
            hooks = registered_hooks(plugin)
            hooks_list = ''
            unless hooks.empty?
              suffix = 'hook'.pluralize(hooks.count)
              hooks_list = " (#{hooks.to_sentence} #{suffix})"
            end
            UI.puts_indented " - #{name_just} : #{plugin.version}#{hooks_list}"
          end
        end

        # Print the given plugins as a verbose list, with name, version,
        #   homepage and summary for each plugin.
        #
        # @param [Array<Gem::Specification>] plugins
        #        The list of plugins to print
        #
        def print_verbose_list(plugins)
          plugins.each do |plugin|
            hooks = registered_hooks(plugin)

            UI.title(plugin.name)
            UI.labeled('Version', plugin.version.to_s)
            UI.labeled('Hooks', hooks) unless hooks.empty?
            unless plugin.homepage.empty?
              UI.labeled('Homepage', plugin.homepage)
            end
            UI.labeled('Summary', plugin.summary)
          end
        end

        # Names of the registered hook(s) (if any) for the given plugin
        #
        # @return [Array<String>]
        #         Names of the hooks the given plugin did register for.
        #
        def registered_hooks(plugin)
          registrations = Pod::HooksManager.registrations
          return [] if registrations.nil?

          registrations.reduce([]) do |list, (name, hooks)|
            list.push(name) if hooks.any? { |h| h.plugin_name == plugin.name }
            list
          end
        end
      end
    end
  end
end
