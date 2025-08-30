// script.js

class SalaryBoard {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.designations = new Set();
        this.departments = new Set();
        this.currentFocus = -1;
        this.uploadedFiles = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFileUpload();
    }

    setupFileUpload() {
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        const fileList = document.getElementById('fileList');
        const processBtn = document.getElementById('processBtn');

        // File input change event
        fileInput.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files);
        });

        // Drag and drop events
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFileSelect(e.dataTransfer.files);
        });

        // Click to select files
        uploadArea.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') {
                fileInput.click();
            }
        });
    }

    handleFileSelect(files) {
        const fileList = document.getElementById('fileList');
        const processBtn = document.getElementById('processBtn');

        // Clear previous files
        this.uploadedFiles = [];
        fileList.innerHTML = '';

        // Add new files
        for (let file of files) {
            if (file.type === 'application/pdf') {
                this.uploadedFiles.push(file);
                
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.innerHTML = `
                    <span class="file-name">${file.name}</span>
                    <span class="file-status">Ready</span>
                `;
                fileList.appendChild(fileItem);
            }
        }

        processBtn.disabled = this.uploadedFiles.length === 0;
    }

    async processFiles() {
        const processBtn = document.getElementById('processBtn');
        const fileItems = document.querySelectorAll('.file-item');
        
        if (this.uploadedFiles.length === 0) return;

        processBtn.disabled = true;
        processBtn.innerHTML = '<span class="loading-spinner"></span>Processing...';

        try {
            const formData = new FormData();
            
            // Add all files to form data
            this.uploadedFiles.forEach((file, index) => {
                formData.append('files', file);
            });

            // Update file statuses
            fileItems.forEach(item => {
                const status = item.querySelector('.file-status');
                status.textContent = 'Processing...';
                status.className = 'file-status processing';
            });

            // Send files to backend
            const response = await fetch('/api/process-pdfs', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to process files');
            }

            const result = await response.json();

            if (result.success) {
                // Update file statuses
                fileItems.forEach(item => {
                    const status = item.querySelector('.file-status');
                    status.textContent = 'Completed';
                    status.className = 'file-status completed';
                });

                // Load the extracted data
                this.data = result.data;
                this.processData();
                this.showAnalysisSection();
            } else {
                throw new Error(result.error || 'Processing failed');
            }

        } catch (error) {
            console.error('Error processing files:', error);
            
            // Update file statuses to error
            fileItems.forEach(item => {
                const status = item.querySelector('.file-status');
                status.textContent = 'Error';
                status.className = 'file-status error';
            });

            alert('Error processing files: ' + error.message);
        } finally {
            processBtn.disabled = false;
            processBtn.innerHTML = 'Process Files';
        }
    }

    processData() {
        this.filteredData = [...this.data];
        this.designations.clear();
        this.departments.clear();

        // Collect unique designations and departments
        this.data.forEach(item => {
            if (item['Designation']) this.designations.add(item['Designation']);
            if (item['Group']) this.departments.add(item['Group']);
        });

        this.sortData();
        this.populateFilters();
        this.renderTable();
        this.updateSummaryStats();
        this.updateTitle();
    }

    showAnalysisSection() {
        document.getElementById('analysisSection').classList.remove('hidden');
        
        // Scroll to analysis section
        document.getElementById('analysisSection').scrollIntoView({
            behavior: 'smooth'
        });
    }

    sortData() {
        const monthOrder = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        this.data.sort((a, b) => {
            const yearA = parseInt(a.Year, 10);
            const yearB = parseInt(b.Year, 10);
            const monthA = monthOrder.indexOf(a.Month);
            const monthB = monthOrder.indexOf(b.Month);

            if (yearA !== yearB) {
                return yearB - yearA;
            }
            return monthB - monthA;
        });

        this.filteredData = [...this.data];
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return; // Skip if elements don't exist yet

        searchInput.addEventListener('input', () => {
            this.handleSearchInput();
        });

        searchInput.addEventListener('keydown', (e) => {
            let autocompleteList = document.getElementById('autocomplete-list');
            if (autocompleteList) {
                let items = autocompleteList.getElementsByTagName('div');
                
                if (e.key === 'ArrowDown') {
                    this.currentFocus++;
                    this.addActive(items);
                    e.preventDefault();
                } else if (e.key === 'ArrowUp') {
                    this.currentFocus--;
                    this.addActive(items);
                    e.preventDefault();
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (this.currentFocus > -1 && items) {
                        items[this.currentFocus].click();
                    } else {
                        this.applyFilters();
                    }
                }
            } else if (e.key === 'Enter') {
                this.applyFilters();
            }
        });

        document.getElementById('searchBtn')?.addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('exportCsvBtn')?.addEventListener('click', () => {
            this.exportToCSV();
        });

        document.getElementById('exportPdfBtn')?.addEventListener('click', () => {
            this.exportToPDF();
        });

        document.getElementById('exportPdfDetailedBtn')?.addEventListener('click', () => {
            this.exportToPDFDetailed();
        });

        document.getElementById('monthFilter')?.addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('yearFilter')?.addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('designationFilter')?.addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('departmentFilter')?.addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('resetFilters')?.addEventListener('click', () => {
            this.resetFilters();
        });

        // Close autocomplete when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target !== searchInput) {
                this.closeAutocomplete();
            }
        });
    }

    handleSearchInput() {
        const searchInput = document.getElementById('searchInput');
        // Convert input to uppercase
        searchInput.value = searchInput.value.toUpperCase();
        const val = searchInput.value;
        
        // Close any already open lists of autocompleted values
        this.closeAutocomplete();
        
        if (!val) {
            this.applyFilters();
            return false;
        }
        
        this.currentFocus = -1;
        
        // Create a DIV element that will contain the items (values):
        const autocompleteList = document.createElement('div');
        autocompleteList.setAttribute('id', 'autocomplete-list');
        autocompleteList.setAttribute('class', 'autocomplete-items');
        
        // Append the DIV element as a child of the autocomplete container:
        searchInput.parentNode.appendChild(autocompleteList);
        
        // Get matching names (limit to 3)
        const matches = this.getMatchingNames(val.toLowerCase()).slice(0, 3);
        
        // For each item in the array...
        for (let i = 0; i < matches.length; i++) {
            // Create a DIV element for each matching element:
            const item = document.createElement('div');
            
            // Make the matching letters bold:
            const regex = new RegExp(`(${val})`, 'gi');
            item.innerHTML = matches[i].replace(regex, '<strong>$1</strong>');
            
            // Insert a input field that will hold the current array item's value:
            item.innerHTML += `<input type='hidden' value='${matches[i]}'>`;
            
            // Execute a function when someone clicks on the item value (DIV element):
            item.addEventListener('click', (e) => {
                // Insert the value for the autocomplete text field:
                searchInput.value = e.target.getElementsByTagName('input')[0].value;
                
                // Close the list of autocompleted values,
                this.closeAutocomplete();
                
                // Apply filters with the selected name
                this.applyFilters();
            });
            
            autocompleteList.appendChild(item);
        }
    }

    getMatchingNames(searchTerm) {
        const matches = [];
        const seen = new Set();
        
        for (let i = 0; i < this.data.length; i++) {
            const name = this.data[i]['Name'];
            if (name && name.toLowerCase().includes(searchTerm)) {
                if (!seen.has(name)) {
                    matches.push(name);
                    seen.add(name);
                }
            }
        }
        
        return matches;
    }

    closeAutocomplete() {
        const autocompleteList = document.getElementById('autocomplete-list');
        if (autocompleteList) {
            autocompleteList.parentNode.removeChild(autocompleteList);
        }
        this.currentFocus = -1;
    }

    addActive(items) {
        if (!items) return false;
        
        // Remove all active classes:
        for (let i = 0; i < items.length; i++) {
            items[i].classList.remove('autocomplete-active');
        }
        
        // Add active class to the current item:
        if (this.currentFocus >= items.length) this.currentFocus = 0;
        if (this.currentFocus < 0) this.currentFocus = (items.length - 1);
        
        items[this.currentFocus].classList.add('autocomplete-active');
    }

    exportToCSV() {
        // Define all columns including breakdowns
        const allowanceFields = ['DA', 'HRA', 'IR', 'SFN', 'SPAY-TYPIST', 'P'];
        const deductionFields = ['IT', 'PT', 'GSLIC', 'LIC', 'FBF'];
        
        // Create CSV header
        let csvContent = "Name,Designation,Department,Month,Year,Basic Pay";
        
        // Add allowance headers
        allowanceFields.forEach(field => {
            csvContent += `,${field}`;
        });
        
        // Add gross salary
        csvContent += ",Gross Salary";
        
        // Add deduction headers
        deductionFields.forEach(field => {
            csvContent += `,${field}`;
        });
        
        // Add total deductions and net salary
        csvContent += ",Total Deductions,Net Salary\n";
        
        // Add data rows
        this.filteredData.forEach(item => {
            // Start with basic info
            let row = [
                `"${item['Name']}"`,
                `"${item['Designation']}"`,
                `"${item['Group'] || 'N/A'}"`,
                `"${item['Month']}"`,
                `"${item['Year']}"`,
                `"${item['Basic']}"`
            ];
            
            // Add allowance values
            allowanceFields.forEach(field => {
                row.push(`"${item[field] || 0}"`);
            });
            
            // Add gross salary
            row.push(`"${item['Gross Salary']}"`);
            
            // Add deduction values
            deductionFields.forEach(field => {
                row.push(`"${item[field] || 0}"`);
            });
            
            // Add total deductions and net salary
            row.push(`"${item['Total Deductions']}"`);
            row.push(`"${item['Net Salary']}"`);
            
            csvContent += row.join(",") + "\n";
        });
        
        // Add total row
        const totals = this.calculateTotals();
        
        // Calculate allowance and deduction totals
        const allowanceTotals = {};
        const deductionTotals = {};
        
        allowanceFields.forEach(field => {
            allowanceTotals[field] = 0;
        });
        
        deductionFields.forEach(field => {
            deductionTotals[field] = 0;
        });
        
        this.filteredData.forEach(item => {
            allowanceFields.forEach(field => {
                allowanceTotals[field] += (item[field] || 0);
            });
            
            deductionFields.forEach(field => {
                deductionTotals[field] += (item[field] || 0);
            });
        });
        
        // Create total row
        let totalRow = [
            `"Total"`,
            `"${this.filteredData.length}"`,
            `""`,
            `""`,
            `""`,
            `"${totals.basic}"`
        ];
        
        // Add allowance totals
        allowanceFields.forEach(field => {
            totalRow.push(`"${Math.round(allowanceTotals[field])}"`);
        });
        
        // Add gross salary total
        totalRow.push(`"${totals.gross}"`);
        
        // Add deduction totals
        deductionFields.forEach(field => {
            totalRow.push(`"${Math.round(deductionTotals[field])}"`);
        });
        
        // Add total deductions and net salary
        totalRow.push(`"${totals.deductions}"`);
        totalRow.push(`"${totals.net}"`);
        
        csvContent += totalRow.join(",") + "\n";
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "salary_data_detailed.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    exportToPDF() {
        // Show loading message
        const originalText = document.getElementById('exportPdfBtn').textContent;
        document.getElementById('exportPdfBtn').textContent = 'Generating PDF...';
        document.getElementById('exportPdfBtn').disabled = true;
        
        // Use a timeout to allow UI to update before generating PDF
        setTimeout(() => {
            try {
                // Create a new window for the printable content
                const printWindow = window.open('', '_blank');
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Salary Data</title>
                        <style>
                            @page {
                                size: landscape;
                                margin: 10mm;
                            }
                            body {
                                font-family: 'Inter', Arial, sans-serif;
                                font-size: 10px;
                                color: #000;
                                margin: 15px;
                                line-height: 1.3;
                            }
                            table {
                                width: 100%;
                                border-collapse: collapse;
                                margin-bottom: 20px;
                                table-layout: fixed;
                            }
                            /* Optimized column widths for basic table */
                            th:nth-child(1), td:nth-child(1) { width: 20%; } /* Name */
                            th:nth-child(2), td:nth-child(2) { width: 15%; } /* Designation */
                            th:nth-child(3), td:nth-child(3) { width: 8%; } /* Department */
                            th:nth-child(4), td:nth-child(4) { width: 8%; } /* Month */
                            th:nth-child(5), td:nth-child(5) { width: 6%; } /* Year */
                            th:nth-child(6), td:nth-child(6) { width: 10%; } /* Basic Pay */
                            th:nth-child(7), td:nth-child(7) { width: 11%; } /* Gross Salary */
                            th:nth-child(8), td:nth-child(8) { width: 11%; } /* Total Deductions */
                            th:nth-child(9), td:nth-child(9) { width: 11%; } /* Net Salary */
                            
                            th, td {
                                border: 1px solid #333;
                                padding: 6px 8px;
                                text-align: left;
                                font-size: 9px;
                                overflow: hidden;
                                text-overflow: ellipsis;
                                vertical-align: top;
                            }
                            th {
                                background-color: #f0f0f0;
                                font-weight: bold;
                                font-size: 9px;
                                text-align: center;
                            }
                            /* Right align numeric columns */
                            th:nth-child(n+6), td:nth-child(n+6) {
                                text-align: right;
                            }
                            /* Left align name and designation */
                            th:nth-child(1), td:nth-child(1),
                            th:nth-child(2), td:nth-child(2) {
                                text-align: left;
                            }
                            /* Allow names to wrap */
                            td:nth-child(1) {
                                white-space: normal;
                                word-wrap: break-word;
                                max-width: 0;
                            }
                            tfoot td {
                                font-weight: bold;
                                background-color: #f0f0f0;
                                font-size: 9px;
                            }
                            h1 {
                                text-align: center;
                                margin-bottom: 15px;
                                font-size: 16px;
                                font-weight: bold;
                            }
                            .summary {
                                margin-bottom: 15px;
                                font-size: 10px;
                                text-align: center;
                            }
                            .summary div {
                                display: inline-block;
                                margin-right: 30px;
                            }
                        </style>
                    </head>
                    <body>
                        <h1>SMP Salary Board Report</h1>
                        <div class="summary">
                            <div><strong>Report Generated:</strong> ${new Date().toLocaleDateString()}</div>
                            <div><strong>Total Employees:</strong> ${this.filteredData.length}</div>
                        </div>
                        ${this.generatePrintableTableBasic()}
                    </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                
                // Wait for content to load then print
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 500);
            } catch (error) {
                console.error('Error generating PDF:', error);
                alert('Error generating PDF. Please try again.');
            } finally {
                // Restore button
                document.getElementById('exportPdfBtn').textContent = originalText;
                document.getElementById('exportPdfBtn').disabled = false;
            }
        }, 100);
    }

    exportToPDFDetailed() {
        // Show loading message
        const originalText = document.getElementById('exportPdfDetailedBtn').textContent;
        document.getElementById('exportPdfDetailedBtn').textContent = 'Generating PDF...';
        document.getElementById('exportPdfDetailedBtn').disabled = true;
        
        // Use a timeout to allow UI to update before generating PDF
        setTimeout(() => {
            try {
                // Create a new window for the printable content
                const printWindow = window.open('', '_blank');
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Salary Data - Detailed</title>
                        <style>
                            @page {
                                size: landscape;
                                margin: 5mm;
                            }
                            body {
                                font-family: 'Inter', Arial, sans-serif;
                                font-size: 8px;
                                color: #000;
                                margin: 5px;
                                line-height: 1.3;
                            }
                            .container {
                                width: 100%;
                                max-width: 100%;
                            }
                            table {
                                width: 100%;
                                border-collapse: collapse;
                                margin-bottom: 15px;
                                table-layout: fixed;
                            }
                            /* Optimized column widths for detailed table */
                            th:nth-child(1), td:nth-child(1) { width: 12%; } /* Name */
                            th:nth-child(2), td:nth-child(2) { width: 8%; } /* Designation */
                            th:nth-child(3), td:nth-child(3) { width: 4%; } /* Department */
                            th:nth-child(4), td:nth-child(4) { width: 5%; } /* Month */
                            th:nth-child(5), td:nth-child(5) { width: 4%; } /* Year */
                            th:nth-child(6), td:nth-child(6) { width: 6%; } /* Basic Pay */
                            th:nth-child(7), td:nth-child(7) { width: 4%; } /* DA */
                            th:nth-child(8), td:nth-child(8) { width: 4%; } /* HRA */
                            th:nth-child(9), td:nth-child(9) { width: 3%; } /* IR */
                            th:nth-child(10), td:nth-child(10) { width: 3%; } /* SFN */
                            th:nth-child(11), td:nth-child(11) { width: 6%; } /* SPAY-TYPIST */
                            th:nth-child(12), td:nth-child(12) { width: 3%; } /* P */
                            th:nth-child(13), td:nth-child(13) { width: 6%; } /* Gross Salary */
                            th:nth-child(14), td:nth-child(14) { width: 3%; } /* IT */
                            th:nth-child(15), td:nth-child(15) { width: 3%; } /* PT */
                            th:nth-child(16), td:nth-child(16) { width: 4%; } /* GSLIC */
                            th:nth-child(17), td:nth-child(17) { width: 3%; } /* LIC */
                            th:nth-child(18), td:nth-child(18) { width: 3%; } /* FBF */
                            th:nth-child(19), td:nth-child(19) { width: 6%; } /* Total Deductions */
                            th:nth-child(20), td:nth-child(20) { width: 6%; } /* Net Salary */
                            
                            th, td {
                                border: 1px solid #333;
                                padding: 3px 4px;
                                text-align: left;
                                font-size: 7px;
                                overflow: hidden;
                                text-overflow: ellipsis;
                                vertical-align: top;
                                word-wrap: break-word;
                                hyphens: auto;
                                line-height: 1.2;
                            }
                            th {
                                background-color: #f0f0f0;
                                font-weight: bold;
                                font-size: 7px;
                                text-align: center;
                                white-space: nowrap;
                            }
                            /* Right align numeric columns */
                            th:nth-child(n+6), td:nth-child(n+6) {
                                text-align: right;
                            }
                            /* Left align name and designation */
                            th:nth-child(1), td:nth-child(1),
                            th:nth-child(2), td:nth-child(2) {
                                text-align: left;
                            }
                            /* Allowance columns background */
                            th:nth-child(n+7):nth-child(-n+12), 
                            td:nth-child(n+7):nth-child(-n+12) {
                                background-color: #f9f9f9;
                            }
                            /* Deduction columns background */
                            th:nth-child(n+14):nth-child(-n+18), 
                            td:nth-child(n+14):nth-child(-n+18) {
                                background-color: #fff2f2;
                            }
                            tfoot td {
                                font-weight: bold;
                                background-color: #f0f0f0;
                                font-size: 8px;
                            }
                            h1 {
                                text-align: center;
                                margin-bottom: 10px;
                                font-size: 14px;
                                font-weight: bold;
                            }
                            .summary {
                                margin-bottom: 10px;
                                font-size: 9px;
                                text-align: center;
                            }
                            .summary div {
                                display: inline-block;
                                margin-right: 20px;
                            }
                            /* Ensure names don't get cut off */
                            td:nth-child(1) {
                                white-space: normal;
                                word-wrap: break-word;
                                max-width: 0;
                                font-size: 7px;
                                line-height: 1.3;
                            }
                            /* Make numeric values more readable */
                            td:nth-child(n+6) {
                                font-size: 7px;
                                font-weight: 500;
                            }
                        </style>
                    </head>
                    <body>
                        <h1>SMP Salary Board Report - Detailed</h1>
                        <div class="summary">
                            <div><strong>Report Generated:</strong> ${new Date().toLocaleDateString()}</div>
                            <div><strong>Total Employees:</strong> ${this.filteredData.length}</div>
                        </div>
                        <div class="container">
                            ${this.generatePrintableTable()}
                        </div>
                    </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                
                // Wait for content to load then print
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 500);
            } catch (error) {
                console.error('Error generating detailed PDF:', error);
                alert('Error generating detailed PDF. Please try again.');
            } finally {
                // Restore button
                document.getElementById('exportPdfDetailedBtn').textContent = originalText;
                document.getElementById('exportPdfDetailedBtn').disabled = false;
            }
        }, 100);
    }

    generatePrintableTableBasic() {
        // Start table
        let tableHtml = '<table><thead><tr>';
        
        // Add headers (same as UI table)
        const headers = ['Name', 'Designation', 'Department', 'Month', 'Year', 'Basic Pay', 'Gross Salary', 'Total Deductions', 'Net Salary'];
        headers.forEach(header => {
            tableHtml += `<th>${header}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';
        
        // Add data rows
        this.filteredData.forEach(item => {
            tableHtml += '<tr>';
            tableHtml += `<td>${item['Name']}</td>`;
            tableHtml += `<td>${item['Designation']}</td>`;
            tableHtml += `<td>${item['Group'] || 'N/A'}</td>`;
            tableHtml += `<td>${item['Month']}</td>`;
            tableHtml += `<td>${item['Year']}</td>`;
            tableHtml += `<td>₹${item['Basic'].toLocaleString('en-IN')}</td>`;
            tableHtml += `<td>₹${item['Gross Salary'].toLocaleString('en-IN')}</td>`;
            tableHtml += `<td>₹${item['Total Deductions'].toLocaleString('en-IN')}</td>`;
            tableHtml += `<td>₹${item['Net Salary'].toLocaleString('en-IN')}</td>`;
            tableHtml += '</tr>';
        });
        
        // Add total row
        tableHtml += '</tbody><tfoot><tr>';
        const totals = this.calculateTotals();
        tableHtml += `<td><strong>Total</strong></td>`;
        tableHtml += `<td><strong>${this.filteredData.length}</strong></td>`;
        tableHtml += `<td colspan="3"></td>`;
        tableHtml += `<td><strong>₹${totals.basic.toLocaleString('en-IN')}</strong></td>`;
        tableHtml += `<td><strong>₹${totals.gross.toLocaleString('en-IN')}</strong></td>`;
        tableHtml += `<td><strong>₹${totals.deductions.toLocaleString('en-IN')}</strong></td>`;
        tableHtml += `<td><strong>₹${totals.net.toLocaleString('en-IN')}</strong></td>`;
        tableHtml += '</tr></tfoot></table>';
        
        return tableHtml;
    }

    generatePrintableTable() {
        // Define all columns including breakdowns
        const allowanceFields = ['DA', 'HRA', 'IR', 'SFN', 'SPAY-TYPIST', 'P'];
        const deductionFields = ['IT', 'PT', 'GSLIC', 'LIC', 'FBF'];
        
        // Start table
        let tableHtml = '<table><thead><tr>';
        
        // Add basic headers
        const basicHeaders = ['Name', 'Designation', 'Department', 'Month', 'Year', 'Basic Pay'];
        basicHeaders.forEach(header => {
            tableHtml += `<th>${header}</th>`;
        });
        
        // Add allowance headers
        allowanceFields.forEach(field => {
            tableHtml += `<th>${field}</th>`;
        });
        
        // Add gross salary
        tableHtml += `<th>Gross Salary</th>`;
        
        // Add deduction headers
        deductionFields.forEach(field => {
            tableHtml += `<th>${field}</th>`;
        });
        
        // Add total deductions and net salary
        tableHtml += `<th>Total Deductions</th>`;
        tableHtml += `<th>Net Salary</th>`;
        tableHtml += '</tr></thead><tbody>';
        
        // Add data rows
        this.filteredData.forEach(item => {
            tableHtml += '<tr>';
            tableHtml += `<td>${item['Name']}</td>`;
            tableHtml += `<td>${item['Designation']}</td>`;
            tableHtml += `<td>${item['Group'] || 'N/A'}</td>`;
            tableHtml += `<td>${item['Month']}</td>`;
            tableHtml += `<td>${item['Year']}</td>`;
            tableHtml += `<td>₹${item['Basic'].toLocaleString('en-IN')}</td>`;
            
            // Add allowance values
            allowanceFields.forEach(field => {
                tableHtml += `<td>₹${(item[field] || 0).toLocaleString('en-IN')}</td>`;
            });
            
            // Add gross salary
            tableHtml += `<td>₹${item['Gross Salary'].toLocaleString('en-IN')}</td>`;
            
            // Add deduction values
            deductionFields.forEach(field => {
                tableHtml += `<td>₹${(item[field] || 0).toLocaleString('en-IN')}</td>`;
            });
            
            // Add total deductions and net salary
            tableHtml += `<td>₹${item['Total Deductions'].toLocaleString('en-IN')}</td>`;
            tableHtml += `<td>₹${item['Net Salary'].toLocaleString('en-IN')}</td>`;
            tableHtml += '</tr>';
        });
        
        // Add total row
        tableHtml += '</tbody><tfoot><tr>';
        const totals = this.calculateTotals();
        
        // Calculate allowance and deduction totals
        const allowanceTotals = {};
        const deductionTotals = {};
        
        allowanceFields.forEach(field => {
            allowanceTotals[field] = 0;
        });
        
        deductionFields.forEach(field => {
            deductionTotals[field] = 0;
        });
        
        this.filteredData.forEach(item => {
            allowanceFields.forEach(field => {
                allowanceTotals[field] += (item[field] || 0);
            });
            
            deductionFields.forEach(field => {
                deductionTotals[field] += (item[field] || 0);
            });
        });
        
        tableHtml += `<td><strong>Total</strong></td>`;
        tableHtml += `<td><strong>${this.filteredData.length}</strong></td>`;
        tableHtml += `<td colspan="3"></td>`;
        tableHtml += `<td><strong>₹${totals.basic.toLocaleString('en-IN')}</strong></td>`;
        
        // Add allowance totals
        allowanceFields.forEach(field => {
            tableHtml += `<td><strong>₹${Math.round(allowanceTotals[field]).toLocaleString('en-IN')}</strong></td>`;
        });
        
        // Add gross salary total
        tableHtml += `<td><strong>₹${totals.gross.toLocaleString('en-IN')}</strong></td>`;
        
        // Add deduction totals
        deductionFields.forEach(field => {
            tableHtml += `<td><strong>₹${Math.round(deductionTotals[field]).toLocaleString('en-IN')}</strong></td>`;
        });
        
        // Add total deductions and net salary
        tableHtml += `<td><strong>₹${totals.deductions.toLocaleString('en-IN')}</strong></td>`;
        tableHtml += `<td><strong>₹${totals.net.toLocaleString('en-IN')}</strong></td>`;
        tableHtml += '</tr></tfoot></table>';
        
        return tableHtml;
    }

    populateFilters() {
        const designationFilter = document.getElementById('designationFilter');
        const departmentFilter = document.getElementById('departmentFilter');

        if (!designationFilter || !departmentFilter) return;

        // Clear existing options (except first)
        designationFilter.innerHTML = '<option value="">All Designations</option>';
        departmentFilter.innerHTML = '<option value="">All Departments</option>';

        // Populate designations
        Array.from(this.designations)
            .sort()
            .forEach(designation => {
                const option = document.createElement('option');
                option.value = designation;
                option.textContent = designation;
                designationFilter.appendChild(option);
            });

        // Populate departments
        Array.from(this.departments)
            .sort()
            .forEach(department => {
                const option = document.createElement('option');
                option.value = department;
                option.textContent = department;
                departmentFilter.appendChild(option);
            });
    }

    applyFilters() {
        const searchInput = document.getElementById('searchInput');
        const monthFilter = document.getElementById('monthFilter');
        const yearFilter = document.getElementById('yearFilter');
        const designationFilter = document.getElementById('designationFilter');
        const departmentFilter = document.getElementById('departmentFilter');

        if (!searchInput) return;

        const searchTerm = searchInput.value.toLowerCase();
        const monthValue = monthFilter?.value || '';
        const yearValue = yearFilter?.value || '';
        const designationValue = designationFilter?.value || '';
        const departmentValue = departmentFilter?.value || '';

        this.filteredData = this.data.filter(item => {
            // Search filter
            if (searchTerm && 
                !item['Name'].toLowerCase().includes(searchTerm) &&
                !item['Designation'].toLowerCase().includes(searchTerm) &&
                !(item['Group'] || '').toLowerCase().includes(searchTerm)) {
                return false;
            }

            // Month filter
            if (monthValue && item['Month'] !== monthValue) {
                return false;
            }

            // Year filter
            if (yearValue && item['Year'] !== yearValue) {
                return false;
            }

            // Designation filter
            if (designationValue && item['Designation'] !== designationValue) {
                return false;
            }

            // Department filter
            if (departmentValue && (item['Group'] || '') !== departmentValue) {
                return false;
            }

            return true;
        });

        this.renderTable();
        this.updateSummaryStats();
    }

    resetFilters() {
        const searchInput = document.getElementById('searchInput');
        const monthFilter = document.getElementById('monthFilter');
        const yearFilter = document.getElementById('yearFilter');
        const designationFilter = document.getElementById('designationFilter');
        const departmentFilter = document.getElementById('departmentFilter');

        if (searchInput) searchInput.value = '';
        if (monthFilter) monthFilter.value = '';
        if (yearFilter) yearFilter.value = '';
        if (designationFilter) designationFilter.value = '';
        if (departmentFilter) departmentFilter.value = '';
        
        this.filteredData = [...this.data];
        this.renderTable();
        this.updateSummaryStats();
    }

    renderTable() {
        const tableBody = document.getElementById('tableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        let table = document.getElementById('salaryTable');
        let tfoot = table.querySelector('tfoot');
        if (tfoot) {
            tfoot.remove();
        }

        // Render all rows
        for (let i = 0; i < this.filteredData.length; i++) {
            const item = this.filteredData[i];
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td class="employee-name">${item['Name']}</td>
                <td>${item['Designation']}</td>
                <td>${item['Group'] || 'N/A'}</td>
                <td>${item['Month']}</td>
                <td>${item['Year']}</td>
                <td>₹${item['Basic'].toLocaleString('en-IN')}</td>
                <td>₹${item['Gross Salary'].toLocaleString('en-IN')}</td>
                <td>₹${item['Total Deductions'].toLocaleString('en-IN')}</td>
                <td>₹${item['Net Salary'].toLocaleString('en-IN')}</td>
            `;

            row.querySelector('.employee-name').addEventListener('click', () => this.showPopup(item));
            
            tableBody.appendChild(row);
        }

        // Add total row
        tfoot = document.createElement('tfoot');
        const totalRow = document.createElement('tr');
        const totals = this.calculateTotals();
        totalRow.innerHTML = `
            <td><strong>Total</strong></td>
            <td><strong>${this.filteredData.length}</strong></td>
            <td colspan="3"></td>
            <td><strong>₹${totals.basic.toLocaleString('en-IN')}</strong></td>
            <td><strong>₹${totals.gross.toLocaleString('en-IN')}</strong></td>
            <td><strong>₹${totals.deductions.toLocaleString('en-IN')}</strong></td>
            <td><strong>₹${totals.net.toLocaleString('en-IN')}</strong></td>
        `;
        tfoot.appendChild(totalRow);
        table.appendChild(tfoot);
        
        // Ensure proper table layout
        setTimeout(() => {
            table.style.display = 'table';
        }, 0);
    }

    calculateTotals() {
        const totals = {
            basic: 0,
            gross: 0,
            deductions: 0,
            net: 0,
        };

        this.filteredData.forEach(item => {
            totals.basic += item['Basic'] || 0;
            totals.gross += item['Gross Salary'] || 0;
            totals.deductions += item['Total Deductions'] || 0;
            totals.net += item['Net Salary'] || 0;
        });

        return {
            basic: Math.round(totals.basic),
            gross: Math.round(totals.gross),
            deductions: Math.round(totals.deductions),
            net: Math.round(totals.net),
        };
    }

    updateSummaryStats() {
        const totalEmployeesElement = document.getElementById('totalEmployees');
        if (!totalEmployeesElement) return;

        const totalEmployees = this.filteredData.length;
        totalEmployeesElement.textContent = totalEmployees.toLocaleString('en-IN');

        const allowanceFields = ['DA', 'HRA', 'IR', 'SFN', 'SPAY-TYPIST', 'P'];
        const deductionFields = ['IT', 'PT', 'GSLIC', 'LIC', 'FBF'];

        const totals = {
            allowances: {},
            deductions: {},
        };

        allowanceFields.forEach(field => totals.allowances[field] = 0);
        deductionFields.forEach(field => totals.deductions[field] = 0);

        let totalAllowances = 0;
        let totalDeductions = 0;

        this.filteredData.forEach(item => {
            allowanceFields.forEach(field => {
                const value = item[field] || 0;
                totals.allowances[field] += value;
                totalAllowances += value;
            });
            deductionFields.forEach(field => {
                const value = item[field] || 0;
                totals.deductions[field] += value;
                totalDeductions += value;
            });
        });

        const totalAllowancesElement = document.getElementById('totalAllowances');
        const totalDeductionsElement = document.getElementById('totalDeductions');
        if (totalAllowancesElement) totalAllowancesElement.textContent = `₹${Math.round(totalAllowances).toLocaleString('en-IN')}`;
        if (totalDeductionsElement) totalDeductionsElement.textContent = `₹${Math.round(totalDeductions).toLocaleString('en-IN')}`;

        const allowancesBreakdown = document.getElementById('allowancesBreakdown');
        const deductionsBreakdown = document.getElementById('deductionsBreakdown');
        
        if (allowancesBreakdown) {
            allowancesBreakdown.innerHTML = '';
            for (const [key, value] of Object.entries(totals.allowances)) {
                if (value > 0) {
                    const p = document.createElement('p');
                    p.innerHTML = `<strong>${key}:</strong> ₹${Math.round(value).toLocaleString('en-IN')}`;
                    allowancesBreakdown.appendChild(p);
                }
            }
        }

        if (deductionsBreakdown) {
            deductionsBreakdown.innerHTML = '';
            for (const [key, value] of Object.entries(totals.deductions)) {
                if (value > 0) {
                    const p = document.createElement('p');
                    p.innerHTML = `<strong>${key}:</strong> ₹${Math.round(value).toLocaleString('en-IN')}`;
                    deductionsBreakdown.appendChild(p);
                }
            }
        }
    }

    updateTitle() {
        const salaryPeriod = document.getElementById('salaryPeriod');
        if (!salaryPeriod) return;

        if (this.data.length > 0) {
            const first = this.data[0];
            const last = this.data[this.data.length - 1];
            salaryPeriod.textContent = `Salary Data: ${last.Month} ${last.Year} - ${first.Month} ${first.Year}`;
        }
    }

    showPopup(item) {
        const popup = document.getElementById('popup');
        const isVisible = popup.style.display === 'block';

        if (isVisible) {
            popup.style.display = 'none';
            document.removeEventListener('click', this.closePopup);
        } else {
            popup.innerHTML = ''; // Clear previous content

            const content = document.createElement('div');
            content.classList.add('popup-content');

            const allowanceFields = ['DA', 'HRA', 'IR', 'SFN', 'SPAY-TYPIST', 'P'];
            const deductionFields = ['IT', 'PT', 'GSLIC', 'LIC', 'FBF'];

            let allowancesHtml = '';
            allowanceFields.forEach(field => {
                if (item[field] > 0) {
                    allowancesHtml += `<p><strong>${field}:</strong> ₹${item[field].toLocaleString('en-IN')}</p>`;
                }
            });

            let deductionsHtml = '';
            deductionFields.forEach(field => {
                if (item[field] > 0) {
                    deductionsHtml += `<p><strong>${field}:</strong> ₹${item[field].toLocaleString('en-IN')}</p>`;
                }
            });

            const daPercentage = ((item.DA / item.Basic) * 100).toFixed(2);
            const hraPercentage = ((item.HRA / item.Basic) * 100).toFixed(2);

            content.innerHTML = `
                <h3>${item.Name}</h3>
                <p><strong>EMP No:</strong> ${item['EMP No']}</p>
                <p><strong>Next Increment:</strong> ${item['Next Increment Date']}</p>
                <p><strong>Designation:</strong> ${item.Designation}</p>
                <p><strong>Department:</strong> ${item.Group || 'N/A'}</p>
                <p><strong>A/C No:</strong> ${item['Bank A/C Number'] || 'N/A'}</p>
                <p><strong>Month:</strong> ${item.Month}</p>
                <p><strong>Year:</strong> ${item.Year}</p>
                <hr>
                <h4>Allowances</h4>
                <p><strong>DA (${daPercentage}%):</strong> ₹${item.DA.toLocaleString('en-IN')}</p>
                <p><strong>HRA (${hraPercentage}%):</strong> ₹${item.HRA.toLocaleString('en-IN')}</p>
                ${allowancesHtml}
                <hr>
                <h4>Deductions</h4>
                ${deductionsHtml}
                <hr>
                <p><strong>Basic Pay:</strong> ₹${item.Basic.toLocaleString('en-IN')}</p>
                <p><strong>Gross Salary:</strong> ₹${item['Gross Salary'].toLocaleString('en-IN')}</p>
                <p><strong>Total Deductions:</strong> ₹${item['Total Deductions'].toLocaleString('en-IN')}</p>
                <p><strong>Net Salary:</strong> ₹${item['Net Salary'].toLocaleString('en-IN')}</p>
            `;

            popup.appendChild(content);
            popup.style.display = 'block';

            this.closePopup = (e) => {
                if (!popup.contains(e.target)) {
                    popup.style.display = 'none';
                    document.removeEventListener('click', this.closePopup);
                }
            };

            setTimeout(() => {
                document.addEventListener('click', this.closePopup);
            }, 0);
        }
    }
}

// Global function to process files
function processFiles() {
    if (window.salaryBoard) {
        window.salaryBoard.processFiles();
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.salaryBoard = new SalaryBoard();
});