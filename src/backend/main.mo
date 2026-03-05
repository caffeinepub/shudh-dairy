import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import List "mo:core/List";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Map "mo:core/Map";
import Migration "migration";

(with migration = Migration.run)
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
    image : Storage.ExternalBlob;
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
  var nextProductId : Nat = 1;
  var nextOrderId : Nat = 1001;

  var products = Map.empty<Nat, Product>();
  var orders = Map.empty<Nat, Order>();

  public query ({ caller }) func getAllProducts() : async [Product] {
    products.values().toArray();
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    orders.values().toArray();
  };

  public query ({ caller }) func adminLogin(username : Text, password : Text) : async Bool {
    Text.equal(username, adminUsername) and Text.equal(password, adminPassword);
  };

  public shared ({ caller }) func addProduct(_sessionToken : Text, name : Text, description : Text, price : Float, category : Text, weight : Text, inStock : Bool, image : Storage.ExternalBlob) : async () {
    let newProduct : Product = {
      id = nextProductId;
      name;
      description;
      price;
      category;
      weight;
      inStock;
      image;
    };

    products.add(nextProductId, newProduct);
    nextProductId += 1;
  };

  public shared ({ caller }) func updateProduct(_sessionToken : Text, id : Nat, name : Text, description : Text, price : Float, category : Text, weight : Text, inStock : Bool, image : Storage.ExternalBlob) : async Bool {
    switch (products.get(id)) {
      case (?_product) {
        let updatedProduct : Product = {
          id;
          name;
          description;
          price;
          category;
          weight;
          inStock;
          image;
        };
        products.add(id, updatedProduct);
        true;
      };
      case (null) { false };
    };
  };

  public shared ({ caller }) func deleteProduct(_sessionToken : Text, id : Nat) : async Bool {
    switch (products.get(id)) {
      case (?_) {
        products.remove(id);
        true;
      };
      case (null) { false };
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

    orders.add(nextOrderId, newOrder);
    nextOrderId += 1;
    newOrder.id;
  };

  public query ({ caller }) func getOrdersByPhone(phone : Text) : async [Order] {
    let ordersArray = orders.values().toArray();
    let matchingOrders = ordersArray.filter(
      func(order) {
        order.customerPhone == phone;
      }
    );
    matchingOrders;
  };

  public shared ({ caller }) func updateOrderStatus(_sessionToken : Text, orderId : Nat, status : Text) : async Bool {
    switch (orders.get(orderId)) {
      case (?order) {
        let updatedOrder : Order = {
          order with status;
        };
        orders.add(orderId, updatedOrder);
        true;
      };
      case (null) { false };
    };
  };
};
