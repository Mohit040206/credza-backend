const logError = (err) => {
    console.error("❌ ERROR:", {
        message: err.message,
        stack: err.stack,
        time: new Date().toISOString()
    });
};

module.exports = { logError };