#!/usr/bin/env ruby
require 'json'
require 'zlib'
require 'sinatra/base'
require 'rack/typhoeus'

TESTSERVER = Sinatra.new do
  set :logging, false
  use Rack::Typhoeus::Middleware::ParamsDecoder

  fail_count = 0

  post '/file' do
    {
      'content-type' => params[:file][:type],
      'filename' => params[:file][:filename],
      'content' => params[:file][:tempfile].read,
      'request-content-type' => request.env['CONTENT_TYPE']
    }.to_json
  end

  get '/multiple-headers' do
    [200, { 'Set-Cookie' => %w[ foo bar ], 'Content-Type' => 'text/plain' }, ['']]
  end

  get '/cookies-test' do
    [200, { 'Set-Cookie' => %w(foo=bar bar=foo), 'Content-Type' => 'text/plain' }, ['']]
  end

  get '/cookies-test2' do
    [200, { 'Set-Cookie' => %w(foo2=bar bar2=foo), 'Content-Type' => 'text/plain' }, ['']]
  end

  get '/fail/:number' do
    if fail_count >= params[:number].to_i
      "ok"
    else
      fail_count += 1
      error 500, "oh noes!"
    end
  end

  get '/fail_forever' do
    error 500, "oh noes!"
  end

  get '/redirect' do
    redirect '/'
  end

  get '/bad_redirect' do
    redirect '/bad_redirect'
  end

  get '/auth_basic/:username/:password' do
    @auth ||=  Rack::Auth::Basic::Request.new(request.env)
    # Check that we've got a basic auth, and that it's credentials match the ones
    # provided in the request
    if @auth.provided? && @auth.basic? && @auth.credentials == [ params[:username], params[:password] ]
      # auth is valid - confirm it
      true
    else
      # invalid auth - request the authentication
      response['WWW-Authenticate'] = %(Basic realm="Testing HTTP Auth")
      throw(:halt, [401, "Not authorized\n"])
    end
  end

  get '/auth_ntlm' do
    # we're just checking for the existence if NTLM auth header here. It's validation
    # is too troublesome and really doesn't bother is much, it's up to libcurl to make
    # it valid
    response['WWW-Authenticate'] = 'NTLM'
    is_ntlm_auth = /^NTLM/ =~ request.env['HTTP_AUTHORIZATION']
    true if is_ntlm_auth
    throw(:halt, [401, "Not authorized\n"]) if !is_ntlm_auth
  end

  get '/gzipped' do
    req_env = request.env.to_json
    z = Zlib::Deflate.new
    gzipped_env = z.deflate(req_env, Zlib::FINISH)
    z.close
    response['Content-Encoding'] = 'gzip'
    gzipped_env
  end

  get '/**' do
    sleep params["delay"].to_i if params.has_key?("delay")
    request.env.merge!(:body => request.body.read).to_json
  end

  head '/**' do
    sleep params["delay"].to_i if params.has_key?("delay")
  end

  put '/**' do
    request.env.merge!(:body => request.body.read).to_json
  end

  post '/**' do
    request.env.merge!(:body => request.body.read).to_json
  end

  delete '/**' do
    request.env.merge!(:body => request.body.read).to_json
  end

  patch '/**' do
    request.env.merge!(:body => request.body.read).to_json
  end

  options '/**' do
    request.env.merge!(:body => request.body.read).to_json
  end
end
