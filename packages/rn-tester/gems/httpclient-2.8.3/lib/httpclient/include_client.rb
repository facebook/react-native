# It is useful to re-use a HTTPClient instance for multiple requests, to
# re-use HTTP 1.1 persistent connections. 
#
# To do that, you sometimes want to store an HTTPClient instance in a global/
# class variable location, so it can be accessed and re-used. 
#
# This mix-in makes it easy to create class-level access to one or more
# HTTPClient instances. The HTTPClient instances are lazily initialized
# on first use (to, for instance, avoid interfering with WebMock/VCR),
# and are initialized in a thread-safe manner. Note that a 
# HTTPClient, once initialized, is safe for use in multiple threads.
#
# Note that you `extend` HTTPClient::IncludeClient, not `include. 
#
#    require 'httpclient/include_client'
#    class Widget
#       extend HTTPClient::IncludeClient
#
#       include_http_client
#       # and/or, specify more stuff
#       include_http_client('http://myproxy:8080', :method_name => :my_client) do |client|
#          # any init you want
#          client.set_cookie_store nil
#          client.
#       end
#    end
#
# That creates two HTTPClient instances available at the class level.
# The first will be available from Widget.http_client (default method
# name for `include_http_client`), with default initialization. 
#
# The second will be available at Widget.my_client, with the init arguments
# provided, further initialized by the block provided. 
#
# In addition to a class-level method, for convenience instance-level methods
# are also provided. Widget.http_client is identical to Widget.new.http_client
#
#
require 'httpclient'

class HTTPClient
  module IncludeClient
        

    def include_http_client(*args, &block)
      # We're going to dynamically define a class
      # to hold our state, namespaced, as well as possibly dynamic
      # name of cover method. 
      method_name = (args.last.delete(:method_name) if args.last.kind_of? Hash) || :http_client
      args.pop if args.last == {} # if last arg was named methods now empty, remove it.       
      
      # By the amazingness of closures, we can create these things
      # in local vars here and use em in our method, we don't even
      # need iVars for state. 
      client_instance = nil
      client_mutex = Mutex.new
      client_args = args
      client_block = block

      # to define a _class method_ on the specific class that's currently
      # `self`, we have to use this bit of metaprogramming, sorry. 
      (class << self; self ; end).instance_eval do      
        define_method(method_name) do                            
          # implementation copied from ruby stdlib singleton
          # to create this global obj thread-safely.
          return client_instance if client_instance
          client_mutex.synchronize do
            return client_instance if client_instance
            # init HTTPClient with specified args/block  
            client_instance = HTTPClient.new(*client_args)
            client_block.call(client_instance) if client_block
          end
          return client_instance
        end
      end
      
      # And for convenience, an  _instance method_ on the class that just
      # delegates to the class method. 
      define_method(method_name) do
        self.class.send(method_name)
      end
          
    end
  end
end
