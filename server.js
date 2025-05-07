const express = require('express');
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define Student Schema
const studentSchema = new mongoose.Schema({
    Barcode: String,
    name: String,
    REGISTERNUMBER: String,
    DEPT: String,
    PROGRAMME: String,
    SEC: String,
    YEAR: String
});

const Student = mongoose.model('Student', studentSchema);

// Paths
const outputFilePath = path.join(__dirname, 'scanned_students.xlsx');

// Init scanned data
let scannedData = [];

function createNewScannedFile() {
    if (fs.existsSync(outputFilePath)) {
        fs.unlinkSync(outputFilePath);
    }
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet([]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Scanned Students');
    XLSX.writeFile(workbook, outputFilePath);
}

// Reset scanned data on server start
createNewScannedFile();

app.get('/reset-scanned-data', (req, res) => {
    scannedData = [];
    createNewScannedFile();
    res.json({ message: "Scanned data has been reset and new Excel file created." });
});

app.post('/scan', async (req, res) => {
    try {
        const { barcode } = req.body;

        const student = await Student.findOne({ Barcode: barcode });

        if (student) {
            const alreadyScanned = scannedData.some(s => s.Barcode === student.Barcode);
            if (!alreadyScanned) {
                const timestamp = new Date().toLocaleString();
                const studentWithTime = { ...student.toObject(), Time: timestamp };
                scannedData.push(studentWithTime);

                const worksheet = XLSX.utils.json_to_sheet(scannedData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Scanned Students');
                XLSX.writeFile(workbook, outputFilePath);
            }

            return res.json({ success: true, product: student });
        }

        res.json({ success: false, message: 'Student not found' });
    } catch (error) {
        console.error('Error in scan:', error);
        res.status(500).json({ success: false, message: error });
    }
});

app.get('/generate-report', (req, res) => {
    try {
        if (scannedData.length === 0) {
            return res.status(400).json({ message: 'No scanned data available' });
        }
        res.download(outputFilePath);
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ message: 'Error generating report' });
    }
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.post('/send-email', (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        if (scannedData.length === 0) {
            return res.status(400).json({ message: 'No scanned data available to send' });
        }

        if (!fs.existsSync(outputFilePath)) {
            return res.status(400).json({ message: 'Report file not found' });
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Scanned Student Report',
            text: 'Please find attached the scanned student report.',
            attachments: [{ filename: 'scanned_students.xlsx', path: outputFilePath }]
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ message: 'Error sending email' });
            }
            res.json({ message: 'Email sent successfully!' });
        });
    } catch (error) {
        console.error('Error in email sending:', error);
        res.status(500).json({ message: 'Server error' });
    }
});




const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
