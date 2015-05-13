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

  this.$container.on("click", "#generateReportFromCart", function() {
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

$(function() {
  if (typeof AS.Cart == "undefined") {
    return;
  }

  new CartCheckout(AS.Cart, $("#cartCheckoutPane"), $("#cartData"));
});
