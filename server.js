const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const cors = require('cors');
const ExcelJS = require('exceljs');
const app = express();
const { jsPDF } = require('jspdf');
const pdf = require('html-pdf');
const port = 9000;


// const crypto = require('crypto');

// // Generate a random key
// const secret = crypto.randomBytes(64).toString('hex');

// console.log('Generated secret key:', secret);
// Database connection configuration
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Test',
    password: 'Password',
    port: 5432,
});

// Set EJS as the templating engine
app.set('view engine', 'ejs');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Middleware to parse JSON requests
app.use(express.json()); // Ensure the body is parsed as JSON
// Serve static files from the 'public' directory
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/Public/loginForm.html');
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/Public/signUpForm.html');
});
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/Public/admin.html');
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/Public/search.html');
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/Public/freight.html');
});
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/Public/vehicle.html');
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/Public/vendor.html');
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/Public/GSTmaster.html');
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/Public/searchByDate.html');
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/Public/searchByTruck.html');
});






app.post('/signup', async (req, res) => {
    const { username, profile } = req.body;

    try {
        const client = await pool.connect();

        // Check if the username already exists
        const userCheckResult = await client.query('SELECT COUNT(*) FROM users WHERE username = $1', [username]);
        if (parseInt(userCheckResult.rows[0].count) > 0) {
            client.release();
            // Redirect to a page with error message
            return res.redirect('/result.html?status=error&message=Username already exists');
        }

        // Insert the new user
        await client.query('INSERT INTO users (username, profile, password) VALUES ($1, $2, $3)', [username, profile, 'defaultPassword']);
        client.release();
        console.log('User registered:', username);

        // Redirect to a page with success message
        res.redirect('/result.html?status=success&message=Sit back and relax. We will send your credentials to you soon!');
    } catch (err) {
        console.error('Error executing query', err);
        // Redirect to a page with server error message
        res.redirect('/result.html?status=error&message=Internal server error');
    }
});

app.post('/login', async (req, res) => {
    const { username, password, profile } = req.body;

    console.log('Login attempt:', { username, password, profile });

    let client;
    try {
        client = await pool.connect();
        const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);

        console.log('Query result:', result.rows);

        if (result.rows.length > 0) {
            const user = result.rows[0];
            const { password: storedPassword, profile: storedProfile } = user;

            // Compare the provided password with the stored password in plain text
            if (password === storedPassword && storedProfile === profile) {
                let redirectUrl;

                switch (storedProfile) {
                    case 'loadingManager':
                        redirectUrl = '/loadingManager.html';
                        break;
                    case 'admin':
                        redirectUrl = '/search.html';
                        break;
                    case 'accountant':
                        redirectUrl = '/search.html';
                        break;
                    case 'unloadingManager':
                        redirectUrl = '/unloadingManager.html';
                        break;
                    default:
                        return res.status(403).send('Access denied: unknown profile');
                }

                // Directly redirect to the appropriate page
                return res.redirect(redirectUrl);
            } else {
                res.status(401).send('Invalid username, password, or profile');
            }
        } else {
            res.status(401).send('Invalid username, password, or profile');
        }
    } catch (err) {
        console.error('Error executing query:', err.message);
        res.status(500).send('Error logging in');
    } finally {
        if (client) client.release();
    }
});





const storage = multer.memoryStorage(); // Store file data in memory

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Example: limit to 5 MB
});

// Route to handle form submission
// app.post('/submit-truck-details', upload.single('truckImage'), async (req, res) => {
//     const {
//         truckNo, time, date, weight, freight, diesel, advance,
//         driverName, from_destination, destination_to,
//         doNumber, truckType, transactionStatus, dieselSlipNumber, companyName
//     } = req.body;
//     const truckImage = req.file; // Contains information about the uploaded image file

//     try {
//         const client = await pool.connect();
//         const query = `
//             INSERT INTO truck_details (
//                 truck_no, time, date, weight, freight, diesel, advance, 
//                 driver_name, destination_from, destination_to, 
//                 do_number, vendor, truck_type, transaction_status, diesel_slip_number,
//                 truck_image_file_name, image_data
//             ) VALUES (
//                 $1, $2, $3, $4, $5, $6, $7, 
//                 $8, $9, $10, 
//                 $11, $12, $13, $14, $15, 
//                 $16, $17
//             )
//         `;
//         const values = [
//             truckNo, time, date, weight, freight, diesel, advance,
//             driverName, from_destination, destination_to,
//             doNumber, companyName, truckType, transactionStatus, dieselSlipNumber,
//             truckImage ? truckImage.originalname : null, truckImage ? truckImage.buffer : null
//         ];
//         await client.query(query, values);
//         client.release();
//         console.log('Truck details added successfully');

//         // Redirect to the home page or any other appropriate page after successful insertion
//         res.redirect('/search.html');
//     } catch (err) {
//         console.error('Error adding truck details:', err);
//         res.status(500).send('Error adding truck details');
//     }
// });



app.post('/submit-truck-details', upload.fields([
    { name: 'truckImage', maxCount: 1 },
    { name: 'loadingAdvice', maxCount: 1 },
    { name: 'invoiceCompany', maxCount: 1 },
    { name: 'weighmentSlip', maxCount: 1 },
    { name: 'others', maxCount: 1 }
]), async (req, res) => {
    const {
        truckNo, time, date, weight, freight, diesel, advance,
        driverName, from_destination, destination_to,
        doNumber, truckType, transactionStatus, dieselSlipNumber, companyName,
        actualWeight, differenceWeight 
    } = req.body;

    const truckImage = req.files['truckImage'] ? req.files['truckImage'][0] : null;
    const loadingAdvice = req.files['loadingAdvice'] ? req.files['loadingAdvice'][0] : null;
    const invoiceCompany = req.files['invoiceCompany'] ? req.files['invoiceCompany'][0] : null;
    const weighmentSlip = req.files['weighmentSlip'] ? req.files['weighmentSlip'][0] : null;
    const others = req.files['others'] ? req.files['others'][0] : null;

    try {
        const client = await pool.connect();
        const query = `
            INSERT INTO truck_details (
                truck_no, time, date, weight, freight, diesel, advance, 
                driver_name, destination_from, destination_to, 
                do_number, vendor, truck_type, transaction_status, diesel_slip_number,
                actual_weight, difference_weight, 
                truck_image_file_name, image_data,
                loading_advice_file_name, loading_advice_data,
                invoice_company_file_name, invoice_company_data,
                weighment_slip_file_name, weighment_slip_data,
                others_file_name, others_data
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, 
                $8, $9, $10, 
                $11, $12, $13, $14, $15,
                $16, $17, 
                $18, $19,
                $20, $21,
                $22, $23,
                $24, $25,
                $26, $27
            )
        `;
        const values = [
            truckNo, time, date, weight, freight, diesel, advance,
            driverName, from_destination, destination_to,
            doNumber, companyName, truckType, transactionStatus, dieselSlipNumber,
            actualWeight, differenceWeight,
            truckImage ? truckImage.originalname : null, truckImage ? truckImage.buffer : null,
            loadingAdvice ? loadingAdvice.originalname : null, loadingAdvice ? loadingAdvice.buffer : null,
            invoiceCompany ? invoiceCompany.originalname : null, invoiceCompany ? invoiceCompany.buffer : null,
            weighmentSlip ? weighmentSlip.originalname : null, weighmentSlip ? weighmentSlip.buffer : null,
            others ? others.originalname : null, others ? others.buffer : null
        ];
        await client.query(query, values);
        client.release();
        console.log('Truck details added successfully');

        // Redirect to the home page or any other appropriate page after successful insertion
        res.redirect('/search.html');
    } catch (err) {
        console.error('Error adding truck details:', err);
        res.status(500).send('Error adding truck details');
    }
});








//search data by truck no
app.get('/search-truck', async (req, res) => {
    const truckNo = req.query.truck_No;

    if (!truckNo) {
        return res.status(400).send('Truck number is required');
    }

    try {
        const client = await pool.connect();
        const query = 'SELECT * FROM truck_details WHERE truck_no = $1';
        const result = await client.query(query, [truckNo]);
        client.release();

        if (result.rows.length > 0) {
            // Format date in each row as 'YYYY-MM-DD'
            const formattedRows = result.rows.map(row => {
                const date = new Date(row.date);
                return {
                    ...row,
                    date: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
                };
            });

            // Send formatted truck details as JSON response
            res.json(formattedRows);
        } else {
            res.status(404).send('Truck details not found');
        }
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).send('Error searching for truck details');
    }
});



// Route to search for truck details by truck number and download as Excel
app.get('/search-truck/download', async (req, res) => {
    const truckNo = req.query.truck_No;

    if (!truckNo) {
        return res.status(400).send('Truck number is required');
    }

    try {
        const client = await pool.connect();
        // Updated query to include new fields
        const query = `
            SELECT 
                truck_no, time, date, weight, freight, diesel, advance, 
                driver_name, destination_from, destination_to,
                do_number, vendor, truck_type, transaction_status, diesel_slip_number
            FROM truck_details
            WHERE truck_no = $1
        `;
        const result = await client.query(query, [truckNo]);
        client.release();

        if (result.rows.length > 0) {
            // Format date in each row
            result.rows.forEach(row => {
                row.date = new Date(row.date).toLocaleDateString(); // Format date as per your requirement
            });

            // Convert data to xlsx format
            const ws = XLSX.utils.json_to_sheet(result.rows);

            // Adjust column widths
            ws['!cols'] = [
                { wch: 20 }, // Truck Number
                { wch: 15 }, // Time
                { wch: 12 }, // Date
                { wch: 15 }, // Weight
                { wch: 15 }, // Freight
                { wch: 15 }, // Diesel
                { wch: 15 }, // Advance
                { wch: 20 }, // Driver Name
                { wch: 20 }, // Destination From
                { wch: 20 }, // Destination To
                { wch: 20 }, // DO Number
                { wch: 20 }, // Vendor
                { wch: 20 }, // Truck Type
                { wch: 20 }, // Transaction Status
                { wch: 20 }  // Diesel Slip Number
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Truck Details');
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

            // Set response headers to trigger file download
            res.setHeader('Content-Disposition', 'attachment; filename="truck_details.xlsx"');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(wbout);
        } else {
            res.status(404).send('Truck details not found');
        }
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).send('Error searching for truck details');
    }
});


//search data by date
app.get('/search-date', async (req, res) => {
    const { startdate, enddate } = req.query;

    try {
        const client = await pool.connect();
        const query = 'SELECT * FROM truck_details WHERE date BETWEEN $1 AND $2 ORDER BY date DESC;';
        const result = await client.query(query, [startdate, enddate]);
        client.release();

        if (result.rows.length > 0) {
            // Format date in each row as 'YYYY-MM-DD'
            const formattedRows = result.rows.map(row => {
                const date = new Date(row.date);
                return {
                    ...row,
                    date: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
                };
            });

            // Send formatted truck details as JSON response
            res.json(formattedRows);
        } else {
            res.status(404).send('Date details not found');
        }
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).send('Error searching for truck details');
    }
});

app.get('/search-date-vendor', async (req, res) => {
    const { startdate, enddate, vendor, truckNo } = req.query;

    try {
        const client = await pool.connect();

        // Base query
        let query = 'SELECT * FROM truck_details WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        // If start date and end date are provided, add them to the query
        if (startdate && enddate) {
            query += ` AND date BETWEEN $${paramIndex++} AND $${paramIndex++}`;
            params.push(startdate, enddate);
        }

        // If vendor is provided, add it to the query
        if (vendor) {
            query += ` AND vendor = $${paramIndex++}`;
            params.push(vendor);
        }

        // If truckNo is provided, add it to the query
        if (truckNo) {
            query += ` AND truck_no = $${paramIndex++}`;
            params.push(truckNo);
        }

        query += ' ORDER BY date DESC;';

        const result = await client.query(query, params);
        client.release();

        if (result.rows.length > 0) {
            // Format date in each row as 'YYYY-MM-DD'
            const formattedRows = result.rows.map(row => {
                const date = new Date(row.date);
                return {
                    ...row,
                    date: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
                };
            });

            // Send formatted truck details as JSON response
            res.json(formattedRows);
        } else {
            res.status(404).send('Date details not found');
        }
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).send('Error searching for truck details');
    }
});


app.get('/search-date/download', async (req, res) => {
    const { startdate, enddate } = req.query;

    if (!startdate || !enddate) {
        return res.status(400).send('Start date and end date are required');
    }

    try {
        const client = await pool.connect();
        const query = `
            SELECT truck_no, time, date, weight, freight, diesel, advance, driver_name, 
                   destination_from, destination_to,  do_number, vendor, truck_type, transaction_status, diesel_slip_number
            FROM truck_details 
            WHERE date >= $1 AND date <= $2
        `;
        const result = await client.query(query, [startdate, enddate]);
        client.release();

        if (result.rows.length > 0) {
            // Format date in each row
            result.rows.forEach(row => {
                row.date = new Date(row.date).toLocaleDateString(); // Format date as per your requirement
            });

            // Convert data to xlsx format
            const ws = XLSX.utils.json_to_sheet(result.rows);

            // Adjust column widths
            ws['!cols'] = [
                { wch: 20 }, // Truck Number
                { wch: 15 }, // Time
                { wch: 12 }, // Date
                { wch: 15 }, // Weight
                { wch: 15 }, // Freight
                { wch: 15 }, // Diesel
                { wch: 15 }, // Advance
                { wch: 20 }, // Driver Name
                { wch: 20 }, // Destination From
                { wch: 20 }, // Destination To
                { wch: 15 }, // DO Number
                { wch: 20 }, // Vendor
                { wch: 15 }, // Truck Type
                { wch: 20 }, // Transaction Status
                { wch: 20 }  // Diesel Slip Number
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Truck Details');
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

            // Set response headers to trigger file download
            res.setHeader('Content-Disposition', 'attachment; filename="truck_details.xlsx"');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(wbout);
        } else {
            res.status(404).send('No truck details found for the specified date range');
        }
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).send('Error searching for truck details');
    }
});



// app.post('/submit', async (req, res) => {
//     const { from_destination, to_destination, rate } = req.body;

//     console.log('Received:', { from_destination, to_destination, rate });

//     try {
//         const client = await pool.connect();

//         // Check if the combination of from_destination and to_destination already exists
//         const checkResult = await client.query(
//             'SELECT COUNT(*) FROM shipments WHERE from_destination = $1 AND to_destination = $2',
//             [from_destination, to_destination]
//         );

//         if (parseInt(checkResult.rows[0].count) > 0) {
//             client.release();
//             return res.status(400).json({ message: 'Destination already registered' });
//         }

//         // Insert the new shipment
//         await client.query(
//             'INSERT INTO shipments (from_destination, to_destination, rate) VALUES ($1, $2, $3)',
//             [from_destination, to_destination, parseFloat(rate)]
//         );

//         client.release();
//         console.log('New shipment added:', { from_destination, to_destination, rate });

//         // Return success message as JSON
//         res.json({ message: 'Shipment added successfully!' });
//     } catch (err) {
//         console.error('Error executing query', err);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });
app.post('/submit', async (req, res) => {
    const { from_destination, to_destination, rate } = req.body;

    try {
        const client = await pool.connect();

        // Check if the combination of from_destination and to_destination already exists
        const checkResult = await client.query(
            'SELECT COUNT(*) FROM shipments WHERE from_destination = $1 AND to_destination = $2',
            [from_destination, to_destination]
        );

        if (parseInt(checkResult.rows[0].count) > 0) {
            client.release();
            return res.status(400).json({ message: 'Data already available.' });
        }

        // Insert the new shipment
        await client.query(
            'INSERT INTO shipments (from_destination, to_destination, rate) VALUES ($1, $2, $3)',
            [from_destination, to_destination, parseFloat(rate)]
        );

        client.release();
        console.log('New shipment added:', { from_destination, to_destination, rate });

        // Respond with a success message in JSON format
        res.status(200).json({ message: 'Data added successfully!' });
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});




// Serve data for the table on page load
app.get('/data', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM shipments');
        res.json({ shipments: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Handle form submission
app.post('/submitVehicle', async (req, res) => {
    const { truckNo, make, freight, companyOwner } = req.body;

    try {
        // Insert the new vehicle into the database
        await pool.query(
            'INSERT INTO vehicle_master (truck_no, make, freight, company_owner) VALUES ($1, $2, $3, $4)',
            [truckNo, make, parseFloat(freight), companyOwner]
        );

        // Fetch all vehicles from the database
        const result = await pool.query('SELECT * FROM vehicle_master');

        // Send the data back as JSON
        res.json({ vehicle_master: result.rows });
    } catch (err) {
        console.error('Error inserting data:', err);
        res.status(500).send('Server error');
    }
});

// Serve data for the table on page load
app.get('/vehicledata', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM vehicle_master');
        res.json({ vehicle_master: result.rows });
    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).send('Server error');
    }
});

// Handle form submission
app.post('/submitCompany', async (req, res) => {
    const { companyName, companyOwner, tdsRate, pan, gst } = req.body;

    try {
        // Insert the new company into the database
        await pool.query(
            'INSERT INTO company_master (company_name, company_owner, tds_rate, pan, gst) VALUES ($1, $2, $3, $4, $5)',
            [companyName, companyOwner, parseFloat(tdsRate), pan, gst]
        );

        // Fetch all companies from the database
        const result = await pool.query('SELECT * FROM company_master');

        // Send the data back as JSON
        res.json({ company_master: result.rows });
    } catch (err) {
        console.error('Error inserting data:', err);
        res.status(500).send('Server error');
    }
});

// Serve data for the table on page load
app.get('/companydata', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM company_master');
        res.json({ company_master: result.rows });
    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).send('Server error');
    }
});

// Handle form submission
app.post('/submitGST', async (req, res) => {
    const { companyName, companyOwner, gstNo } = req.body;

    try {
        // Insert the new company into the database
        await pool.query(
            'INSERT INTO gst_master (company_name, company_owner, gst_no) VALUES ($1, $2, $3)',
            [companyName, companyOwner, gstNo]
        );

        // Fetch all companies from the database
        const result = await pool.query('SELECT * FROM gst_master');

        // Send the data back as JSON
        res.json({ gst_master: result.rows });
    } catch (err) {
        console.error('Error inserting data:', err);
        res.status(500).send('Server error');
    }
});

// Serve data for the table on page load
app.get('/gstdata', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM gst_master');
        res.json({ gst_master: result.rows });
    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).send('Server error');
    }
});

function logout() {
    sessionStorage.clear();  // or localStorage.clear();
    window.location.href = '/loginForm.html';  // Adjust path as needed
}


// Endpoint to fetch today's truck list

// Endpoint to fetch today's truck list
app.get('/search-truck/today', async (req, res) => {
    const today = req.query.date; // Date should be in YYYY-MM-DD format

    if (!today) {
        return res.status(400).send('Date is required.');
    }

    try {
        // Query to select all truck details for today
        const result = await pool.query(
            'SELECT * FROM truck_details WHERE DATE(date) = $1',
            [today]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching truck details:', error);
        res.status(500).send('Error fetching truck details');
    }
});


app.get('/search-truck/today/download', async (req, res) => {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

    try {
        // Query to select all truck details for today, including new fields
        const result = await pool.query(
            `SELECT 
                truck_no, time, date, weight, freight, diesel, advance, 
                driver_name, destination_from, destination_to,
                do_number, vendor, truck_type, transaction_status, diesel_slip_number
            FROM truck_details
            WHERE DATE(date) = $1`,
            [today]
        );

        const truckDetailsList = result.rows;

        if (truckDetailsList.length === 0) {
            return res.status(404).send('No truck details found for today.');
        }

        // Create a new Excel workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Truck Details');

        // Add column headers
        worksheet.columns = [
            { header: 'Truck Number', key: 'truck_no', width: 20 },
            { header: 'Time', key: 'time', width: 15 },
            { header: 'Date', key: 'date', width: 20 },
            { header: 'Weight (tons)', key: 'weight', width: 15 },
            { header: 'Freight', key: 'freight', width: 15 },
            { header: 'Diesel (liters)', key: 'diesel', width: 20 },
            { header: 'Advance', key: 'advance', width: 15 },
            { header: 'Driver Name', key: 'driver_name', width: 25 },
            { header: 'Destination From', key: 'destination_from', width: 25 },
            { header: 'Destination To', key: 'destination_to', width: 25 },
            { header: 'DO Number', key: 'do_number', width: 20 },
            { header: 'Vendor', key: 'vendor', width: 20 },
            { header: 'Truck Type', key: 'truck_type', width: 20 },
            { header: 'Transaction Status', key: 'transaction_status', width: 20 },
            { header: 'Diesel Slip Number', key: 'diesel_slip_number', width: 20 }
        ];

        // Add rows
        truckDetailsList.forEach(truckDetails => {
            worksheet.addRow({
                truck_no: truckDetails.truck_no,
                time: truckDetails.time,
                date: new Date(truckDetails.date).toLocaleDateString('en-US'), // Format date
                weight: truckDetails.weight,
                freight: truckDetails.freight,
                diesel: truckDetails.diesel,
                advance: truckDetails.advance,
                driver_name: truckDetails.driver_name,
                destination_from: truckDetails.destination_from,
                destination_to: truckDetails.destination_to,
                do_number: truckDetails.do_number,
                vendor: truckDetails.vendor,
                truck_type: truckDetails.truck_type,
                transaction_status: truckDetails.transaction_status,
                diesel_slip_number: truckDetails.diesel_slip_number
            });
        });

        // Adjust row heights (optional)
        worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            row.height = 20; // Set a fixed row height (example: 20 pixels)
        });

        // Set response headers to indicate file attachment
        res.setHeader('Content-Disposition', 'attachment; filename=today_truck_list.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Write the workbook to response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Error generating Excel file');
    }
});


// Route to get 'from' destinations
app.get('/api/destinations', async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT from_destination FROM shipments');
        res.json(result.rows.map(row => ({ from_destination: row.from_destination })));
    } catch (error) {
        console.error('Error fetching from destinations:', error);
        res.status(500).send('Server error');
    }
});

// Route to get 'to' destinations
app.get('/api/to-destinations', async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT to_destination FROM shipments');
        res.json(result.rows.map(row => ({ to_destination: row.to_destination })));
    } catch (error) {
        console.error('Error fetching to destinations:', error);
        res.status(500).send('Server error');
    }
});

// Route to get rate based on destination pair
app.get('/api/rate', async (req, res) => {
    const { from, to } = req.query;
    try {
        const result = await pool.query('SELECT rate FROM shipments WHERE from_destination = $1 AND to_destination = $2 LIMIT 1', [from, to]);
        if (result.rows.length > 0) {
            res.json({ rate: result.rows[0].rate });
        } else {
            res.status(404).send('Rate not found');
        }
    } catch (error) {
        console.error('Error fetching rate:', error);
        res.status(500).send('Server error');
    }
});

// Route to get vendor options
app.get('/get-vendors', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT DISTINCT company_name FROM company_master');
        client.release();

        const vendors = result.rows.map(row => row.company_name);
        res.json(vendors);
    } catch (err) {
        console.error('Error fetching vendors:', err);
        res.status(500).send('Error fetching vendors');
    }
});


// Handle file upload
app.post('/upload', upload.single('excelFile'), async (req, res) => {
    try {
        // Check if a file was uploaded
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        // Read and parse Excel file from memory
        const workbook = XLSX.read(req.file.buffer);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        // Insert data into PostgreSQL
        for (const row of data) {
            const client = await pool.connect();
            await client.query(
                'INSERT INTO company_master (company_name, company_owner, tds_rate, pan, gst) VALUES ($1, $2, $3, $4, $5)',
                [row['company_name'], row['company_owner'], row['tds_rate'], row['pan'], row['gst']]
            );
        }

        res.send('File uploaded and data inserted successfully!');
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred while processing the file.');
    }
});
// app.post('/update-truck-details', upload.none(), async (req, res) => {
//     const {
//         id, // Add this line to extract the id from the request body
//         truckNo, time, date, weight, freight, diesel, advance,
//         driverName, destinationFrom, destinationTo,
//         doNumber, vendor, truckType, transactionStatus, dieselSlipNumber
//     } = req.body;

//     // Log incoming request body
//     console.log('Incoming request body:', req.body);

//     // Correct the time and date assignments
//     const timeValue = req.body.time; // This should be formatted correctly
//     const dateValue = req.body.date; // This should be 'YYYY-MM-DD'

//     try {
//         const client = await pool.connect();
//         const query = `
//             UPDATE truck_details
//             SET 
//                 time = $1, 
//                 date = $2, 
//                 weight = $3, 
//                 freight = $4, 
//                 diesel = $5, 
//                 advance = $6, 
//                 driver_name = $7, 
//                 destination_from = $8, 
//                 destination_to = $9, 
//                 do_number = $10, 
//                 vendor = $11, 
//                 truck_type = $12, 
//                 transaction_status = $13, 
//                 diesel_slip_number = $14,
//                 id = $15 
//             WHERE 
//                  truck_no = $16
//         `;

//         const values = [
//             time,    // Ensure this is in HH:MM:SS format
//             date,    // Ensure this is in YYYY-MM-DD format
//             weight,
//             freight,
//             diesel,
//             advance,
//             driverName,
//             destinationFrom,
//             destinationTo,
//             doNumber,
//             vendor,
//             truckType,
//             transactionStatus,
//             dieselSlipNumber,
//             id,           // Use id to identify the row
//             truckNo       // Include truckNo for additional identification
//         ];

//         console.log('Query:', query); // Log the query
//         console.log('Values:', values); // Log the values

//         const result = await client.query(query, values);
//         client.release();

//         if (result.rowCount > 0) {
//             console.log('Update successful for Truck Number:', truckNo);
//             return res.status(200).json({ message: 'Truck updated successfully' });
//         } else {
//             console.warn('No rows affected. Truck not found for Truck Number:', truckNo);
//             return res.status(404).json({ message: 'Truck not found' });
//         }
//     } catch (err) {
//         console.error('Error updating truck details:', err);
//         return res.status(500).json({ message: 'Error updating truck details' });
//     }
// });


app.post('/update-truck-details', upload.none(), async (req, res) => {
    const {
        Id,
        time,
        date,
        weight,
        freight,
        diesel,
        advance,
        driver_name,
        destination_from,
        destination_to,
        do_number,
        vendor,
        truck_type,
        transaction_status,
        diesel_slip_number,
        truck_no
    } = req.body;

    // Check if Id is present
    if (!Id) {
        return res.status(400).json({ message: 'Truck ID is required' });
    }

    console.log('Updating truck with ID:', Id); // Debugging output
    console.log('Request body:', req.body); // Log the incoming request body

    try {
        const client = await pool.connect();
        
        const query = `
            UPDATE truck_details
            SET 
                time = $1, 
                date = $2, 
                weight = $3, 
                freight = $4, 
                diesel = $5, 
                advance = $6, 
                driver_name = $7, 
                destination_from = $8, 
                destination_to = $9, 
                do_number = $10, 
                vendor = $11, 
                truck_type = $12, 
                transaction_status = $13, 
                diesel_slip_number = $14,
                truck_no = $15
            WHERE 
                id = $16
        `;

        const values = [
            time,
            date,
            weight,
            freight,
            diesel,
            advance,
            driver_name,
            destination_from,
            destination_to,
            do_number,
            vendor,
            truck_type,
            transaction_status,
            diesel_slip_number,
            truck_no,
            Id
        ];

        console.log('Executing query:', query);
        console.log('With values:', values);

        await client.query(query, values);
        client.release();

        return res.status(200).json({ message: 'Truck updated successfully' });
    } catch (err) {
        console.error('Error updating truck details:', err);
        return res.status(500).json({ message: 'Error updating truck details' });
    }
});






app.use(bodyParser.json());
// Route to get truck data
app.get('/api/trucks', async (req, res) => {
    try {
        const query = 'SELECT * FROM truck_details'; // Replace with your actual table name
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching truck data:', error);
        res.status(500).send('Error fetching truck data.');
    }
});// Route to generate Excel
app.post('/generate-excel', async (req, res) => {
    const truckData = req.body.truckData;

    console.log('Truck Data received:', req.body); // Debugging

    if (!truckData || !Array.isArray(truckData)) {
        console.error('Invalid truck data received:', truckData);
        return res.status(400).send('Invalid truck data.');
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Truck Details');

    // Define the columns including 'Total'
    worksheet.columns = [
        { header: 'Id', key: 'id', width: 10 },
        { header: 'Truck Number', key: 'truck_no', width: 15 },
        { header: 'Time', key: 'time', width: 10 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Weight (tons)', key: 'weight', width: 15 },
        { header: 'Freight', key: 'freight', width: 15 },
        { header: 'Diesel (liters)', key: 'diesel', width: 15 },
        { header: 'Advance', key: 'advance', width: 15 },
        { header: 'Driver Name', key: 'driver_name', width: 20 },
        { header: 'Destination From', key: 'destination_from', width: 20 },
        { header: 'Destination To', key: 'destination_to', width: 20 },
        { header: 'DO Number', key: 'do_number', width: 15 },
        { header: 'Vendor', key: 'vendor', width: 15 },
        { header: 'Truck Type', key: 'truck_type', width: 15 },
        { header: 'Transaction Status', key: 'transaction_status', width: 20 },
        { header: 'Diesel Slip Number', key: 'diesel_slip_number', width: 20 },
        { header: 'Total', key: 'total', width: 15 } // New total column
    ];

    // Update the transaction status in the database
    const ids = truckData.map(truck => truck.id);
    const updateQuery = `UPDATE truck_details SET transaction_status = 'Acknowledged + Billed' WHERE id = ANY($1::int[])`;
    await pool.query(updateQuery, [ids]);

    // Add rows to the worksheet
    truckData.forEach(truck => {
        const { id, truck_no, time, date, weight, freight, total, diesel, advance, driver_name, destination_from, destination_to, do_number, vendor, truck_type, transaction_status, diesel_slip_number } = truck;

        const row = {
            id,
            truck_no,
            time,
            date,
            weight,
            freight,
            diesel,
            advance,
            driver_name,
            destination_from,
            destination_to,
            do_number,
            vendor,
            truck_type,
            transaction_status,
            diesel_slip_number,
            total // Include total in the row data
        };

        worksheet.addRow(row);
    });

    // Write to a buffer
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Disposition', 'attachment; filename=truck-details.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
});

app.get('/get-acknowledged-trucks', async (req, res) => {
    try {
        const query = `
            SELECT 
                id, 
                truck_no, 
                time, 
                date, 
                weight, 
                freight, 
                diesel, 
                advance, 
                driver_name, 
                destination_from, 
                destination_to, 
                do_number, 
                vendor, 
                truck_type, 
                transaction_status, 
                diesel_slip_number 
            FROM truck_details 
            WHERE transaction_status = $1
        `;
        const values = ['Acknowledged + Billed'];

        const { rows } = await pool.query(query, values);
        return res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching trucks:', err);
        return res.status(500).json({ message: 'Error fetching trucks' });
    }
});

app.post('/update', async (req, res) => {
    const { from_destination, to_destination, rate } = req.body;

    // Log the data to check if it's being received correctly
    console.log('Received data:', { from_destination, to_destination, rate });

    try {
        const client = await pool.connect();

        // Check if the shipment exists in the database before updating
        const result = await client.query(
            'SELECT * FROM shipments WHERE from_destination = $1 AND to_destination = $2',
            [from_destination, to_destination]
        );

        // If no record is found, return an error
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No shipment found to update' });
        }

        // Perform the update
        await client.query(
            'UPDATE shipments SET rate = $1 WHERE from_destination = $2 AND to_destination = $3',
            [parseFloat(rate), from_destination, to_destination]
        );

        client.release();
        console.log('Shipment updated:', { from_destination, to_destination, rate });

        // Respond with a success message
        res.status(200).json({ message: 'Data updated successfully!' });
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Server-side route for updating a row
app.post('/update-row', async (req, res) => {
    const {  from_destination, to_destination, rate, id, } = req.body;

    // Log incoming request body for debugging
    console.log('Incoming request body:', req.body);

    // Check if ID is present
    if (!id) {
        return res.status(400).json({ message: 'ID is required' });
    }

    // Check if 'rate' is a valid number
    if (isNaN(rate) || rate.trim() === '') {
        return res.status(400).json({ message: 'Invalid value for rate. Please enter a numeric value.' });
    }

    try {
        const client = await pool.connect();

        // Construct the SQL query
        const query = `
            UPDATE shipments
            SET 
                from_destination = $1, 
                to_destination = $2, 
                rate = $3
            WHERE id = $4
        `;

        // Log the query and values for debugging
        console.log('Executing query:', query);
        console.log('With values:', [from_destination, to_destination, rate, id]);

        // Execute the query
        const result = await client.query(query, [from_destination, to_destination, rate, id]);

        client.release();

        // Check if any rows were affected
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'No rows found to update for this ID' });
        }

        return res.status(200).json({ message: 'Row updated successfully' });
    } catch (err) {
        console.error('Error updating row:', err);
        return res.status(500).json({ message: 'Error updating row' });
    }
});



// Start server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
