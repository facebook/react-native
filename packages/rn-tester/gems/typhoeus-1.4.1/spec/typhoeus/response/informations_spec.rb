require 'spec_helper'

describe Typhoeus::Response::Informations do
  let(:options) { {} }
  let(:response) { Typhoeus::Response.new(options) }

  describe "#return_code" do
    let(:options) { { :return_code => :ok } }

    it "returns return_code from options" do
      expect(response.return_code).to be(:ok)
    end
  end

  describe "#debug_info" do
    let(:options) { { :debug_info => Ethon::Easy::DebugInfo.new } }

    it "returns debug_info from options" do
      expect(response.debug_info).to be_a(Ethon::Easy::DebugInfo)
    end
  end

  describe "#return_message" do
    let(:options) { { :return_code => :couldnt_connect } }

    it "returns a message" do
      expect(response.return_message).to eq("Couldn't connect to server")
    end

    describe "with nil return_code" do
      let(:options) { { :return_code => nil } }

      it "returns nil" do
        expect(response.return_message).to be_nil
      end
    end
  end

  describe "#response_body" do
    context "when response_body" do
      let(:options) { { :response_body => "body" } }

      it "returns response_body from options" do
        expect(response.response_body).to eq("body")
      end
    end

    context "when body" do
      let(:options) { { :body => "body" } }

      it "returns body from options" do
        expect(response.body).to eq("body")
      end
    end
  end

  describe "#response_headers" do
    let(:options) { { :response_headers => "Length: 1" } }

    context "when no mock" do
      it "returns response_headers from options" do
        expect(response.response_headers).to eq("Length: 1")
      end
    end

    context "when mock" do
      context "when no response_headers" do
        context "when headers" do
          let(:options) { { :mock => true, :headers => {"Length" => 1, "Content-Type" => "text/plain" } } }

          it "constructs response_headers" do
            expect(response.response_headers).to include("Length: 1")
            expect(response.response_headers).to include("Content-Type: text/plain")
            expect(response.response_headers).to include("\r\n")
          end
        end

        context "when multiple values for a header" do
          let(:options) { { :mock => true, :headers => {"Length" => 1, "Content-Type" => "text/plain", "set-cookie" => ["cookieone=one","cookietwo=two"] } } }

          it "constructs response_headers" do
            expect(response.response_headers).to include("Length: 1")
            expect(response.response_headers).to include("Content-Type: text/plain")
            expect(response.response_headers).to include("set-cookie: cookieone=one,cookietwo=two")
            expect(response.response_headers).to include("\r\n")
          end
        end
      end
    end
  end

  describe "#response_code" do
    context "when response_code" do
      let(:options) { { :response_code => "200" } }

      it "returns response_code from options" do
        expect(response.response_code).to eq(200)
      end
    end

    context "when code" do
      let(:options) { { :code => "200" } }

      it "returns code from options" do
        expect(response.code).to eq(200)
      end
    end
  end

  describe "#httpauth_avail" do
    let(:options) { { :httpauth_avail => "code" } }

    it "returns httpauth_avail from options" do
      expect(response.httpauth_avail).to eq("code")
    end
  end

  describe "#total_time" do
    let(:options) { { :total_time =>  1 } }

    it "returns total_time from options" do
      expect(response.total_time).to eq(1)
    end
  end

  describe "#starttransfer_time" do
    let(:options) { { :starttransfer_time =>  1 } }

    it "returns starttransfer_time from options" do
      expect(response.starttransfer_time).to eq(1)
    end
  end

  describe "#appconnect_time" do
    let(:options) { { :appconnect_time =>  1 } }

    it "returns appconnect_time from options" do
      expect(response.appconnect_time).to eq(1)
    end
  end

  describe "#pretransfer_time" do
    let(:options) { { :pretransfer_time =>  1 } }

    it "returns pretransfer_time from options" do
      expect(response.pretransfer_time).to eq(1)
    end
  end

  describe "#connect_time" do
    let(:options) { { :connect_time =>  1 } }

    it "returns connect_time from options" do
      expect(response.connect_time).to eq(1)
    end
  end

  describe "#namelookup_time" do
    let(:options) { { :namelookup_time =>  1 } }

    it "returns namelookup_time from options" do
      expect(response.namelookup_time).to eq(1)
    end
  end

  describe "#redirect_time" do
    let(:options) { { :redirect_time =>  1 } }

    it "returns redirect_time from options" do
      expect(response.redirect_time).to eq(1)
    end
  end

  describe "#effective_url" do
    let(:options) { { :effective_url => "http://www.example.com" } }

    it "returns effective_url from options" do
      expect(response.effective_url).to eq("http://www.example.com")
    end
  end

  describe "#primary_ip" do
    let(:options) { { :primary_ip => "127.0.0.1" } }

    it "returns primary_ip from options" do
      expect(response.primary_ip).to eq("127.0.0.1")
    end
  end

  describe "#redirect_count" do
    let(:options) { { :redirect_count => 2 } }

    it "returns redirect_count from options" do
      expect(response.redirect_count).to eq(2)
    end
  end

  describe "#redirect_url" do
    let(:options) { { :redirect_url => "http://www.example.com" } }

    it "returns redirect_url from options" do
      expect(response.redirect_url).to eq("http://www.example.com")
    end
  end

  describe "#request_size" do
    let(:options) { { :request_size => 2 } }

    it "returns request_size from options" do
      expect(response.request_size).to eq(2)
    end
  end

  describe "#size_upload" do
    let(:options) { { :size_upload => 2.0 } }

    it "returns size_upload from options" do
      expect(response.size_upload).to eq(2.0)
    end
  end

  describe "#size_download" do
    let(:options) { { :size_download => 2.0 } }

    it "returns size_download from options" do
      expect(response.size_download).to eq(2.0)
    end
  end

  describe "#speed_upload" do
    let(:options) { { :speed_upload => 2.0 } }

    it "returns speed_upload from options" do
      expect(response.speed_upload).to eq(2.0)
    end
  end

  describe "#speed_download" do
    let(:options) { { :speed_download => 2.0 } }

    it "returns speed_download from options" do
      expect(response.speed_download).to eq(2.0)
    end
  end

  describe "#headers" do
    context "when no response_headers" do
      it "returns nil" do
        expect(response.headers).to be_nil
      end
    end

    context "when response_headers" do
      let(:options) { {:response_headers => "Expire: -1\nServer: gws"} }

      it "returns nonempty headers" do
        expect(response.headers).to_not be_empty
      end

      it "has Expire" do
        expect(response.headers['expire']).to eq('-1')
      end

      it "has Server" do
        expect(response.headers['server']).to eq('gws')
      end
    end

    context "when multiple headers" do
      let(:options) { {:response_headers => "Server: A\r\n\r\nServer: B"} }

      it "returns the last" do
        expect(response.headers['server']).to eq("B")
      end
    end

    context "when mock" do
      context "when headers" do
        let(:options) { {:mock => true, :headers => {"Length" => "1"}} }

        it "returns Typhoeus::Response::Header" do
          expect(response.headers).to be_a(Typhoeus::Response::Header)
        end

        it "returns headers" do
          expect(response.headers.to_hash).to include("Length" => "1")
        end
      end
    end

    context "when requesting" do
      let(:response) { Typhoeus.get("localhost:3001") }

      it "returns headers" do
        expect(response.headers).to_not be_empty
      end
    end
  end

  describe "#redirections" do
    context "when no response_headers" do
      it "returns empty array" do
        expect(response.redirections).to be_empty
      end
    end

    context "when headers" do
      let(:options) { {:response_headers => "Expire: -1\nServer: gws"} }

      it "returns empty array" do
        expect(response.redirections).to be_empty
      end
    end

    context "when multiple headers" do
      let(:options) { {:response_headers => "Server: A\r\n\r\nServer: B"} }

      it "returns response from all but last headers" do
        expect(response.redirections.size).to eq(1)
      end
    end
  end
end
