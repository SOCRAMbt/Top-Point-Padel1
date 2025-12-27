const Setting = require('../models/Setting');

exports.getSettings = async (req, res) => {
    try {
        const settings = await Setting.findAll();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const settings = req.body; // Expecting an array or object of {key, value}

        if (Array.isArray(settings)) {
            for (const item of settings) {
                await Setting.upsert({ key: item.key, value: item.value });
            }
        } else if (typeof settings === 'object') {
            for (const [key, value] of Object.entries(settings)) {
                await Setting.upsert({ key, value });
            }
        }

        const updatedSettings = await Setting.findAll();
        res.json(updatedSettings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
