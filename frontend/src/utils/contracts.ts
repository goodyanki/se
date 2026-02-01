import { http, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import CampusMarketplaceABI from './abis/CampusMarketplace.json';

// Contract Address
export const CONTRACT_ADDRESS = "0x4CA400092f105d5581f9ed6918BBA0896417E173";

// Helper for type-safe contract interaction
export const CAMPUS_MARKETPLACE_CONFIG = {
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CampusMarketplaceABI,
} as const;

// Types from the contract
export enum TransactionStatus {
    Created = 0,
    Locked = 1,
    Disputed = 2,
    Completed = 3,
    Cancelled = 4
}
