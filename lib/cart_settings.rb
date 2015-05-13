class CartSettings
  def self.limit
    AppConfig.has_key?(:component_report_cart_limit) ? AppConfig[:component_report_cart_limit] : 1000
  end
end