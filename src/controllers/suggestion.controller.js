const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createSuggestion = async (req, res) => {
    const { foodName, origin, description, suggesterName } = req.body;
    try {
        const newSuggestion = await prisma.suggestion.create({
            data: { foodName, origin, description, suggesterName }
        });
        res.status(201).json({ message: "Terima kasih atas saran Anda! Akan kami review secepatnya." });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengirim saran", error: error.message });
    }
};

module.exports = { createSuggestion };