import { Router } from "express";
import { Pool } from "pg";
import { container } from "tsyringe";

const router = Router();
router.get("/health", async (req, res) => {
    try {
        const pool = container.resolve<Pool>("DatabasePool");
        await pool.query("SELECT 1");
        res.status(200).json({ status: "ok", database: "connect", timestamp: new Date().toISOString() });   
    } catch (err) {
        res.status(503).json({ status: "error", database: "disconnected", timestamp: new Date().toISOString() });
    }
});

export default router;