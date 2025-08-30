# SMP Salary Analyzer

A modern web application for analyzing salary slip data extracted from PDF files. Transform PDF salary slips into interactive, searchable data with advanced filtering, visualization, and export capabilities.

## Features

### 🚀 **Core Functionality**
- **PDF Upload & Processing**: Drag-and-drop PDF salary slips for automatic data extraction
- **Real-time Analysis**: Immediate data processing and visualization after upload
- **Advanced Search**: Autocomplete search functionality across employee names, designations, and departments
- **Multi-criteria Filtering**: Filter by month, year, designation, and department simultaneously

### 📊 **Data Visualization**
- **Summary Statistics**: Real-time calculation of total employees, allowances, and deductions
- **Interactive Tables**: Sortable, filterable data tables with employee details
- **Employee Profiles**: Click employee names for detailed salary breakdowns including DA/HRA percentages
- **Responsive Design**: Modern dark theme optimized for desktop and mobile devices

### 📄 **Export Options**
- **CSV Export**: Detailed CSV files with all salary components and totals
- **PDF Reports**: 
  - Basic PDF: Clean summary reports
  - Detailed PDF: Comprehensive reports with optimized column layouts and readable fonts
- **Print-ready**: Landscape orientation with proper page margins and typography

### 🔍 **Data Processing**
- **Intelligent Parsing**: Extract salary details from PDF files using advanced regex patterns
- **Data Validation**: Automatic validation and error handling for corrupted or incomplete data
- **Format Standardization**: Consistent data formatting across different PDF layouts

## Installation

### Prerequisites
- Python 3.7 or higher
- pip (Python package installer)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/tejukargal/SMP-Salary-Analyser_Python.git
   cd SMP-Salary-Analyser_Python
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python app.py
   ```

4. **Access the application**
   Open your browser and navigate to: `http://localhost:5000`

## Usage

### Quick Start Guide

1. **Upload PDF Files**
   - Drag and drop PDF salary slips onto the upload area
   - Or click "Choose Files" to select multiple PDF files
   - Supported format: PDF files containing salary slip data

2. **Process Files**
   - Click "Process Files" to extract salary data
   - Wait for processing to complete (status indicators show progress)
   - Files are processed automatically with error handling

3. **Analyze Data**
   - View extracted data in the interactive table
   - Use search bar for quick employee lookup with autocomplete
   - Apply filters by month, year, designation, or department
   - Click employee names for detailed salary breakdowns

4. **Export Results**
   - **CSV**: Download complete data with all allowances and deductions
   - **PDF Basic**: Generate clean summary reports
   - **PDF Detailed**: Create comprehensive reports with optimized formatting

### Advanced Features

- **Real-time Filtering**: Combine multiple filters for precise data analysis
- **Summary Cards**: View total employees, allowances, and deductions at a glance
- **Employee Details**: Click any name to see complete salary breakdown with percentages
- **Responsive Interface**: Seamlessly works on desktop, tablet, and mobile devices

## Project Structure

```
├── app.py                 # Flask web server and API endpoints
├── requirements.txt       # Python dependencies
├── templates/
│   └── index.html        # Main web interface
├── static/
│   ├── css/
│   │   └── styles.css    # Modern dark theme styling
│   └── js/
│       └── script.js     # Interactive functionality and PDF generation
└── uploads/              # Temporary PDF storage directory
```

## Technology Stack

- **Backend**: Flask (Python web framework)
- **PDF Processing**: pdfplumber (PDF text extraction)
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Modern CSS with CSS Grid and Flexbox
- **Data Handling**: Pandas (data manipulation)
- **Export**: Native browser printing for PDF generation

## Dependencies

```
flask>=3.1.2
flask-cors>=6.0.1
pandas>=2.1.4
pdfplumber>=0.11.7
xlsxwriter>=3.2.5
openpyxl>=3.1.5
python-dateutil>=2.8.2
```

## Browser Compatibility

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Author

**Teju SMP**
- GitHub: [@tejukargal](https://github.com/tejukargal)

## Acknowledgments

- Built with Flask and modern web technologies
- PDF processing powered by pdfplumber
- Responsive design with CSS Grid and Flexbox
- Interactive features using vanilla JavaScript

---

*Transform your PDF salary slips into actionable insights with SMP Salary Analyzer!*