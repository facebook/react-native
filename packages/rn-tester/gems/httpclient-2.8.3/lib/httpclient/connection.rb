# HTTPClient - HTTP client library.
# Copyright (C) 2000-2015  NAKAMURA, Hiroshi  <nahi@ruby-lang.org>.
#
# This program is copyrighted free software by NAKAMURA, Hiroshi.  You can
# redistribute it and/or modify it under the same terms of Ruby's license;
# either the dual license version in 2003, or any later version.


class HTTPClient


  # Represents a HTTP response to an asynchronous request.  Async methods of
  # HTTPClient such as get_async, post_async, etc. returns an instance of
  # Connection.
  #
  # == How to use
  #
  # 1. Invoke HTTP method asynchronously and check if it's been finished
  #    periodically.
  #
  #     connection = clnt.post_async(url, body)
  #     print 'posting.'
  #     while true
  #       break if connection.finished?
  #       print '.'
  #       sleep 1
  #     end
  #     puts '.'
  #     res = connection.pop
  #     p res.status
  #
  # 2. Read the response as an IO.
  #
  #     connection = clnt.get_async('http://dev.ctor.org/')
  #     io = connection.pop.content
  #     while str = io.read(40)
  #       p str
  #     end
  class Connection
    attr_accessor :async_thread

    def initialize(header_queue = [], body_queue = []) # :nodoc:
      @headers = header_queue
      @body = body_queue
      @async_thread = nil
      @queue = Queue.new
    end

    # Checks if the asynchronous invocation has been finished or not.
    def finished?
      if !@async_thread
        # Not in async mode.
        true
      elsif @async_thread.alive?
        # Working...
        false
      else
        # Async thread have been finished.
        join
        true
      end
    end

    # Retrieves a HTTP::Message instance of HTTP response.  Do not invoke this
    # method twice for now.  The second invocation will be blocked.
    def pop
      response_or_exception = @queue.pop
      if response_or_exception.is_a? Exception
        raise response_or_exception
      end
      response_or_exception
    end

    def push(result) # :nodoc:
      @queue.push(result)
    end

    # Waits the completion of the asynchronous invocation.
    def join
      if @async_thread
        @async_thread.join
      end
      nil
    end
  end


end
