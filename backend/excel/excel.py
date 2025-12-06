import openpyxl
import re
from pathlib import Path

script_dir = Path(__file__).parent
excel_file = script_dir / "test.xlsx"

# Load workbook with data_only=True to get calculated values instead of formulas
wb = openpyxl.load_workbook(excel_file, data_only=True)

# Select the sheet you want
sheet = wb["EST SITE"]

# Get all rows
rows = list(sheet.iter_rows(values_only=True))

# Headers are in rows 10 and 11 (0-indexed: rows[9] and rows[10])
# Row 10 = main headers (Description, Quantity, Unit, Material, Labor, Total)
# Row 11 = sub-headers (Unit, Amount under Material/Labor/Total)
header_row_1 = rows[9] if len(rows) > 9 else []  # Row 10 - main headers
header_row_2 = rows[10] if len(rows) > 10 else []  # Row 11 - sub-headers

# Combine headers hierarchically: "MainHeader - SubHeader" or just "MainHeader"
headers = []
max_cols = max(len(header_row_1), len(header_row_2))

# Track the current main header for columns that span multiple sub-columns
current_main_header = None

# Track header occurrences to handle duplicates
header_counts = {}

for idx in range(max_cols):
    header_1 = header_row_1[idx] if idx < len(header_row_1) else None
    header_2 = header_row_2[idx] if idx < len(header_row_2) else None
    
    # Clean the values
    main_header = str(header_1).strip() if header_1 is not None and str(header_1).strip() != "" else None
    sub_header = str(header_2).strip() if header_2 is not None and str(header_2).strip() != "" else None
    
    # Update current main header if we have a new one
    if main_header:
        current_main_header = main_header
    
    # Create the column name (only for actual header combinations)
    header_name = None
    if sub_header and current_main_header:
        # Both main and sub header exist: "MainHeader - SubHeader"
        header_name = f"{current_main_header} - {sub_header}"
    elif sub_header:
        # Only sub header exists (main header spans from previous column)
        header_name = sub_header
    elif main_header:
        # Only main header exists (no sub header)
        header_name = main_header
    else:
        # No header text for this column (part of merged parent header or blank column)
        header_name = None
    
    # Handle duplicate headers by adding a sequence number
    if header_name:
        if header_name in header_counts:
            header_counts[header_name] += 1
            # Make it unique by appending the occurrence number
            unique_header = f"{header_name} [{header_counts[header_name]}]"
            headers.append(unique_header)
        else:
            header_counts[header_name] = 1
            headers.append(header_name)
    else:
        headers.append(None)

# Display headers with debug info
print("=" * 80)
print("HEADER PROCESSING:")
print("=" * 80)
print(f"Row 10 (main headers): {[str(h) if h else 'None' for h in header_row_1[:15]]}")
print(f"Row 11 (sub headers): {[str(h) if h else 'None' for h in header_row_2[:15]]}")
print("\nFinal combined headers:")
for idx, header in enumerate(headers[:15], 1):
    display_header = header if header else "(no header)"
    print(f"  Column {idx}: {display_header}")
print("\n" + "=" * 80)

# Get the first N data rows starting from row 12 (index 11, after header rows 10 and 11)
DATA_START_INDEX = 11  # zero-based index; Excel row 12
SAMPLE_ROW_COUNT = 10  # number of rows to inspect (head)

data_rows = rows[DATA_START_INDEX:DATA_START_INDEX + SAMPLE_ROW_COUNT] if len(rows) > DATA_START_INDEX else []
excel_row_start_number = DATA_START_INDEX + 1  # Excel rows are 1-based

# Debug: Show what's in the data rows (first SAMPLE_ROW_COUNT rows)
if data_rows:
    end_excel_row = excel_row_start_number + len(data_rows) - 1
    print(f"DEBUG: Raw data from Excel rows {excel_row_start_number}-{end_excel_row}:")
else:
    print("DEBUG: No data rows found after the headers.")
for idx, row in enumerate(data_rows, excel_row_start_number):
    print(f"  Excel Row {idx}: {list(row)[:15]}")  # Show first 15 columns
print("\n" + "=" * 80)

# Filter headers to only include meaningful columns - exclude generic "column1", "column2", etc.
# Check for patterns like "column1", "Column1", "column_1", "Column_1", etc. (case-insensitive)
def is_meaningful_header(header):
    """Check if header is meaningful (not generic like 'column1', 'column2', etc.)"""
    if not header or str(header).strip() == "":
        return False
    
    header_lower = str(header).lower().strip()
    # Match patterns like "column1", "column_1", "column 1", etc.
    pattern = r'^column[\s_]?\d+$'
    if re.match(pattern, header_lower):
        return False
    
    return True

def has_meaningful_value(value):
    """Determine if a cell value contains meaningful (non-empty) data."""
    if value is None:
        return False
    if isinstance(value, (int, float)):
        return value != 0
    if isinstance(value, str):
        text = value.strip()
        if text == "":
            return False
        if re.fullmatch(r"-+", text):
            return False
        return True
    return True

def is_total_or_subtotal(description_text, row_values):
    """Detect if a row represents a total/subtotal rather than a line item."""
    desc_lower = description_text.lower() if description_text else ""
    if desc_lower:
        if desc_lower.startswith("subtotal") or desc_lower.startswith("total"):
            return True
        if "grand total" in desc_lower:
            return True
    # Rows without description but with total values populated (and no other info)
    if not description_text:
        total_value_present = any(
            ("total" in header.lower()) and has_meaningful_value(value)
            for header, value in row_values.items()
            if header
        )
        if total_value_present:
            non_total_values = any(
                ("total" not in header.lower()) and has_meaningful_value(value)
                for header, value in row_values.items()
                if header
            )
            if not non_total_values:
                return True
    return False

meaningful_headers = []
meaningful_indices = []
for idx, header in enumerate(headers):
    if is_meaningful_header(header):
        meaningful_headers.append(header)
        meaningful_indices.append(idx)

print(f"Meaningful headers ({len(meaningful_headers)}): {meaningful_headers}")
print("=" * 80)

# Process data rows - capture values for each meaningful column
records = []
current_section = None
current_subsection = None
for excel_row_num, row in enumerate(data_rows, excel_row_start_number):
    # Extend row to match header length if needed
    extended_row = list(row) + [None] * (len(headers) - len(row))

    # Build a record of header -> value for meaningful columns
    row_values = {}
    for idx in meaningful_indices:
        header = headers[idx]
        value = extended_row[idx] if idx < len(extended_row) else None
        row_values[header] = value

    # Detect section header rows (only description populated)
    description_value = row_values.get("Description")
    description_text = str(description_value).strip() if description_value is not None else ""
    has_other_values = any(
        has_meaningful_value(value)
        for header, value in row_values.items()
        if header != "Description"
    )
    if description_text and not has_other_values:
        if re.match(r'^\d', description_text):
            current_section = description_text
            current_subsection = None  # Reset subsection when a new section starts
            print(f"Excel Row {excel_row_num}: SECTION HEADER -> {current_section}")
        else:
            current_subsection = description_text
            print(f"Excel Row {excel_row_num}: SUBSECTION HEADER -> {current_subsection}")
        continue

    # Skip explicit total/subtotal rows
    if is_total_or_subtotal(description_text, row_values):
        print(f"Excel Row {excel_row_num}: SKIPPED - total/subtotal row")
        continue

    # Skip divider/subtotal separator rows that use "---" or "-" markers
    has_divider_marker = any(
        isinstance(value, str) and value.strip() != "" and re.fullmatch(r"-+", value.strip())
        for value in row_values.values()
    )
    if has_divider_marker:
        print(f"Excel Row {excel_row_num}: SKIPPED - divider marker row")
        continue

    # Skip rows that have no data in meaningful columns
    has_data = any(has_meaningful_value(value) for value in row_values.values())
    if not has_data:
        print(f"Excel Row {excel_row_num}: SKIPPED - no data in meaningful columns")
        continue

    record = {
        "_excel_row": excel_row_num,
        "_section": current_section,
        "_subsection": current_subsection,
    }
    record.update(row_values)
    records.append(record)
    print(f"Excel Row {excel_row_num}: CAPTURED - data recorded for {len(row_values)} columns")

# Display the rows of data (only rows with captured data)
# Display the rows of data (only rows with captured data)
if records:
    print("Data rows with meaningful column values:")
    print("=" * 80)
    for idx, record in enumerate(records, 1):
        excel_row = record.get("_excel_row", "?")  # Get Excel row number
        print(f"\nRow {idx} (Excel row {excel_row}):")
        section = record.get("_section")
        if section:
            print(f"  Section: {section}")
        subsection = record.get("_subsection")
        if subsection:
            print(f"  Subsection: {subsection}")
        for header, value in record.items():
            if header in {"_excel_row", "_section", "_subsection"}:
                continue
            print(f"  {header}: {value}")
    print(f"\nTotal records with data: {len(records)}")
else:
    print("No rows contained data for the meaningful columns.")