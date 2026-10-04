const { pool } = require("../config/database");

/**
 * GET /api/dashboard/stats
 * Aggregate key metrics for hospital staff dashboard
 */
const getDashboardStats = async (req, res) => {
  try {
    const [
      patientsCountRes,
      doctorsCountRes,
      todayAppointmentsRes,
      pendingLabOrdersRes,
      lowStockRes,
      unpaidInvoicesRes,
      recentPatientsRes,
      recentAppointmentsRes,
    ] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS total FROM patients WHERE is_active = true"),
      pool.query("SELECT COUNT(*)::int AS total FROM doctors doc JOIN users u ON doc.user_id = u.id WHERE u.is_active = true"),
      pool.query("SELECT COUNT(*)::int AS total FROM appointments WHERE appointment_date = CURRENT_DATE"),
      pool.query("SELECT COUNT(*)::int AS total FROM lab_orders WHERE status IN ('pending', 'in_progress')"),
      pool.query("SELECT COUNT(*)::int AS total FROM medicines WHERE quantity_in_stock <= reorder_level AND is_active = true"),
      pool.query("SELECT COUNT(*)::int AS count, COALESCE(SUM(balance_due), 0)::numeric AS total_amount FROM invoices WHERE status IN ('unpaid', 'partially_paid')"),
      pool.query(`
        SELECT id, patient_number, first_name, last_name, gender, date_of_birth, created_at
        FROM patients
        ORDER BY created_at DESC
        LIMIT 5
      `),
      pool.query(`
        SELECT 
          a.id, a.appointment_date, a.appointment_time, a.status, a.reason,
          p.id AS patient_id, p.first_name AS patient_first_name, p.last_name AS patient_last_name, p.patient_number,
          u.first_name AS doctor_first_name, u.last_name AS doctor_last_name,
          doc.specialty
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN doctors doc ON a.doctor_id = doc.id
        JOIN users u ON doc.user_id = u.id
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
        LIMIT 5
      `),
    ]);

    const stats = {
      totalPatients: patientsCountRes.rows[0]?.total || 0,
      totalDoctors: doctorsCountRes.rows[0]?.total || 0,
      todayAppointments: todayAppointmentsRes.rows[0]?.total || 0,
      pendingLabOrders: pendingLabOrdersRes.rows[0]?.total || 0,
      lowStockMedicines: lowStockRes.rows[0]?.total || 0,
      unpaidInvoicesCount: unpaidInvoicesRes.rows[0]?.count || 0,
      unpaidInvoicesAmount: parseFloat(unpaidInvoicesRes.rows[0]?.total_amount || 0),
      recentPatients: recentPatientsRes.rows,
      recentAppointments: recentAppointmentsRes.rows,
    };

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching dashboard statistics",
    });
  }
};

module.exports = {
  getDashboardStats,
};
