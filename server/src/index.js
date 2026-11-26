import { createPool } from './db.js';
import { createApp } from './app.js';

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is not set, using an insecure development secret.');
}
const app = createApp(createPool());
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Sweety API listening on http://localhost:${port}`));
