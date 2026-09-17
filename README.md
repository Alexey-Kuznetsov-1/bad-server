# WebLarek — бэкенд (спринт 18: аудит безопасности)

Проектная работа «Бэкенд приложения». Проведён аудит безопасности, устранены критические уязвимости, обновлены зависимости.

## Автор

- **Имя:** Алексей Кузнецов
- **Когорта:** 48
- **Курс:** Фулстек-разработчик расширенный

## Репозиторий

https://github.com/Alexey-Kuznetsov-1/bad-server.git

## Стек

- TypeScript, Node.js, Express
- MongoDB, Mongoose
- JWT (access + refresh), bcryptjs
- Docker, Docker Compose, nginx
- React + Vite (фронтенд)

## Запуск

### 1. Клонировать и подготовить окружение

```bash
git clone https://github.com/Alexey-Kuznetsov-1/bad-server.git
cd bad-server
```

### 2. Создать `.env` файлы из примеров

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

В `frontend/.env` раскомментировать вариант с `/api` (для Docker):

```env
VITE_API_ORIGIN=http://localhost/api
# VITE_API_ORIGIN=http://localhost:3000
```

В `backend/.env` для Docker должна быть строка:

```env
DB_ADDRESS=mongodb://root:example@mongo:27017/weblarek?authSource=admin
ORIGIN_ALLOW=http://localhost
```

### 3. Запустить Docker

```bash
docker compose up -d
```

### 4. Импортировать базу данных

Инструкция в [.dump/README.md](.dump/README.md). Можно через MongoDB Compass по адресу `mongodb://root:example@localhost:27018/weblarek?authSource=admin` или через `mongoimport`.

### 5. Открыть сервис

- Приложение: http://localhost/
- Вход: http://localhost/login/
- Админка: http://localhost/admin/

### ⚠️ Важно: данные для входа

Дамп `.dump/weblarek.users.json` содержит **устаревшие md5-хеши** паролей, которые несовместимы с bcrypt (пароли в проекте теперь хешируются через bcryptjs).

После импорта дампа зарегистрируйте пользователей заново:

1. Войдите как admin через регистрацию:

   ```bash
   curl -X POST http://localhost/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@mail.ru","password":"password","name":"Admin"}'
   ```

2. В MongoDB Compass откройте коллекцию `users`, найдите `admin@mail.ru` и замените поле `roles` с `["customer"]` на `["admin"]`.

3. Аналогично создайте `user1@mail.ru` / `password1` (роль `customer` по умолчанию).

---

## Аудит безопасности: что найдено и исправлено

| № | Уязвимость | Коммит | Что сделано |
|---|------------|--------|-------------|
| 1 | Открытый CORS, нет security-заголовков, нет лимита на тело | `d9b608c` | `helmet()`, ограничение CORS через `ORIGIN_ALLOW`, `json({ limit: '1mb' })` |
| 2 | Отсутствовала защита от DDoS | `04fedfa` | `express-rate-limit`: 300/15мин общий, 10/15мин на `/auth/login` и `/auth/register` |
| 3 | NoSQL-инъекции, отсутствие валидации | `15429ef` | `express-mongo-sanitize`, Joi-валидация для `/auth/*`, whitelist полей при обновлении пользователя |
| 4 | Пароли хранились через `md5` без соли | `50feae1` | Замена на `bcryptjs` с 10 раундами |
| 5 | ReDoS в регулярках и в поиске | `f2945d1` | Безопасный `phoneRegExp`, `escapeRegExp` для поиска, лимит длины поиска и пагинации |
| 6 | Path Traversal в статике и загрузке файлов | `041b831` | Проверка префикса пути в `serveStatic`, безопасные имена через `crypto.randomUUID()`, лимит размера файла 5 МБ |
| 7 | `/customers` доступен обычным пользователям + краш при ошибке | `6d4d258` | `roleGuardMiddleware(Role.Admin)`, исправлен `error-handler` (убран `next()` после `res.send()`), `auth` больше не делает unhandled rejection |
| 8 | `updateCustomer` позволял менять роли/пароли | `80fa940` | Whitelist полей: только `name`, `email`, `phone` |
| 9 | CSRF-риск: `GET /auth/token`, `GET /auth/logout` | `7a14f04` | Переведены в `POST`, cookie `refreshToken` → `sameSite: 'strict'`, `secure` в проде |
| 10 | Токены жили 10 лет | `d82c537` | Access — 15 минут, refresh — 7 дней |
| 11 | nginx: debug-логи, нет rate limit | `87db75f` | `error_log warn`, `limit_req_zone`, `server_tokens off`, таймауты |
| 12 | Уязвимые npm-зависимости | `7fa2366` | `npm audit fix` (25 → 1), удалены неиспользуемые `@faker-js/faker` и `sharp`, `celebrate@16` |

### Остаточные уязвимости

`brace-expansion` (транзитивная зависимость ESLint) — единственная оставшаяся. **Только в `devDependencies`, не попадает в прод-сборку.** Обновление требует мажорного апгрейда ESLint 8 → 9 с переходом на flat config, что нецелесообразно в рамках текущего проекта.

---

## Проверка защиты

### Rate limiting

```bash
# Express: 10 попыток на /auth/login, потом 429
for i in $(seq 1 12); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"x@x.x","password":"x"}'
done

# nginx: параллельные запросы к /api/product вызывают 429
seq 1 500 | xargs -P 50 -I {} curl -s -o /dev/null -w "%{http_code}\n" \
  http://localhost/api/product | sort | uniq -c
```

### Нагрузочное тестирование (Apache Benchmark)

```bash
ab -k -c 2000 -n 50000 http://localhost/api/product/
```

Проверить:

- Не растёт ли лог-файл nginx бесконтрольно.
- Не падает ли приложение из-за OOM.
- Не выдаются ли сообщения об ошибках с версией Node.js или ОС.

### NoSQL-инъекция (заблокирована валидацией)

```bash
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":{"$ne":null},"password":{"$ne":null}}'
# → 400 Bad Request (validation)
```

---

## Разработка

### Запуск бэкенда с hot-reload

Backend в Docker запускается с `nodemon -L` — правки в `backend/src/` подхватываются автоматически.

### Пересборка фронта

Фронт собирается в Docker-образ и монтируется в nginx через **named volume**. При изменении `frontend/src/` нужно:

```bash
docker compose rm -f frontend server
docker volume rm bad-server_frontend
docker compose build frontend
docker compose up -d frontend server
```

Простой `docker compose restart frontend` **не пересоберёт** бандл.

### Линтер

```bash
cd backend
npm run lint
```

---

## Структура

```
bad-server/
├── backend/          # Express + MongoDB
│   ├── src/
│   │   ├── controllers/
│   │   ├── middlewares/    # auth, rate-limit, sanitize, static
│   │   ├── models/
│   │   ├── routes/
│   │   └── app.ts
│   └── package.json
├── frontend/         # React + Vite
├── nginx/            # Reverse proxy + rate limit
├── .dump/            # Дампы MongoDB
└── docker-compose.yml
```