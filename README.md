# Campus Marketplace 功能演示指南


## 1. 准备工作
请确保开发服务器正在运行：
```bash
npm run dev
```
打开浏览器访问：`http://localhost:5173/` (推荐使用 Chrome 的移动端模拟模式或 100% 缩放)。

---

## 2. 演示流程脚本

### 场景一：浏览与搜索 (Home Page)
**目标**：展示首页布局、搜索功能和响应式设计。
1. **进入首页**：展示商品列表的 Grid 布局（每行 4 个商品）, 如果没有，可以先发布
2. **滚动浏览**：向下滑动，展示不同类型的商品（Books, Electronics 等）。
3. **搜索商品**：
   - 在搜索框输入 "Apple" 或 "Book"。
   - 观察列表实时过滤出的结果。
4. **分类筛选**：
   - 点击 Categories 单选框（如 "Electronics"）。
   - 展示筛选后的商品。


### 场景二：商品详情与购买 (Item Detail & Buy)
**目标**：展示商品详情页和模拟购买流程。
1. **点击商品**：从首页点击任意一个商品卡片（例如 "iPad Air"）。
2. **浏览详情**：
   - 查看大图、价格、卖家信息、Tag 标签。
3. **点击 "Buy Now"**：
   - 弹出确认模态框 (Confirm Purchase)。
   - 点击 "Confirm"。
   - 等待 1 秒模拟 Loading。
   - **成功反馈**：展示 "Transaction Successful" 弹窗和模拟的 Transaction Hash。
   - 点击 "OK" 返回首页。

### 场景三：连接钱包与登录 (Authentication)
**目标**：展示模拟的 Web3 登录流程。
1. **注销 (如果已登录)**：
   - 如果右上角显示头像，点击头像 -> 点击 "Logout"。
2. **点击 "Connect Wallet"**：
   - 点击 Navbar 右上角的 "Connect Wallet" 按钮。
   - 跳转至登录页面。
3. **执行登录步骤**：
   - 页面展示 Steps 步骤条 (Connect -> Sign)。
   - 点击 "Sign & Login" 按钮。
   - 观察 Loading 状态和成功提示 ("Wallet Connected", "Signature Verified")。
   - 自动跳转回首页，右上角变为用户头像。

### 场景四：发布商品 (Create Listing)
**目标**：展示表单验证和发布流程。
1. **点击 "Sell"**：Navbar 导航栏点击 "Sell"。
2. **填写表单**：
   - **Title**: 输入 "Used Calculus Textbook"。
   - **Price**: 输入 "30"。
   - **Category**: 选择 "Books"。
   - **Description**: 输入 "Good condition, no markings."。
   - **Image**: 点击 Upload 区域（模拟上传，不会真实上传文件）。
3. **提交**：
   - 点击 "Publish Listing"。
   - 观察 Loading 状态。
   - **成功反馈**：顶部出现 "Listing created successfully" 提示，并跳转回首页。

### 场景五：个人中心与验证 (Profile & Verification)
**目标**：展示用户数据统计和邮箱验证功能。
1. **进入个人中心**：点击右上角头像 -> 点击 "My Profile"。
2. **查看 Dashboard**：
   - 关注 "Items Sold" 和 "Active Listings" 统计数据。
   - 查看用户信息区域的 Wallet Address。
3. **验证邮箱** (如果显示 Unverified)：
   - 点击 "Unverified" 标签或手动访问 `/verify-email`（如果在 Profile 页面没有直接入口，请演示点击 Navbar 的 "My Profile" -> 假设包含验证引导）。
   - *注：在此版本中，如果用户未验证，页面会显示红色 "Unverified" 标签*。
   - (可选) 演示验证流程：
     - 在浏览器地址栏输入 `/verify-email` (或如果已集成在 Profile 页面则直接点击)。
     - 输入 qq 邮箱 `xxxxxxxxxx@qq.com`。
     - 点击 "Send Verification Code"。
     - 看到 "Successfully Verified" 成功页面。
     - 点击 "My Profile" 返回，看到状态变为绿色的 "Verified Student"。

### 场景六：聊天功能 (Chat)
**目标**：展示即时通讯界面。需要确保已经链接，消息列表上有绿色圆形
1. **进入聊天**：登录状态下，点击 Navbar 上的 "消息图标" (MessageOutlined)。
2. **发送消息**：
   - 在左侧列表看到 "Student_A"。
   - 在输入框输入 "Is this still available?"。
   - 点击发送按钮或按回车。
   - 消息立即出现在聊天记录中（蓝色气泡）。

---

## 3. 注意事项
- **数据重置**：如果想重置所有状态（如登录状态、验证状态），可以在浏览器的 Application -> Local Storage 中清除 `mock_user` 数据，然后刷新页面。
- **环境**：确保演示过程中网络通畅（因为图片使用的是 `placehold.co` 占位图服务）。
