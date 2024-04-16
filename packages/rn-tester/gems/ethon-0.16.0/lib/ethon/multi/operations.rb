# frozen_string_literal: true
module Ethon
  class Multi # :nodoc
    # This module contains logic to run a multi.
    module Operations
      STARTED_MULTI = "ETHON: started MULTI"
      PERFORMED_MULTI = "ETHON: performed MULTI"

      # Return the multi handle. Inititialize multi handle,
      # in case it didn't happened already.
      #
      # @example Return multi handle.
      #   multi.handle
      #
      # @return [ FFI::Pointer ] The multi handle.
      def handle
        @handle ||= FFI::AutoPointer.new(Curl.multi_init, Curl.method(:multi_cleanup))
      end

      # Initialize variables.
      #
      # @example Initialize variables.
      #   multi.init_vars
      #
      # @return [ void ]
      def init_vars
        if @execution_mode == :perform
          @timeout = ::FFI::MemoryPointer.new(:long)
          @timeval = Curl::Timeval.new
          @fd_read = Curl::FDSet.new
          @fd_write = Curl::FDSet.new
          @fd_excep = Curl::FDSet.new
          @max_fd = ::FFI::MemoryPointer.new(:int)
        elsif @execution_mode == :socket_action
          @running_count_pointer = FFI::MemoryPointer.new(:int)
        end
      end

      # Perform multi.
      #
      # @return [ nil ]
      #
      # @example Perform multi.
      #   multi.perform
      def perform
        ensure_execution_mode(:perform)

        Ethon.logger.debug(STARTED_MULTI)
        while ongoing?
          run
          timeout = get_timeout
          next if timeout == 0
          reset_fds
          set_fds(timeout)
        end
        Ethon.logger.debug(PERFORMED_MULTI)
        nil
      end

      # Prepare multi.
      #
      # @return [ nil ]
      #
      # @example Prepare multi.
      #   multi.prepare
      #
      # @deprecated It is no longer necessary to call prepare.
      def prepare
        Ethon.logger.warn(
          "ETHON: It is no longer necessay to call "+
          "Multi#prepare. Its going to be removed "+
          "in future versions."
        )
      end

      # Continue execution with an external IO loop.
      #
      # @example When no sockets are ready yet, or to begin.
      #   multi.socket_action
      #
      # @example When a socket is readable
      #   multi.socket_action(io_object, [:in])
      #
      # @example When a socket is readable and writable
      #   multi.socket_action(io_object, [:in, :out])
      #
      # @return [ Symbol ] The Curl.multi_socket_action return code.
      def socket_action(io = nil, readiness = 0)
        ensure_execution_mode(:socket_action)

        fd = if io.nil?
          ::Ethon::Curl::SOCKET_TIMEOUT
        elsif io.is_a?(Integer)
          io
        else
          io.fileno
        end

        code = Curl.multi_socket_action(handle, fd, readiness, @running_count_pointer)
        @running_count = @running_count_pointer.read_int

        check

        code
      end

      # Return whether the multi still contains requests or not.
      #
      # @example Return if ongoing.
      #   multi.ongoing?
      #
      # @return [ Boolean ] True if ongoing, else false.
      def ongoing?
        easy_handles.size > 0 || (!defined?(@running_count) || running_count > 0)
      end

      private

      # Get timeout.
      #
      # @example Get timeout.
      #   multi.get_timeout
      #
      # @return [ Integer ] The timeout.
      #
      # @raise [ Ethon::Errors::MultiTimeout ] If getting the timeout fails.
      def get_timeout
        code = Curl.multi_timeout(handle, @timeout)
        raise Errors::MultiTimeout.new(code) unless code == :ok
        timeout = @timeout.read_long
        timeout = 1 if timeout < 0
        timeout
      end

      # Reset file describtors.
      #
      # @example Reset fds.
      #   multi.reset_fds
      #
      # @return [ void ]
      def reset_fds
        @fd_read.clear
        @fd_write.clear
        @fd_excep.clear
      end

      # Set fds.
      #
      # @example Set fds.
      #   multi.set_fds
      #
      # @return [ void ]
      #
      # @raise [ Ethon::Errors::MultiFdset ] If setting the file descriptors fails.
      # @raise [ Ethon::Errors::Select ] If select fails.
      def set_fds(timeout)
        code = Curl.multi_fdset(handle, @fd_read, @fd_write, @fd_excep, @max_fd)
        raise Errors::MultiFdset.new(code) unless code == :ok
        max_fd = @max_fd.read_int
        if max_fd == -1
          sleep(0.001)
        else
          @timeval[:sec] = timeout / 1000
          @timeval[:usec] = (timeout * 1000) % 1000000
          loop do
            code = Curl.select(max_fd + 1, @fd_read, @fd_write, @fd_excep, @timeval)
            break unless code < 0 && ::FFI.errno == Errno::EINTR::Errno
          end
          raise Errors::Select.new(::FFI.errno) if code < 0
        end
      end

      # Check.
      #
      # @example Check.
      #   multi.check
      #
      # @return [ void ]
      def check
        msgs_left = ::FFI::MemoryPointer.new(:int)
        while true
          msg = Curl.multi_info_read(handle, msgs_left)
          break if msg.null?
          next if msg[:code] != :done
          easy = easy_handles.find{ |e| e.handle == msg[:easy_handle] }
          easy.return_code = msg[:data][:code]
          Ethon.logger.debug { "ETHON:         performed #{easy.log_inspect}" }
          delete(easy)
          easy.complete
        end
      end

      # Run.
      #
      # @example Run
      #   multi.run
      #
      # @return [ void ]
      def run
        running_count_pointer = FFI::MemoryPointer.new(:int)
        begin code = trigger(running_count_pointer) end while code == :call_multi_perform
        check
      end

      # Trigger.
      #
      # @example Trigger.
      #   multi.trigger
      #
      # @return [ Symbol ] The Curl.multi_perform return code.
      def trigger(running_count_pointer)
        code = Curl.multi_perform(handle, running_count_pointer)
        @running_count = running_count_pointer.read_int
        code
      end

      # Return number of running requests.
      #
      # @example Return count.
      #   multi.running_count
      #
      # @return [ Integer ] Number running requests.
      def running_count
        @running_count ||= nil
      end
    end
  end
end
