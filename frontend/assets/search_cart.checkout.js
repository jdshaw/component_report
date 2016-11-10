function CartCheckout(cart, $container, $cartData) {
  this.cart = cart;
  this.$container = $container;
  this.$cartData = $cartData;

  this.loadURL = $container.data("load-url");

  this.loadCart();
};


CartCheckout.prototype.loadCart = function() {
  var self = this;

  self.cart.loadCart(self.$cartData, function() {
    $("#generateReportFromCart").prop("disabled", false);
  });
  
	self.sharedShelf();
	
	this.$container.on("change", "#generateReportType", function() {
		self.sharedShelf();
	});
	
  this.$container.on("click", "#generateReportFromCart", function() {
  	$('<input />').attr('type', 'hidden')
			.attr('name', "type")
			.attr('value', $("#generateReportType").val())
			.appendTo('#componentReportForm');
          
    $("#componentReportForm").trigger("submit");
    $("#generateReportFromCart").prop("disabled", "disabled");
    $("#generateReportFromCart").find(".action-text").hide();
    $("#generateReportFromCart").find(".loading-text").show();
    setTimeout(function() {
      $("#generateReportFromCart").prop("disabled", false);
      $("#generateReportFromCart").find(".loading-text").hide();
      $("#generateReportFromCart").find(".action-text").show();
    }, 5000);
  });

  self.$container.on("click", ".clear-cart-btn", function() {
    self.cart.clearSelection();
    location.reload();
  });
};

CartCheckout.prototype.sharedShelf = function() {
	if ($("#generateReportType").val() == "shared_shelf") {
			var shared_shelf_warning = $(AS.renderTemplate("template_cart_shared_shelf_warning"));
			$("#componentReportForm").prepend(shared_shelf_warning);
	}
	else $("#shared_shelf_warning").remove();
}

$(function() {
  if (typeof AS.Cart == "undefined") {
    return;
  }

  new CartCheckout(AS.Cart, $("#cartCheckoutPane"), $("#cartData"));
});
