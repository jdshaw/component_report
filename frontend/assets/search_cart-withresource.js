function Cart(primaryKey, secondaryKey) {
  this.STORAGE_KEY = primaryKey;
  this.key = secondaryKey;
  this.$cart = this.createCartWidget();

  this.LIMIT = this.$cart.data("limit");
  this.IS_SEARCH_PAGE = this.$cart.data("is-search-page");

  var allData = AS.getData(this.STORAGE_KEY);
  if (allData == null) {
    // remove any existing carts and child keys from the storage
    // if user is new to this browser
    AS.flushData();
    for (var key in localStorage){
   		if (key.substring(0, 16) == "as-cart-children") {
   			localStorage.removeItem(key);
   		}
		}
    allData = {};
  }
  this.data = allData[this.key] || [];

  // only allow these types to be added to the cart
  this.SUPPORTED_JSONMODEL_TYPES = ['resource', 'archival_object'];

  this.setupCartEvents();
  this.updateSelectionSummary();
  this.setupSearchResultsActions();
  if (this.IS_SEARCH_PAGE) {
    this.setupAddAllFromSearchAction();
  }
  this.setupTreePageActions();
};

Cart.prototype.createCartWidget = function() {
  var $cart = $(AS.renderTemplate("template_cart_toolbar_action"));

  $(".repository-header .navbar-nav .repo-container").before($cart);

  return $cart;
};


Cart.prototype.loadCart = function($container, onComplete) {
  var self = this;

  var load_url = $container.data("load-url");

  if (typeof load_url == "undefined") {
    return;
  }

  $.post(load_url, {uri: self.data}, function(html) {
    $container.html(html);

    self.bindSummaryEvents($container);

    if (onComplete) {
      onComplete();
    }
  });
};


Cart.prototype.setupCartEvents = function() {
  var self = this;

  self.$cart.on("click", ".show-cart-btn", function(event) {
    event.preventDefault();

    var $modal = AS.openCustomModal("quickModal",
      AS.renderTemplate("template_cart_dialog_title"),
      AS.renderTemplate("modal_quick_template", {
        message: AS.renderTemplate("template_cart_dialog_contents", {
          selected: self.data
        })
      }),
      "full");

    if ($modal.has("#cartCheckoutPane")) {
      self.loadCart($("#cartCheckoutPane", $modal));
    }

    $modal.find(".modal-footer").replaceWith(AS.renderTemplate("template_cart_dialog_footer"));

    self.bindSummaryEvents($modal);
  });

  self.$cart.on("click", "#cartSummaryDropdownBtn", function(event) {
    $("#cartSummaryDropdownPanel").find(".cart-summary").html(AS.renderTemplate("template_cart_dialog_contents", {
      selected: self.data
    }));

    if ($.isEmptyObject(self.data)) {
      $("#cartSummaryDropdownPanel").find("button").addClass("disabled").attr("disabed", "disabled");
    } else {
      $("#cartSummaryDropdownPanel").find("button").removeClass("disabled").removeAttr("disabed");
    }
  });

  self.$cart.on("click", ".cart-summary button", function(event) {
    event.preventDefault();
    event.stopPropagation();
  });

  self.$cart.on("click", ".clear-cart-btn", function() {
    self.clearSelection();
    location.reload();
  });
};


Cart.prototype.bindSummaryEvents = function($container) {
  var self = this;

  $container.
    on("click", ".clear-cart-btn", function(event) {
      self.clearSelection();
      location.reload();
    }).
    on("click", ".remove-from-cart-btn", function(event) {
      event.stopPropagation();

      var $btn = $(event.target).closest(".btn");
      var $tr = $btn.closest("tr");
      self.removeFromSelection($btn.data("uri"));
      $tr.remove();
    });

  // trigger a resize so the modal resizes to fit the container size
  $(window).trigger("resize");
}


Cart.prototype.clearSelection = function() {
  var self = this;

  self.data = AS.setData(self.STORAGE_KEY, function(data) {
    if (data) {
      $.each(data[self.key], function (k,v) {
      localStoreKey = "as-cart-children"+v;
      	if (localStoreKey in localStorage) {
      		localStorage.removeItem(localStoreKey);
      	}
      });
      delete data[self.key];
    }

    return data;
  });

  self.updateSelectionSummary();
};


Cart.prototype.updateSelectionSummary = function() {
  var self = this;

  if ($.isEmptyObject(self.data)) {
    self.$cart.find(".cart-count").html("0");
    self.cartIsNoLongerFull();
  } else {
    var size = 0;
    for (var _ in self.data) {
      size++
    }
    self.$cart.find(".cart-count").html(size).removeClass("hide");
    if (size >= self.LIMIT) {
      self.raiseCartIsFull();
    } else {
      self.cartIsNoLongerFull();
    }
  }
};


Cart.prototype.removeFromSelection = function(uri) {
  var self = this;

  self.data = AS.setData(self.STORAGE_KEY, function(data) {
    if (data == null) {
      data = {};
    }
    if (!data.hasOwnProperty(self.key)) {
      data[self.key] = [];
    }

    if ($.inArray(uri, data[self.key]) >= 0) {
      data[self.key].splice($.inArray(uri, data[self.key]), 1);
    }

    return data;
  })[self.key] || [];

  if (self.$table && self.$table.length) {
    var $tr = self.$table.find("[data-uri='"+uri+"']");
    $tr.find(".add-to-cart-btn").removeClass("hide");
    $tr.find(".remove-from-cart-btn").addClass("hide");
  }

  self.updateSelectionSummary();
};


Cart.prototype.addURItoCartData = function(uri) {
  var self = this;

  self.data = AS.setData(self.STORAGE_KEY, function(data) {
    if (data == null) {
      data = {};
    }

    if (!data.hasOwnProperty(self.key)) {
      data[self.key] = [];
    }

    if ($.inArray(uri, data[self.key]) < 0) {
      data[self.key].push(uri);
    }

    return data;
  })[self.key];
};

Cart.prototype.addURIChildrenToCartData = function(uri) {
	var self = this;
	
	return function() {
		var currentCartMax = self.LIMIT - self.$cart.find(".cart-count").html();
		if (currentCartMax > 0) {
			var defer = $.Deferred();
				$.post("/plugins/component_report/children_uris_for_search", 
					{uri:uri, cart_max: currentCartMax},
					function (json) {
						defer.resolve();
						localStorage.setItem("as-cart-children"+uri,json);
						
						$.each(json, function(k,v){
							self.addURItoCartData(v);
						});
						
						self.updateSelectionSummary();
						$(".cart-actions .btn-group button").removeAttr("disabled");
					}
				);

			return defer.promise();
		}
		self.removeOverlay();
	}
};

Cart.prototype.addToSelection = function(uri, record_type) {
  var self = this;

  if ($.inArray(record_type, self.SUPPORTED_JSONMODEL_TYPES) < 0) {
    return;
  }

  self.addURItoCartData(uri);
  self.updateSelectionSummary();
};

Cart.prototype.addWithChildrenToSelection = function (uri, record_type) {
	var self = this;
	
	if ($.inArray(record_type, self.SUPPORTED_JSONMODEL_TYPES) < 0) {
    return;
  }
  
  self.addURItoCartData(uri);
  self.updateSelectionSummary();
  self.insertOverlay();

  // if the record is a resource, we need to find all of the children and 
  // send those individually off to addWithChildrenToSelection()
  // do this serially so that we don't overrun the cart limit by too much
  if (record_type == 'resource') {
  	var resourceChildren = new Array();
  	var resourceID = $('#archives_tree').data("root-id");
  	$.getJSON("/resources/"+resourceID+"/tree", function (json) {
  		$.each(json.children, function (child, object) {
  			self.addURItoCartData(object.record_uri);
  			self.updateSelectionSummary();
  			resourceChildren.push(object.record_uri);
  			populateChildren();
			});
  	});
  }
  else {
   resourceChildren = [uri];
   populateChildren();
  }
  
  function populateChildren() { 
  console.log(resourceChildren);

  var base = $.when({});
  $.each(resourceChildren, function (k,v) {
			base = base.then(self.addURIChildrenToCartData(v));
	});
  }
  //else $.when({}).then(self.addURIChildrenToCartData(uri));
};

Cart.prototype.removeWithChildrenFromSelection = function (uri) {
	var self = this;
  
  self.removeFromSelection(uri);
  var localStoreKey = "as-cart-children"+uri;
  var children = localStorage.getItem(localStoreKey).split(",");
  $.each(children, function (k,v) {
  	  self.removeFromSelection(v);
  });
  localStorage.removeItem(localStoreKey);
};


Cart.prototype.setupSearchResultsActions = function() {
  var self = this;

  self.$table = $(".table-search-results");
  var actions = AS.renderTemplate("template_cart_actions");

  self.$table.find("tr[data-uri]").each(function() {
    var $tr = $(this);
    if ($.inArray($tr.data("record-type"), self.SUPPORTED_JSONMODEL_TYPES) >= 0) {
      $tr.find(".table-record-actions").append(actions);

      if (self.isSelected($tr.data("uri"))) {
        $tr.find(".add-to-cart-btn").addClass("hide");
        $tr.find(".remove-from-cart-btn").removeClass("hide");
      }

      if (localStorage["as-cart-children"+$tr.data("uri")]) {
				$tr.find(".add-to-cart-with-children").addClass("hide");
				$tr.find(".remove-from-cart-with-children").removeClass("hide");
      }
    }
  });

  self.$table.
    on("click", ".add-to-cart-btn", function(event) {
      var $tr = $(event.target).closest("tr");
      self.addToSelection($tr.data("uri"), $tr.data("record-type"));
      $tr.find(".add-to-cart-btn").addClass("hide");
      $tr.find(".remove-from-cart-btn").removeClass("hide");
    }).
    on("click", ".remove-from-cart-btn", function(event) {
      var $tr = $(event.target).closest("tr");
      self.removeFromSelection($tr.data("uri"))
      $tr.find(".add-to-cart-btn").removeClass("hide");
      $tr.find(".remove-from-cart-btn").addClass("hide");
    }).
    on("click", ".cart-plus-children-btn", function(event) {
      $(".cart-actions .btn-group button").attr("disabled","disabled");
    	var $tr = $(event.target).closest("tr");
    	self.addWithChildrenToSelection($tr.data("uri"), $tr.data("record-type"));
    	$tr.find(".add-to-cart-btn").addClass("hide");
      $tr.find(".remove-from-cart-btn").removeClass("hide");
			$tr.find(".add-to-cart-with-children").addClass("hide");
			$tr.find(".remove-from-cart-with-children").removeClass("hide");
    }).
     on("click", ".cart-minus-children-btn", function(event) {
    	var $tr = $(event.target).closest("tr");
    	self.removeWithChildrenFromSelection($tr.data("uri"));
    	$tr.find(".add-to-cart-btn").removeClass("hide");
      $tr.find(".remove-from-cart-btn").addClass("hide");
			$tr.find(".add-to-cart-with-children").removeClass("hide");
			$tr.find(".remove-from-cart-with-children").addClass("hide");
    });

};


Cart.prototype.isSelected = function(uri) {
  return $.inArray(uri, this.data || []) >= 0;
}


Cart.prototype.setupTreePageActions = function() {
  var self = this;
  var $tree = $("#archives_tree");
  var $treeContainer = $tree.closest(".archives-tree-container");

	var spinnerOverlay = AS.renderTemplate("template_cart_add_children_overlay");
	$('.container-fluid .content-pane').prepend(spinnerOverlay);
	
  if (!AS.hasOwnProperty("tree_data") || $tree.data("root-node-type") != "resource") {
    return;
  }

  function toggleCartActions(uri) {
    if (self.isSelected(uri)) {
      $treeContainer.find(".add-to-cart-btn").addClass("hide");
      $treeContainer.find(".remove-from-cart-btn").removeClass("hide");
    } else {
      $treeContainer.find(".add-to-cart-btn").removeClass("hide");
      $treeContainer.find(".remove-from-cart-btn").addClass("hide");
    }
    if (localStorage["as-cart-children"+uri]) {
			$treeContainer.find(".add-to-cart-with-children").addClass("hide");
			$treeContainer.find(".remove-from-cart-with-children").removeClass("hide");
		}
  }

  function uriForNode($node) {
    if ($node.data("uri")) {
      return $node.data("uri");
    }
    // Some nodes don't store the uri...
    return CURRENT_REPO_URI + "/" + $node.attr("rel") + "s/" + $node.data("id");
  };

  function setupTreeToolbar(event) {
    var $node = $(".primary-selected", $tree);

    if ($node.hasClass("new")) {
      // nothing to do as item is new
      return;
    }
    
    // remove any existing cart buttons
    $treeContainer.find(".cart-actions").remove();

    var uri = uriForNode($node);

    var actions = AS.renderTemplate("template_cart_actions");
    $treeContainer.prepend(actions);

    toggleCartActions(uri);
  };


  $tree.on("loaded.jstree select_node.jstree", function(event) {
    setupTreeToolbar(event);
  });

  $treeContainer.
    on("click", ".add-to-cart-btn", function(event) {
      var $node = $tree.find(".primary-selected");
      var uri = uriForNode($node);

      self.addToSelection(uri, $node.attr("rel"));
      toggleCartActions(uri);
    }).
    on("click", ".remove-from-cart-btn", function(event) {
      var $node = $tree.find(".primary-selected");
      var uri = uriForNode($node);

      self.removeFromSelection(uri)

      toggleCartActions(uri);
    }).
    on("click", ".cart-plus-children-btn", function(event) {
    	$(".cart-actions .btn-group button").attr("disabled","disabled");
      var $node = $tree.find(".primary-selected");
      var uri = uriForNode($node);
    	self.addWithChildrenToSelection(uri, $node.attr("rel"));
    	$treeContainer.find(".add-to-cart-with-children").addClass("hide");
			$treeContainer.find(".remove-from-cart-with-children").removeClass("hide");
      toggleCartActions(uri);
    }).
     on("click", ".cart-minus-children-btn", function(event) {
      var $node = $tree.find(".primary-selected");
      var uri = uriForNode($node);
    	self.removeWithChildrenFromSelection(uri);
    	$treeContainer.find(".add-to-cart-with-children").removeClass("hide");
			$treeContainer.find(".remove-from-cart-with-children").addClass("hide");
      toggleCartActions(uri);
    });
};


Cart.prototype.addAllToSelection = function(uris) {
  var self = this;

  function uniquify(array) {
    var tmp_hash = {}, result=[];
    for(var i = 0; i < array.length; i++)
    {
      if (!tmp_hash[array[i]])
      {
        tmp_hash[array[i]] = true;
        result.push(array[i]);
      }
    }
    return result;
  };

  var newData = uniquify([].concat(self.data.concat(uris)));

  if (newData.length > self.LIMIT) {
    // raise too big! and slice to LIMIT
    newData = newData.slice(0, self.LIMIT);
  }

  self.data = AS.setData(self.STORAGE_KEY, function(data) {
    if (data == null) {
      data = {};
    }

    data[self.key] = newData;

    return data;
  })[self.key];

  self.updateSelectionSummary();

  // toggle all cart buttons to be added
  $(".add-to-cart-btn").addClass("hide");
  $(".remove-from-cart-btn").removeClass("hide");
}


Cart.prototype.setupAddAllFromSearchAction = function() {
  var self = this;
  var $searchTable = $("#tabledSearchResults");

  if ($searchTable.length == 0) {
    // no search results on this page
    return;
  }

  var $action = $(AS.renderTemplate("template_cart_add_all_action"));
  $searchTable.before($action);

  $action.click(function() {
    $action.find(".loading").removeClass("hide");
    $action.prop("disabled", "disabled");
    $.getJSON("/plugins/component_report/uris_for_search" + location.search, function(json) {
      self.addAllToSelection(json);
      $action.find(".loading").remove();
      $action.removeClass("btn-info").addClass("btn-success");
      $action.find(".action-text").remove();
      $action.find(".success-text").removeClass("hide");
    });
  });
};


Cart.prototype.raiseCartIsFull = function() {
  this.$cart.find(".btn.show-cart-btn").addClass("btn-danger");
};

Cart.prototype.cartIsNoLongerFull = function() {
  this.$cart.find(".btn.show-cart-btn.btn-danger").removeClass("btn-danger");
};

Cart.prototype.insertOverlay = function() {
	 var spinnerTop = window.innerHeight/2;
	 //console.log(spinnerTop);
    $("#archives_tree_overlay_for_cart_action").height('100%');
    $("#archives_tree_overlay_for_cart_action").siblings(".spinner_for_cart").show().css('top',spinnerTop);
  }
  
Cart.prototype.removeOverlay = function() {
    $("#archives_tree_overlay_for_cart_action").height('0%');
    $("#archives_tree_overlay_for_cart_action").siblings(".spinner_for_cart").hide().css('top','');
  }

$(function() {
  if (typeof CURRENT_REPO_URI == "undefined" || typeof CURRENT_USER_HASH == "undefined" ) {
    return;
  }

  AS.Cart = new Cart(CURRENT_USER_HASH, CURRENT_REPO_URI);
});

// Add API for storing to LocalStorage
AS.getData = function(key) {
  return $.jStorage.get(key);
};
AS.setData = function(key, mutator) {
  var data = AS.getData(key);
  var updated = mutator(data);

  $.jStorage.set(key, updated);

  return updated;
};
AS.flushData = function() {
  $.jStorage.flush();
};