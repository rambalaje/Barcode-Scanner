document.addEventListener("DOMContentLoaded", function () {
    const barcodeInput = document.getElementById("barcodeInput");
    const studentDetails = document.getElementById("student-details");

    fetch("/reset-scanned-data")
        .then(response => response.json())
        .then(data => console.log(data.message))
        .catch(err => console.error("Error:", err));

    barcodeInput.addEventListener("input", function () {
        const barcode = barcodeInput.value.trim();
        if (barcode.length >= 10) {
            fetch("https://barcode-scanner-zirs.onrender.com/scan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ barcode: barcode })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const student = data.product;
                    studentDetails.innerHTML = `
                        <strong>Name:</strong> ${student.name}<br>
                        <strong>Register No:</strong> ${student.REGISTERNUMBER

                        }<br>
                        <strong>Department:</strong> ${student.DEPT}<br>
                        <strong>Programme:</strong> ${student.PROGRAMME
                        }<br>
                        <strong>Section:</strong> ${student.SEC
                        }<br>
                        <strong>Year:</strong> ${student.YEAR

                        }
                    `;

                    barcodeInput.style.backgroundColor = "#d4edda"; 
                    barcodeInput.placeholder = "Scanned!";
                } else {
                    studentDetails.innerHTML = `<span style="color:red;">Student not found!</span>`;

                    barcodeInput.style.backgroundColor = "#f8d7da"; 
                    barcodeInput.placeholder = "Not found!";
                }

                setTimeout(() => {
                    barcodeInput.value = "";
                    barcodeInput.style.backgroundColor = ""; 
                    barcodeInput.placeholder = "Scan the barcode here...";
                }, 500); 
            })
            .catch(err => console.error("Error:", err));
        }
    });

    document.getElementById("downloadBtn").addEventListener("click", function () {
        fetch("https://barcode-scanner-zirs.onrender.com/generate-report")
        .then(response => response.blob())
        .then(blob => {
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "scanned_students.xlsx";
            link.click();
        })
        .catch(err => console.error("Error:", err));
    });

    document.getElementById("shareEmailBtn").addEventListener("click", function () {
        const email = prompt("Enter recipient email:");
        if (email && email.includes("@")) {
            fetch("https://barcode-scanner-zirs.onrender.com/send-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email })
            })
            .then(response => response.json())
            .then(data => alert(data.message))
            .catch(err => console.error("Error:", err));
        } else {
            alert("Invalid email. Please enter a valid email address.");
        }
    });
});
