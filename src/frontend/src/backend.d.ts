import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Product {
    id: bigint;
    weight: string;
    inStock: boolean;
    name: string;
    description: string;
    category: string;
    price: number;
}
export interface OrderItem {
    productWeight: string;
    productId: bigint;
    productName: string;
    quantity: bigint;
    price: number;
}
export interface Order {
    id: bigint;
    customerName: string;
    status: string;
    total: number;
    customerPhone: string;
    customerAddress: string;
    timestamp: bigint;
    items: Array<OrderItem>;
}
export interface backendInterface {
    addProduct(_sessionToken: string, name: string, description: string, price: number, category: string, weight: string, inStock: boolean): Promise<void>;
    adminLogin(username: string, password: string): Promise<boolean>;
    deleteProduct(_sessionToken: string, id: bigint): Promise<boolean>;
    getAllOrders(): Promise<Array<Order>>;
    getAllProducts(): Promise<Array<Product>>;
    getOrdersByPhone(phone: string): Promise<Array<Order>>;
    placeOrder(customerName: string, customerPhone: string, customerAddress: string, items: Array<OrderItem>, total: number): Promise<bigint>;
    updateOrderStatus(_sessionToken: string, orderId: bigint, status: string): Promise<boolean>;
    updateProduct(_sessionToken: string, id: bigint, name: string, description: string, price: number, category: string, weight: string, inStock: boolean): Promise<boolean>;
}
