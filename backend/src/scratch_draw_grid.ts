import { PDFDocument, rgb } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

async function drawGrid() {
  const pathG = "C:\\Users\\Alessandro\\Documents\\ciei-sistema-main\\backend\\src\\assets\\templates\\Anexo_G.pdf";
  const bytesG = fs.readFileSync(pathG);
  const pdfDoc = await PDFDocument.load(bytesG);
  
  const pages = pdfDoc.getPages();
  
  for (let p = 0; p < pages.length; p++) {
    const page = pages[p];
    const { width, height } = page.getSize();
    
    // Draw horizontal lines and labels
    for (let y = 0; y < height; y += 20) {
      page.drawLine({
        start: { x: 0, y },
        end: { x: width, y },
        color: rgb(0.85, 0.85, 0.85),
        width: 0.5
      });
      if (y % 100 === 0) {
        page.drawLine({
          start: { x: 0, y },
          end: { x: width, y },
          color: rgb(0.6, 0.6, 0.6),
          width: 0.8
        });
      }
      page.drawText(`${y}`, {
        x: 5,
        y: y + 2,
        size: 5,
        color: rgb(0.5, 0.5, 0.5)
      });
    }
    
    // Draw vertical lines and labels
    for (let x = 0; x < width; x += 20) {
      page.drawLine({
        start: { x, y: 0 },
        end: { x, y: height },
        color: rgb(0.85, 0.85, 0.85),
        width: 0.5
      });
      if (x % 100 === 0) {
        page.drawLine({
          start: { x, y: 0 },
          end: { x, y: height },
          color: rgb(0.6, 0.6, 0.6),
          width: 0.8
        });
      }
      page.drawText(`${x}`, {
        x: x + 2,
        y: height - 10,
        size: 5,
        color: rgb(0.5, 0.5, 0.5)
      });
    }
  }
  
  const pdfBytes = await pdfDoc.save();
  const outputPath = "C:\\Users\\Alessandro\\Documents\\ciei-sistema-main\\anexo_g_grid.pdf";
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`Grid PDF saved to: ${outputPath}`);
}

drawGrid();
