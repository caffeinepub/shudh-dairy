import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface OrderItem {
    productWeight: string;
    productId: bigint;
    productName: string;
    quantity: bigint;
    price: number;
}
export interface FounderInfo {
    bio: string;
    title: string;
    foundedYear: string;
    name: string;
    photoUrl: string;
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
export interface Review {
    id: bigint;
    customerName: string;
    comment: string;
    timestamp: bigint;
    rating: bigint;
    helpful: bigint;
}
export interface Product {
    id: bigint;
    weight: string;
    inStock: boolean;
    name: string;
    description: string;
    category: string;
    image: ExternalBlob;
    price: number;
}
export interface backendInterface {
    addProduct(_sessionToken: string, name: string, description: string, price: number, category: string, weight: string, inStock: boolean, image: ExternalBlob): Promise<void>;
    addReview(customerName: string, rating: bigint, comment: string): Promise<bigint>;
    adminLogin(username: string, password: string): Promise<boolean>;
    changeAdminPassword(_sessionToken: string, oldPassword: string, newPassword: string): Promise<boolean>;
    deleteProduct(_sessionToken: string, id: bigint): Promise<boolean>;
    deleteReview(_sessionToken: string, id: bigint): Promise<boolean>;
    getAllOrders(): Promise<Array<Order>>;
    getAllProducts(): Promise<Array<Product>>;
    getAllReviews(): Promise<Array<Review>>;
    getFounderInfo(): Promise<FounderInfo>;
    getOrdersByPhone(phone: string): Promise<Array<Order>>;
    markReviewHelpful(id: bigint): Promise<boolean>;
    placeOrder(customerName: string, customerPhone: string, customerAddress: string, items: Array<OrderItem>, total: number): Promise<bigint>;
    updateFounderInfo(_sessionToken: string, name: string, title: string, bio: string, foundedYear: string, photoUrl: string): Promise<boolean>;
    updateOrderStatus(_sessionToken: string, orderId: bigint, status: string): Promise<boolean>;
    updateProduct(_sessionToken: string, id: bigint, name: string, description: string, price: number, category: string, weight: string, inStock: boolean, image: ExternalBlob): Promise<boolean>;
}
