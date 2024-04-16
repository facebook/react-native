# encoding: UTF-8

require 'rbconfig'
require 'cgi'
require 'gh_inspector'

module Pod
  module UserInterface
    module ErrorReport
      class << self
        def report(exception)
          <<-EOS

#{'――― MARKDOWN TEMPLATE ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――'.reversed}

### Command

```
#{original_command}
```

#{report_instructions}

#{stack}
### Plugins

```
#{plugins_string}
```
#{markdown_podfile}
### Error

```
#{exception.class} - #{exception.message.force_encoding('UTF-8')}
#{exception.backtrace.join("\n") if exception.backtrace}
```

#{'――― TEMPLATE END ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――'.reversed}

#{'[!] Oh no, an error occurred.'.red}
#{error_from_podfile(exception)}
#{'Search for existing GitHub issues similar to yours:'.yellow}
#{issues_url(exception)}

#{'If none exists, create a ticket, with the template displayed above, on:'.yellow}
https://github.com/CocoaPods/CocoaPods/issues/new

#{'Be sure to first read the contributing guide for details on how to properly submit a ticket:'.yellow}
https://github.com/CocoaPods/CocoaPods/blob/master/CONTRIBUTING.md

Don't forget to anonymize any private data!

EOS
        end

        def report_instructions
          <<-EOS
### Report

* What did you do?

* What did you expect to happen?

* What happened instead?
EOS
        end

        def stack
          parts = {
            'CocoaPods' => Pod::VERSION,
            'Ruby' => RUBY_DESCRIPTION,
            'RubyGems' => Gem::VERSION,
            'Host' => host_information,
            'Xcode' => xcode_information,
            'Git' => git_information,
            'Ruby lib dir' => RbConfig::CONFIG['libdir'],
            'Repositories' => repo_information,
          }
          justification = parts.keys.map(&:size).max

          str = <<-EOS
### Stack

```
EOS
          parts.each do |name, value|
            str << name.rjust(justification)
            str << ' : '
            str << Array(value).join("\n" << (' ' * (justification + 3)))
            str << "\n"
          end

          str << "```\n"
        end

        def plugins_string
          plugins = installed_plugins
          max_name_length = plugins.keys.map(&:length).max
          plugins.map do |name, version|
            "#{name.ljust(max_name_length)} : #{version}"
          end.sort.join("\n")
        end

        def markdown_podfile
          return '' unless Config.instance.podfile_path && Config.instance.podfile_path.exist?
          <<-EOS

### Podfile

```ruby
#{Config.instance.podfile_path.read.strip}
```
EOS
        end

        def search_for_exceptions(exception)
          inspector = GhInspector::Inspector.new 'cocoapods', 'cocoapods'
          message_delegate = UserInterface::InspectorReporter.new
          inspector.search_exception exception, message_delegate
        rescue => e
          warn "Searching for inspections failed: #{e}"
          nil
        end

        private

        def `(other)
          super
        rescue Errno::ENOENT => e
          "Unable to find an executable (#{e})"
        end

        def pathless_exception_message(message)
          message.gsub(/- \(.*\):/, '-')
        end

        def error_from_podfile(error)
          if error.message =~ /Podfile:(\d*)/
            "\nIt appears to have originated from your Podfile at line #{Regexp.last_match[1]}.\n"
          end
        end

        def remove_color(string)
          string.gsub(/\e\[(\d+)m/, '')
        end

        def issues_url(exception)
          message = remove_color(pathless_exception_message(exception.message))
          'https://github.com/CocoaPods/CocoaPods/search?q=' \
          "#{CGI.escape(message)}&type=Issues"
        end

        def host_information
          product, version, build = `sw_vers`.strip.split("\n").map { |line| line.split(':').last.strip }
          "#{product} #{version} (#{build})"
        end

        def xcode_information
          version, build = `xcodebuild -version`.strip.split("\n").map { |line| line.split(' ').last }
          "#{version} (#{build})"
        end

        def git_information
          `git --version`.strip.split("\n").first
        end

        def installed_plugins
          CLAide::Command::PluginManager.specifications.
            reduce({}) { |hash, s| hash.tap { |h| h[s.name] = s.version.to_s } }
        end

        def repo_information
          Config.instance.sources_manager.all.map do |source|
            repo = source.repo
            if source.is_a?(Pod::CDNSource)
              "#{repo.basename} - CDN - #{source.url}"
            elsif source.git?
              sha = git_hash(source)
              "#{repo.basename} - git - #{source.url} @ #{sha}"
            else
              "#{repo.basename} - #{source.type}"
            end
          end
        end

        def original_command
          "#{$PROGRAM_NAME} #{ARGV.join(' ')}"
        end

        private

        # @param [Source] source
        #        a git source
        #
        # @return [String] the current git SHA
        def git_hash(source)
          Dir.chdir(source.repo) do
            `git rev-parse HEAD 2>&1`
          end
        end
      end
    end
  end
end
