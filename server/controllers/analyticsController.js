import { getDashboardAnalytics } from "../services/analyticsService.js";

export async function dashboardAnalytics(req, res) {
  res.json(await getDashboardAnalytics(req.user._id));
}
