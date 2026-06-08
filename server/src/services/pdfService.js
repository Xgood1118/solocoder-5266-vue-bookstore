const fs = require('fs')
const path = require('path')
const { PDFDocument } = require('pdf-lib')
const { success, fail } = require('../utils/helpers')
const config = require('../config')
const db = require('../db/database')

class PdfService {
  async getTrialPages(bookId, page = 1, pageSize = 10) {
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId)
    if (!book) {
      return fail('书籍不存在')
    }

    if (!book.pdf_path) {
      return fail('暂无试读内容')
    }

    const totalPages = book.pdf_pages || 0
    const trialPages = book.trial_pages || Math.ceil(totalPages * config.pdf.trialPercent / 100)

    if (trialPages <= 0) {
      return fail('暂无试读内容')
    }

    if (page > trialPages) {
      return fail('已到达试读上限，请购买完整版')
    }

    const endPage = Math.min(page + pageSize - 1, trialPages)

    return success({
      bookId,
      title: book.title,
      currentPage: page,
      endPage,
      trialPages,
      totalPages,
      hasMore: endPage < trialPages,
    })
  }

  async getPdfPage(bookId, pageNum) {
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId)
    if (!book) {
      return { error: '书籍不存在', status: 404 }
    }

    if (!book.pdf_path) {
      return { error: '暂无试读内容', status: 404 }
    }

    const pdfPath = path.join(config.pdf.dir, book.pdf_path)
    if (!fs.existsSync(pdfPath)) {
      return { error: 'PDF 文件不存在', status: 404 }
    }

    const trialPages = book.trial_pages || Math.ceil((book.pdf_pages || 100) * config.pdf.trialPercent / 100)
    if (pageNum > trialPages) {
      return { error: '已到达试读上限', status: 403 }
    }

    if (pageNum < 1) {
      return { error: '页码无效', status: 400 }
    }

    try {
      const pdfBytes = fs.readFileSync(pdfPath)
      const pdfDoc = await PDFDocument.load(pdfBytes)
      const totalPages = pdfDoc.getPageCount()

      if (pageNum > totalPages) {
        return { error: '页码超出范围', status: 404 }
      }

      const pageDoc = await PDFDocument.create()
      const [copiedPage] = await pageDoc.copyPages(pdfDoc, [pageNum - 1])
      pageDoc.addPage(copiedPage)

      const pageBytes = await pageDoc.save()

      return {
        data: Buffer.from(pageBytes),
        contentType: 'application/pdf',
        page: pageNum,
        totalPages,
        trialPages,
      }
    } catch (err) {
      console.error('PDF 处理失败:', err)
      return { error: 'PDF 处理失败', status: 500 }
    }
  }

  async getTrialPdf(bookId) {
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId)
    if (!book) {
      return { error: '书籍不存在', status: 404 }
    }

    if (!book.pdf_path) {
      return { error: '暂无试读内容', status: 404 }
    }

    const pdfPath = path.join(config.pdf.dir, book.pdf_path)
    if (!fs.existsSync(pdfPath)) {
      return { error: 'PDF 文件不存在', status: 404 }
    }

    const trialPages = book.trial_pages || Math.ceil((book.pdf_pages || 100) * config.pdf.trialPercent / 100)

    try {
      const pdfBytes = fs.readFileSync(pdfPath)
      const pdfDoc = await PDFDocument.load(pdfBytes)
      const totalPages = pdfDoc.getPageCount()
      const actualTrialPages = Math.min(trialPages, totalPages)

      const trialDoc = await PDFDocument.create()
      for (let i = 0; i < actualTrialPages; i++) {
        const [copiedPage] = await trialDoc.copyPages(pdfDoc, [i])
        trialDoc.addPage(copiedPage)
      }

      const trialBytes = await trialDoc.save()

      return {
        data: Buffer.from(trialBytes),
        contentType: 'application/pdf',
        trialPages: actualTrialPages,
        totalPages,
      }
    } catch (err) {
      console.error('PDF 切片失败:', err)
      return { error: 'PDF 处理失败', status: 500 }
    }
  }

  getPdfInfo(bookId) {
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId)
    if (!book) {
      return fail('书籍不存在')
    }

    const totalPages = book.pdf_pages || 0
    const trialPages = book.trial_pages || Math.ceil(totalPages * config.pdf.trialPercent / 100)

    return success({
      bookId: book.id,
      title: book.title,
      totalPages,
      trialPages,
      trialPercent: config.pdf.trialPercent,
      hasPdf: !!book.pdf_path,
    })
  }

  async createSamplePdf(bookId) {
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId)
    if (!book) {
      return fail('书籍不存在')
    }

    try {
      const pdfDoc = await PDFDocument.create()
      const pages = 20

      for (let i = 0; i < pages; i++) {
        const page = pdfDoc.addPage([600, 800])
        page.drawText(`${book.title} - 第 ${i + 1} 页`, {
          x: 50,
          y: 750,
          size: 20,
        })

        const sampleTexts = [
          '这是一段试读内容的示例文本。',
          '在正式版本中，这里会是书籍的真实内容。',
          'PDF 流式渲染技术可以让用户按页阅读，',
          '无需下载整本 PDF 文件。',
          '前 30% 免费试读，让您先睹为快！',
          '如果您喜欢这本书，请购买完整版支持作者。',
        ]

        let y = 700
        for (let j = 0; j < 8; j++) {
          const text = sampleTexts[(i + j) % sampleTexts.length]
          page.drawText(text.repeat(2), {
            x: 50,
            y: y,
            size: 12,
          })
          y -= 30
        }
      }

      const pdfBytes = await pdfDoc.save()
      const filename = `sample_${bookId}_${Date.now()}.pdf`
      const filePath = path.join(config.pdf.dir, filename)

      if (!fs.existsSync(config.pdf.dir)) {
        fs.mkdirSync(config.pdf.dir, { recursive: true })
      }

      fs.writeFileSync(filePath, pdfBytes)

      const trialPages = Math.ceil(pages * config.pdf.trialPercent / 100)

      db.prepare(`
        UPDATE books SET pdf_path = ?, pdf_pages = ?, trial_pages = ?
        WHERE id = ?
      `).run(filename, pages, trialPages, bookId)

      return success({ filename, pages, trialPages }, '示例 PDF 生成成功')
    } catch (err) {
      console.error('生成示例 PDF 失败:', err)
      return fail('生成示例 PDF 失败')
    }
  }
}

module.exports = new PdfService()
