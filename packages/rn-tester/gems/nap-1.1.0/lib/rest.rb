require 'uri'

# REST is basically a convenience wrapper around Net::HTTP. It defines a simple and consistant API
# for doing REST-style HTTP calls.
#
# In addition it provides wrappers for the many error classes that can be raised while making
# requests. See REST::Error for a complete discussion of options.
module REST
  # Library version
  VERSION = '1.1.0'
  
  # Performs a GET on a resource. See REST::Request.new for a complete discussion of options.
  #
  #   response = REST.get('http://example.com/pigeons/12',
  #     {'Accept' => 'text/plain'},
  #     {:username => 'admin', :password => 'secret'}
  #   )
  #   if response.ok?
  #     puts response.body
  #   else
  #     puts "Couldn't fetch your pigeon (#{response.status_code})"
  #   end
  def self.get(uri, headers={}, options={}, &configure_block)
    REST::Request.perform(:get, URI.parse(uri), nil, headers, options, &configure_block)
  end
  
  # Performs a HEAD on a resource. See REST::Request.new for a complete discussion of options.
  #
  #   response = REST.head('http://example.com/pigeons/12')
  #   if response.ok?
  #     puts "Your pigeon exists!"
  #   elsif response.found?
  #     puts "Someone moved your pigeon!"
  #   else
  #     puts "Couldn't fetch your pigeon (#{response.status_code})"
  #   end
  def self.head(uri, headers={}, options={}, &configure_block)
    REST::Request.perform(:head, URI.parse(uri), nil, headers, options, &configure_block)
  end

  # Performs a DELETE on a resource. See REST::Request.new for a complete discussion of options.
  #
  #   response = REST.delete('http://example.com/pigeons/12')
  #   if response.ok?
  #     puts "Your pigeon died ): )"
  #   elsif response.found?
  #     puts "Someone moved your pigeon!"
  #   else
  #     puts "Couldn't delete your pigeon (#{response.status_code})"
  #   end
  def self.delete(uri, headers={}, options={}, &configure_block)
    REST::Request.perform(:delete, URI.parse(uri), nil, headers, options, &configure_block)
  end
  
  # Performs a PATCH on a resource. See REST::Request.new for a complete discussion of options.
  #
  #   response = REST.patch('http://example.com/pigeons/12',
  #     {'Name' => 'Homer'}.to_xml,
  #     {'Accept' => 'application/xml, */*', 'Content-Type' => 'application/xml'}
  #   )
  #   if response.ok?
  #     puts "Your pigeon was renamed to 'Homer'!"
  #   else
  #     puts "Couldn't rename your pigeon (#{response.status_code})"
  #     puts XML.parse(response.body).reason
  #   end
  def self.patch(uri, body, headers={}, options={}, &configure_block)
    REST::Request.perform(:patch, URI.parse(uri), body, headers, options, &configure_block)
  end
  
  # Performs a PUT on a resource. See REST::Request.new for a complete discussion of options.
  #
  #   response = REST.put('http://example.com/pigeons/12',
  #     {'Name' => 'Homer'}.to_xml,
  #     {'Accept' => 'application/xml, */*', 'Content-Type' => 'application/xml'}
  #   )
  #   if response.ok?
  #     puts "Your pigeon 'Bowser' was replaced by 'Homer'!"
  #   else
  #     puts "Couldn't replace your pigeon (#{response.status_code})"
  #     puts XML.parse(response.body).reason
  #   end
  def self.put(uri, body, headers={}, options={}, &configure_block)
    REST::Request.perform(:put, URI.parse(uri), body, headers, options, &configure_block)
  end
  
  # Performs a POST on a resource. See REST::Request.new for a complete discussion of options.
  #
  #   response = REST.post('http://example.com/pigeons',
  #     {'Name' => 'Bowser'}.to_xml,
  #     {'Accept' => 'application/xml, */*', 'Content-Type' => 'application/xml'}
  #   )
  #   if response.created?
  #     puts "Created a new pigeon called 'Bowser'"
  #   else
  #     puts "Couldn't create your pigeon (#{response.status_code})"
  #     puts XML.parse(response.body).reason
  #   end
  def self.post(uri, body, headers={}, options={}, &configure_block)
    REST::Request.perform(:post, URI.parse(uri), body, headers, options, &configure_block)
  end
end

require File.expand_path('../rest/error', __FILE__)
require File.expand_path('../rest/request', __FILE__)
require File.expand_path('../rest/response', __FILE__)
