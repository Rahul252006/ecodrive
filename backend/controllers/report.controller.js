const reportService = require('../services/report.service');

async function getWeeklyReport(req, res, next) {
  try {
    const report = await reportService.getWeeklyReport(req.user.id);
    res.json({
      success: true,
      data: report
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getWeeklyReport };
