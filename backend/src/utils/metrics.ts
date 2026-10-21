import { Request, Response, NextFunction } from "express";

interface MetricRecord {
  timestamp: number;
  durationMs: number;
  statusCode: number;
  method: string;
  path: string;
}

const records: MetricRecord[] = [];
const MAX_RECORDS = 5000;

export const metricsCollector = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();

  res.on("finish", () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const durationMs = seconds * 1000 + nanoseconds / 1e6;

    if (records.length >= MAX_RECORDS) {
      records.shift();
    }

    records.push({
      timestamp: Date.now(),
      durationMs,
      statusCode: res.statusCode,
      method: req.method,
      path: req.baseUrl + (req.route?.path || req.path),
    });
  });

  next();
};

export const getMetricsSnapshot = () => {
  if (records.length === 0) {
    return {
      totalRequests: 0,
      uptimeSeconds: process.uptime(),
      latency: { p50: 0, p95: 0, p99: 0, avg: 0 },
      statusCodes: {},
    };
  }

  const sortedLatencies = [...records].map((r) => r.durationMs).sort((a, b) => a - b);
  const count = sortedLatencies.length;

  const p50 = sortedLatencies[Math.floor(count * 0.5)] || 0;
  const p95 = sortedLatencies[Math.floor(count * 0.95)] || 0;
  const p99 = sortedLatencies[Math.floor(count * 0.99)] || 0;
  const avg = sortedLatencies.reduce((a, b) => a + b, 0) / count;

  const statusCodes: Record<string, number> = {};
  for (const r of records) {
    statusCodes[r.statusCode] = (statusCodes[r.statusCode] || 0) + 1;
  }

  return {
    totalRequests: count,
    uptimeSeconds: Math.floor(process.uptime()),
    latency: {
      avgMs: Number(avg.toFixed(2)),
      p50Ms: Number(p50.toFixed(2)),
      p95Ms: Number(p95.toFixed(2)),
      p99Ms: Number(p99.toFixed(2)),
    },
    statusCodes,
    memoryUsageMB: {
      rss: Number((process.memoryUsage().rss / 1024 / 1024).toFixed(2)),
      heapUsed: Number((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)),
    },
  };
};
