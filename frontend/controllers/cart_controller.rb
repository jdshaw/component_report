require 'securerandom'
class CartController < ApplicationController

  set_access_control  "view_repository" => [:checkout, :summary, :download_report, :uris_for_search, :children_uris_for_search]

  def checkout
  end


  def summary
    uris = ASUtils.as_array(params[:uri])
    if uris.empty?
      @cart_items = []
    else
      response = JSONModel::HTTP.post_form("/plugins/component_report/repositories/#{session[:repo_id]}/cart", "uri[]" => uris)
      @cart_items = ASUtils.json_parse(response.body)
    end

    render_aspace_partial :partial => "cart/summary"
  end


  def download_report
    uris = ASUtils.as_array(params[:uri])
    type = params[:type] ? params[:type] : ""
    report_id = SecureRandom.uuid
    queue = Queue.new

    backend_session = JSONModel::HTTP::current_backend_session

    Thread.new do
      JSONModel::HTTP::current_backend_session = backend_session
      begin
        post_with_stream_response("/plugins/component_report/repositories/#{session[:repo_id]}/report", "uri[]" => uris, "type" => type, "report_id" => report_id) do |report_response|
          response.headers['Content-Disposition'] = report_response['Content-Disposition']
          response.headers['Content-Type'] = report_response['Content-Type']
          response.headers['Last-Modified'] = Time.now.to_s
          response.headers['Cache-Control'] = 'no-cache'
          response.headers['X-Content-Type-Options'] = 'nosniff'

          queue << :ok
          report_response.read_body do |chunk|
            queue << chunk
          end
        end
      rescue
        queue << {:error => $!.message}
      ensure
        queue << :EOF
      end
    end

    first_on_queue = queue.pop # :ok or error hash
    if first_on_queue.kind_of?(Hash)
      @report_errors = first_on_queue[:error]

      return render :action => :checkout
    end

    self.response_body = Class.new do
      def self.queue=(queue)
        @queue = queue
      end
      def self.each(&block)
        while(true)
          chunk = @queue.pop

          break if chunk === :EOF

          block.call(chunk)
        end
      end
    end

    self.response_body.queue = queue
  end


  def uris_for_search
    criteria = params_for_backend_search

    queries = advanced_search_queries.reject{|field| field["value"].nil? || field["value"] == ""}

    if not queries.empty?
      criteria["aq"] = AdvancedQueryBuilder.new(queries, :staff).build_query.to_json
    end

    render :json => JSONModel::HTTP::get_json("/plugins/component_report/repositories/#{session[:repo_id]}/uris_for_search", criteria)
  end
  
  def children_uris_for_search
    ao_id = params[:uri].split("/").last
    cart_max = params[:cart_max].to_i
    children = []

    if not ao_id.empty?
      render :json => ultimate_children(ao_id, cart_max, children)
    end
  end

  private
  
  def ultimate_children(ao_id, cart_max, descendants)
    
    if descendants.empty?
      descendants = []
    end
    
    grand_children = JSONModel::HTTP::get_json("/repositories/#{session[:repo_id]}/archival_objects/#{ao_id}/children")
    if not grand_children.empty?
      grand_children.each do |descendant|
        if not descendants.length >= cart_max
          descendants.push(descendant["uri"])
          ultimate_children(descendant["uri"].split('/').last, cart_max, descendants)
        end
      end
    end

    descendants
  end


  def post_with_stream_response(uri, params = {}, &block)
    uri = URI("#{ JSONModel::backend_url}#{uri}")

    req = Net::HTTP::Post.new(uri.request_uri)
    req.body = URI.encode_www_form(params)

    req['X-ArchivesSpace-Session'] = JSONModel::HTTP::current_backend_session

    Net::HTTP.start(uri.host, uri.port) do |http|
      http.request(req, nil) do |response|
        if response.code =~ /^4/
          #JSONModel::handle_error(ASUtils.json_parse(response.body))
          raise response.body
        end

        block.call(response)
      end
    end
  end

end
