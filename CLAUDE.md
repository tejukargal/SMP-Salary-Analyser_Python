# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Application
```bash
python app.py
```
The Flask application runs on `http://localhost:5000` by default.

### Virtual Environment Setup
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Environment Variables
- `FLASK_ENV`: Set to 'development', 'production', or 'testing' (defaults to 'development')
- `SECRET_KEY`: Flask secret key for sessions (required in production)
- `UPLOAD_FOLDER`: Directory for PDF uploads (defaults to 'uploads')
- `MAX_CONTENT_LENGTH`: Maximum file upload size in bytes (defaults to 16MB)

## Architecture Overview

### Core Components
- **Flask Backend** (`app.py`): Main application server with PDF processing logic
- **Configuration System** (`config.py`): Environment-based configuration management
- **Frontend** (`templates/index.html`): Single-page application with drag-and-drop PDF upload
- **Static Assets**: Modern CSS (`static/css/styles.css`) and JavaScript (`static/js/script.js`)

### PDF Processing Pipeline
1. **Upload**: Multiple PDF files via drag-and-drop or file picker
2. **Extraction**: Uses `pdfplumber` to extract salary data with regex patterns
3. **Parsing**: Complex regex patterns extract employee details, allowances, and deductions
4. **Analysis**: Real-time data processing with filtering and search capabilities
5. **Export**: CSV and PDF report generation with detailed formatting

### Data Structure
The application extracts salary slip data into standardized records with fields:
- **Employee Info**: EMP No, Name, Designation, Pay Scale, DDO Code, Group
- **Time Data**: Month, Year, Days Worked, Next Increment Date
- **Financial Data**: Basic pay, allowances (DA, HRA, IR, SFN, P, SPAY-TYPIST), deductions (IT, PT, GSLIC, LIC, FBF)
- **Summary**: Gross Salary, Net Salary, Total Deductions, Bank A/C Number

### Key Features
- **Intelligent PDF Parsing**: Regex-based extraction handles various PDF salary slip formats
- **Real-time Search**: Autocomplete functionality across employee names, designations, departments
- **Advanced Filtering**: Multi-criteria filtering by month, year, designation, department
- **Export Options**: CSV export and PDF report generation (basic and detailed)
- **Responsive UI**: Modern dark theme with CSS Grid and Flexbox

### File Upload Flow
- Files are uploaded to the `uploads/` directory
- Each PDF is processed using `extract_salary_details()` function
- Extracted data is returned as JSON to the frontend
- Failed files are tracked and reported to users

### Configuration Management
Uses Flask configuration classes:
- `DevelopmentConfig`: Debug enabled, local development
- `ProductionConfig`: Debug disabled, uses environment variables
- `TestingConfig`: Testing-specific settings

The application automatically creates the upload directory and handles file validation for PDF-only uploads.

### Frontend Architecture
Single-page application with:
- Drag-and-drop PDF upload interface
- Real-time data tables with sorting and filtering
- Interactive employee detail modals
- Export functionality for CSV and PDF reports
- Responsive design optimized for desktop and mobile

### Dependencies
- **Flask 3.1.2+**: Web framework
- **pdfplumber**: PDF text extraction
- **pandas**: Data manipulation
- **flask-cors**: Cross-origin resource sharing
- **xlsxwriter/openpyxl**: Excel export capabilities