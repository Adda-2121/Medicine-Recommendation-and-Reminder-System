const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getItems,
  createItem,
  updateItem,
  deleteItem
} = require('../controllers/serviceController');
const { protect } = require('../middlewares/authMiddleware');

// Categories
router.route('/categories')
  .get(protect, getCategories)
  .post(protect, createCategory);

router.route('/categories/:id')
  .put(protect, updateCategory)
  .delete(protect, deleteCategory);

// Items
router.route('/items')
  .get(protect, getItems)
  .post(protect, createItem);

router.route('/items/:id')
  .put(protect, updateItem)
  .delete(protect, deleteItem);

module.exports = router;
