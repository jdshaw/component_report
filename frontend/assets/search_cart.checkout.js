function CartCheckout(cart, $container, $cartData) {
  this.cart = cart;
  this.$container = $container;
  this.$cartData = $cartData;

  this.loadCart();
  this.disableCartInToolbar();
};


CartCheckout.prototype.loadCart = function() {
  var self = this;

  self.$cartData.html(AS.renderTemplate("template_cart_dialog_contents", {
    selected: self.cart.data
  }));

  self.cart.bindSummaryEvents(self.$container);
  self.$container.on("click", ".clear-cart-btn", function() {
    self.cart.clearSelection();
    location.reload();
  });

  self.$container.on("click", "#generateReportFromCart", function() {
    alert("Next on the list!");
  });
}


CartCheckout.prototype.disableCartInToolbar = function() {
  this.cart.$cart.find(":input").attr("disabled", "disabled").addClass("disabled");
};

$(function() {
  if (typeof AS.Cart == "undefined") {
    return;
  }

  new CartCheckout(AS.Cart, $("#cartCheckoutPane"), $("#cartData"));
});