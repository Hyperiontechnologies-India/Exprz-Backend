const express = require('express');
const cors = require('cors');
const app = express();
const { sequelize, connectDB } = require('./config/db');

const Cart = require('./models/Cart');
const Product = require('./models/Product');
const Category = require('./models/Category');

// Connect to DB first
connectDB(); // ✅ Log success or failure here

app.use(cors({
  origin: ['http://localhost:3000', 'https://exprz.co.uk'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
require('./routes/cartRoutes')(app, Cart, Product);
require('./routes/productRoutes')(app, Product, sequelize);
require('./routes/categoryRoutes')(app, Category);

app.get('/', (req, res) => res.send('API Running'));

const PORT = process.env.PORT || 5000;

// Sync models and start server
sequelize.sync().then(() => {
  app.listen(PORT, () => console.log(`✅ Server started on port ${PORT}`));
}).catch(err => {
  console.error('❌ Error syncing models:', err);
});
