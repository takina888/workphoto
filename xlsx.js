(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WorkPhotoXlsx = api;
})(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  const encoder = new TextEncoder();
  const escapeXml = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  })[c]);
  const pushU16 = (arr, n) => arr.push(n & 255, (n >>> 8) & 255);
  const pushU32 = (arr, n) => arr.push(n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255);
  const concat = parts => {
    const length = parts.reduce((sum, part) => sum + part.length, 0);
    const output = new Uint8Array(length);
    let offset = 0;
    for (const part of parts) {
      output.set(part, offset);
      offset += part.length;
    }
    return output;
  };

  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(data) {
    let c = 0xffffffff;
    for (let i = 0; i < data.length; i += 1) c = crcTable[(c ^ data[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function dosDateTime(date = new Date()) {
    const year = Math.max(1980, date.getFullYear());
    return {
      date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
      time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1)
    };
  }

  class ZipWriter {
    constructor() { this.entries = []; }
    add(name, data) {
      if (typeof data === 'string') data = encoder.encode(data);
      this.entries.push({ name, data: data instanceof Uint8Array ? data : new Uint8Array(data) });
    }
    build() {
      const locals = [];
      const centrals = [];
      let offset = 0;
      const dt = dosDateTime();
      for (const entry of this.entries) {
        const name = encoder.encode(entry.name);
        const crc = crc32(entry.data);
        const localHeader = [];
        pushU32(localHeader, 0x04034b50); pushU16(localHeader, 20); pushU16(localHeader, 0x0800);
        pushU16(localHeader, 0); pushU16(localHeader, dt.time); pushU16(localHeader, dt.date);
        pushU32(localHeader, crc); pushU32(localHeader, entry.data.length); pushU32(localHeader, entry.data.length);
        pushU16(localHeader, name.length); pushU16(localHeader, 0);
        const local = concat([Uint8Array.from(localHeader), name, entry.data]);
        locals.push(local);

        const centralHeader = [];
        pushU32(centralHeader, 0x02014b50); pushU16(centralHeader, 20); pushU16(centralHeader, 20);
        pushU16(centralHeader, 0x0800); pushU16(centralHeader, 0); pushU16(centralHeader, dt.time); pushU16(centralHeader, dt.date);
        pushU32(centralHeader, crc); pushU32(centralHeader, entry.data.length); pushU32(centralHeader, entry.data.length);
        pushU16(centralHeader, name.length); pushU16(centralHeader, 0); pushU16(centralHeader, 0);
        pushU16(centralHeader, 0); pushU16(centralHeader, 0); pushU32(centralHeader, 0); pushU32(centralHeader, offset);
        centrals.push(concat([Uint8Array.from(centralHeader), name]));
        offset += local.length;
      }
      const central = concat(centrals);
      const end = [];
      pushU32(end, 0x06054b50); pushU16(end, 0); pushU16(end, 0);
      pushU16(end, this.entries.length); pushU16(end, this.entries.length);
      pushU32(end, central.length); pushU32(end, offset); pushU16(end, 0);
      return concat([...locals, central, Uint8Array.from(end)]);
    }
  }

  function columnName(index) {
    let result = '';
    for (let x = index + 1; x > 0; x = Math.floor((x - 1) / 26)) {
      result = String.fromCharCode(65 + ((x - 1) % 26)) + result;
    }
    return result;
  }

  const LEDGER_LAYOUTS = Object.freeze({ 9: [3, 3], 12: [3, 4], 16: [4, 4], 20: [4, 5] });
  const EMU_PER_POINT = 12700;
  const columnPixels = width => Math.floor(Number(width) * 7 + 5);

  function getPhotoLedgerGeometry(options = {}) {
    const orientation = options.orientation === 'landscape' ? 'landscape' : 'portrait';
    const perPage = [9, 12, 16, 20].includes(Number(options.perPage)) ? Number(options.perPage) : 9;
    const numberPosition = ['top-left', 'top-right'].includes(options.numberPosition) ? options.numberPosition : 'bottom';
    const [cols, rows] = LEDGER_LAYOUTS[perPage];
    const columnWidth = orientation === 'landscape' ? 24 : 21;
    const imageRowPoints = orientation === 'landscape' ? 82 : 74;
    const commentRowPoints = 38;
    const horizontalInsetEmu = 90000;
    const bottomInsetEmu = 65000;
    const labelStripPoints = numberPosition === 'bottom' ? 0 : 16;
    const topInsetEmu = 65000 + Math.round(labelStripPoints * EMU_PER_POINT);
    const columnPoints = columnPixels(columnWidth) * 0.75;
    const photoWidthPoints = Math.max(24, columnPoints - (horizontalInsetEmu * 2 / EMU_PER_POINT));
    const photoHeightPoints = Math.max(24, imageRowPoints - ((topInsetEmu + bottomInsetEmu) / EMU_PER_POINT));
    const rasterDpi = 300;
    const rawPixelWidth = photoWidthPoints / 72 * rasterDpi;
    const rawPixelHeight = photoHeightPoints / 72 * rasterDpi;
    const rasterScale = Math.max(1, 320 / rawPixelWidth, 240 / rawPixelHeight);
    return {
      orientation, perPage, numberPosition, cols, rows, columnWidth, imageRowPoints, commentRowPoints,
      horizontalInsetEmu, topInsetEmu, bottomInsetEmu, labelStripPoints,
      columnEmu: Math.round(columnPoints * EMU_PER_POINT),imageRowEmu: Math.round(imageRowPoints * EMU_PER_POINT),
      photoWidthPoints, photoHeightPoints,
      photoPixelWidth: Math.round(rawPixelWidth * rasterScale),
      photoPixelHeight: Math.round(rawPixelHeight * rasterScale),
      pageMargins: { left: 0.22, right: 0.22, top: 0.25, bottom: 0.3, header: 0.12, footer: 0.12 }
    };
  }

  function textCell(ref, value, style = 0) {
    return `<c r="${ref}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
  }

  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="4">
    <font><sz val="10"/><name val="Calibri"/></font>
    <font><b/><sz val="16"/><name val="Calibri"/></font>
    <font><sz val="10"/><color rgb="FF53656E"/><name val="Calibri"/></font>
    <font><b/><sz val="9"/><name val="Calibri"/></font>
  </fonts>
  <fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF2F7F7"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="2"><border/><border><left style="thin"><color rgb="FF7A858A"/></left><right style="thin"><color rgb="FF7A858A"/></right><top style="thin"><color rgb="FF7A858A"/></top><bottom style="thin"><color rgb="FF7A858A"/></bottom></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="8">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="left" vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="left" vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="left" vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="left" vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="right" vertical="top" wrapText="1"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

  function appProps(sheetCount) {
    const titles = Array.from({ length: sheetCount }, (_, i) => `<vt:lpstr>${i + 1}</vt:lpstr>`).join('');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>WORK PHOTO</Application><DocSecurity>0</DocSecurity><ScaleCrop>false</ScaleCrop><HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant><vt:variant><vt:i4>${sheetCount}</vt:i4></vt:variant></vt:vector></HeadingPairs><TitlesOfParts><vt:vector size="${sheetCount}" baseType="lpstr">${titles}</vt:vector></TitlesOfParts><Company></Company><LinksUpToDate>false</LinksUpToDate><SharedDoc>false</SharedDoc><HyperlinksChanged>false</HyperlinksChanged><AppVersion>2.0</AppVersion></Properties>`;
  }

  function coreProps(title) {
    const now = new Date().toISOString();
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${escapeXml(title)}</dc:title><dc:creator>WORK PHOTO</dc:creator><cp:lastModifiedBy>WORK PHOTO</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`;
  }

  function workbookXml(pageCount) {
    const sheets = Array.from({ length: pageCount }, (_, i) => `<sheet name="${i + 1}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView xWindow="0" yWindow="0" windowWidth="16000" windowHeight="9000"/></bookViews><sheets>${sheets}</sheets><calcPr calcId="191029"/></workbook>`;
  }

  function workbookRels(pageCount) {
    let rels = '';
    for (let i = 0; i < pageCount; i += 1) rels += `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`;
    rels += `<Relationship Id="rId${pageCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`;
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}</Relationships>`;
  }

  function rootRels() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`;
  }

  function contentTypes(pageCount) {
    let overrides = `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>`;
    for (let i = 1; i <= pageCount; i += 1) {
      overrides += `<Override PartName="/xl/worksheets/sheet${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`;
      overrides += `<Override PartName="/xl/drawings/drawing${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`;
    }
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpg" ContentType="image/jpeg"/>${overrides}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`;
  }

  function drawingXml(items, geometry, imageStartIndex) {
    let anchors = '';
    items.forEach((item, index) => {
      const rowBand = Math.floor(index / geometry.cols);
      const col = index % geometry.cols;
      const imageRowZero = 3 + rowBand * 2;
      anchors += `<xdr:twoCellAnchor editAs="oneCell"><xdr:from><xdr:col>${col}</xdr:col><xdr:colOff>${geometry.horizontalInsetEmu}</xdr:colOff><xdr:row>${imageRowZero}</xdr:row><xdr:rowOff>${geometry.topInsetEmu}</xdr:rowOff></xdr:from><xdr:to><xdr:col>${col}</xdr:col><xdr:colOff>${geometry.columnEmu-geometry.horizontalInsetEmu}</xdr:colOff><xdr:row>${imageRowZero}</xdr:row><xdr:rowOff>${geometry.imageRowEmu-geometry.bottomInsetEmu}</xdr:rowOff></xdr:to><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${index + 1}" name="${escapeXml(item.label || `Photo ${imageStartIndex + index + 1}`)}"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId${index + 1}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:twoCellAnchor>`;
    });
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${anchors}</xdr:wsDr>`;
  }

  function drawingRels(items, imageStartIndex) {
    const rels = items.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${imageStartIndex + i + 1}.jpg"/>`).join('');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}</Relationships>`;
  }

  function sheetXml({ title, subtitle, page, pageCount, pageItems, note, geometry }) {
    const { cols, rows, orientation, numberPosition } = geometry;
    const maxCol = columnName(cols - 1);
    const sheetRows = [];
    sheetRows.push(`<row r="1" ht="25" customHeight="1">${textCell('A1', title, 1)}</row>`);
    sheetRows.push(`<row r="2" ht="18" customHeight="1">${textCell('A2', subtitle || '', 3)}</row>`);
    sheetRows.push(`<row r="3" ht="5" customHeight="1"></row>`);

    for (let rowBand = 0; rowBand < rows; rowBand += 1) {
      const imageRow = 4 + rowBand * 2;
      const commentRow = imageRow + 1;
      let imageCells = '';
      for (let col = 0; col < cols; col += 1) {
        const itemIndex = rowBand * cols + col;
        const ref = `${columnName(col)}${imageRow}`;
        if (numberPosition !== 'bottom' && itemIndex < pageItems.length) {
          imageCells += textCell(ref, pageItems[itemIndex].label || '', numberPosition === 'top-right' ? 7 : 6);
        } else imageCells += `<c r="${ref}" s="2"/>`;
      }
      sheetRows.push(`<row r="${imageRow}" ht="${geometry.imageRowPoints}" customHeight="1">${imageCells}</row>`);
      let commentCells = '';
      for (let col = 0; col < cols; col += 1) {
        const itemIndex = rowBand * cols + col;
        const ref = `${columnName(col)}${commentRow}`;
        if (itemIndex < pageItems.length) {
          const item = pageItems[itemIndex];
          const content = numberPosition === 'bottom'
            ? `${item.label || ''}${item.comment ? `\n${item.comment}` : '\n'}`
            : (item.comment || '\n');
          commentCells += textCell(ref, content, 5);
        } else {
          commentCells += `<c r="${ref}" s="2"/>`;
        }
      }
      sheetRows.push(`<row r="${commentRow}" ht="${geometry.commentRowPoints}" customHeight="1">${commentCells}</row>`);
    }

    const noteRow = 4 + rows * 2;
    sheetRows.push(`<row r="${noteRow}" ht="30" customHeight="1">${textCell(`A${noteRow}`, note || '', 4)}</row>`);
    const merges = `<mergeCells count="3"><mergeCell ref="A1:${maxCol}1"/><mergeCell ref="A2:${maxCol}2"/><mergeCell ref="A${noteRow}:${maxCol}${noteRow}"/></mergeCells>`;
    const dimensions = `A1:${maxCol}${noteRow}`;
    const columns = Array.from({ length: cols }, (_, col) => `<col min="${col + 1}" max="${col + 1}" width="${geometry.columnWidth}" customWidth="1"/>`).join('');
    const margins = geometry.pageMargins;

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="${dimensions}"/><sheetViews><sheetView workbookViewId="0" zoomScale="75"/></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols>${columns}</cols><sheetData>${sheetRows.join('')}</sheetData>${merges}<drawing r:id="rId1"/><pageMargins left="${margins.left}" right="${margins.right}" top="${margins.top}" bottom="${margins.bottom}" header="${margins.header}" footer="${margins.footer}"/><pageSetup paperSize="9" orientation="${orientation}" fitToWidth="1" fitToHeight="1"/><headerFooter><oddFooter>&amp;LWORK PHOTO&amp;R${page} / ${pageCount}</oddFooter></headerFooter></worksheet>`;
  }

  function sheetRels(drawingIndex) {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${drawingIndex}.xml"/></Relationships>`;
  }

  async function createPhotoLedgerXlsx(options) {
    const {
      title = '写真台帳',
      subtitle = '',
      orientation = 'portrait',
      perPage = 9,
      photos = [],
      note = '',
      numberPosition = 'bottom'
    } = options || {};
    if (!photos.length) throw new Error('写真がありません');

    const geometry = getPhotoLedgerGeometry({ orientation, perPage, numberPosition });
    const pageCount = Math.ceil(photos.length / perPage);
    const zip = new ZipWriter();

    zip.add('[Content_Types].xml', contentTypes(pageCount));
    zip.add('_rels/.rels', rootRels());
    zip.add('docProps/core.xml', coreProps(title));
    zip.add('docProps/app.xml', appProps(pageCount));
    zip.add('xl/workbook.xml', workbookXml(pageCount));
    zip.add('xl/_rels/workbook.xml.rels', workbookRels(pageCount));
    zip.add('xl/styles.xml', styles);

    let imageIndex = 0;
    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
      const pageItems = photos.slice(pageIndex * perPage, (pageIndex + 1) * perPage);
      zip.add(`xl/worksheets/sheet${pageIndex + 1}.xml`, sheetXml({
        title,
        subtitle,
        page: pageIndex + 1,
        pageCount,
        pageItems,
        note,
        geometry
      }));
      zip.add(`xl/worksheets/_rels/sheet${pageIndex + 1}.xml.rels`, sheetRels(pageIndex + 1));
      zip.add(`xl/drawings/drawing${pageIndex + 1}.xml`, drawingXml(pageItems, geometry, imageIndex));
      zip.add(`xl/drawings/_rels/drawing${pageIndex + 1}.xml.rels`, drawingRels(pageItems, imageIndex));
      for (const photo of pageItems) {
        zip.add(`xl/media/image${imageIndex + 1}.jpg`, photo.bytes);
        imageIndex += 1;
      }
    }

    return new Blob([zip.build()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  return { createPhotoLedgerXlsx, getPhotoLedgerGeometry, ZipWriter, crc32 };
});
