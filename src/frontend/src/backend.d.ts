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
export interface backendInterface {
    addProduct(_sessionToken: string, name: string, description: string, price: number, category: string, weight: string, inStock: boolean): Promise<void>;
    adminLogin(username: string, password: string): Promise<boolean>;
    deleteProduct(_sessionToken: string, id: bigint): Promise<boolean>;
    getAllProducts(): Promise<Array<Product>>;
    updateProduct(_sessionToken: string, id: bigint, name: string, description: string, price: number, category: string, weight: string, inStock: boolean): Promise<boolean>;
}
