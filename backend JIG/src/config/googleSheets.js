// src/config/googleSheets.js
// Konfigurasi autentikasi ke Google Sheets API

const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

/**
 * Membuat instance Google Sheets yang sudah terauthentikasi
 * Menggunakan Service Account (bukan OAuth user)
 */
const getGoogleSheetsClient = async () => {
  const keyFile = path.resolve(process.cwd(), process.env.GOOGLE_KEY_FILE || 'service-account.json');

  const auth = new google.auth.GoogleAuth({
    keyFile, // path ke file JSON service account
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  return sheets;
};

module.exports = { getGoogleSheetsClient };
