
import json
import logging
import sys
from web3 import Web3

# --- 配置部分 ---
# 合约地址 (请确保这与 contracts.ts 里的一致)
CONTRACT_ADDRESS = "0x3FfAf5E999Fda995b7959249B2F2eFf494427457"

# ABI 文件路径 (相对路径)
ABI_PATH = "frontend/src/utils/abis/CampusMarketplace.json"

# Sepolia RPC 节点 (更换为更稳定的节点)
RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com"
# 备用: "https://1rpc.io/sepolia"
# 备用2: "https://rpc.sepolia.org" (有时不稳定)
# 前端(MetaMask)通常用自带的 Infura 节点，但 Python 脚本需要我们自己提供一个公共节点。

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def main():
    # 1. 连接节点
    logger.info(f"Connecting to RPC: {RPC_URL} ...")
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    
    if not w3.is_connected():
        logger.error("❌ Failed to connect to Sepolia RPC. Please check your internet or try a different RPC URL.")
        return

    logger.info("✅ Connected to Sepolia network!")
    try:
        logger.info(f"Current Block Number: {w3.eth.block_number}")
    except Exception as e:
        logger.error(f"❌ Connected but failed to fetch block number: {e}")
        return

    # 2. 加载 ABI
    try:
        with open(ABI_PATH, 'r', encoding='utf-8') as f:
            contract_abi = json.load(f)
        logger.info(f"✅ Loaded ABI from {ABI_PATH}")
    except FileNotFoundError:
        logger.error(f"❌ ABI file not found at {ABI_PATH}")
        return
    except Exception as e:
        logger.error(f"❌ Error reading ABI: {e}")
        return

    # 3. 初始化合约
    try:
        contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=contract_abi)
        logger.info(f"✅ Initialized contract instance at {CONTRACT_ADDRESS}")
    except Exception as e:
        logger.error(f"❌ Failed to initialize contract: {e}")
        return

    # 4. 读取合约状态 (Read-Only Calls)
    logger.info("--- Reading Contract State ---")

    try:
        # Check 1: debugMode
        try:
            debug_mode = contract.functions.debugMode().call()
            logger.info(f"🔍 [Check] debugMode status: {debug_mode}")
            if debug_mode:
                logger.info("   -> ✅ Debug Mode is ON. Verification checks will be skipped (GOOD for testing).")
            else:
                logger.warning("   -> ⚠️ Debug Mode is OFF. You might face 'User not verified' errors if not careful.")
        except Exception as e:
             logger.warning(f"   -> ⚠️ Could not read 'debugMode' (maybe checking an old version?): {e}")

        # Check 2: listingCount
        listing_count = contract.functions.listingCount().call()
        logger.info(f"🔍 [Check] Total Listings: {listing_count}")

        # Check 3: Check admin
        admin_addr = contract.functions.admin().call()
        logger.info(f"🔍 [Check] Admin Address: {admin_addr}")

    except Exception as e:
         logger.error(f"❌ Error calling contract functions: {e}")
         return

    # 5. 模拟交易 (Simulate Transaction / Static Call)
    logger.info("--- Simulating createListing (Dry Run) ---")
    
    test_title = "Test Item from Python"
    test_desc = "Testing via web3.py"
    test_price = w3.to_wei(0.01, 'ether')
    test_image = "QmTestHash"
    test_sender = admin_addr 

    try:
        response = contract.functions.createListing(
            test_title,
            test_desc,
            test_price,
            test_image
        ).call({'from': test_sender})
        
        success, code, message, data = response
        
        logger.info(f"📝 Simulation Result: Success={success}, Code={code}, Msg='{message}'")
        
        if success and code == 200:
             logger.info("✅ SUCCESS! The contract logic allows creating a listing.")
        else:
             logger.error(f"❌ FAILURE! Reason: {message}")

    except Exception as e:
        logger.error(f"❌ Simulation reverted or failed: {e}")

    print("\n" + "="*50)
    print("FINISHED. If you see ✅ SUCCESS above, your contract is ready!")
    print("="*50)

if __name__ == "__main__":
    main()
