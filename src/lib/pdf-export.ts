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

export interface PDFTranslations {
  generated_at: string;
  word_count_label: string;
  ai_model: string;
  story_format: string;
  story_genre: string;
  story_tone: string;
  prompt: string;
  footer_text: string;
  page_indicator: string; // 格式: "Page {current} / {total}" 或 "第 {current} 页 / 共 {total} 页"
}

/**
 * 计算中英文混合文本的字数
 */
function calculateWordCount(text: string): number {
  if (!text || !text.trim()) return 0;

  const trimmed = text.trim();

  // 中日韩字符计数
  const cjkRegex = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g;
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
function formatDate(date: Date, locale: string = 'en'): string {
  const localeMap: Record<string, string> = {
    'en': 'en-US',
    'zh': 'zh-CN',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'de': 'de-DE'
  };

  return date.toLocaleString(localeMap[locale] || 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * HTML转义函数,防止XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 导出故事内容为PDF文件
 * 完全使用HTML渲染方案,避免中文乱码问题
 */
export async function exportStoryToPdf(
  content: string,
  metadata: StoryMetadata,
  locale: string = 'en',
  translations: PDFTranslations,
  onProgress?: (progress: number) => void
): Promise<void> {
  try {
    onProgress?.(10);

    // 创建临时HTML容器来渲染内容
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: 794px;
      background: white;
      padding: 60px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK', sans-serif;
      color: #333;
      line-height: 1.8;
    `;

    // 构建HTML内容
    tempContainer.innerHTML = `
      <div style="margin-bottom: 30px;">
        <h1 style="
          font-size: 28px;
          font-weight: bold;
          text-align: center;
          margin: 0 0 20px 0;
          color: #1a1a1a;
          line-height: 1.4;
          word-wrap: break-word;
          overflow-wrap: break-word;
          max-width: 100%;
        ">${escapeHtml(metadata.title || 'Untitled Story')}</h1>

        <div style="
          background: #f5f5f5;
          padding: 16px;
          border-radius: 8px;
          font-size: 13px;
          color: #666;
          line-height: 1.6;
        ">
          <div style="margin-bottom: 6px;"><strong>${escapeHtml(translations.generated_at)}:</strong> ${formatDate(metadata.generatedAt, locale)}</div>
          <div style="margin-bottom: 6px;"><strong>${escapeHtml(translations.word_count_label)}:</strong> ${metadata.wordCount}</div>
          ${metadata.model ? `<div style="margin-bottom: 6px;"><strong>${escapeHtml(translations.ai_model)}:</strong> ${escapeHtml(metadata.model)}</div>` : ''}
          ${metadata.format ? `<div style="margin-bottom: 6px;"><strong>${escapeHtml(translations.story_format)}:</strong> ${escapeHtml(metadata.format)}</div>` : ''}
          ${metadata.genre ? `<div style="margin-bottom: 6px;"><strong>${escapeHtml(translations.story_genre)}:</strong> ${escapeHtml(metadata.genre)}</div>` : ''}
          ${metadata.tone ? `<div style="margin-bottom: 6px;"><strong>${escapeHtml(translations.story_tone)}:</strong> ${escapeHtml(metadata.tone)}</div>` : ''}
          ${metadata.prompt ? `<div><strong>${escapeHtml(translations.prompt)}:</strong> ${escapeHtml(metadata.prompt.substring(0, 200))}${metadata.prompt.length > 200 ? '...' : ''}</div>` : ''}
        </div>
      </div>

      <div style="
        border-top: 2px solid #e0e0e0;
        padding-top: 24px;
        margin-top: 24px;
      ">
        <div style="
          font-size: 16px;
          line-height: 1.8;
          text-align: justify;
          white-space: pre-wrap;
          word-wrap: break-word;
        ">${escapeHtml(content).replace(/\n\n+/g, '</p><p style="margin: 16px 0;">').replace(/^/, '<p style="margin: 16px 0;">').replace(/$/, '</p>')}</div>
      </div>

      <div style="
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #e0e0e0;
        text-align: center;
        font-size: 12px;
        color: #999;
      ">
        ${escapeHtml(translations.footer_text)}
      </div>
    `;

    document.body.appendChild(tempContainer);

    onProgress?.(30);

    // 使用html2canvas渲染
    const canvas = await html2canvas(tempContainer, {
      scale: 2, // 高清晰度
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      width: 794, // A4宽度(px at 96dpi)
    });

    onProgress?.(60);

    // 移除临时容器
    document.body.removeChild(tempContainer);

    // 创建PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    // 将canvas转换为图片
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // 如果内容高度小于一页,直接添加
    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    } else {
      // 内容超过一页,需要分页
      let heightLeft = imgHeight;
      let position = 0;
      let page = 0;

      while (heightLeft > 0) {
        if (page > 0) {
          pdf.addPage();
        }

        // 计算当前页显示的内容
        const sourceY = page * (canvas.height * (pageHeight / imgHeight));
        const sourceHeight = Math.min(
          canvas.height * (pageHeight / imgHeight),
          canvas.height - sourceY
        );

        // 创建当前页的canvas片段
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;

        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            canvas,
            0, sourceY, // source x, y
            canvas.width, sourceHeight, // source width, height
            0, 0, // dest x, y
            canvas.width, sourceHeight // dest width, height
          );

          const pageImgData = pageCanvas.toDataURL('image/JPEG', 0.95);
          const pageImgHeight = (sourceHeight * pageWidth) / canvas.width;

          pdf.addImage(pageImgData, 'JPEG', 0, 0, imgWidth, pageImgHeight);
        }

        heightLeft -= pageHeight;
        page++;
      }
    }

    onProgress?.(80);

    // 生成文件名
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const title = metadata.title.replace(/[^\w\u4e00-\u9fff]/g, '_').substring(0, 20);
    const fileName = `AI_Story_${title}_${timestamp}.pdf`;

    // 保存PDF
    pdf.save(fileName);

    onProgress?.(100);

  } catch (error) {
    console.log('PDF导出失败:', error);
    throw new Error('PDF export failed, please try again');
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