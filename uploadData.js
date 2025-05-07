const mongoose = require('mongoose');
const XLSX = require('xlsx');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Connection Error:", err));

// Define Student schema
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

// Read Excel file
const workbook = XLSX.readFile('data.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const students = XLSX.utils.sheet_to_json(sheet);

// Insert into MongoDB
Student.insertMany(students)
    .then(() => {
        console.log('Data uploaded successfully');
        mongoose.connection.close();
    })
    .catch(err => {
        console.error('Error uploading data:', err);
        mongoose.connection.close();
    });
