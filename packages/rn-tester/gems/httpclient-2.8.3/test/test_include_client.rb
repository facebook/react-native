# -*- encoding: utf-8 -*-
require File.expand_path('helper', File.dirname(__FILE__))

require 'httpclient/include_client'
class TestIncludeClient < Test::Unit::TestCase
  class Widget
      extend HTTPClient::IncludeClient

      include_http_client("http://example.com") do |client|
        client.cookie_manager = nil
        client.agent_name = "iMonkey 4k"
      end
  end

  class OtherWidget
    extend HTTPClient::IncludeClient

    include_http_client
    include_http_client(:method_name => :other_http_client)
  end
  
  class UnrelatedBlankClass ; end

  def test_client_class_level_singleton
    assert_equal Widget.http_client.object_id, Widget.http_client.object_id

    assert_equal Widget.http_client.object_id, Widget.new.http_client.object_id

    assert_not_equal Widget.http_client.object_id, OtherWidget.http_client.object_id
  end

  def test_configured
    assert_equal Widget.http_client.agent_name, "iMonkey 4k"
    assert_nil Widget.http_client.cookie_manager
    assert_equal Widget.http_client.proxy.to_s, "http://example.com"
  end
  
  def test_two_includes
    assert_not_equal OtherWidget.http_client.object_id, OtherWidget.other_http_client.object_id
    
    assert_equal OtherWidget.other_http_client.object_id, OtherWidget.new.other_http_client.object_id          
  end
  
  # meta-programming gone wrong sometimes accidentally
  # adds the class method to _everyone_, a mistake we've made before. 
  def test_not_infected_class_hieararchy
    assert ! Class.respond_to?(:http_client)
    assert ! UnrelatedBlankClass.respond_to?(:http_client)
  end


end
