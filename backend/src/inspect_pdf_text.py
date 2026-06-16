import pdfplumber
import sys

def inspect_pdf(pdf_path):
    print(f"Inspecting PDF: {pdf_path}")
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages):
            print(f"\n--- PAGE {page_num + 1} (height={page.height}, width={page.width}) ---")
            
            # Extract words with coordinates
            words = page.extract_words()
            
            # Group words by line (approximate y coord)
            lines = {}
            for w in words:
                y_round = round(w['top'], 1)
                found = False
                for y_key in lines:
                    if abs(y_key - y_round) < 5:
                        lines[y_key].append(w)
                        found = True
                        break
                if not found:
                    lines[y_round] = [w]
            
            # Sort lines by y top
            for y_top in sorted(lines.keys()):
                # Sort words in line by x0
                line_words = sorted(lines[y_top], key=lambda w: w['x0'])
                text = " ".join([w['text'] for w in line_words])
                x0 = line_words[0]['x0']
                # In PDF coordinate system, Y increases from bottom to top. 
                # pdfplumber coordinate system: top=0 is at the top of the page, Y increases downwards.
                # pdf-lib coordinate system: Y increases upwards, y=0 is at the bottom of the page.
                # So: pdf_lib_y = page.height - top
                pdf_lib_y = page.height - y_top
                print(f"  [y_top={y_top:.1f} | pdf-lib y={pdf_lib_y:.1f} | x0={x0:.1f}]: {text}")

if __name__ == "__main__":
    pdf_path = "C:\\Users\\Alessandro\\Documents\\ciei-sistema-main\\backend\\src\\assets\\templates\\Anexo_G.pdf"
    inspect_pdf(pdf_path)
