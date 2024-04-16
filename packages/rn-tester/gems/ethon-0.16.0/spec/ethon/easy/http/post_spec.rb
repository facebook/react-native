# frozen_string_literal: true
require 'spec_helper'

describe Ethon::Easy::Http::Post do
  let(:easy) { Ethon::Easy.new }
  let(:url) { "http://localhost:3001/" }
  let(:params) { nil }
  let(:form) { nil }
  let(:options) { Hash.new }
  let(:post) { described_class.new(url, options.merge({:params => params, :body => form})) }

  describe "#setup" do
    context "when nothing" do
      it "sets url" do
        post.setup(easy)
        expect(easy.url).to eq(url)
      end

      it "sets postfield_size" do
        expect(easy).to receive(:postfieldsize=).with(0)
        post.setup(easy)
      end

      it "sets copy_postfields" do
        expect(easy).to receive(:copypostfields=).with("")
        post.setup(easy)
      end

      it "makes a post request" do
        post.setup(easy)
        easy.perform
        expect(easy.response_body).to include('"REQUEST_METHOD":"POST"')
      end
    end

    context "when params" do
      let(:params) { {:a => "1&"} }

      it "attaches escaped to url" do
        post.setup(easy)
        expect(easy.url).to eq("#{url}?a=1%26")
      end

      context "with arrays" do
        let(:params) { {:a => %w( foo bar )} }

        context "by default" do
          it "encodes them with indexes" do
            post.setup(easy)
            expect(easy.url).to eq("#{url}?a%5B0%5D=foo&a%5B1%5D=bar")
          end
        end

        context "when params_encoding is :rack" do
          let(:options) { {:params_encoding => :rack} }
          it "encodes them without indexes" do
            post.setup(easy)
            expect(easy.url).to eq("#{url}?a%5B%5D=foo&a%5B%5D=bar")
          end
        end
      end

      context "with :escape" do
        context 'missing' do
          it "escapes values" do
            post.setup(easy)
            expect(easy.url).to eq("#{url}?a=1%26")
          end
        end

        context 'nil' do
          let(:options) { {:escape => nil} }

          it "escapes values" do
            post.setup(easy)
            expect(easy.url).to eq("#{url}?a=1%26")
          end
        end

        context 'true' do
          let(:options) { {:escape => true} }

          it "escapes values" do
            post.setup(easy)
            expect(easy.url).to eq("#{url}?a=1%26")
          end
        end

        context 'false' do
          let(:options) { {:escape => false} }

          it "sends raw values" do
            post.setup(easy)
            expect(easy.url).to eq("#{url}?a=1&")
          end
        end
      end

      it "sets postfieldsize" do
        expect(easy).to receive(:postfieldsize=).with(0)
        post.setup(easy)
      end

      it "sets copypostfields" do
        expect(easy).to receive(:copypostfields=).with("")
        post.setup(easy)
      end

      context "when requesting" do
        let(:postredir) { nil }

        before do
          easy.headers = { 'Expect' => '' }
          post.setup(easy)
          easy.postredir = postredir
          easy.followlocation = true
          easy.perform
        end

        it "is a post" do
          expect(easy.response_body).to include('"REQUEST_METHOD":"POST"')
        end

        it "uses application/x-www-form-urlencoded content type" do
          expect(easy.response_body).to include('"CONTENT_TYPE":"application/x-www-form-urlencoded"')
        end

        it "requests parameterized url" do
          expect(easy.response_body).to include('"REQUEST_URI":"http://localhost:3001/?a=1%26"')
        end

        context "when redirection" do
          let(:url) { "localhost:3001/redirect" }

          context "when no postredirs" do
            it "is a get" do
              expect(easy.response_body).to include('"REQUEST_METHOD":"GET"')
            end
          end

          unless ENV['TRAVIS']
            context "when postredirs" do
              let(:postredir) { :post_all }

              it "is a post" do
                expect(easy.response_body).to include('"REQUEST_METHOD":"POST"')
              end
            end
          end
        end
      end
    end

    context "when body" do
      context "when multipart" do
        let(:form) { {:a => File.open(__FILE__, 'r')} }

        it "sets httppost" do
          expect(easy).to receive(:httppost=)
          post.setup(easy)
        end

        context "when requesting" do
          before do
            easy.headers = { 'Expect' => '' }
            post.setup(easy)
            easy.perform
          end

          it "returns ok" do
            expect(easy.return_code).to eq(:ok)
          end

          it "is a post" do
            expect(easy.response_body).to include('"REQUEST_METHOD":"POST"')
          end

          it "uses multipart/form-data content type" do
            expect(easy.response_body).to include('"CONTENT_TYPE":"multipart/form-data')
          end

          it "submits a body" do
            expect(easy.response_body).to match('"body":".+"')
          end

          it "submits the data" do
            expect(easy.response_body).to include('"filename":"post_spec.rb"')
          end
        end
      end

      context "when not multipart" do
        let(:form) { {:a => "1&b=2"} }
        let(:encoded) { "a=1%26b%3D2" }

        it "sets escaped copypostfields" do
          expect(easy).to receive(:copypostfields=).with(encoded)
          post.setup(easy)
        end

        it "sets postfieldsize" do
          expect(easy).to receive(:postfieldsize=).with(encoded.bytesize)
          post.setup(easy)
        end

        context "when requesting" do
          before do
            easy.headers = { 'Expect' => '' }
            post.setup(easy)
            easy.perform
          end

          it "returns ok" do
            expect(easy.return_code).to eq(:ok)
          end

          it "is a post" do
            expect(easy.response_body).to include('"REQUEST_METHOD":"POST"')
          end

          it "uses multipart/form-data content type" do
            expect(easy.response_body).to include('"CONTENT_TYPE":"application/x-www-form-urlencoded')
          end

          it "submits a body" do
            expect(easy.response_body).to match('"body":"a=1%26b%3D2"')
          end

          it "submits the data" do
            expect(easy.response_body).to include('"rack.request.form_hash":{"a":"1&b=2"}')
          end
        end
      end

      context "when string" do
        let(:form) { "{a: 1}" }

        context "when requesting" do
          before do
            easy.headers = { 'Expect' => '' }
            post.setup(easy)
            easy.perform
          end

          it "returns ok" do
            expect(easy.return_code).to eq(:ok)
          end

          it "sends string" do
            expect(easy.response_body).to include('"body":"{a: 1}"')
          end
        end
      end

      context "when binary with null bytes" do
        let(:form) { [1, 0, 1].pack('c*') }

        context "when requesting" do
          before do
            easy.headers = { 'Expect' => '' }
            post.setup(easy)
            easy.perform
          end

          it "returns ok" do
            expect(easy.return_code).to eq(:ok)
          end

          it "sends binary data" do
            expect(easy.response_body).to include('"body":"\\u0001\\u0000\\u0001"')
          end
        end
      end

      context "when arrays" do
        let(:form) { {:a => %w( foo bar )} }

        context "by default" do
          it "sets copypostfields with indexed, escaped representation" do
            expect(easy).to receive(:copypostfields=).with('a%5B0%5D=foo&a%5B1%5D=bar')
            post.setup(easy)
          end
        end

        context "when params_encoding is :rack" do
          let(:options) { {:params_encoding => :rack} }

          it "sets copypostfields with non-indexed, escaped representation" do
            expect(easy).to receive(:copypostfields=).with('a%5B%5D=foo&a%5B%5D=bar')
            post.setup(easy)
          end
        end
      end
    end

    context "when params and body" do
      let(:form) { {:a => "1"} }
      let(:params) { {:b => "2"} }

      context "when requesting" do
        before do
          easy.headers = { 'Expect' => '' }
          post.setup(easy)
          easy.perform
        end

        it "url contains params" do
          expect(easy.response_body).to include('"REQUEST_URI":"http://localhost:3001/?b=2"')
        end

        it "body contains form" do
          expect(easy.response_body).to include('"body":"a=1"')
        end
      end
    end
  end
end
