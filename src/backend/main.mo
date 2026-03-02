import Array "mo:core/Array";
import Text "mo:core/Text";
import Float "mo:core/Float";
import Time "mo:core/Time";

import List "mo:core/List";
import Nat "mo:core/Nat";
import MixinStorage "blob-storage/Mixin";


actor {
  include MixinStorage();

  type Product = {
    id : Nat;
    name : Text;
    description : Text;
    price : Float;
    category : Text;
    weight : Text;
    inStock : Bool;
  };

  type OrderItem = {
    productId : Nat;
    productName : Text;
    productWeight : Text;
    quantity : Nat;
    price : Float;
  };

  type Order = {
    id : Nat;
    customerName : Text;
    customerPhone : Text;
    customerAddress : Text;
    items : [OrderItem];
    total : Float;
    status : Text;
    timestamp : Int;
  };

  let adminUsername = "admin";
  let adminPassword = "sunrise2024";
  var nextOrderId = 1001;

  let products = List.fromArray<Product>(
    [
      {
        id = 1;
        name = "Ghee";
        description = "Pure cow ghee, rich in flavor and nutrients";
        price = 15.99;
        category = "Dairy";
        weight = "500g";
        inStock = true;
      },
      {
        id = 2;
        name = "Paneer";
        description = "Fresh homemade paneer, soft and delicious";
        price = 9.99;
        category = "Dairy";
        weight = "250g";
        inStock = true;
      },
    ]
  );

  let orders = List.empty<Order>();

  public query ({ caller }) func getAllProducts() : async [Product] {
    products.toArray();
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    orders.toArray();
  };

  public query ({ caller }) func adminLogin(username : Text, password : Text) : async Bool {
    Text.equal(username, adminUsername) and Text.equal(password, adminPassword);
  };

  public shared ({ caller }) func addProduct(_sessionToken : Text, name : Text, description : Text, price : Float, category : Text, weight : Text, inStock : Bool) : async () {
    let newId = products.size() + 1;
    let newProduct : Product = {
      id = newId;
      name;
      description;
      price;
      category;
      weight;
      inStock;
    };

    products.add(newProduct);
  };

  public shared ({ caller }) func updateProduct(_sessionToken : Text, id : Nat, name : Text, description : Text, price : Float, category : Text, weight : Text, inStock : Bool) : async Bool {
    let result = products.toArray().map(
      func(product) {
        if (product.id == id) {
          {
            id;
            name;
            description;
            price;
            category;
            weight;
            inStock;
          };
        } else { product };
      }
    );
    let existed = products.toArray().find(func(product) { product.id == id });
    products.clear();
    for (product in result.values()) {
      products.add(product);
    };
    switch (existed) {
      case (null) { false };
      case (?_) { true };
    };
  };

  public shared ({ caller }) func deleteProduct(_sessionToken : Text, id : Nat) : async Bool {
    let filteredProducts = products.toArray().filter(
      func(product) {
        product.id != id;
      }
    );
    let existed = products.toArray().find(func(product) { product.id == id });
    products.clear();
    for (product in filteredProducts.values()) {
      products.add(product);
    };
    switch (existed) {
      case (null) { false };
      case (?_) { true };
    };
  };

  public shared ({ caller }) func placeOrder(customerName : Text, customerPhone : Text, customerAddress : Text, items : [OrderItem], total : Float) : async Nat {
    let newOrder : Order = {
      id = nextOrderId;
      customerName;
      customerPhone;
      customerAddress;
      items;
      total;
      status = "Pending";
      timestamp = Time.now();
    };

    orders.add(newOrder);
    nextOrderId += 1;
    newOrder.id;
  };

  public query ({ caller }) func getOrdersByPhone(phone : Text) : async [Order] {
    orders.toArray().filter(
      func(order) {
        Text.equal(order.customerPhone, phone);
      }
    );
  };

  public shared ({ caller }) func updateOrderStatus(_sessionToken : Text, orderId : Nat, status : Text) : async Bool {
    let result = orders.toArray().map(
      func(order) {
        if (order.id == orderId) {
          {
            order with status;
          };
        } else { order };
      }
    );
    let existed = orders.toArray().find(func(order) { order.id == orderId });
    orders.clear();
    for (order in result.values()) {
      orders.add(order);
    };
    switch (existed) {
      case (null) { false };
      case (?_) { true };
    };
  };
};
