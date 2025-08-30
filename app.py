from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import pandas as pd
import pdfplumber
import re
import os
import json
from datetime import datetime
from werkzeug.utils import secure_filename

from config import config

app = Flask(__name__)
CORS(app)

# Load configuration
config_name = os.environ.get('FLASK_ENV', 'development')
app.config.from_object(config[config_name])

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def extract_salary_details(pdf_path):
    """
    Extract salary details from PDF and return as a list of dictionaries
    """
    salary_records = []
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                
                # Split text into salary slip sections
                salary_slips = re.split(r'SNO:\s+\d+', text)
                
                for slip in salary_slips[1:]:  # Skip first empty split
                    record = {}
                    
                    # Basic Details
                    emp_no_match = re.search(r'EMP No\s+(\d+)', slip)
                    name_match = re.search(r'Sri\s*/\s*Smt:?\s*([A-Z][A-Z\s\.]+)(?=\s*Days Worked|Designation|\s*PAN)', slip)
                    designation_match = re.search(r'Designation:?\s*([A-Z][A-Z\s\(\)]+)(?=\s*Pay Scale|Group|\s*Basic)', slip)
                    pay_scale_match = re.search(r'Pay Scale\s*:\s*(\d+)-(\d+)', slip)
                    ddo_code_match = re.search(r'DDO Code\s*:\s*(\w+)', slip)
                    days_worked_match = re.search(r'Days Worked:\s*(\d+)', slip)
                    next_increment_match = re.search(r'Next Increment Date:\s*([A-Za-z]+\s+\d{4})', slip)
                    group_match = re.search(r'Group\s*:\s*([A-Z])', slip)
                    
                    # Extract Pay Details
                    basic_match = re.search(r'Basic\s*:\s*(\d+)', slip)
                    
                    # Allowances
                    da_match = re.search(r'DA\s+(\d+)', slip)
                    hra_match = re.search(r'HRA\s+(\d+)', slip)
                    ir_match = re.search(r'IR\s+(\d+)', slip)
                    sfn_match = re.search(r'SFN\s+(\d+)', slip)
                    p_match = re.search(r'P\s+(\d+)', slip)
                    spaytypist_match = re.search(r'SPAY-TYPIST\s+(\d+)', slip)
                    
                    # Deductions
                    it_match = re.search(r'IT\s+(\d+)', slip)
                    pt_match = re.search(r'PT\s+(\d+)', slip)
                    gslic_match = re.search(r'GSLIC\s+(\d+)', slip)
                    lic_match = re.search(r'(?<!GS)LIC\s+(\d+)', slip)
                    fbf_match = re.search(r'FBF\s+(\d+)', slip)
                    
                    # Summary Details
                    gross_salary_match = re.search(r'Gross Salary:\s*Rs\.\s*(\d+)', slip)
                    net_salary_match = re.search(r'Net Salary\s*:\s*Rs\.\s*(\d+)', slip)
                    deductions_match = re.search(r'sum of deductions &Recoveries\s*:\s*Rs\.\s*(\d+)', slip)
                    
                    # Bank Details
                    account_match = re.search(r'Bank A/C Number:\s*(\d+)', slip)
                    
                    # Extract month and year
                    date_match = re.search(r'Month Of\s+([A-Za-z]+)\s+(\d{4})', slip)
                    month = date_match.group(1) if date_match else ''
                    year = date_match.group(2) if date_match else ''
                    
                    # Populate record dictionary - MAP TO HTML ANALYZER FORMAT
                    record.update({
                        'Month': month,
                        'Year': year,
                        'EMP No': emp_no_match.group(1) if emp_no_match else '',
                        'Name': name_match.group(1).strip() if name_match else '',
                        'Designation': designation_match.group(1).strip() if designation_match else '',
                        'Pay Scale': f"{pay_scale_match.group(1)}-{pay_scale_match.group(2)}" if pay_scale_match else '',
                        'DDO Code': ddo_code_match.group(1) if ddo_code_match else '',
                        'Days Worked': days_worked_match.group(1) if days_worked_match else '',
                        'Next Increment Date': next_increment_match.group(1) if next_increment_match else '',
                        'Group': group_match.group(1) if group_match else '',
                        
                        # Basic Pay
                        'Basic': int(basic_match.group(1)) if basic_match else 0,
                        
                        # Allowances
                        'DA': int(da_match.group(1)) if da_match else 0,
                        'HRA': int(hra_match.group(1)) if hra_match else 0,
                        'IR': int(ir_match.group(1)) if ir_match else 0,
                        'SFN': int(sfn_match.group(1)) if sfn_match else 0,
                        'P': int(p_match.group(1)) if p_match else 0,
                        'SPAY-TYPIST': int(spaytypist_match.group(1)) if spaytypist_match else 0,
                        
                        # Deductions
                        'IT': int(it_match.group(1)) if it_match else 0,
                        'PT': int(pt_match.group(1)) if pt_match else 0,
                        'GSLIC': int(gslic_match.group(1)) if gslic_match else 0,
                        'LIC': int(lic_match.group(1)) if lic_match else 0,
                        'FBF': int(fbf_match.group(1)) if fbf_match else 0,
                        
                        # Summary
                        'Gross Salary': int(gross_salary_match.group(1)) if gross_salary_match else 0,
                        'Net Salary': int(net_salary_match.group(1)) if net_salary_match else 0,
                        'Total Deductions': int(deductions_match.group(1)) if deductions_match else 0,
                        
                        # Bank Details
                        'Bank A/C Number': account_match.group(1) if account_match else ''
                    })
                    
                    if record['EMP No']:  # Only add if we found an employee ID
                        salary_records.append(record)
    
    except Exception as e:
        print(f"Error processing PDF: {str(e)}")
        return None
        
    return salary_records

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/process-pdfs', methods=['POST'])
def process_pdfs():
    try:
        if 'files' not in request.files:
            return jsonify({'success': False, 'error': 'No files uploaded'})
        
        files = request.files.getlist('files')
        
        if not files or all(f.filename == '' for f in files):
            return jsonify({'success': False, 'error': 'No files selected'})
        
        all_records = []
        processed_files = []
        failed_files = []
        
        for file in files:
            if file and allowed_file(file.filename):
                try:
                    # Save uploaded file temporarily
                    filename = secure_filename(file.filename)
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                    temp_filename = f"temp_{timestamp}_{filename}"
                    temp_path = os.path.join(app.config['UPLOAD_FOLDER'], temp_filename)
                    
                    file.save(temp_path)
                    
                    # Extract salary data
                    salary_records = extract_salary_details(temp_path)
                    
                    if salary_records:
                        all_records.extend(salary_records)
                        processed_files.append(filename)
                    else:
                        failed_files.append(filename)
                    
                    # Clean up temporary file
                    if os.path.exists(temp_path):
                        os.remove(temp_path)
                        
                except Exception as e:
                    print(f"Error processing {file.filename}: {str(e)}")
                    failed_files.append(file.filename)
            else:
                failed_files.append(file.filename)
        
        if all_records:
            return jsonify({
                'success': True,
                'data': all_records,
                'processed_files': processed_files,
                'failed_files': failed_files,
                'total_records': len(all_records)
            })
        else:
            return jsonify({
                'success': False,
                'error': 'No salary records found in the uploaded PDFs',
                'failed_files': failed_files
            })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        })



if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(debug=debug, host='0.0.0.0', port=port)

