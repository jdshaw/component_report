function CartCheckout(cart, $container, $cartData) {
  this.cart = cart;
  this.$container = $container;
  this.$cartData = $cartData;

  this.loadURL = $container.data("load-url");

  this.loadCart();
};


CartCheckout.prototype.loadCart = function() {

  this.cart.loadCart(this.$cartData);

  this.$container.on("click", "#generateReportFromCart", function() {
    $("#componentReportForm").trigger("submit");
  });
};

$(function() {
  if (typeof AS.Cart == "undefined") {
    return;
  }

  new CartCheckout(AS.Cart, $("#cartCheckoutPane"), $("#cartData"));
});
