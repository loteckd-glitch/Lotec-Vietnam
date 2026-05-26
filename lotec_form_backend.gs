/**
 * LOTEC Vietnam — Google Apps Script Backend
 * ============================================
 * Chức năng:
 *   1. Nhận dữ liệu form từ website (POST request)
 *   2. Gửi email thông báo đến Lotec.kd@gmail.com
 *   3. Lưu dữ liệu vào Google Sheet
 *
 * HƯỚNG DẪN TRIỂN KHAI (đọc kỹ trước khi deploy):
 * ─────────────────────────────────────────────────
 * Bước 1: Tạo Google Sheet mới
 *   → Vào https://sheets.google.com → Tạo spreadsheet mới
 *   → Copy URL, lấy phần ID (giữa /d/ và /edit)
 *   → Dán vào biến SHEET_ID bên dưới
 *
 * Bước 2: Deploy script này
 *   → Vào https://script.google.com → New Project
 *   → Dán toàn bộ code này vào
 *   → Click "Deploy" → "New deployment"
 *   → Type: "Web app"
 *   → Execute as: "Me"
 *   → Who has access: "Anyone"
 *   → Click Deploy → Copy "Web app URL"
 *   → Dán URL vào biến GAS_URL trong LotecHomepage.jsx
 *
 * Bước 3: Cấp quyền
 *   → Lần đầu chạy sẽ yêu cầu authorize
 *   → Đăng nhập Gmail của LOTEC và cho phép
 */

/* ─── CẤU HÌNH — chỉnh sửa 2 dòng này ─── */
const SHEET_ID    = "PASTE_YOUR_GOOGLE_SHEET_ID_HERE"; // ID của Google Sheet
const NOTIFY_EMAIL = "Lotec.kd@gmail.com";              // Email nhận thông báo
/* ─────────────────────────────────────── */

const SHEET_NAME  = "Leads LOTEC";
const COLS = ["Thời gian", "Họ tên", "Đơn vị", "Điện thoại", "Email", "Lĩnh vực", "Nội dung dự án", "Nguồn"];

/**
 * Xử lý GET request — health check
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", service: "LOTEC Form API" }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Xử lý POST request từ React form
 */
function doPost(e) {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    // Parse JSON body
    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch {
      data = e.parameter || {};
    }

    const { name, company, phone, email, sector, note, source } = data;

    // Validate bắt buộc
    if (!name || !phone) {
      return buildResponse({ success: false, message: "Thiếu họ tên hoặc số điện thoại." }, headers);
    }

    const timestamp = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

    // 1. Lưu vào Google Sheet
    saveToSheet({ timestamp, name, company, phone, email, sector, note, source: source || "Website" });

    // 2. Gửi email thông báo
    sendNotificationEmail({ timestamp, name, company, phone, email, sector, note });

    return buildResponse({
      success: true,
      message: "Cảm ơn, LOTEC sẽ liên hệ trong vòng 24h!"
    }, headers);

  } catch (err) {
    console.error("Error:", err.toString());
    return buildResponse({
      success: false,
      message: "Đã xảy ra lỗi. Vui lòng liên hệ trực tiếp: 0908 560 233"
    }, headers);
  }
}

/**
 * Lưu dữ liệu vào Google Sheet
 */
function saveToSheet({ timestamp, name, company, phone, email, sector, note, source }) {
  const ss = SpreadsheetApp.openById(SHEET_ID);

  // Tạo sheet nếu chưa có
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Tạo header row
    sheet.appendRow(COLS);
    // Format header
    const headerRange = sheet.getRange(1, 1, 1, COLS.length);
    headerRange.setBackground("#0B2545");
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontWeight("bold");
    headerRange.setFontSize(11);
    // Freeze header row
    sheet.setFrozenRows(1);
    // Auto-resize columns
    sheet.autoResizeColumns(1, COLS.length);
  }

  // Append row với dữ liệu mới
  sheet.appendRow([
    timestamp,
    name        || "",
    company     || "",
    phone       || "",
    email       || "",
    sector      || "",
    note        || "",
    source      || "Website",
  ]);

  // Highlight row mới nhất màu vàng nhạt (optional)
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 1, 1, COLS.length).setBackground("#FFFDE7");

  // Auto-resize sau khi thêm data
  sheet.autoResizeColumns(1, COLS.length);
}

/**
 * Gửi email thông báo đến LOTEC
 */
function sendNotificationEmail({ timestamp, name, company, phone, email, sector, note }) {
  const subject = `🔔 [LOTEC] Yêu cầu tư vấn mới — ${name} | ${phone}`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #F1F5F9; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 24px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #040D1A, #071428); padding: 28px 32px; }
    .header-title { color: #2DD4FF; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 6px; }
    .header-h1 { color: #fff; font-size: 20px; font-weight: 700; margin: 0; }
    .badge { display: inline-block; background: rgba(249,115,22,0.2); border: 1px solid rgba(249,115,22,0.5); color: #FB923C; font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 12px; letter-spacing: 0.06em; margin-top: 10px; }
    .body { padding: 28px 32px; }
    .section-title { font-size: 11px; font-weight: 700; color: #94A3B8; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 14px; }
    .info-grid { display: grid; gap: 0; border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; margin-bottom: 22px; }
    .info-row { display: flex; border-bottom: 1px solid #E2E8F0; }
    .info-row:last-child { border-bottom: none; }
    .info-label { background: #F8FAFC; color: #64748B; font-size: 12px; font-weight: 600; padding: 11px 16px; width: 160px; flex-shrink: 0; border-right: 1px solid #E2E8F0; }
    .info-value { color: #0F172A; font-size: 13px; padding: 11px 16px; flex: 1; }
    .info-value.highlight { color: #1D4ED8; font-weight: 600; }
    .note-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-left: 4px solid #2DD4FF; border-radius: 8px; padding: 14px 16px; margin-bottom: 22px; }
    .note-label { font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
    .note-text { color: #334155; font-size: 13px; line-height: 1.7; white-space: pre-wrap; }
    .cta-row { display: flex; gap: 10px; margin-bottom: 22px; }
    .btn-call { background: linear-gradient(135deg, #E87722, #C85E14); color: #fff; text-decoration: none; padding: 11px 22px; border-radius: 7px; font-size: 13px; font-weight: 700; display: inline-block; }
    .btn-sheet { background: #1D4ED8; color: #fff; text-decoration: none; padding: 11px 22px; border-radius: 7px; font-size: 13px; font-weight: 700; display: inline-block; }
    .footer { background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 16px 32px; display: flex; justify-content: space-between; align-items: center; }
    .footer-text { color: #94A3B8; font-size: 11px; }
    .timestamp { font-family: monospace; background: #EFF6FF; color: #1D4ED8; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-title">LOTEC Vietnam — Hệ thống CRM</div>
      <div class="header-h1">Yêu cầu tư vấn mới</div>
      <div class="badge">🔔 CẦN XỬ LÝ NGAY</div>
    </div>

    <div class="body">
      <div class="section-title">Thông tin khách hàng</div>
      <div class="info-grid">
        <div class="info-row">
          <div class="info-label">👤 Họ và tên</div>
          <div class="info-value highlight">${name || "—"}</div>
        </div>
        <div class="info-row">
          <div class="info-label">🏢 Đơn vị / Công ty</div>
          <div class="info-value">${company || "—"}</div>
        </div>
        <div class="info-row">
          <div class="info-label">📞 Điện thoại</div>
          <div class="info-value highlight">${phone || "—"}</div>
        </div>
        <div class="info-row">
          <div class="info-label">✉️ Email</div>
          <div class="info-value">${email || "—"}</div>
        </div>
        <div class="info-row">
          <div class="info-label">🏭 Lĩnh vực</div>
          <div class="info-value">${sector || "Chưa chọn"}</div>
        </div>
      </div>

      <div class="section-title">Nội dung dự án / Yêu cầu</div>
      <div class="note-box">
        <div class="note-label">Mô tả từ khách hàng</div>
        <div class="note-text">${note || "(Không có mô tả)"}</div>
      </div>

      <div class="section-title">Hành động</div>
      <div class="cta-row">
        <a href="tel:${phone}" class="btn-call">📞 Gọi ngay ${phone}</a>
        <a href="https://docs.google.com/spreadsheets/d/${SHEET_ID}" class="btn-sheet">📊 Xem Google Sheet</a>
      </div>
    </div>

    <div class="footer">
      <div class="footer-text">LOTEC Vietnam — Hệ thống tiếp nhận tư vấn tự động</div>
      <div class="timestamp">🕐 ${timestamp}</div>
    </div>
  </div>
</body>
</html>
  `;

  const plainText = `
YÊU CẦU TƯ VẤN MỚI — LOTEC Vietnam
=====================================
Thời gian   : ${timestamp}
Họ tên      : ${name}
Đơn vị      : ${company || "—"}
Điện thoại  : ${phone}
Email       : ${email || "—"}
Lĩnh vực    : ${sector || "—"}

Nội dung dự án:
${note || "(Không có mô tả)"}
=====================================
Đây là email tự động từ website lotecvietnam.vn
  `;

  GmailApp.sendEmail(NOTIFY_EMAIL, subject, plainText, {
    htmlBody,
    name: "LOTEC Vietnam - Hệ thống Form",
    replyTo: email || NOTIFY_EMAIL,
  });
}

/**
 * Helper — tạo JSON response
 */
function buildResponse(data, headers) {
  const output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Test function — chạy thủ công để kiểm tra
 * Click Run trong Apps Script editor để test
 */
function testForm() {
  const mockData = {
    postData: {
      contents: JSON.stringify({
        name: "Nguyễn Văn Test",
        company: "Công ty Test",
        phone: "0901234567",
        email: "test@example.com",
        sector: "Nhà máy & Sản xuất",
        note: "Cần tư vấn hệ thống camera nhiệt cho nhà máy 5000m2",
        source: "Website Test"
      })
    }
  };
  const result = doPost(mockData);
  Logger.log(result.getContent());
}
