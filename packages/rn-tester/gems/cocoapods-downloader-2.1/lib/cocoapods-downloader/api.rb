module Pod
  module Downloader
    # The Downloader::Hooks module allows to adapt the Downloader to
    # the UI of other gems.
    #
    module API
      # Executes
      # @return [String] the output of the command.
      #
      def execute_command(executable, command, raise_on_failure = false)
        require 'shellwords'
        command = command.map(&:to_s).map(&:shellescape).join(' ')
        output = `\n#{executable} #{command} 2>&1`
        check_exit_code!(executable, command, output) if raise_on_failure
        puts output
        output
      end

      # Checks if the just executed command completed successfully.
      #
      # @raise  If the command failed.
      #
      # @return [void]
      #
      def check_exit_code!(executable, command, output)
        if $?.exitstatus != 0
          raise DownloaderError, "Error on `#{executable} #{command}`.\n#{output}"
        end
      end

      # Indicates that an action will be performed. The action is passed as a
      # block.
      #
      # @param  [String] message
      #         The message associated with the action.
      #
      # @yield  The action, this block is always executed.
      #
      # @return [void]
      #
      def ui_action(message)
        puts message
        yield
      end

      # Indicates that a minor action will be performed. The action is passed as
      # a block.
      #
      # @param  [String] message
      #         The message associated with the action.
      #
      # @yield  The action, this block is always executed.
      #
      # @return [void]
      #
      def ui_sub_action(message)
        puts message
        yield
      end

      # Prints an UI message.
      #
      # @param  [String] message
      #         The message associated with the action.
      #
      # @return [void]
      #
      def ui_message(message)
        puts message
      end
    end
  end
end
