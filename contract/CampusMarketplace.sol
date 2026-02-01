// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CampusMarketplace {
    
    // --- 状态变量 ---

    // 存储已验证用户的邮箱哈希 => 钱包地址
    mapping(bytes32 => address) public emailToAddress;
    // 存储钱包地址 => 邮箱哈希 (用于反向查询用户是否已验证)
    mapping(address => bytes32) public addressToEmail;
    // 统一响应结构体
    struct Response {
        bool success;      // 操作是否成功
        uint256 code;      // 状态码 (200=成功, 400=错误, 401=未授权)
        string message;    // 提示信息
        uint256 data;      // 可选数据 (如返回创建的 ID)
    }

    // 数据存储
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Transaction) public transactions;
    
    uint256 public listingCount = 0;
    uint256 public transactionCount = 0;

    address public admin;

    // 商品结构体
    struct Listing {
        uint256 id;
        string title;
        string description;
        uint256 price; // 单位: wei
        address seller;
        bool isActive;
        string imageHash; 
    }

    // 交易结构体
    struct Transaction {
        uint256 id;
        uint256 listingId;
        address buyer;
        address seller;
        uint256 amount;
        TransactionStatus status;
        address disputeInitiator;
        string disputeReason;
        uint256 createdAt;
    }


    enum TransactionStatus {
        Created,
        Locked,
        Disputed,
        Completed,
        Cancelled
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    constructor() {
        admin = msg.sender;
    }


    // 事件 (用于前端监听)
    event EmailBound(address indexed user, bytes32 indexed emailHash);
    event ListingCreated(uint256 indexed id, address indexed seller, string title, uint256 price);
    event TransactionCreated(uint256 indexed txId, uint256 indexed listingId, address indexed buyer, uint256 amount);
    event FundReleased(uint256 indexed txId, address seller, uint256 amount);
    event TransactionCancelled(uint256 indexed txId);
    event DisputeRaised(uint256 indexed transactionId, address initiator);
    event DisputeResolved(uint256 indexed transactionId, bool sellerWins);
    event ListingForceDelisted(uint256 indexed listingId);


    // --- 1. 用户身份绑定 ---
    // 返回: Response (success, code, message, 0)
    function bindEmail(bytes32 emailHash, bytes memory signature) external returns (Response memory) {
        Response memory res;

        // 检查邮箱是否已被绑定
        if (emailToAddress[emailHash] != address(0)) {
            res.success = false;
            res.code = 400;
            res.message = "Email already bound";
            return res;
        }
        
        // 恢复签名者地址
        address signer = recoverSigner(emailHash, signature);
        if (signer != msg.sender) {
            res.success = false;
            res.code = 401;
            res.message = "Signature verification failed";
            return res;
        }

        // 存储绑定关系
        emailToAddress[emailHash] = msg.sender;
        addressToEmail[msg.sender] = emailHash;

        emit EmailBound(msg.sender, emailHash);

        res.success = true;
        res.code = 200;
        res.message = "Email bound successfully";
        return res;
    }

    // --- 2. 登录验证 (View Function) ---
    // 查询函数保持原样，返回 bool
    function verifyLogin(address user) external view returns (bool) {
        return addressToEmail[user] != bytes32(0);
    }

    // --- 3. 发布商品 ---
    // 返回: Response (success, code, message, listingId)
    function createListing(
        string memory _title, 
        string memory _description, 
        uint256 _price,
        string memory _imageHash
    ) external returns (Response memory) {
        Response memory res;

        // 验证用户是否已绑定校园邮箱
        if (addressToEmail[msg.sender] == bytes32(0)) {
            res.success = false;
            res.code = 401;
            res.message = "User not verified";
            return res;
        }

        listingCount++;
        listings[listingCount] = Listing({
            id: listingCount,
            title: _title,
            description: _description,
            price: _price,
            seller: msg.sender,
            isActive: true,
            imageHash: _imageHash
        });

        emit ListingCreated(listingCount, msg.sender, _title, _price);

        res.success = true;
        res.code = 200;
        res.message = "Listing created successfully";
        res.data = listingCount; // 返回新创建的商品ID
        return res;
    }

    // --- 4. 创建交易 (购买商品) ---
    // 返回: Response (success, code, message, transactionId)
    function createTransaction(uint256 _listingId, bytes memory _signature) external payable returns (Response memory) {
        Response memory res;
        
        Listing memory item = listings[_listingId];
        
        // 验证商品状态
        if (!item.isActive) {
            res.success = false;
            res.code = 400;
            res.message = "Item not available";
            return res;
        }

        if (item.seller == msg.sender) {
            res.success = false;
            res.code = 400;
            res.message = "Cannot buy your own item";
            return res;
        }
        
        // 验证买家身份
        if (addressToEmail[msg.sender] == bytes32(0)) {
            res.success = false;
            res.code = 401;
            res.message = "Buyer not verified";
            return res;
        }

        if (addressToEmail[item.seller] == bytes32(0)) {
            res.success = false;
            res.code = 401;
            res.message = "Seller not verified";
            return res;
        }

        // 验证金额
        if (msg.value < item.price) {
            res.success = false;
            res.code = 400;
            res.message = "Insufficient funds";
            return res;
        }

        // 验证买家签名
        bytes32 messageHash = keccak256(abi.encodePacked(_listingId, item.price, msg.sender, item.seller));
        address signer = recoverSigner(messageHash, _signature);
        if (signer != msg.sender) {
            res.success = false;
            res.code = 401;
            res.message = "Invalid transaction signature";
            return res;
        }

        // 标记商品为已售
        listings[_listingId].isActive = false;

        // 创建交易记录
        transactionCount++;
        transactions[transactionCount] = Transaction({
        id: transactionCount,
        listingId: _listingId,
        buyer: msg.sender,
        seller: item.seller,
        amount: msg.value,
        status: TransactionStatus.Locked,
        disputeInitiator: address(0),
        disputeReason: "",
        createdAt: block.timestamp
    });


        emit TransactionCreated(transactionCount, _listingId, msg.sender, msg.value);

        res.success = true;
        res.code = 200;
        res.message = "Transaction created successfully";
        res.data = transactionCount; // 返回新创建的交易ID
        return res;
    }

    // --- 5. 释放资金 (确认收货) ---
    // 返回: Response (success, code, message, 0)
    function releaseFunds(uint256 _txId) external returns (Response memory) {
        Response memory res;
        Transaction storage txData = transactions[_txId];

        // 验证调用者是买家
        if (txData.buyer != msg.sender) {
            res.success = false;
            res.code = 401;
            res.message = "Only buyer can release funds";
            return res;
        }

        if (txData.status != TransactionStatus.Locked) {
            res.success = false;
            res.code = 400;
            res.message = "Invalid transaction status";
            return res;
        }

        // 更新状态
        txData.status = TransactionStatus.Completed;

        // 转账给卖家
        payable(txData.seller).transfer(txData.amount);

        emit FundReleased(_txId, txData.seller, txData.amount);

        res.success = true;
        res.code = 200;
        res.message = "Funds released successfully";
        return res;
    }

    // --- 6. 取消交易 ---
    // 返回: Response (success, code, message, 0)
    function cancelTransaction(uint256 _txId) external returns (Response memory) {
        Response memory res;
        Transaction storage txData = transactions[_txId];
        
        if (txData.status != TransactionStatus.Locked) {
            res.success = false;
            res.code = 400;
            res.message = "Transaction not locked";
            return res;
        }

        if (msg.sender != txData.buyer && msg.sender != txData.seller) {
            res.success = false;
            res.code = 401;
            res.message = "Not authorized";
            return res;
        }

        // 恢复商品状态
        listings[txData.listingId].isActive = true;
        
        // 更新交易状态
        txData.status = TransactionStatus.Cancelled;

        // 退款给买家
        payable(txData.buyer).transfer(txData.amount);

        emit TransactionCancelled(_txId);

        res.success = true;
        res.code = 200;
        res.message = "Transaction cancelled successfully";
        return res;
    }

    // --- 查询函数 (View Functions - 保持原样) ---
    function getListing(uint256 _id) external view returns (Listing memory) {
        return listings[_id];
    }

    function getTransaction(uint256 _id) external view returns (Transaction memory) {
        return transactions[_id];
    }

    // --- 内部辅助函数: 签名恢复 ---
    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature) internal pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    // --- 内部辅助函数: 拆分签名 ---
    // 将 65 字节的签名拆分为 (r, s, v)，并规范化 v 值到 27 / 28
    // 用于后续 ecrecover 进行签名者地址恢复
    function splitSignature(bytes memory sig) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "Invalid signature length");
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        if (v < 27) v += 27;
        require(v == 27 || v == 28, "Invalid v value");

    }

    // --- 内部辅助函数: 以太坊标准消息哈希 ---
    function toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }


    // --- 争议处理: 用户发起争议 ---
    function raiseDispute(
        uint256 transactionId,
        string calldata reason
    ) external {
        Transaction storage txn = transactions[transactionId];

        require(
            msg.sender == txn.buyer || msg.sender == txn.seller,
            "Not transaction participant"
        );
        require(
            txn.status == TransactionStatus.Locked,
            "Transaction not disputable"
        );

        txn.status = TransactionStatus.Disputed;
        txn.disputeInitiator = msg.sender;
        txn.disputeReason = reason;
        emit DisputeRaised(transactionId, msg.sender);
    }

    // --- 管理员操作: 强制下架商品 ---
    function forceDelist(uint256 listingId) external onlyAdmin {
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Listing already inactive");

        listing.isActive = false;
    }

    // --- 管理员操作: 裁决交易争议 ---
    function resolveDispute(
        uint256 transactionId,
        bool releaseToSeller
    ) external onlyAdmin {
        Transaction storage txn = transactions[transactionId];

        require(
            txn.status == TransactionStatus.Disputed,
            "No active dispute"
        );

        txn.status = TransactionStatus.Completed;

        if (releaseToSeller) {
            payable(txn.seller).transfer(txn.amount);
        } else {
            payable(txn.buyer).transfer(txn.amount);
            listings[txn.listingId].isActive = true;
        }
    }


}
