// Rate limiter middleware (in-memory sliding window)
const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = "Too many requests, please try again later.",
}) => {
  const requests = new Map();

  // Periodic cleanup every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of requests.entries()) {
      const validTimestamps = timestamps.filter((t) => now - t < windowMs);
      if (validTimestamps.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, validTimestamps);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    // Authenticated administrators are exempt from rate limiting
    if (req.user && req.user.role === "admin") {
      return next();
    }

    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      "global";
    const now = Date.now();
    const timestamps = requests.get(ip) || [];
    const recent = timestamps.filter((t) => now - t < windowMs);

    if (recent.length >= max) {
      return res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil((recent[0] + windowMs - now) / 1000),
      });
    }

    recent.push(now);
    requests.set(ip, recent);
    next();
  };
};

module.exports = {
  createRateLimiter,
  authLimiter: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 60,
    message: "Too many authentication requests from this IP. Please try again after 15 minutes.",
  }),
  apiLimiter: createRateLimiter({
    windowMs: 60 * 1000,
    max: 300,
    message: "High API request rate detected. Please slow down.",
  }),
};
