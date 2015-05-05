class ArchivesSpaceService < Sinatra::Base

  Endpoint.post('/plugins/component_report/repositories/:repo_id/cart')
  .description("Return resolved JSON of the records in the cart")
  .params(["repo_id", :repo_id],
          ["uri", [String], "The uris of the records in the cart"])
  .permissions([:view_repository])
  .returns([200, "[(:cart_item)]"]) \
  do
    cart = Cart.new(params[:uri])

    json_response(resolve_references(cart.cart_items, ["resource","series", "box", "file", "item"]))
  end


  Endpoint.post('/plugins/component_report/repositories/:repo_id/report')
  .description("Return Excel formatted component report for record uris")
  .params(["repo_id", :repo_id],
          ["uri", [String], "The uris of the records in the cart"])
  .permissions([:view_repository])
  .returns([200, "report"]) \
  do
    cart_resolved = resolve_references(Cart.new(params[:uri]).cart_items, ["resource","series", "box", "file", "item", "resource::linked_agents", "resource::container_locations", "box::container_locations"])

    [
      200,
      {
        "Content-Type" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition" => "attachment; filename=\"component_report.xlsx\""
      },
      ComponentReport.new(cart_resolved).to_stream
    ]
  end


end