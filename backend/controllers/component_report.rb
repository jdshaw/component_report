class ArchivesSpaceService < Sinatra::Base

  Endpoint.post('/plugins/component_report/repository/:repo_id/cart')
  .description("Return resolved JSON of the records in the cart")
  .params(["repo_id", :repo_id],
          ["uri", [String], "The uris of the records in the cart"])
  .permissions([:view_repository])
  .returns([200, "[(:cart_item)]"]) \
  do
    cart = Cart.new(params[:uri])

    json_response(resolve_references(cart.cart_items, ["resource","series", "box", "file", "item"]))
  end

end