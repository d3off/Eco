**Link:** https://eco-orbitnewversionprime.vercel.app/prediction

**UZBEKCHA QOLLANMA**
# EcoOrbit dasturini ishga tushirish bo‘yicha qo‘llanma

Dasturni qayta ishga tushirish yoki boshqa kompyuterda yoqish uchun quyidagi qadamlarni bajaring. Loyiha ikki qismdan iborat bo‘lgani sababli, ikkita terminal oynasi (Command Prompt yoki PowerShell) ochilishi kerak bo‘ladi.

---

## 1-qadam: Backend (Server) qismini ishga tushirish

Ushbu qism ma’lumotlarni qayta ishlash, hisob-kitoblar va baza bilan ishlash uchun javob beradi.

1. Yangi terminal oynasini oching.
2. Backend papkasiga o‘ting:

```powershell id="jlwmn0"
cd c:\Users\User\Desktop\EcoOrbitximik\EcoOrbitximik\EcoOrbit\backend
```

3. Serverni ishga tushiring:

```powershell id="7dnsvx"
python -m uvicorn main:app --reload
```

Agar hammasi muvaffaqiyatli ishga tushsa, terminalda quyidagi yozuv paydo bo‘ladi:

```txt id="7aqjya"
Uvicorn running on http://127.0.0.1:8000
```

---

## 2-qadam: Frontend (Sayt) qismini ishga tushirish

Ushbu qism interfeys, xarita va ma’lumotlarning vizual ko‘rinishi uchun javob beradi.

1. Yana bir alohida terminal oynasini oching.
2. Frontend papkasiga o‘ting:

```powershell id="bqarf4"
cd c:\Users\User\Desktop\EcoOrbitximik\EcoOrbitximik\EcoOrbit\frontend
```

3. Saytni quyidagi buyruq orqali ishga tushiring:

```powershell id="y7f1br"
npm run dev
```

Ishga tushgandan so‘ng terminalda sayt manzili chiqadi. Odatda:

```txt id="3a8txj"
http://localhost:5173
```

yoki

```txt id="ddm2p7"
http://localhost:5174
```

---

## 3-qadam: Saytni ochish

Brauzeringizni (Chrome, Edge va boshqalar) oching va frontend terminalida chiqqan manzilga kiring.

Misol:

👉 http://localhost:5174/

---

## Foydali ma’lumotlar

### Python

Backend ishlashi uchun Python o‘rnatilgan bo‘lishi kerak.

Tekshirish:

```powershell id="ns3gk8"
python --version
```

---

### Node.js

Frontend ishlashi uchun Node.js va npm kerak bo‘ladi.

Tekshirish:

```powershell id="0k2n5p"
npm --version
```

---

## Kutubxonalarni o‘rnatish

Agar loyiha birinchi marta ishga tushirilayotgan bo‘lsa, kerakli kutubxonalarni o‘rnatish zarur.

### Backend

```powershell id="l2k17y"
pip install -r requirements.txt
```

### Frontend

```powershell id="6g95zl"
npm install
```

---

## Eslatma

Dastur to‘g‘ri ishlashi uchun ikkala terminal ham bir vaqtning o‘zida ishlab turishi kerak:

* backend (uvicorn)
* frontend (npm run dev)

Qismlardan biri ishlamasa, sayt noto‘g‘ri ishlashi yoki umuman ochilmasligi mumkin.

---
**СПРАВОЧНИК НА РУССКОМ:**
# Инструкция по запуску EcoOrbit

Чтобы повторно запустить программу или открыть её на другом компьютере, выполните следующие шаги. Проект состоит из двух частей, поэтому потребуется открыть два окна терминала (Command Prompt / PowerShell).

---

## Шаг 1: Запуск Backend (Серверной части)

Эта часть отвечает за обработку данных, вычисления и работу базы данных.

1. Откройте новый терминал.
2. Перейдите в папку backend:

```powershell
cd c:\Users\User\Desktop\EcoOrbitximik\EcoOrbitximik\EcoOrbit\backend
```

3. Запустите сервер:

```powershell
python -m uvicorn main:app --reload
```

Если всё успешно запустилось, появится сообщение:

```txt
Uvicorn running on http://127.0.0.1:8000
```

---

## Шаг 2: Запуск Frontend (Сайта)

Эта часть отвечает за интерфейс, карту и визуальное отображение данных.

1. Откройте ещё одно отдельное окно терминала.
2. Перейдите в папку frontend:

```powershell
cd c:\Users\User\Desktop\EcoOrbitximik\EcoOrbitximik\EcoOrbit\frontend
```

3. Запустите сайт командой:

```powershell
npm run dev
```

После запуска в терминале появится адрес сайта, обычно:

```txt
http://localhost:5173
```

или

```txt
http://localhost:5174
```

---

## Шаг 3: Открытие сайта

Откройте браузер (Chrome, Edge и т.д.) и перейдите по адресу, который появился в терминале frontend.

Пример:

👉 http://localhost:5174/

---

## Полезная информация

### Python

Для работы backend необходимо установить Python.

Проверка:

```powershell
python --version
```

---

### Node.js

Для работы frontend требуется Node.js и npm.

Проверка:

```powershell
npm --version
```

---

## Установка зависимостей

Если проект запускается впервые, необходимо установить библиотеки.

### Backend

```powershell
pip install -r requirements.txt
```

### Frontend

```powershell
npm install
```

---

## Примечание

Перед использованием убедитесь, что оба терминала работают одновременно:

* backend (uvicorn)
* frontend (npm run dev)

Без одной из частей сайт может работать некорректно.
