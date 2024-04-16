# frozen_string_literal: true
require 'spec_helper'

describe Ethon::Easy::Operations do
  let(:easy) { Ethon::Easy.new }

  describe "#handle" do
    it "returns a pointer" do
      expect(easy.handle).to be_a(FFI::Pointer)
    end
  end


  describe "#perform" do
    let(:url) { nil }
    let(:timeout) { nil }
    let(:connect_timeout) { nil }
    let(:follow_location) { nil }
    let(:max_redirs) { nil }
    let(:user_pwd) { nil }
    let(:http_auth) { nil }
    let(:headers) { nil }
    let(:protocols) { nil }
    let(:redir_protocols) { nil }
    let(:username) { nil }
    let(:password) { nil }

    before do
      Ethon.logger.level = Logger::DEBUG
      easy.url = url
      easy.timeout = timeout
      easy.connecttimeout = connect_timeout
      easy.followlocation = follow_location
      easy.maxredirs = max_redirs
      easy.httpauth = http_auth
      easy.headers = headers
      easy.protocols = protocols
      easy.redir_protocols = redir_protocols

      if user_pwd
        easy.userpwd = user_pwd
      else
        easy.username = username
        easy.password = password
      end

      easy.perform
    end

    it "calls Curl.easy_perform" do
      expect(Ethon::Curl).to receive(:easy_perform)
      easy.perform
    end

    it "calls Curl.easy_cleanup" do
      expect_any_instance_of(FFI::AutoPointer).to receive(:free)
      easy.cleanup
    end

    it "logs" do
      expect(Ethon.logger).to receive(:debug)
      easy.perform
    end

    it "doesn't log after completing because completing could reset" do
      easy.on_complete{ expect(Ethon.logger).to receive(:debug).never }
      easy.perform
    end

    context "when url" do
      let(:url) { "http://localhost:3001/" }

      it "returns ok" do
        expect(easy.return_code).to eq(:ok)
      end

      it "sets response body" do
        expect(easy.response_body).to be
      end

      it "sets response headers" do
        expect(easy.response_headers).to be
      end

      context "when request timed out" do
        let(:url) { "http://localhost:3001/?delay=1" }
        let(:timeout) { 1 }

        it "returns operation_timedout" do
          expect(easy.return_code).to eq(:operation_timedout)
        end
      end

      context "when connection timed out" do
        let(:url) { "http://localhost:3009" }
        let(:connect_timeout) { 1 }

        it "returns couldnt_connect" do
          expect(easy.return_code).to eq(:couldnt_connect)
        end
      end

      context "when no follow location" do
        let(:url) { "http://localhost:3001/redirect" }
        let(:follow_location) { false }

        it "doesn't follow" do
          expect(easy.response_code).to eq(302)
          expect(easy.redirect_url).to eq("http://localhost:3001/")
        end
      end

      context "when follow location" do
        let(:url) { "http://localhost:3001/redirect" }
        let(:follow_location) { true }

        it "follows" do
          expect(easy.response_code).to eq(200)
          expect(easy.redirect_url).to eq(nil)
        end

        context "when infinite redirect loop" do
          let(:url) { "http://localhost:3001/bad_redirect" }
          let(:max_redirs) { 5 }

          context "when max redirect set" do
            it "follows only x times" do
              expect(easy.response_code).to eq(302)
              expect(easy.redirect_url).to eq("http://localhost:3001/bad_redirect")
            end
          end
        end
      end

      context "when user agent" do
        let(:headers) { { 'User-Agent' => 'Ethon' } }

        it "sets" do
          expect(easy.response_body).to include('"HTTP_USER_AGENT":"Ethon"')
        end
      end
    end

    context "when auth url" do
      before { easy.url = url }

      context "when basic auth" do
        let(:url) { "http://localhost:3001/auth_basic/username/password" }

        context "when no user_pwd" do
          it "returns 401" do
            expect(easy.response_code).to eq(401)
          end
        end

        context "when invalid user_pwd" do
          let(:user_pwd) { "invalid:invalid" }

          it "returns 401" do
            expect(easy.response_code).to eq(401)
          end
        end

        context "when valid user_pwd" do
          let(:user_pwd) { "username:password" }

          it "returns 200" do
            expect(easy.response_code).to eq(200)
          end
        end

        context "when user and password" do
          let(:username) { "username" }
          let(:password) { "password" }

          it "returns 200" do
            expect(easy.response_code).to eq(200)
          end
        end
      end

      context "when ntlm" do
        let(:url) { "http://localhost:3001/auth_ntlm" }
        let(:http_auth) { :ntlm }

        context "when no user_pwd" do
          it "returns 401" do
            expect(easy.response_code).to eq(401)
          end
        end

        context "when user_pwd" do
          let(:user_pwd) { "username:password" }

          it "returns 200" do
            expect(easy.response_code).to eq(200)
          end
        end
      end
    end

    context "when protocols" do
      context "when asking for a allowed url" do
        let(:url) { "http://localhost:3001" }
        let(:protocols) { :http }

        it "returns ok" do
          expect(easy.return_code).to be(:ok)
        end
      end

      context "when asking for a not allowed url" do
        let(:url) { "http://localhost:3001" }
        let(:protocols) { :https }

        it "returns unsupported_protocol" do
          expect(easy.return_code).to be(:unsupported_protocol)
        end
      end
    end

    context "when multiple protocols" do
      context "when asking for a allowed url" do
        let(:protocols) { [:http, :https] }

        context "when http" do
          let(:url) { "http://localhost:3001" }

          it "returns ok for http" do
            expect(easy.return_code).to be(:ok)
          end
        end

        context "when https" do
          let(:url) { "https://localhost:3001" }

          it "returns ssl_connect_error for https" do
            expect(easy.return_code).to be(:ssl_connect_error)
          end
        end
      end

      context "when asking for a not allowed url" do
        let(:url) { "ssh://localhost" }
        let(:protocols) { [:https, :http] }

        it "returns unsupported_protocol" do
          expect(easy.return_code).to be(:unsupported_protocol)
        end
      end
    end

    context "when redir_protocols" do
      context "when redirecting to a not allowed url" do
        let(:url) { "http://localhost:3001/redirect" }
        let(:follow_location) { true }
        let(:redir_protocols) { :https }

        it "returns unsupported_protocol" do
          expect(easy.return_code).to be(:unsupported_protocol)
        end
      end
    end

    context "when no url" do
      it "returns url_malformat" do
        expect(easy.perform).to eq(:url_malformat)
      end
    end
  end
end
