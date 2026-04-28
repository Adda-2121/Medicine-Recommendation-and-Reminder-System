const { Setting } = require('../models');

// @desc    Get all settings
// @route   GET /api/settings
// @access  Private (Company Admin)
exports.getSettings = async (req, res) => {
  try {
    // Allowed for all authenticated users to fetch settings (e.g. patients need to see consultation fee)

    const settings = await Setting.findAll();
    res.status(200).json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error fetching settings' });
  }
};

// @desc    Update a specific setting
// @route   PUT /api/settings/:key
// @access  Private (Company Admin)
exports.updateSetting = async (req, res) => {
  try {
    if (req.user.role !== 'company_admin') {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }

    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ message: 'Value is required' });
    }

    let setting = await Setting.findOne({ where: { key } });

    if (!setting) {
      // If setting doesn't exist, create it
      setting = await Setting.create({ key, value: String(value) });
    } else {
      setting.value = String(value);
      await setting.save();
    }

    res.status(200).json({
      message: 'Setting updated successfully',
      setting,
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ message: 'Server error updating setting' });
  }
};
