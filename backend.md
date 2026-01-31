这份清单是为你和前端开发同学沟通准备的**标准技术对接文档**。你可以直接转发给对方。

目前我们采用的是 **JWT (JSON Web Token)** 认证机制，所有的交互都围绕着“钱包地址”和“校园核验”展开。

---

## 🛠 后端接口对接文档 (V1.0)

### 1. 全局约定

* **Base URL**: `http://localhost:8080/api`
* **Content-Type**: `application/json`
* **认证方式**: 使用 Bearer Token。前端在登录后的所有请求头中需加入：
`Authorization: Bearer <你的TOKEN>`

---

### 2. 接口详细说明

#### A. 钱包登录 (自动注册)

前端从 MetaMask 获取地址后调用。

* **URL**: `/auth/login`
* **Method**: `POST`
* **请求参数 (Body)**:
```json
{
  "wallet_address": "0x123..." 
}

```


* **后端逻辑**: 数据库查不到该地址则自动创建新用户。
* **返回**: `token`（前端需存入 LocalStorage/Vuex）。

#### B. 发送校园验证码

* **URL**: `/auth/send-code`
* **Method**: `POST`
* **Headers**: `Authorization: Bearer <TOKEN>`
* **请求参数 (Body)**:
```json
{
  "email": "xxx@xxx.edu.cn"
}

```


* **后端逻辑**: 真实发送 6 位验证码到该邮箱，并存入数据库，设置 10 分钟过期。

#### C. 验证码核验

* **URL**: `/auth/verify-email`
* **Method**: `POST`
* **Headers**: `Authorization: Bearer <TOKEN>`
* **请求参数 (Body)**:
```json
{
  "code": "123456"
}

```


* **后端逻辑**: 对比验证码。成功后将该用户的 `is_verified` 字段改为 `1`。

#### D. 获取个人资料 (用于前端展示状态)

* **URL**: `/auth/me`
* **Method**: `GET`
* **Headers**: `Authorization: Bearer <TOKEN>`
* **返回示例**:
```json
{
  "code": 200,
  "data": {
    "wallet_address": "0x123...",
    "email": "xxx@edu.cn",
    "is_verified": true
  }
}

```



---

### 3. 给前端开发的特别提醒 (前端逻辑梳理)

1. **权限门槛**：
* 前端在进入“发布商品”页面前，应先调用 `/auth/me`。
* 如果 `is_verified` 为 `false`，前端应弹窗拦截，引导用户跳转到“邮箱核验”页面。


2. **MetaMask 交互**：
* 登录时，前端需调用 `window.ethereum.request({ method: 'eth_requestAccounts' })` 获取地址。
* 后端目前**不校验**签名（由前端确保地址真实性），后续迭代可增加 `personal_sign` 校验。


3. **Token 过期处理**：
* 如果后端返回 `401 Unauthorized`，前端应清空本地缓存并跳转至登录页。



---

### 4. 数据库字段对应 (供前后端参考)

* `wallet_address`: 用户的唯一身份标识（主键）。
* `is_verified`: `0` 未核验，`1` 已通过校园核验。
* `verification_code`: 存储最新一次的验证码。

---

### 💡 下一个动作建议

这套逻辑已经非常清晰了。为了让前端同学能更有动力，我们需要给他们提供**商品数据**。

**我们要不要把“发布商品”和“获取商品列表”这两个接口写出来？** 这样前端同学就能直接写出：**“登录 -> 验证 -> 发布商品 -> 首页看到商品”** 这一整套酷炫的 Demo 了！如果需要，我马上给你整理商品模块的代码。