# Тест по Python (Next.js)

Сайт-тест в тёмно-синем стиле: 20 закрытых вопросов (a, b, c, d), 5 открытых
и 5 заданий, где нужно написать код. Код проверяется автоматически прямо
в браузере (Skulpt, лежит в `public/skulpt`, интернет для проверки не нужен).

## Запуск на Ubuntu

1. Установите Node.js 18 или новее (если ещё не установлен):

       curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
       sudo apt-get install -y nodejs

   Проверка: `node -v` (должно быть v18 и выше).

2. Распакуйте архив и перейдите в папку:

       tar xzf python-test-nextjs.tar.gz
       cd python-test-nextjs

3. Установите зависимости:

       npm install

4. Запустите.

   Режим разработки: `npm run dev`

   Обычный (быстрее): `npm run build && npm start`

5. Откройте в браузере http://localhost:3000

Другой порт: `PORT=8080 npm start`.
Чтобы открыть сайт с других устройств в сети: `npm start -- -H 0.0.0.0`.

## Где менять вопросы

Все вопросы лежат в `app/data.js`. Формат каждого блока описан в комментариях.
# Python-Test
