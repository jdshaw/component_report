class CartSettings
  def self.limit
    AppConfig.has_key?(:component_report_cart_limit) ? AppConfig[:component_report_cart_limit] : 250
  end
end