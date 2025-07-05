import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ScheduleItem } from './scheduling';

export class TimetableExporter {
  static exportToPDF(scheduleItems: ScheduleItem[], title: string): void {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text(title, 20, 20);
    
    // Prepare data for table
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const hours = Array.from({ length: 12 }, (_, i) => `${8 + i}:00`);
    
    // Create schedule grid
    const scheduleGrid: string[][] = [];
    
    // Header row
    scheduleGrid.push(['Time', ...days]);
    
    // Data rows
    hours.forEach((hour, hourIndex) => {
      const row = [hour];
      
      days.forEach((_, dayIndex) => {
        const item = scheduleItems.find(
          item => item.timeSlot.day === dayIndex && item.timeSlot.hour === (8 + hourIndex)
        );
        
        if (item) {
          row.push(`${item.subjectName}\n${item.teacherName}\n${item.roomName}`);
        } else {
          row.push('');
        }
      });
      
      scheduleGrid.push(row);
    });
    
    // Generate table
    autoTable(doc, {
      head: [scheduleGrid[0]],
      body: scheduleGrid.slice(1),
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
      },
      columnStyles: {
        0: { cellWidth: 20 },
      },
    });
    
    // Save the PDF
    doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
  }
  
  static exportToExcel(scheduleItems: ScheduleItem[], title: string): void {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const hours = Array.from({ length: 12 }, (_, i) => `${8 + i}:00`);
    
    // Create schedule grid
    const scheduleGrid: any[][] = [];
    
    // Header row
    scheduleGrid.push(['Time', ...days]);
    
    // Data rows
    hours.forEach((hour, hourIndex) => {
      const row = [hour];
      
      days.forEach((_, dayIndex) => {
        const item = scheduleItems.find(
          item => item.timeSlot.day === dayIndex && item.timeSlot.hour === (8 + hourIndex)
        );
        
        if (item) {
          row.push(`${item.subjectName} - ${item.teacherName} - ${item.roomName}`);
        } else {
          row.push('');
        }
      });
      
      scheduleGrid.push(row);
    });
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(scheduleGrid);
    
    // Style the header row
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (ws[cellAddress]) {
        ws[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "2980B9" } },
        };
      }
    }
    
    // Set column widths
    ws['!cols'] = [
      { width: 10 }, // Time column
      ...days.map(() => ({ width: 25 })), // Day columns
    ];
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Timetable');
    
    // Save the file
    XLSX.writeFile(wb, `${title.toLowerCase().replace(/\s+/g, '_')}.xlsx`);
  }
  
  static exportDetailedList(scheduleItems: ScheduleItem[], title: string): void {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text(title, 20, 20);
    
    // Prepare data
    const tableData = scheduleItems.map(item => [
      this.getDayName(item.timeSlot.day),
      `${item.timeSlot.hour}:00`,
      item.subjectName,
      item.teacherName,
      item.roomName,
      item.groupName,
    ]);
    
    // Generate table
    autoTable(doc, {
      head: [['Day', 'Time', 'Subject', 'Teacher', 'Room', 'Group']],
      body: tableData,
      startY: 40,
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
      },
    });
    
    // Save the PDF
    doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_detailed.pdf`);
  }
  
  private static getDayName(dayIndex: number): string {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayIndex] || 'Unknown';
  }
}