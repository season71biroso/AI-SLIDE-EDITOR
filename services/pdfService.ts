import { jsPDF } from "jspdf";

// We declare the global variable injected by the CDN script in index.html
declare const pdfjsLib: any;

export const convertPdfToImages = async (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function (e) {
      try {
        const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
        const loadingTask = pdfjsLib.getDocument(typedarray);
        const pdf = await loadingTask.promise;
        
        const images: string[] = [];
        const scale = 1.5; // Good quality for analysis

        // Iterate through all pages
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (!context) throw new Error("Canvas context not available");

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };
          
          await page.render(renderContext).promise;
          
          // Export to JPEG base64
          const base64 = canvas.toDataURL('image/jpeg', 0.9);
          images.push(base64);
        }
        
        resolve(images);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const generatePdfFromImages = (images: string[]): void => {
  if (images.length === 0) return;

  // Create PDF with 16:9 aspect ratio (approx 1920x1080 px equivalent)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [1920, 1080]
  });

  images.forEach((image, index) => {
    if (index > 0) {
      pdf.addPage();
    }
    // Add image to cover the full page
    pdf.addImage(image, 'JPEG', 0, 0, 1920, 1080);
  });

  pdf.save('presentation_slides.pdf');
};