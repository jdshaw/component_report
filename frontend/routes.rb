ArchivesSpace::Application.routes.draw do
  match('/plugins/search_cart/checkout' => 'cart#checkout', :via => [:get])
  match('/plugins/search_cart/context' => 'cart#extra_context', :via => [:get])
end
