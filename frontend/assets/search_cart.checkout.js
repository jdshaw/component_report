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
    alert("Next on the list!");
  });
};
