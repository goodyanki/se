import { http, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import CampusMarketplaceABI from './abis/CampusMarketplace.json';

// Contract Address
export const CONTRACT_ADDRESS = "0x3FfAf5E999Fda995b7959249B2F2eFf494427457";

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
