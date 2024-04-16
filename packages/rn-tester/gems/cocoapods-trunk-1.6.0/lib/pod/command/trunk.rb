# encoding: UTF-8

require 'json'
require 'rest'
require 'netrc'

module Pod
  class Command
    class Trunk < Command
      self.abstract_command = true
      self.summary = 'Interact with the CocoaPods API (e.g. publishing new specs)'

      SCHEME_AND_HOST = ENV['TRUNK_SCHEME_AND_HOST'] || 'https://trunk.cocoapods.org'
      BASE_URL = "#{SCHEME_AND_HOST}/api/v1".freeze

      require 'pod/command/trunk/add_owner'
      require 'pod/command/trunk/delete'
      require 'pod/command/trunk/deprecate'
      require 'pod/command/trunk/info'
      require 'pod/command/trunk/me'
      require 'pod/command/trunk/push'
      require 'pod/command/trunk/register'
      require 'pod/command/trunk/remove_owner'

      private

      def request_url(action, url, *args)
        response = create_request(action, url, *args)
        if (400...600).cover?(response.status_code)
          print_error(response.body)
        end
        response
      end

      def request_path(action, path, *args)
        request_url(action, "#{BASE_URL}/#{path}", *args)
      end

      def create_request(*args)
        if verbose?
          REST.send(*args) do |request|
            request.set_debug_output($stdout)
          end
        else
          REST.send(*args)
        end
      end

      def print_error(body)
        begin
          json = JSON.parse(body)
        rescue JSON::ParserError
          json = {}
        end
        error = json['error'] || "An unexpected error occurred: #{body}"

        case data = json['data']
        when Hash
          lines = data.sort_by(&:first).map do |attr, messages|
            attr = attr[0, 1].upcase << attr[1..-1]
            messages.sort.map do |message|
              "- #{attr}: #{message}"
            end
          end.flatten
          count = lines.size
          lines.unshift "The following #{'validation'.pluralize(count)} failed:"
          error += "\n" << lines.join("\n")
        end

        raise Informative, error
      end

      def print_messages(data_url, messages, spec = nil, action = nil)
        if verbose? || spec.nil?
          # Using UI.labeled here is dangerous, as it wraps the URL and indents
          # it, which breaks the URL when you try to copy-paste it.
          UI.puts "  - Data URL: #{data_url}"

          server_logs = messages.map do |entry|
            at, message = entry.to_a.flatten
            "#{formatted_time(at)}: #{message}"
          end
          UI.labeled 'Log messages', server_logs
        else
          separator = '-' * 80
          UI.puts
          UI.puts separator
          UI.puts " 🎉  Congrats"
          UI.puts
          UI.puts " 🚀  #{spec.name} (#{spec.version}) successfully #{action}"
          unless messages.empty?
            at = messages.first.to_a.flatten.first
            UI.puts " 📅  #{formatted_time(at)}"
          end
          UI.puts " 🌎  https://cocoapods.org/pods/#{spec.name}"
          UI.puts " 👍  Tell your friends!"
          UI.puts separator
        end
      end

      def json(response)
        JSON.parse(response.body)
      end

      def netrc
        @@netrc ||= Netrc.read
      end

      def token
        ENV['COCOAPODS_TRUNK_TOKEN'] ||
          (netrc['trunk.cocoapods.org'] && netrc['trunk.cocoapods.org'].password)
      end

      def default_headers
        {
          'Content-Type' => 'application/json; charset=utf-8',
          'Accept' => 'application/json; charset=utf-8',
          'User-Agent' => "CocoaPods/#{Pod::VERSION}",
        }
      end

      def auth_headers
        default_headers.merge('Authorization' => "Token #{token}")
      end

      def formatted_time(time_string)
        require 'active_support/time'
        @tz_offset ||= Time.zone_offset(time_zone)
        @current_year ||= Date.today.year

        time = Time.parse(time_string) + @tz_offset
        formatted = time.to_formatted_s(:long_ordinal)
        # No need to show the current year, the user will probably know.
        if time.year == @current_year
          formatted.sub!(" #{@current_year}", '')
        end
        formatted
      end

      def time_zone
        out, = Executable.capture_command('/bin/date', %w(+%Z), :capture => :out)
        out.strip
      end
    end
  end
end
