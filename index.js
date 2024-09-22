const express = require('express');
const mongoose = require('mongoose');

const app = express();

mongoose.connect('mongodb://localhost:27017/assignments', { useNewUrlParser: true, useUnifiedTopology: true });

// model of category
const categorySchema = new mongoose.Schema({
  name: String,
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
});

const Category = mongoose.model('Category', categorySchema);
//model of product
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }
});

const Product = mongoose.model('Product', productSchema);


app.use(express.json());



// Create new category
app.post('/categories', async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all categories
app.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find().populate('products');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single category by ID
app.get('/categories/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate('products');
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a category by ID
app.put('/categories/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a category by ID
app.delete('/categories/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* PRODUCT ENDPOINTS */

// Create a new product and link it to a category
app.post('/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    const savedProduct = await product.save();

    // Add the product to the corresponding category
    await Category.findByIdAndUpdate(savedProduct.category, { $push: { products: savedProduct._id } });

    res.status(201).json(savedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all products
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find().populate('category');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single product by ID
app.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a product by ID
app.put('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (req.body.category) {
      await Category.findByIdAndUpdate(product.category, { $pull: { products: req.params.id } });
      await Category.findByIdAndUpdate(req.body.category, { $push: { products: req.params.id } });
    }

    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a product by ID
app.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await Category.findByIdAndUpdate(product.category, { $pull: { products: req.params.id } });

    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});
