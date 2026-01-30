# 🚀 High-Performance URL Shortener

A production-ready URL shortener built with **NestJS**, **Redis**, and **PostgreSQL**. Designed with scalability, security, and performance in mind.

---

## ✨ Features

- **⚡ Blazing Fast**: Redis-powered caching with **Conditional Dynamic TTL** for optimized resolution times.
- **🛡️ Secure**: JWT-based authentication for user management and link ownership.
- **🧩 Custom Aliases**: Support for user-defined short codes with automatic collision handling.
- **⏳ Expiration Support**: Automatic invalidation of links based on user-defined timestamps.
- **🏗️ Robust Retries**: Smart 5-attempt retry logic with salted hashing for collision-free code generation.
- **🧪 Tested**: 100% logic coverage for core shortening and resolution services.

---

## 🛠️ Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) (Node.js)
- **Language**: TypeScript
- **Database**: PostgreSQL with [TypeORM](https://typeorm.io/)
- **Cache**: Redis via [ioredis](https://github.com/redis/ioredis)
- **Auth**: Passport.js & JWT
- **Validation**: Class-validator & Class-transformer

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL
- Redis

### Installation

1. **Clone the repo**

   ```bash
   git clone https://github.com/ncbinh98/url-shortener.git
   cd url-shortener
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Copy `.env.example` to `.env` and update your database/redis credentials.

4. **Run Migrations**

   ```bash
   npm run migration:run
   ```

5. **Start the server**
   ```bash
   npm run start:dev
   ```

---

## 📖 Key Architecture Highlights

### Cache-Aside Strategy

We implement a smart **Cache-Aside** pattern. For link resolution:

1. Pull from **Redis** (O(1)).
2. Fallback to **PostgreSQL** if cache miss.
3. Update cache with specialized TTL:
   - **Default**: 24 hours.
   - **Dynamic**: If a link expires in < 24h, the cache TTL is matched to the exact expiration second.

### Collision Handling

Short codes are generated using **Base62 encoding** of hashed URLs. If a collision occurs, the system automatically appends a salt and retries up to 5 times to ensure 100% uniqueness without sacrificing code length.

---

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run in watch mode
npm run test:watch
```

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a PR.

---

## 📄 License

This project is [UNLICENSED](LICENSE).
