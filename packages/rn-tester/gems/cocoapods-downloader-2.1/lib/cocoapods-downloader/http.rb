require 'cocoapods-downloader/remote_file'

module Pod
  module Downloader
    class Http < RemoteFile
      USER_AGENT_HEADER = 'User-Agent'.freeze

      private

      executable :curl

      def download_file(full_filename)
        parameters = ['-f', '-L', '-o', full_filename, url, '--create-dirs', '--netrc-optional', '--retry', '2']
        parameters << user_agent_argument if headers.nil? ||
            headers.none? { |header| header.casecmp(USER_AGENT_HEADER).zero? }

        headers.each do |h|
          parameters << '-H'
          parameters << h
        end unless headers.nil?

        curl! parameters
      end

      # Returns a cURL command flag to add the CocoaPods User-Agent.
      #
      # @return [String] cURL command -A flag and User-Agent.
      #
      def user_agent_argument
        "-A '#{Http.user_agent_string}'"
      end
    end
  end
end
