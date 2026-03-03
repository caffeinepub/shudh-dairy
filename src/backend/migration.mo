import List "mo:core/List";
import Nat "mo:core/Nat";

module {
  type Product = {
    id : Nat;
    name : Text;
    description : Text;
    price : Float;
    category : Text;
    weight : Text;
    inStock : Bool;
    image : Blob;
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
    nextProductId : Nat;
    nextOrderId : Nat;
    stableProducts : [Product];
    stableOrders : [Order];
  };

  type NewActor = {
    nextProductId : Nat;
    nextOrderId : Nat;
    stableProducts : [Product];
    stableOrders : [Order];
  };

  public func run(old : OldActor) : NewActor {
    old;
  };
};
