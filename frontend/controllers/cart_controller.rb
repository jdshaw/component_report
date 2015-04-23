class CartController < ApplicationController

  set_access_control  "view_repository" => [:checkout, :summary]

  def checkout
  end


  def summary
    uris = ASUtils.as_array(params[:uri])
    if uris.empty?
      @cart_items = []
    else
      response = JSONModel::HTTP.post_form("/plugins/component_report/repository/#{session[:repo_id]}/cart", "uri[]" => uris)
      @cart_items = ASUtils.json_parse(response.body)
    end

    render_aspace_partial :partial => "cart/summary"
  end

end

