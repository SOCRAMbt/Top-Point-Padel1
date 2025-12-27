const Block = require('../models/Block');

exports.getBlocks = async (req, res) => {
    const blocks = await Block.findAll();
    res.json(blocks);
};

exports.createBlock = async (req, res) => {
    try {
        const newBlock = await Block.create(req.body);
        res.status(201).json(newBlock);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteBlock = async (req, res) => {
    const { id } = req.params;
    const block = await Block.findByPk(id);
    if (!block) return res.status(404).json({ error: 'Bloqueo no encontrado' });
    await block.destroy();
    res.json({ success: true });
};
