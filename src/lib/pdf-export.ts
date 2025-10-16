import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface StoryMetadata {
  title: string;
  prompt: string;
  wordCount: number;
  generatedAt: Date;
  model?: string;
  format?: string;
  genre?: string;
  tone?: string;
}

/**
 * 计算中英文混合文本的字数
 */
function calculateWordCount(text: string): number {
  if (!text || !text.trim()) return 0;

  const trimmed = text.trim();

  // 中日韩字符计数
  const cjkRegex = /[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}\u{2b740}-\u{2b81f}\u{2b820}-\u{2ceaf}\uf900-\ufaff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/gu;
  const cjkChars = trimmed.match(cjkRegex);
  const cjkCount = cjkChars ? cjkChars.length : 0;

  // 英文单词计数
  const withoutCJK = trimmed.replace(cjkRegex, ' ').trim();
  const englishWords = withoutCJK.split(/\s+/).filter(word => word.length > 0);
  const englishCount = withoutCJK ? englishWords.length : 0;

  return cjkCount + englishCount;
}

/**
 * 格式化日期为本地化字符串
 */
function formatDate(date: Date): string {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 将长文本分割成适合PDF页面的段落
 */
function splitTextForPdf(text: string, maxWidth: number, lineHeight: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    // 估算字符宽度（中文按2个字符计算）
    const estimatedWidth = Array.from(testLine).reduce((width, char) => {
      return width + (char.charCodeAt(0) > 127 ? 2 : 1);
    }, 0) * 3; // 每个字符约3mm宽

    if (estimatedWidth > maxWidth) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // 单词太长，强制分割
        lines.push(word);
      }
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * 导出故事内容为PDF文件
 */
export async function exportStoryToPdf(
  content: string,
  metadata: StoryMetadata,
  onProgress?: (progress: number) => void
): Promise<void> {
  try {
    onProgress?.(10);

    // 创建PDF文档 (A4尺寸: 210mm x 297mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20; // 页边距
    const contentWidth = pageWidth - 2 * margin;
    const lineHeight = 7;
    const fontSize = 12;

    // 设置字体（使用内置字体作为后备）
    pdf.setFontSize(fontSize);

    onProgress?.(30);

    // 标题
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    const titleLines = splitTextForPdf(metadata.title || 'AI生成故事', contentWidth, lineHeight);

    let yPosition = margin + 10;
    titleLines.forEach((line, index) => {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin + 10;
      }
      pdf.text(line, margin, yPosition);
      yPosition += lineHeight * 1.5;
    });

    // 元数据信息
    yPosition += 10;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    const metadataLines = [
      `生成时间: ${formatDate(metadata.generatedAt)}`,
      `字数统计: ${metadata.wordCount} 字`,
      metadata.model ? `AI模型: ${metadata.model}` : '',
      metadata.prompt ? `创作提示: ${metadata.prompt.substring(0, 100)}${metadata.prompt.length > 100 ? '...' : ''}` : ''
    ].filter(Boolean);

    metadataLines.forEach((line) => {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin + 10;
      }
      pdf.text(line, margin, yPosition);
      yPosition += lineHeight * 1.2;
    });

    // 分隔线
    yPosition += 5;
    if (yPosition > pageHeight - margin - 20) {
      pdf.addPage();
      yPosition = margin + 10;
    }

    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // 故事内容
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', 'normal');

    onProgress?.(50);

    const contentLines = splitTextForPdf(content, contentWidth, lineHeight);

    for (let i = 0; i < contentLines.length; i++) {
      const line = contentLines[i];

      // 检查是否需要新页面
      if (yPosition > pageHeight - margin - lineHeight) {
        pdf.addPage();
        yPosition = margin + 10;

        // 在新页面顶部添加页眉
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`- ${metadata.title || 'AI生成故事'} - 第${pdf.getCurrentPageInfo().pageNumber}页 -`, pageWidth / 2, margin - 5, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(fontSize);
      }

      pdf.text(line, margin, yPosition);
      yPosition += lineHeight;
    }

    // 页脚
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `第 ${i} 页，共 ${totalPages} 页 | 由AI故事生成器创建`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    onProgress?.(80);

    // 生成文件名
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const title = metadata.title.replace(/[^\w\u4e00-\u9fff]/g, '_').substring(0, 20);
    const fileName = `AI故事_${title}_${timestamp}.pdf`;

    // 保存PDF
    pdf.save(fileName);

    onProgress?.(100);

  } catch (error) {
    console.log('PDF导出失败:', error);
    throw new Error('PDF导出失败，请重试');
  }
}

/**
 * 使用html2canvas将DOM元素转换为PDF（备用方案）
 */
export async function exportElementToPdf(
  elementId: string,
  filename: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('找不到要导出的元素');
    }

    onProgress?.(20);

    // 创建canvas
    const canvas = await html2canvas(element, {
      scale: 2, // 提高清晰度
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    onProgress?.(60);

    // 转换为图片
    const imgData = canvas.toDataURL('image/png');

    // 创建PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // 计算图片在PDF中的尺寸和位置
    const imgWidth = pageWidth - 20; // 左右各留10mm边距
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10; // 顶部边距

    // 添加第一页
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - 20; // 除去顶部和底部边距

    // 如果内容超过一页，添加更多页面
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;
    }

    onProgress?.(90);

    // 保存PDF
    pdf.save(filename);

    onProgress?.(100);

  } catch (error) {
    console.log('元素PDF导出失败:', error);
    throw new Error('PDF导出失败，请重试');
  }
}