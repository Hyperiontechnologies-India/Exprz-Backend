      const express = require('express');
      const cors = require('cors');
      const { connectDB, sequelize } = require('./config/db');
      const authRoutes = require('./routes/authRoutes');
      const User = require('./models/User');
      const OTP = require('./models/OTP');
      const Product = require('./models/Product');
      const Category = require('./models/Category');
      const Cart=require("./models/Cart")
      const router = express.Router();


      /*INVOICE GENERATION*/
      
      const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
 


      /*_______________________________________________*/
       




    
      
      require('dotenv').config();

      const app = express();
      const PORT = process.env.PORT || 5000;

      // Connect to database
      connectDB();

      // CORS Configuration
      const corsOptions = {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization','Accept'],
        credentials: true,
        optionsSuccessStatus: 200

      };


     
      // Middleware
      app.use(cors(corsOptions));
      app.use(express.json({ limit: '50mb' }));
      app.use(express.urlencoded({ limit: '50mb', extended: true }));
      app.options('*', cors(corsOptions)); // Handle preflight
       


      // Sync database models
      sequelize.sync()
        .then(() => console.log('Database synced successfully.'))
        .catch(err => console.error('Error syncing database:', err));

      // Routes
      app.use('/api/auth', authRoutes);

      // Protected route example
      const { protect } = require('./middleware/authMiddleware');
      app.get('/api/protected', protect, (req, res) => {
        res.json({ message: `Welcome ${req.user.username}!` });
      });

      // Product API Endpoints

      // Create Product Endpoint (Optimized Version)
      app.post('/api/admin/products', async (req, res) => {
        try {
          // Validate required fields
          if (!req.body.name || !req.body.brand || req.body.price === undefined) {
            return res.status(400).json({
              error: 'Name, brand, and price are required fields'
            });
          }

          // Prepare product data
          const productData = {
            name: req.body.name,
            brand: req.body.brand,
            flavors_data: req.body.flavors_data || [],
            nicotine_level: req.body.nicotine_level || null,
            description: req.body.description || null,
            image_base64: req.body.image_base64 || null,
            price: parseFloat(req.body.price),
            stock: parseInt(req.body.stock) || 0,
            category: req.body.category || null,
            product_group: req.body.product_group || null,
            is_active: true
          };

          // Create the product using Sequelize model
          const product = await Product.create(productData);

          // Format the response
          const responseData = product.toJSON();
          try {
            responseData.flavors = responseData.flavors_data ? 
                                JSON.parse(responseData.flavors_data) : 
                                [];
          } catch (e) {
            console.error('Error parsing flavors_data in response:', e);
            responseData.flavors = [];
          }
          delete responseData.flavors_data;

          res.status(201).json({
            message: 'Product created successfully',
            product: responseData
          });

        } catch (error) {
          console.error('Error creating product:', error);
          
          let errorMessage = 'Failed to create product';
          let errorDetails = '';
          
          if (error.name === 'SequelizeValidationError') {
            errorMessage = 'Validation error';
            errorDetails = error.errors.map(err => err.message).join(', ');
          } else if (error.response) {
            errorMessage = error.response.data.error || errorMessage;
            errorDetails = error.response.data.details || 
                        (typeof error.response.data === 'string' ? error.response.data : '');
          }

          res.status(500).json({
            error: `${errorMessage} ${errorDetails ? `- ${errorDetails}` : ''}`.trim()
          });
        }
      });

      // Get All Products
      app.get('/api/products', async (req, res) => {
        try {
          const [products] = await sequelize.query('SELECT * FROM products WHERE is_active = true');
          
          const productsWithFlavors = products.map(product => ({
            ...product,
            flavors: product.flavors_data ? JSON.parse(product.flavors_data) : []
          }));

          res.json(productsWithFlavors);
        } catch (error) {
          console.error('Error:', error);
          res.status(500).json({ error: 'Server error' });
        }
      });

      // Get Product by ID
      app.get('/api/products/:id', async (req, res) => {
        try {
          const productId = req.params.id;
          
          if (!/^\d+$/.test(productId)) {
            return res.status(400).json({ error: 'Invalid product ID format' });
          }

          const [product] = await sequelize.query(
            'SELECT * FROM products WHERE id = ?',
            { replacements: [productId] }
          );

          if (!product || product.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
          }

          res.json({
            ...product[0],
            flavors: product[0].flavors_data ? JSON.parse(product[0].flavors_data) : []
          });
        } catch (error) {
          console.error('Error:', error);
          res.status(500).json({ error: 'Server error' });
        }
      });

      // Get All Products (Admin version with inactive products)
      app.get('/api/admin/products', async (req, res) => {
        try {
          const products = await Product.findAll();
          
          const responseData = products.map(product => {
            const productData = product.toJSON();
            try {
              // Parse flavors_data if it exists
              productData.flavors = productData.flavors_data ? 
                                  JSON.parse(productData.flavors_data).flavours || [] : 
                                  [];
            } catch (e) {
              console.error('Error parsing flavors_data in response:', e);
              productData.flavors = [];
            }
            
            return productData;
          });

          res.json(responseData);
        } catch (error) {
          console.error('Error:', error);
          res.status(500).json({ error: 'Server error' });
        }
      });

      // Get Single Product (Admin version)
      app.get('/api/admin/products/:id', async (req, res) => {
        try {
          const productId = req.params.id;
          
          if (!/^\d+$/.test(productId)) {
            return res.status(400).json({ error: 'Invalid product ID format' });
          }

          const product = await Product.findByPk(productId);

          if (!product) {
            return res.status(404).json({ error: 'Product not found' });
          }

          const responseData = product.toJSON();
          try {
            responseData.flavors = responseData.flavors_data ? 
                                JSON.parse(responseData.flavors_data).flavours || [] : 
                                [];
          } catch (e) {
            console.error('Error parsing flavors_data in response:', e);
            responseData.flavors = [];
          }
          delete responseData.flavors_data;

          res.json(responseData);
        } catch (error) {
          console.error('Error:', error);
          res.status(500).json({ error: 'Server error' });
        }
      });

      // Update Product Endpoint
      app.put('/api/admin/products/:id', async (req, res) => {
        try {
          const productId = req.params.id;
          const updates = req.body;

          // Validate required fields
          if (!updates.name || !updates.brand || updates.price === undefined) {
            return res.status(400).json({
              error: 'Name, brand, and price are required fields'
            });
          }

          // Find the product
          const product = await Product.findByPk(productId);
          if (!product) {
            return res.status(404).json({ error: 'Product not found' });
          }

          // Prepare update data
          const updateData = {
            name: updates.name,
            brand: updates.brand,
            flavors_data: updates.flavors_data || product.flavors_data,
            nicotine_level: updates.nicotine_level || product.nicotine_level,
            description: updates.description || product.description,
            image_base64: updates.image_base64 || product.image_base64,
            price: parseFloat(updates.price),
            stock: parseInt(updates.stock) || product.stock,
            category: updates.category || product.category,
            product_group: updates.product_group || product.product_group,
            is_active: updates.is_active !== undefined ? updates.is_active : product.is_active
          };

          // Update the product
          await product.update(updateData);

          // Format the response
          const responseData = product.toJSON();
          try {
            responseData.flavors = responseData.flavors_data ? 
                                JSON.parse(responseData.flavors_data).flavours || [] : 
                                [];
          } catch (e) {
            console.error('Error parsing flavors_data in response:', e);
            responseData.flavors = [];
          }
          delete responseData.flavors_data;

          res.json({
            message: 'Product updated successfully',
            product: responseData
          });

        } catch (error) {
          console.error('Error updating product:', error);
          
          let errorMessage = 'Failed to update product';
          let errorDetails = '';
          
          if (error.name === 'SequelizeValidationError') {
            errorMessage = 'Validation error';
            errorDetails = error.errors.map(err => err.message).join(', ');
          }

          res.status(500).json({
            error: `${errorMessage} ${errorDetails ? `- ${errorDetails}` : ''}`.trim()
          });
        }
      });

      // Delete Product Endpoint (soft delete)
      app.delete('/api/admin/products/:id', async (req, res) => {
        try {
          const productId = req.params.id;
          
          // Soft delete (set is_active to false)
          const result = await Product.update(
            { is_active: false },
            { where: { id: productId } }
          );

          if (result[0] === 0) {
            return res.status(404).json({ error: 'Product not found' });
          }

          res.json({ message: 'Product deleted successfully' });
        } catch (error) {
          console.error('Error deleting product:', error);
          res.status(500).json({ error: 'Failed to delete product' });
        }
      });

      // Toggle Product Status Endpoint
      app.patch('/api/admin/products/:id/status', async (req, res) => {
        try {
          const productId = req.params.id;
          const { is_active } = req.body;

          if (typeof is_active !== 'boolean') {
            return res.status(400).json({ error: 'Invalid status value' });
          }

          const product = await Product.findByPk(productId);
          if (!product) {
            return res.status(404).json({ error: 'Product not found' });
          }

          await product.update({ is_active });
          res.json({ 
            message: `Product ${is_active ? 'activated' : 'deactivated'} successfully`,
            is_active
          });
        } catch (error) {
          console.error('Error toggling product status:', error);
          res.status(500).json({ error: 'Failed to update product status' });
        }
      });

      // Category API Endpoints

    // Create Category
    app.post('/api/admin/categories', async (req, res) => {
      try {
        // Validate required fields
        if (!req.body.name) {
          return res.status(400).json({
            error: 'Name is a required field'
          });
        }

        // Create the category
        const category = await Category.create({
          name: req.body.name,
          description: req.body.description || null,
          is_active: req.body.is_active !== undefined ? req.body.is_active : true
        });

        res.status(201).json({
          message: 'Category created successfully',
          category
        });

      } catch (error) {
        console.error('Error creating category:', error);
        
        let errorMessage = 'Failed to create category';
        let errorDetails = '';
        
        if (error.name === 'SequelizeValidationError') {
          errorMessage = 'Validation error';
          errorDetails = error.errors.map(err => err.message).join(', ');
        } else if (error.name === 'SequelizeUniqueConstraintError') {
          errorMessage = 'Category with this name already exists';
        }

        res.status(500).json({
          error: `${errorMessage} ${errorDetails ? `- ${errorDetails}` : ''}`.trim()
        });
      }
    });

    // Get All Categories (active only for public endpoint)
    app.get('/api/categories', async (req, res) => {
      try {
        const categories = await Category.findAll({
          where: { is_active: true },
          order: [['name', 'ASC']]
        });
        
        res.json(categories);
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Get All Categories (Admin version with inactive categories)
    app.get('/api/admin/categories', async (req, res) => {
      try {
        const categories = await Category.findAll({
          order: [['name', 'ASC']]
        });
        
        res.json(categories);
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Get Single Category
    app.get('/api/admin/categories/:id', async (req, res) => {
      try {
        const categoryId = req.params.id;
        
        if (!/^\d+$/.test(categoryId)) {
          return res.status(400).json({ error: 'Invalid category ID format' });
        }

        const category = await Category.findByPk(categoryId);

        if (!category) {
          return res.status(404).json({ error: 'Category not found' });
        }

        res.json(category);
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Update Category
    app.put('/api/admin/categories/:id', async (req, res) => {
      try {
        const categoryId = req.params.id;
        const updates = req.body;

        // Validate required fields
        if (!updates.name) {
          return res.status(400).json({
            error: 'Name is a required field'
          });
        }

        // Find the category
        const category = await Category.findByPk(categoryId);
        if (!category) {
          return res.status(404).json({ error: 'Category not found' });
        }

        // Update the category
        await category.update({
          name: updates.name,
          description: updates.description || category.description,
          is_active: updates.is_active !== undefined ? updates.is_active : category.is_active
        });

        res.json({
          message: 'Category updated successfully',
          category
        });

      } catch (error) {
        console.error('Error updating category:', error);
        
        let errorMessage = 'Failed to update category';
        let errorDetails = '';
        
        if (error.name === 'SequelizeValidationError') {
          errorMessage = 'Validation error';
          errorDetails = error.errors.map(err => err.message).join(', ');
        } else if (error.name === 'SequelizeUniqueConstraintError') {
          errorMessage = 'Category with this name already exists';
        }

        res.status(500).json({
          error: `${errorMessage} ${errorDetails ? `- ${errorDetails}` : ''}`.trim()
        });
      }
    });

    // Toggle Category Status
    app.patch('/api/admin/categories/:id/status', async (req, res) => {
      try {
        const categoryId = req.params.id;
        const { is_active } = req.body;

        if (typeof is_active !== 'boolean') {
          return res.status(400).json({ error: 'Invalid status value' });
        }

        const category = await Category.findByPk(categoryId);
        if (!category) {
          return res.status(404).json({ error: 'Category not found' });
        }

        await category.update({ is_active });
        res.json({ 
          message: `Category ${is_active ? 'activated' : 'deactivated'} successfully`,
          is_active
        });
      } catch (error) {
        console.error('Error toggling category status:', error);
        res.status(500).json({ error: 'Failed to update category status' });
      }
    });

    // Delete Category (soft delete)
    app.delete('/api/admin/categories/:id', async (req, res) => {
      try {
        const categoryId = req.params.id;
        
        // Soft delete (set is_active to false)
        const result = await Category.update(
          { is_active: false },
          { where: { id: categoryId } }
        );

        if (result[0] === 0) {
          return res.status(404).json({ error: 'Category not found' });
        }

        res.json({ message: 'Category deleted successfully' });
      } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
      }
    });

      // CArt //

      // ======================//

      // Cart API Endpoints

// Add item to cart
app.post('/api/cart', async (req, res) => {
  try {
    const { productid, userid, email, quantity, flavour } = req.body;
    
    // Validate required fields
    if (!productid || !userid || !email) {
      return res.status(400).json({ error: 'productid, userid, and email are required' });
    }

    // Check if product exists
    const product = await Product.findByPk(productid);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if item already exists in cart
    const existingItem = await Cart.findOne({
      where: { 
        userid,
        productid,
        flavour: flavour || null
      }
    });

    let cartItem;
    if (existingItem) {
      // Update quantity if item exists
      const newQuantity = existingItem.quantity + (quantity || 1);
      cartItem = await existingItem.update({ quantity: newQuantity });
    } else {
      // Create new cart item
      cartItem = await Cart.create({
        productid,
        userid,
        email,
        quantity: quantity || 1,
        flavour: flavour || null
      });
    }

    res.status(201).json(cartItem);
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// Get user's cart items


 // Optional: Setup association if not already done
Cart.belongsTo(Product, { foreignKey: 'productid', as: 'product' });

// GET endpoint to fetch cart items by userid
app.get('/api/cart/:userid', async (req, res) => {
  try {
    const { userid } = req.params;

    if (!userid) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const cartItems = await Cart.findAll({
      where: { userid },
      include: [
        {
          model: Product,
          as: 'product' // Comment this block if you don’t want to include product info
        }
      ]
    });

    res.status(200).json(cartItems);
  } catch (error) {
    console.error('Error fetching cart items:', error);
    res.status(500).json({ error: 'Failed to fetch cart items' });
  }
});

// Update cart item quantity
app.put('/api/cart/:id', async (req, res) => {
  try {
    const { quantity, userid } = req.body;
    
    if (!quantity || quantity < 1 || !userid) {
      return res.status(400).json({ error: 'Valid quantity and userid are required' });
    }

    const cartItem = await Cart.findOne({
      where: {
        id: req.params.id,
        userid // Ensure user owns this cart item
      }
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const updatedItem = await cartItem.update({ quantity });
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

// Remove item from cart
app.delete('/api/cart/:id', async (req, res) => {
  try {
    const { userid } = req.body;
    
    if (!userid) {
      return res.status(400).json({ error: 'userid is required' });
    }

    const result = await Cart.destroy({
      where: {
        id: req.params.id,
        userid // Ensure user owns this cart item
      }
    });

    if (result === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
});

// Clear user's cart
app.delete('/api/cart/clear/:userid', async (req, res) => {
  try {
    await Cart.destroy({
      where: { userid: req.params.userid }
    });

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});


/*______________________________________________________*/

 /* EMAIL CONFIGURATION */
// Create temp directory for PDFs
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Google App Password Email Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  pool: true,
  maxConnections: 1,
  maxMessages: 10,
  rateLimit: 5,
  logger: true,
  debug: process.env.NODE_ENV === 'development'
});

// Verify email connection on startup
transporter.verify((error) => {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('SMTP Server is ready to send emails');
  }
});

// OrderDetails Model
const OrderDetails = sequelize.define('OrderDetails', {
  orderId: {
    type: sequelize.Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  userId: {
    type: sequelize.Sequelize.INTEGER,
    allowNull: false
  },
  items: {
    type: sequelize.Sequelize.JSON,
    allowNull: false
  },
  subtotal: {
    type: sequelize.Sequelize.FLOAT,
    allowNull: false
  },
  tax: {
    type: sequelize.Sequelize.FLOAT,
    allowNull: false
  },
  totalAmount: {
    type: sequelize.Sequelize.FLOAT,
    allowNull: false
  },
  paymentMethod: {
    type: sequelize.Sequelize.STRING,
    allowNull: false
  },
  paymentStatus: {
    type: sequelize.Sequelize.STRING,
    defaultValue: 'Not Paid'
  },
  deliveryDetails: {
    type: sequelize.Sequelize.JSON,
    allowNull: false
  },
  invoiceNumber: {
    type: sequelize.Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  status: {
    type: sequelize.Sequelize.STRING,
    defaultValue: 'Processing'
  },
  emailSent: {
    type: sequelize.Sequelize.BOOLEAN,
    defaultValue: false
  },
  emailError: {
    type: sequelize.Sequelize.TEXT
  }
}, {
  timestamps: true
});

// Email Template Generator
const generateEmailTemplate = (type, data) => {
  const templates = {
    customerOrder: (order) => ({
      subject: `Your Order Confirmation #${order.invoiceNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background: #6c5ce7; padding: 20px; color: white; text-align: center;">
            <h1 style="margin: 0;">Thank you for your order!</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #eee;">
            <h2 style="color: #6c5ce7;">Order #${order.invoiceNumber}</h2>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Total:</strong> £${order.totalAmount.toFixed(2)}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
            ${order.paymentMethod === 'cash_on_delivery' ? 
              '<p><strong>Payment Status:</strong> To be paid on delivery</p>' : 
              '<p><strong>Payment Status:</strong> Paid</p>'
            }
            <div style="margin-top: 20px;">
              <a href="${process.env.FRONTEND_URL}/orders/${order.orderId}" 
                 style="background: #6c5ce7; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
                View Your Order
              </a>
            </div>
          </div>
          <div style="margin-top: 20px; font-size: 12px; color: #777; text-align: center;">
            <p>If you have any questions, please contact support at ${process.env.SUPPORT_EMAIL}</p>
          </div>
        </div>
      `
    }),
    adminNotification: (order) => ({
      subject: `[ACTION REQUIRED] New Order #${order.invoiceNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color: #d63031;">New Order Received</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Order #</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${order.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Customer</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">
                ${order.deliveryDetails.firstName} ${order.deliveryDetails.lastName}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Amount</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">£${order.totalAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Payment Method</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${order.paymentMethod}</td>
            </tr>
          </table>
          <div style="margin-top: 20px;">
            <a href="${process.env.ADMIN_URL}/orders/${order.orderId}" 
               style="background: #d63031; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
              View Order in Admin
            </a>
          </div>
        </div>
      `
    })
  };

  return templates[type](data);
};

// PDF Generation
const generateOrderPDF = async (orderData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const pdfPath = path.join(tempDir, `order_${orderData.invoiceNumber}.pdf`);
      const stream = fs.createWriteStream(pdfPath);
      
      doc.pipe(stream);
      
      // Header
      doc.fontSize(20).text('Order Summary', { align: 'center' });
      doc.moveDown();
      
      // Order Info
      doc.fontSize(12).text(`Invoice #: ${orderData.invoiceNumber}`);
      doc.text(`Date: ${new Date().toLocaleDateString()}`);
      doc.text(`Payment Method: ${orderData.paymentMethod} (${orderData.paymentStatus})`);
      doc.moveDown();
      
      // Items
      doc.fontSize(14).text('Order Items:', { underline: true });
      doc.moveDown();
      
      orderData.items.forEach(item => {
        doc.text(`${item.product.name} x ${item.quantity} - £${(item.product.price * item.quantity).toFixed(2)}`);
      });
      
      // Totals
      doc.moveDown();
      doc.text(`Subtotal: £${orderData.subtotal.toFixed(2)}`);
      doc.text(`Tax (20%): £${orderData.tax.toFixed(2)}`);
      doc.fontSize(16).text(`Total: £${orderData.totalAmount.toFixed(2)}`, { align: 'right' });
      doc.moveDown();
      
      // Delivery Info
      doc.fontSize(14).text('Delivery Information:', { underline: true });
      doc.moveDown();
      doc.text(`Name: ${orderData.deliveryDetails.firstName} ${orderData.deliveryDetails.lastName}`);
      doc.text(`Address: ${orderData.deliveryDetails.addressLine1}`);
      if (orderData.deliveryDetails.addressLine2) {
        doc.text(orderData.deliveryDetails.addressLine2);
      }
      doc.text(`${orderData.deliveryDetails.city}, ${orderData.deliveryDetails.postcode}`);
      doc.text(`Phone: ${orderData.deliveryDetails.phone}`);
      doc.text(`Email: ${orderData.deliveryDetails.email}`);
      
      if (orderData.deliveryDetails.deliveryInstructions) {
        doc.moveDown();
        doc.text('Special Instructions:');
        doc.text(orderData.deliveryDetails.deliveryInstructions);
      }
      
      doc.end();
      
      stream.on('finish', () => resolve(pdfPath));
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

// Email Sending with Retry Logic
const sendOrderEmails = async (orderData, pdfPath) => {
  try {
    // Send to customer
    const customerTemplate = generateEmailTemplate('customerOrder', orderData);
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: orderData.deliveryDetails.email,
      subject: customerTemplate.subject,
      html: customerTemplate.html,
      attachments: [{
        filename: `Invoice_${orderData.invoiceNumber}.pdf`,
        path: pdfPath,
        contentType: 'application/pdf'
      }]
    });

    // Send to admin
    const adminTemplate = generateEmailTemplate('adminNotification', orderData);
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: adminTemplate.subject,
      html: adminTemplate.html,
      attachments: [{
        filename: `Invoice_${orderData.invoiceNumber}.pdf`,
        path: pdfPath,
        contentType: 'application/pdf'
      }]
    });

    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

// Retry Failed Emails Job
const retryFailedEmails = async () => {
  try {
    const failedOrders = await OrderDetails.findAll({
      where: {
        emailSent: false,
        emailError: { [sequelize.Sequelize.Op.ne]: null }
      },
      limit: 10
    });

    for (const order of failedOrders) {
      try {
        const pdfPath = path.join(tempDir, `order_${order.invoiceNumber}.pdf`);
        if (!fs.existsSync(pdfPath)) {
          await generateOrderPDF(order);
        }
        
        await sendOrderEmails(order, pdfPath);
        
        await order.update({
          emailSent: true,
          emailError: null
        });
        
        fs.unlinkSync(pdfPath);
      } catch (retryError) {
        console.error(`Retry failed for order ${order.invoiceNumber}:`, retryError);
        await order.update({
          emailError: retryError.message
        });
      }
    }
  } catch (error) {
    console.error('Failed email retry job error:', error);
  }
};

// Schedule email retries (every hour)
setInterval(retryFailedEmails, 60 * 60 * 1000);

// COD Order Endpoint
app.post('/api/orders/cod', async (req, res) => {
  try {
    const { userId, items, subtotal, tax, totalAmount, deliveryDetails } = req.body;

    // Validate required fields
    if (!userId || !items || !deliveryDetails) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const orderData = {
      orderId: `ORD-${Date.now()}`,
      userId,
      items,
      subtotal,
      tax,
      totalAmount,
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'Not Paid',
      deliveryDetails,
      invoiceNumber
    };

    // Create order in database
    const order = await OrderDetails.create(orderData);

    // Generate PDF
    const pdfPath = await generateOrderPDF(orderData);
    
    // Attempt to send emails
    try {
      await sendOrderEmails(orderData, pdfPath);
      await order.update({ emailSent: true });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      await order.update({
        emailSent: false,
        emailError: emailError.message
      });
    }

    // Clean up PDF
    try {
      fs.unlinkSync(pdfPath);
    } catch (cleanupError) {
      console.error('PDF cleanup failed:', cleanupError);
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: {
        id: order.id,
        orderId: order.orderId,
        invoiceNumber: order.invoiceNumber,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt
      }
    });

  } catch (error) {
    console.error('COD order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process COD order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Test Email Endpoint
app.get('/test-email', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).send('Endpoint only available in development');
  }

  try {
    await transporter.sendMail({
      from: `"Test" <${process.env.EMAIL_FROM}>`,
      to: process.env.TEST_EMAIL || process.env.EMAIL_USER,
      subject: 'SMTP Connection Test',
      html: '<h1>SMTP Connection Working!</h1><p>Your email configuration is correct.</p>'
    });
    res.send('Test email sent successfully');
  } catch (error) {
    res.status(500).send(`Email failed: ${error.message}`);
  }
});


/*__________________________________________________________*/
 
      

      // Start server
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });