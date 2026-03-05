import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Storage "blob-storage/Storage";

module {
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

  type OldActor = {
    products : List.List<Product>;
    orders : List.List<Order>;
    nextProductId : Nat;
    nextOrderId : Nat;
  };

  type NewActor = {
    products : Map.Map<Nat, Product>;
    orders : Map.Map<Nat, Order>;
    nextProductId : Nat;
    nextOrderId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let productsMap = Map.fromIter<Nat, Product>(old.products.toArray().map(func(p) { (p.id, p) }).values());
    let ordersMap = Map.fromIter<Nat, Order>(old.orders.toArray().map(func(o) { (o.id, o) }).values());
    {
      products = productsMap;
      orders = ordersMap;
      nextProductId = old.nextProductId;
      nextOrderId = old.nextOrderId;
    };
  };
};
