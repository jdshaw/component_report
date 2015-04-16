class CartController < ApplicationController

  skip_before_filter :unauthorised_access

  def checkout
  end

  def extra_context
    @ao = JSONModel(:archival_object).find(JSONModel(:archival_object).id_for(params[:uri]))
    @tree = JSONModel(:resource_tree).find(nil,
                                   :resource_id => JSONModel(:resource).id_for(@ao['resource']['ref']),
                                   :limit_to => params[:uri])

    render_aspace_partial :partial => "cart/context"
  end

end

