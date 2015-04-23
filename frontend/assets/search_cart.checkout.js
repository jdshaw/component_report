function CartCheckout(cart, $container, $cartData) {
  this.cart = cart;
  this.$container = $container;
  this.$cartData = $cartData;

  this.loadURL = $container.data("load-url");

  this.loadCart();
  this.disableCartInToolbar();
};


CartCheckout.prototype.loadCart = function() {

  this.cart.loadCart(this.$cartData);

  this.$container.on("click", "#generateReportFromCart", function() {
    alert("Next on the list!");
  });
};


CartCheckout.prototype.disableCartInToolbar = function() {
  this.cart.$cart.find(":input").attr("disabled", "disabled").addClass("disabled");
};

$(function() {
  if (typeof AS.Cart == "undefined") {
    return;
  }

  new CartCheckout(AS.Cart, $("#cartCheckoutPane"), $("#cartData"));
});