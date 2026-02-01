// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CampusMarketplace {
    mapping(bytes32 => address) public emailToAddress;
    mapping(address => bytes32) public addressToEmail;

    bool public debugMode = true;

    struct Response {
        bool success;
        uint256 code;
        string message;
        uint256 data;
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Transaction) public transactions;

    uint256 public listingCount = 0;
    uint256 public transactionCount = 0;

    address public admin;

    // 简易重入锁
    bool private locked;
    modifier nonReentrant() {
        require(!locked, "Reentrancy");
        locked = true;
        _;
        locked = false;
    }

    struct Listing {
        uint256 id;
        string title;
        string description;
        uint256 price;
        address seller;
        bool isActive;
        string imageHash;
    }

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

    function setDebugMode(bool _enabled) external onlyAdmin {
        debugMode = _enabled;
    }

    event EmailBound(address indexed user, bytes32 indexed emailHash);
    event ListingCreated(uint256 indexed id, address indexed seller, string title, uint256 price);
    event TransactionCreated(uint256 indexed txId, uint256 indexed listingId, address indexed buyer, uint256 amount);
    event FundReleased(uint256 indexed txId, address seller, uint256 amount);
    event TransactionCancelled(uint256 indexed txId);
    event DisputeRaised(uint256 indexed transactionId, address initiator);
    event DisputeResolved(uint256 indexed transactionId, bool sellerWins);
    event ListingForceDelisted(uint256 indexed listingId);

    // --- 1. 用户身份绑定 ---
    function bindEmail(bytes32 emailHash, bytes memory signature) external returns (Response memory) {
        signature; // silence unused warning
        Response memory res;

        if (emailToAddress[emailHash] != address(0)) {
            res.success = false;
            res.code = 400;
            res.message = "Email already bound";
            return res;
        }

        if (!debugMode) {
            // 正式模式下如果需要验签，请恢复 ecrecover 逻辑
            // 为演示目的，非 debug 模式暂时拒绝
            res.success = false;
            res.code = 501;
            res.message = "Verification disabled in production mode (Demo)";
            return res;
        }

        emailToAddress[emailHash] = msg.sender;
        addressToEmail[msg.sender] = emailHash;

        emit EmailBound(msg.sender, emailHash);

        res.success = true;
        res.code = 200;
        res.message = "Email bound successfully (debug)";
        return res;
    }

    // --- 2. 登录验证 ---
    function verifyLogin(address user) external view returns (bool) {
        if (debugMode) return true;
        return addressToEmail[user] != bytes32(0);
    }

    // --- 3. 发布商品 ---
    function createListing(
        string memory _title,
        string memory _description,
        uint256 _price,
        string memory _imageHash
    ) external returns (Response memory) {
        Response memory res;

        if (!debugMode && addressToEmail[msg.sender] == bytes32(0)) {
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
        res.data = listingCount;
        return res;
    }

    // --- 4. 创建交易 (购买商品) ---
    function createTransaction(uint256 _listingId, bytes memory _signature)
        external
        payable
        returns (Response memory)
    {
        _signature; // silence unused warning
        Response memory res;

        if (_listingId == 0 || _listingId > listingCount) {
            res.success = false;
            res.code = 400;
            res.message = "Listing not found";
            return res;
        }

        Listing memory item = listings[_listingId];

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

        if (!debugMode && addressToEmail[msg.sender] == bytes32(0)) {
            res.success = false;
            res.code = 401;
            res.message = "Buyer not verified";
            return res;
        }

        if (msg.value < item.price) {
            res.success = false;
            res.code = 400;
            res.message = "Insufficient funds";
            return res;
        }

        if (!debugMode) {
             // 模拟生产环境验证检查
             res.success = false;
             res.code = 501;
             res.message = "Verification disabled in production mode (Demo)";
             return res;
        }

        listings[_listingId].isActive = false;

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
        res.message = "Transaction created successfully (debug)";
        res.data = transactionCount;
        return res;
    }

    // --- 5. 释放资金 (确认收货) ---
    // 修改：恢复为直接转账模式，适配当前前端 (没有提现按钮)
    function releaseFunds(uint256 _txId) external nonReentrant returns (Response memory) {
        Response memory res;

        if (_txId == 0 || _txId > transactionCount) {
            res.success = false;
            res.code = 400;
            res.message = "Transaction not found";
            return res;
        }

        Transaction storage txData = transactions[_txId];

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

        txData.status = TransactionStatus.Completed;

        // 直接转账，而不是存入 pendingWithdrawals
        (bool sent, ) = payable(txData.seller).call{value: txData.amount}("");
        require(sent, "Failed to send Ether");

        emit FundReleased(_txId, txData.seller, txData.amount);

        res.success = true;
        res.code = 200;
        res.message = "Funds released successfully";
        return res;
    }

    // --- 6. 取消交易 ---
    // 修改：恢复为直接转账模式
    function cancelTransaction(uint256 _txId) external nonReentrant returns (Response memory) {
        Response memory res;

        if (_txId == 0 || _txId > transactionCount) {
            res.success = false;
            res.code = 400;
            res.message = "Transaction not found";
            return res;
        }

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

        listings[txData.listingId].isActive = true;
        txData.status = TransactionStatus.Cancelled;

        // 直接退款给买家
        (bool sent, ) = payable(txData.buyer).call{value: txData.amount}("");
        require(sent, "Failed to return Ether");

        emit TransactionCancelled(_txId);

        res.success = true;
        res.code = 200;
        res.message = "Transaction cancelled successfully";
        return res;
    }

    // --- 争议处理 (保持原样) ---
    function raiseDispute(uint256 transactionId, string calldata reason) external {
        require(transactionId > 0 && transactionId <= transactionCount, "Transaction not found");
        Transaction storage txn = transactions[transactionId];

        require(msg.sender == txn.buyer || msg.sender == txn.seller, "Not transaction participant");
        require(txn.status == TransactionStatus.Locked, "Transaction not disputable");

        txn.status = TransactionStatus.Disputed;
        txn.disputeInitiator = msg.sender;
        txn.disputeReason = reason;

        emit DisputeRaised(transactionId, msg.sender);
    }

    function forceDelist(uint256 listingId) external onlyAdmin {
        require(listingId > 0 && listingId <= listingCount, "Listing not found");
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Listing already inactive");

        listing.isActive = false;
        emit ListingForceDelisted(listingId);
    }

     // --- 管理员仲裁 ---
    function resolveDispute(uint256 transactionId, bool releaseToSeller)
        external
        onlyAdmin
        nonReentrant
    {
        require(transactionId > 0 && transactionId <= transactionCount, "Transaction not found");
        Transaction storage txn = transactions[transactionId];
        require(txn.status == TransactionStatus.Disputed, "No active dispute");

        txn.status = TransactionStatus.Completed;
        emit DisputeResolved(transactionId, releaseToSeller);

        if (releaseToSeller) {
            (bool sent, ) = payable(txn.seller).call{value: txn.amount}("");
            require(sent, "Failed to send Ether to seller");
        } else {
             (bool sent, ) = payable(txn.buyer).call{value: txn.amount}("");
            require(sent, "Failed to return Ether to buyer");
            listings[txn.listingId].isActive = true;
        }
    }

    receive() external payable {}
}
