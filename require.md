# **Web3 Campus Marketplace \- 前端开发需求列表**

**项目代号:** G7 Web3 Campus Marketplace

**基于文档:** SRS v1.0, Design Doc v1.0, Proposal

**技术栈:** React.js (TypeScript), Docker, Ethers.js, Socket.IO Client

## **1\. 核心架构与技术规范 (Architecture & Tech Stack)**

* **应用类型:** 单页应用 (SPA)。  
* **框架:** React.js 配合 TypeScript，确保类型安全。  
* **Web3 模拟:**  
  * **核心库:** 使用 ethers.js 在客户端进行**本地钱包模拟**。  
  * **密钥管理:** 实现“零密钥泄露 (Zero-Key-Leakage)”策略。前端需负责生成密钥对 (Key Pair)，私钥必须仅保留在浏览器端 (Local Storage 或 内存)，严禁发送至服务器。  
  * **签名机制:** 实现本地签名逻辑，用于登录挑战 (Challenge) 和交易确认。  
* **实时通信:** 使用 socket.io-client 实现买卖双方的即时聊天。  
* **部署:** 支持 Docker 化部署，需编写 Dockerfile，通过 Nginx 或其它方式服务静态资源。  
* **UI/UX:**  
  * 响应式设计 (Responsive Design)，适配桌面端和移动端浏览器 (Chrome, Firefox, Safari)。  
  * 现代消费级应用体验，界面简洁、层级清晰。

## **2\. 功能模块需求 (Functional Modules)**

### **2.1 用户认证与校园验证 (User Authentication & Campus Verification)**

*依据: Design Doc (Sec 4.1, 5.2.1), SRS (Sec 4.1)*

* **登录页** (Login Page):  
  * **连接钱包:** 提供 "Connect Wallet" 按钮。如果本地无钱包，需调用 ethers.js 生成新的密钥对。  
  * **签名验证流程:**  
    1. 请求后端获取 Challenge (Nonce)。  
    2. 弹出 UI 提示用户 "Please sign the following verification code..."。  
    3. 调用本地钱包进行签名。  
    4. 发送 Wallet Address \+ Signature 至后端验证。  
* **校园邮箱验证 (Campus Verification):**  
  * **状态判断:** 登录后检查用户是否已验证 (isEmailVerified)。未验证用户需强制引导至验证流程或限制功能。  
  * **输入表单:** 允许输入 @e.ntu.edu.sg 结尾的邮箱。  
  * **反馈:** 显示验证邮件已发送提示，并提供 "Resend Verification Email" 按钮。  
* **权限控制:**  
  * 未验证用户 (Guest/Unverified): 仅浏览，不可发布、不可交易、不可聊天。  
  * 尝试受限操作时，显示模态框/提示："Sorry, you need to complete campus email verification first..."。

### **2.2 市场首页与商品浏览 (Marketplace Home & Browsing)**

*依据:* SRS (Sec 4.4), Design Doc (Sec *5.2.3)*

* **商品列表:**  
  * 以卡片形式展示商品：图片、标题、价格、状态 (Available/Sold/Pending)。  
  * 支持分页或无限滚动。  
* **搜索与筛选:**  
  * **搜索栏:** 支持按关键词 (Title/Description) 搜索。  
  * **过滤器:** 支持按类别 (Books, Electronics, Furniture) 和 价格区间 筛选。  
  * 动态更新结果，响应时间目标 \< 3秒。  
* **商品详情页** (Product Detail):  
  * 展示完整信息：大图、详细描述、卖家信息 (Username, Wallet Address Masked)。  
  * **操作按钮:**  
    * "Buy Now" (仅对非卖家的验证用户可见)。  
    * "Contact Seller" (跳转至聊天)。  
  * 状态展示：如果商品状态非 AVAILABLE，需置灰购买按钮并显示状态。

### **2.3 商品发布与管理 (Listing Management)**

*依据:* SRS (Sec 4.3), Design Doc (Sec 4.2, *5.2.3)*

* **发布商品表单 (Create Listing):**  
  * **字段:** 标题 (必填)、类别 (下拉选择)、价格 (必填, 禁止负数)、描述 (必填)、图片上传 (必填)。  
  * **前端验证:** 提交前校验必填项，价格校验 (price \>= 0)。  
  * **提交反馈:** 成功后提示 "Listing submitted successfully\! Waiting for review" 并跳转。  
* **我的商品 (My Listings):**  
  * 列表展示用户发布的所有商品及其状态 (Available, Sold, Pending Review)。  
  * **编辑功能:** 点击 "Edit"，预填充原有信息 (Listing ID 不可改)。  
  * **删除功能:** 点击 "Delete"，**必须**弹出二次确认框 ("Are you sure...? Deletion cannot be undone")。

### **2.4 模拟 Web3 交易流程 (Simulated Web3 Transactions)**

*依据:* SRS (Sec 4.6), Design Doc (Sec *4.3)*

* **购买流程 (Buy Now Flow):**  
  1. 点击 "Buy Now"。  
  2. 调用 API (/api/transactions/create-payload) 获取交易 Payload (包含 ItemID, Price, Buyer/Seller Addresses)。  
  3. **交易确认弹窗:** 展示交易详情供用户核对。  
  4. **签名:** 用户点击 "Confirm Transaction"，前端调用本地钱包对 Payload Hash 进行签名。  
  5. **提交:** 发送 Signed Payload 至后端 (/api/transactions/verify-signature)。  
  6. **结果:** 成功后显示 "Transaction Success" 并跳转至订单详情或历史页。  
* **交易历史 (My Transactions):**  
  * 展示作为买家和卖家的所有交易记录。  
  * 展示字段：Transaction ID, Item, Price, Status (Confirmed/Completed), Timestamp。

### **2.5 实时聊天系统 (Real-Time Messaging)**

*依据: SRS (Sec 4.5), Design Doc (Class Diagram \- Message)*

* **聊天入口:** 商品详情页 "Contact Seller" 或 顶部导航栏消息中心。  
* **会话列表:** 列出所有活跃的买卖会话。  
* **聊天窗口:**  
  * 显示历史消息记录。  
  * 发送新消息 (文本)。  
  * 消息状态: 已读/未读 (UI 需区分)。  
  * **Socket 集成:** 监听 chat:receive 事件实现消息实时上屏，无需刷新。

### **2.6 用户个人中心 (User Profile)**

*依据: Design Doc (Sec 5.2.2)*

* **展示信息:** 用户名、头像、钱包地址 (脱敏显示)、邮箱验证状态、角色 (Student/Admin)。  
* **编辑资料:** 允许修改昵称、头像 URL、个人签名。  
  * 敏感词校验反馈："The nickname contains non-compliant content..."。  
* **账户安全:** 只读展示当前绑定的钱包和邮箱，提示不可修改。

## **3\. 接口对接要求 (API Integration Requirements)**

需对接后端提供的 RESTful API 及 WebSocket 事件：

* **Auth:** POST /api/auth/challenge, POST /api/auth/login, POST /api/auth/verify-email  
* **Items:** POST /api/items/create, GET /api/items/list, PUT/DELETE /api/items/:id  
* **Transactions:** POST /api/transactions/create-payload, POST /api/transactions/verify-signature  
* **Upload:** 图片上传接口 (具体路径需后端确认，前端需处理 multipart/form-data)  
* **Socket Events:** chat:connect, chat:send, chat:receive

## **4\. 非功能性与性能要求 (Non-functional Requirements)**

* **加载速度:** 列表页加载时间 \< 2秒 (需实现 Loading Skeleton 骨架屏)。  
* **反馈交互:**  
  * 所有不可逆操作 (删除、支付) 必须有 **Confirmation Dialog**。  
  * API 请求期间需有 Loading Spinner 遮罩或按钮 Loading 状态，防止重复提交。  
  * 成功/失败需有 Toast 提示 (e.g., "Listing deleted successfully").  
* **错误处理:** 统一处理 HTTP 401 (未登录/签名无效), 403 (权限不足), 500 (服务器错误)，显示友好的错误信息而非代码堆栈。