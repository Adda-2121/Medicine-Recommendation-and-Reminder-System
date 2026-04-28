const { ServiceCategory, ServiceItem } = require('../models');

// @desc    Get all service categories
// @route   GET /api/services/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = await ServiceCategory.findAll({
      order: [['name', 'ASC']]
    });
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a service category
// @route   POST /api/services/categories
// @access  Private (Admin)
exports.createCategory = async (req, res) => {
  try {
    if (req.user.role !== 'company_admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { name, department_type } = req.body;
    
    // Check for duplicate category name
    const existingCategory = await ServiceCategory.findOne({ where: { name } });
    if (existingCategory) {
      return res.status(400).json({ message: `Category '${name}' already exists.` });
    }

    const category = await ServiceCategory.create({ name, department_type });
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a service category
// @route   PUT /api/services/categories/:id
// @access  Private (Admin)
exports.updateCategory = async (req, res) => {
  try {
    if (req.user.role !== 'company_admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { name, department_type } = req.body;
    const category = await ServiceCategory.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Not found' });

    if (name && name !== category.name) {
      const existingCategory = await ServiceCategory.findOne({ where: { name } });
      if (existingCategory) {
        return res.status(400).json({ message: `Category '${name}' already exists.` });
      }
    }

    category.name = name || category.name;
    category.department_type = department_type || category.department_type;
    await category.save();

    res.status(200).json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a service category
// @route   DELETE /api/services/categories/:id
// @access  Private (Admin)
exports.deleteCategory = async (req, res) => {
  try {
    if (req.user.role !== 'company_admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const category = await ServiceCategory.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Not found' });

    await category.destroy();
    res.status(200).json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Server error. Make sure no items are linked.' });
  }
};

// @desc    Get all service items
// @route   GET /api/services/items
// @access  Public
exports.getItems = async (req, res) => {
  try {
    const items = await ServiceItem.findAll({
      include: [{ model: ServiceCategory, as: 'Category' }],
      order: [['name', 'ASC']]
    });
    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a service item
// @route   POST /api/services/items
// @access  Private (Admin)
exports.createItem = async (req, res) => {
  try {
    if (req.user.role !== 'company_admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { category_id, name, price, is_active } = req.body;

    // Check for duplicate item name
    const existingItem = await ServiceItem.findOne({ where: { name } });
    if (existingItem) {
      return res.status(400).json({ message: `Service item '${name}' already exists.` });
    }

    const item = await ServiceItem.create({ category_id, name, price, is_active });
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a service item
// @route   PUT /api/services/items/:id
// @access  Private (Admin)
exports.updateItem = async (req, res) => {
  try {
    if (req.user.role !== 'company_admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { category_id, name, price, is_active } = req.body;
    const item = await ServiceItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });

    if (name && name !== item.name) {
      const existingItem = await ServiceItem.findOne({ where: { name } });
      if (existingItem) {
        return res.status(400).json({ message: `Service item '${name}' already exists.` });
      }
    }

    if (category_id !== undefined) item.category_id = category_id;
    if (name !== undefined) item.name = name;
    if (price !== undefined) item.price = price;
    if (is_active !== undefined) item.is_active = is_active;
    await item.save();

    res.status(200).json(item);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a service item
// @route   DELETE /api/services/items/:id
// @access  Private (Admin)
exports.deleteItem = async (req, res) => {
  try {
    if (req.user.role !== 'company_admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const item = await ServiceItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });

    await item.destroy();
    res.status(200).json({ message: 'Item deleted' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'Server error. Make sure no requests use this item.' });
  }
};
